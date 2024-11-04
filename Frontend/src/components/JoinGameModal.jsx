import React, { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import './JoinGameModal.css';
import { db, auth } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

const JoinGameModal = ({ isOpen, onClose }) => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!gameId.trim()) {
      setError("Please enter a valid game ID.");
      return;
    }
  
    try {
      const gameRef = doc(db, 'games', gameId.trim());
      const gameDoc = await getDoc(gameRef);
  
      if (!gameDoc.exists()) {
        setError('Game not found. Please check the invite code.');
        return;
      }
  
      const gameData = gameDoc.data();
  
      const user = auth.currentUser;
      const playerId = uuidv4();      
      const playerRef = doc(db, 'players', playerId);
  
      await setDoc(playerRef, {
        userId: user ? user.uid : null,
        playerName,
        gameId: gameId.trim(),
        isAlive: true,
        isAdmin: false,
      });
  
      await updateDoc(gameRef, {
        playerIds: arrayUnion(playerId),
      });
  
      console.log(`Successfully joined game with ID: ${gameId}`);
      onClose(); // Close the modal after successful join
    } catch (error) {
      console.error("Error joining game:", error);
      setError('There was an issue joining the game. Please try again.');
    }
  };

  if (!isOpen) return null; // Return null if not open

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">&times;</button>
        <h2>Join Game</h2>
        <div className="form-group">
          <label>Player Name</label> 
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your player name"
          />
        </div>
        <div className="form-group">
          <label>Game ID</label>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Paste the game ID here"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button onClick={handleSubmit}>Join Game</button>
      </div>
    </div>
  );
};

export default JoinGameModal;
