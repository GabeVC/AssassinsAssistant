import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, updateDoc, collection, where, query, getDocs } from 'firebase/firestore';
import GameSettings from './GameSettings';
import CreateAnnouncement from './CreateAnnouncement';
import {AnnouncementItem} from './GameFeed';
import './GamePage.css';
import { startGame } from '../../../Backend/controllers/gameController';
import EliminatePlayer from './EliminatePlayer';

/**
 * This component handles displaying and containing all elements of the game page
 * 
 * @returns {React.JSX.Element} A React element that displays an interactive game page
 */
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
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const navigate = useNavigate();
  const [numLivingPlayers, setLiving] = useState(players.length);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

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

          // Filter further to the living players
          // This is the list we care about for eliminations/target assignment
          const numLiving = playerList.filter(p => p.isAlive).length;
          setLiving(numLiving);
          // should trigger a check in backend here to see if we have a winner 

          // Set up a listener for announcements
          const announcementsRef = collection(db, 'announcements');
          const announcementQuery = query(announcementsRef, where('gameId', '==', gameId));
          const unsubscribe = onSnapshot(announcementQuery, (snapshot) => {
            const announcementList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Sort announcements by timestamp (assuming timestamp is a Firestore Timestamp)
            const sortedAnnouncements = announcementList.sort((a, b) => {
              return b.timestamp.seconds - a.timestamp.seconds; // Sort in descending order
            });

            setAnnouncements(sortedAnnouncements);
          });

          const userId = auth.currentUser.uid
          const currentUser = playerList.find(player => player.userId === userId);
          setCurrentPlayer(currentUser);
          if (currentUser) {
            const targetPlayer = playerList.find(player => player.id === currentUser.targetId);
            setUserTargetName(targetPlayer ? targetPlayer.playerName : 'No target assigned');
            setIsAdmin(currentUser.isAdmin);
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
          <h2>{gameData.title}</h2>
          <p><strong>Your Role:</strong> {isAdmin ? 'Admin' : 'Player'}</p>
          <p><strong>Game Status:</strong> {gameData.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Your Status:</strong> {currentPlayer.isAlive ? 'Alive' : 'Eliminated'}</p>
          <p><strong>Players Remaining:</strong> {numLivingPlayers}</p>
          <p><strong>Your Target:</strong> {userTargetName}</p> 
          {/*<p><strong>Rules:</strong> {gameData.rules}</p>*/}

          <div className="navigation-buttons"> 
          {/* Admin Settings Page */}
          {isAdmin && gameData.isActive && (
            <div><button onClick={openModal}>Make an Announcement</button><CreateAnnouncement isOpen={isModalOpen} onClose={closeModal} gameId={gameId}/></div>
          )}

          {isAdmin && (
            <button onClick={openSettings} className="settings-button">
              Settings
            </button>
          )}

          {/* Begin Game Button */}
          {isAdmin && !gameData.isActive && (
            <div><button onClick={handleBeginGame} className="begin-game-button">
              Begin Game
            </button></div>
          )}
          <GameSettings
            isOpen={showSettings}
            onClose={closeSettings}
            inviteLink={`${window.location.origin}/join/${gameId}`}
          />

          <button onClick={() => navigate(`/gamefeed/${gameId}`)}>Game Feed</button>

          {/* Button to show the info block */}
          <button onClick={() => setShowInfo(true)} className="info-button">
            Show Rules
          </button>

          </div>

          {/* Scrollable player list */}
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
          
          {/* Kill player button */}
          {gameData.isActive &&
             (<button onClick={() => {setShowEvidenceModal(true)}}>
              Eliminate Target</button>
          )}

          {/* Popup to hold the evidence submission form */}
          <EliminatePlayer 
              isOpen={showEvidenceModal}
              onClose={() => {setShowEvidenceModal(false)}}
              playerList={players}
              gameId={gameId}/>
          

          

          {/* Dismissible info block */}
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

          {/* Scrollable player list */}
          <div className="player-list-container" >
            <h3>Announcements</h3>
            <div className="player-list">
              {announcements.map((announcement) => (
                <div key={announcement.id}>
                <AnnouncementItem announcement={announcement}  isAdmin={isAdmin}/>
            </div>
              ))}
            </div>
          </div>
        </>
      
    ) : (
        <p>Game not found.</p>
      )}
    </div>
  );
};

export default GamePage;
