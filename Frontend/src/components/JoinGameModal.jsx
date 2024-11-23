import React, { useState } from 'react';
import { doc, collection, query, where, getDocs, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import './JoinGameModal.css';
import { db, auth } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * This component handles creating the join game window.
 * 
 * @param {Boolean} isOpen - Whether the join game window is open or not
 * @param {Function} onClose - What function gets called when the join game window is closed
 * @returns {React.JSX.Element} A React element that displays the join game window
 */
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
      const playersRef = collection(db, 'players');
      const playerQuery = query(playersRef, where('gameId', '==', gameId));
      const playerSnapshot = await getDocs(playerQuery);
      const playerList = playerSnapshot.docs.map((doc) => doc.data());
      const playerId = uuidv4();
      const playerRef = doc(db, 'players', playerId);
      const existingPlayer = playerList.find(player => player.userId === user.uid);
      if (existingPlayer) {
        setError('You are already part of this game.');
        return;
      }

  
      await setDoc(playerRef, {
        userId: user ? user.uid : null,
        playerId,
        playerName,
        gameId: gameId.trim(),
        isAlive: true,
        isAdmin: false,
        targetId: '',
        isPendingReview: ''

      });
  
      await updateDoc(gameRef, {
        playerIds: arrayUnion(playerId),
      });
  
      console.log(`Successfully joined game with ID: ${gameId}`);
      onClose(); 
    } catch (error) {
      console.error("Error joining game:", error);
      setError('There was an issue joining the game. Please try again.');
    }
  };

  if (!isOpen) return null;

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
