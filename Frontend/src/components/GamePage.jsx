import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, updateDoc, collection, where, query, getDocs } from 'firebase/firestore';
import GameSettings from './GameSettings';
import CreateAnnouncement from './CreateAnnouncement';
import {AnnouncementItem} from './GameFeed';
import './GamePage.css';
import AdminDashboard from './adminDashboard';
import { startGame } from '../../../Backend/controllers/gameController';
import EliminatePlayer from './EliminatePlayer';
import DisputeForm from './DisputeForm';

const GamePage = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userTargetName, setUserTargetName] = useState('');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const navigate = useNavigate();
  const [numLivingPlayers, setLiving] = useState(players.length);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const gameRef = doc(db, 'games', gameId);
        const gameDoc = await getDoc(gameRef);

        if (gameDoc.exists()) {
          const gameInfo = gameDoc.data();
          setGameData(gameInfo);

          const playersRef = collection(db, 'players');
          const playerQuery = query(playersRef, where('gameId', '==', gameId));
          const playerSnapshot = await getDocs(playerQuery);
          const playerList = playerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPlayers(playerList);

          // Calculate living players
          const numLiving = playerList.filter(p => p.isAlive).length;
          setLiving(numLiving);

          // Set up announcements listener
          const announcementsRef = collection(db, 'announcements');
          const announcementQuery = query(announcementsRef, where('gameId', '==', gameId));
          const unsubscribe = onSnapshot(announcementQuery, (snapshot) => {
            const announcementList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const sortedAnnouncements = announcementList.sort((a, b) => {
              return b.timestamp.seconds - a.timestamp.seconds;
            });

            setAnnouncements(sortedAnnouncements);
          });

          // Get current user and process their data
          const userId = auth.currentUser.uid;
          const currentUser = playerList.find(player => player.userId === userId);
          
          if (currentUser) {
            // Get the latest elimination attempt if it exists
            const eliminationAttempts = currentUser.eliminationAttempts || [];
            const latestAttempt = eliminationAttempts.length > 0 
              ? eliminationAttempts[eliminationAttempts.length - 1]
              : null;

            // Set current player with all necessary fields
            setCurrentPlayer({
              ...currentUser,
              latestAttempt,
              canDispute: currentUser.isPending && latestAttempt && !latestAttempt.dispute
            });

            // Set target info
            const targetPlayer = playerList.find(player => player.id === currentUser.targetId);
            setUserTargetName(targetPlayer ? targetPlayer.playerName : 'No target assigned');
            setIsAdmin(currentUser.isAdmin);

            // Log for debugging
            console.log("Current User Data:", {
              isPending: currentUser.isPending,
              latestAttempt,
              canDispute: currentUser.isPending && latestAttempt && !latestAttempt.dispute
            });
          }

          return () => unsubscribe();
        } else {
          console.error("No such game exists!");
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, numLivingPlayers]);

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  const handleBeginGame = async () => {
    try {
      setGameData((prevData) => ({ ...prevData, isActive: true }));
      await startGame(gameId);
 
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  };

  if (loading) return <p>Loading game details...</p>;

  return (
    <div className="game-details">
      {gameData ? (
        <>
          {isAdmin && (
            <div className="admin-controls">
              <button 
                onClick={() => setShowAdminDashboard(!showAdminDashboard)}
                className="admin-toggle-button"
              >
                {showAdminDashboard ? 'Show Game View' : 'Show Admin Dashboard'}
              </button>
            </div>
          )}

          {showAdminDashboard && isAdmin ? (
            <AdminDashboard gameId={gameId} />
          ) : (
            <>
              <h2>{gameData.title}</h2>
              <p><strong>Your Role:</strong> {isAdmin ? 'Admin' : 'Player'}</p>
              <p><strong>Game Status:</strong> {gameData.isActive ? 'Active' : 'Inactive'}</p>
              <p><strong>Your Status:</strong> {currentPlayer.isAlive ? 'Alive' : 'Eliminated'}</p>
              <p><strong>Players Remaining:</strong> {numLivingPlayers}</p>
              <p><strong>Your Target:</strong> {userTargetName}</p>

              <div className="navigation-buttons">
                {isAdmin && gameData.isActive && (
                  <div>
                    <button onClick={() => setIsModalOpen(true)}>Make an Announcement</button>
                    <CreateAnnouncement 
                      isOpen={isModalOpen} 
                      onClose={() => setIsModalOpen(false)} 
                      gameId={gameId}
                    />
                  </div>
                )}

                {isAdmin && (
                  <button onClick={() => setShowSettings(true)} className="settings-button">
                    Settings
                  </button>
                )}

                {isAdmin && !gameData.isActive && (
                  <button onClick={handleBeginGame} className="begin-game-button">
                    Begin Game
                  </button>
                )}

                <GameSettings
                  isOpen={showSettings}
                  onClose={() => setShowSettings(false)}
                  inviteLink={`${window.location.origin}/join/${gameId}`}
                />

                <button onClick={() => navigate(`/gamefeed/${gameId}`)}>Game Feed</button>
                <button onClick={() => setShowInfo(true)} className="info-button">
                  Show Rules
                </button>
              </div>

              <div className="player-list-container">
                <h3>Players</h3>
                <div className="player-list">
                  {players.map((player) => (
                    <div key={player.id} className="player">
                      <p><strong>Name:</strong> {player.playerName}</p>
                      <p><strong>Status:</strong> {player.isAlive ? 'Alive' : 'Eliminated'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {gameData.isActive && (
                <button onClick={() => setShowEvidenceModal(true)}>
                  Eliminate Target
                </button>
              )}

              <EliminatePlayer 
                isOpen={showEvidenceModal}
                onClose={() => setShowEvidenceModal(false)}
                playerList={players}
                gameId={gameId}
              />

              {showInfo && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <button onClick={() => setShowInfo(false)} className="close-button">
                      &times;
                    </button>
                    <h2>Rules</h2>
                    <p>{gameData.rules}</p>
                  </div>
                </div>
              )}
              {currentPlayer && currentPlayer.isPending && currentPlayer.canDispute && (
                <div className="dispute-section">
                  <p className="pending-message">Your elimination is pending review</p>
                  <button 
                    className="dispute-button"
                    onClick={() => setShowDisputeForm(true)}
                  >
                    Submit Dispute
                  </button>
                </div>
              )}

              {showDisputeForm && currentPlayer && currentPlayer.latestAttempt && (
                <DisputeForm 
                  playerId={currentPlayer.id}
                  eliminationAttemptId={currentPlayer.latestAttempt.id}
                  onClose={() => setShowDisputeForm(false)}
                />
              )}

              <div className="player-list-container">
                <h3>Announcements</h3>
                <div className="player-list">
                  {announcements.map((announcement) => (
                    <div key={announcement.id}>
                      <AnnouncementItem announcement={announcement} isAdmin={isAdmin}/>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <p>Game not found.</p>
      )}
    </div>
  );
};

export default GamePage;
