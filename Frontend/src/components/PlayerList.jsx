import React, { useState } from 'react';
import { doc, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './PlayerList.css';

/**
 * This component handles the creation of the remove player window
 * 
 * @param {Boolean} isOpen - If the window is open or not
 * @param {Function} onClose - The function called when this winow is closed
 * @param {Function} onConfirm - The function called when the player removal is confirmed
 * @param {String} playerName - The name of the player being removed
 * @returns {React.JSX.Element} A React element that displays the remove player window
 */
const RemovePlayerModal = ({ isOpen, onClose, onConfirm, playerName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Remove Player</h3>
        <p>Are you sure you want to remove {playerName} from the game?</p>
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button 
            onClick={onConfirm}
            className="remove-button"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * This component handles the creation of the player list
 * 
 * @param {List} players - The players of the corresponding game
 * @param {String} gameId - The ID of the corresponding game
 * @param {Boolean} isAdmin - Whether the user is the game's admin or not
 * @returns {React.JSX.Element} A List containing all players in a game
 */
const PlayerList = ({ players, gameId, isAdmin }) => {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [error, setError] = useState(null);

  const handleRemoveClick = (player) => {
    setSelectedPlayer(player);
    setShowRemoveModal(true);
    setError(null);
  };

  const handleRemovePlayer = async () => {
    try {
      // update the game document to remove the player's ID
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        playerIds: arrayRemove(selectedPlayer.id)
      });

      // delete the player document
      const playerRef = doc(db, 'players', selectedPlayer.id);
      await deleteDoc(playerRef);

      setShowRemoveModal(false);
      setSelectedPlayer(null);

      window.location.reload();

    } catch (error) {
      console.error("Error removing player:", error);
      setError("Failed to remove player. Please try again.");
    }
  };

  return (
    <div className="player-list-container">
      <h3>Players</h3>
      {error && <div className="error-message">{error}</div>}
      <div className="player-list">
        {players.map((player) => (
          <div key={player.id} className="player">
            <div className="player-info">
              <p><strong>Name:</strong> {player.playerName}</p>
              <p><strong>Status:</strong> {player.isAlive ? 'Alive' : 'Eliminated'}</p>
            </div>
            {isAdmin && (
              <button
                className="remove-player-button"
                onClick={() => handleRemoveClick(player)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <RemovePlayerModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemovePlayer}
        playerName={selectedPlayer?.playerName}
      />
    </div>
  );
};

export default PlayerList;