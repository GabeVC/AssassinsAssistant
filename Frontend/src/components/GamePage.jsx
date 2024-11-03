import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, collection, where, query, getDocs } from 'firebase/firestore';
import './GamePage.css'

const GamePage = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [showInfo, setShowInfo] = useState(false);

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


          const currentUser = playerList.find(player => player.isAdmin);
          setIsAdmin(currentUser ? currentUser.isAdmin : false); 
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
  }, [gameId]);

  const handleBeginGame = async () => {
    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, { isActive: true });
      setGameData((prevData) => ({ ...prevData, isActive: true })); 
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
          <p><strong>Status:</strong> {gameData.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Players Remaining:</strong> {gameData.playerIds.length}</p>
          {/*<p><strong>Rules:</strong> {gameData.rules}</p>*/}

          {/* Begin Game Button */}
          {isAdmin && !gameData.isActive && (
            <button onClick={handleBeginGame} className="begin-game-button">
              Begin Game
            </button>
          )}

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

          {/* Button to show the info block */}
          <button onClick={() => setShowInfo(true)} className="info-button">
            Show Rules
          </button>

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

        </>
      ) : (
        <p>Game not found.</p>
      )}
    </div>
  );
};

export default GamePage;
