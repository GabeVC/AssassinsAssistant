import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import './CreateGame.css';

/**
 * This component handles the creation of a game
 * 
 * @param {boolean} isOpen - Whether the game creation window is open or not
 * @param {Function} onClose - What function gets called when the game creation window is closed
 * @returns {React.JSX.Element} A React element that displays the game creation window
 */
const CreateGame = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [rules, setRules] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCreateGame = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Game name is required');
      return;
    }

    const gameId = uuidv4(); 
    const playerId = uuidv4();

    try {
        await runTransaction(db, async (transaction) => {
            const userId = auth.currentUser ? auth.currentUser.uid : null;

                if (!userId) {
                throw new Error('User is not authenticated');
                }
            const gameRef = doc(db, 'games', gameId);
            const playerRef = doc(db, 'players', playerId);
            const isAdmin = true;
            const isActive = false;
            const isAlive = true;
      
          transaction.set(gameRef, {
            gameId,
            title,
            isActive,
            rules: rules || 'Default game rules',
            playerIds: [], 
            createdAt: new Date(),
          });
      
          if (isPlaying) {
            transaction.set(playerRef, {
              playerId,
              userId,
              playerName,
              gameId,
              isAlive,
              TargetId: '',
              isAdmin,

            });
      
            transaction.update(gameRef, {
              playerIds: arrayUnion(playerId),
            });
          }
        });
      
        setPlayerName('');
        setIsPlaying(false);
        onClose();
        alert('Game created successfully!');
      } catch (error) {
        console.error('Error creating game:', error);
        alert('Failed to create game. All changes have been rolled back.');
      }
    };

  if (!isOpen) return null; 

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">&times;</button>
        <h2>Create a New Game</h2>
        <form onSubmit={handleCreateGame}>
          <div className="form-group">
            <label>Game Title</label>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isPlaying}
                onChange={(e) => setIsPlaying(e.target.checked)}
              />
              I would like to participate in this game
            </label>
          </div>
          {isPlaying && (
          <div className="form-group">
            <label>Your Player Name</label>
            <input 
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                placeholder='This will be the name visible to other players'
            />
          </div>
          )}
          <div className="form-group">
            <label>Rules</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Enter custom rules or leave blank for default rules"
            />
          </div>
          <button type="submit">Create Game</button>
        </form>
      </div>
    </div>
  );
};

export default CreateGame;
