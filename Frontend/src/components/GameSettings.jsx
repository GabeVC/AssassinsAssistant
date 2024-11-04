import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import './GameSettings.css'


const GameSettings = ({ isOpen, onClose, inviteLink }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button onClick={onClose} className="close-button">&times;</button>
          <h2>Game Settings</h2>
  
          <div className="settings-option">
            <label>Invite Link:</label>
            <input
              type="text"
              value={inviteLink}
              readOnly
              onClick={(e) => e.target.select()}
            />
          </div>
  
          <div className="settings-option">
            <label>Other Settings:</label>
            <p></p>
          </div>
        </div>
      </div>
    );
  };

export default GameSettings