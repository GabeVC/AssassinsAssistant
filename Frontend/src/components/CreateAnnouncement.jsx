import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import './CreateGame.css';

/**
 * This component handles the creation of an announcement
 * 
 * @param {boolean} isOpen - Whether the announcement window is open or not
 * @param {Function} onClose - What function gets called when the announcement window is closed
 * @param {string} gameId - The corresponding game's ID
 * @returns {React.JSX.Element} A React element that displays the announcement window.
 */
const CreateAnnouncement = ({ isOpen, onClose, gameId }) => {
  const [content, setContent] = useState('');

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Announcement cannot be empty');
      return;
    }

    const announcementId = uuidv4(); 

    try {
        await runTransaction(db, async (transaction) => {
            const userId = auth.currentUser ? auth.currentUser.uid : null;

                if (!userId) {
                throw new Error('User is not authenticated');
                }
            const announcementRef = doc(db, 'announcements', announcementId);
        
            if (!announcementId || !gameId || !content) {
                console.error('Error creating announcement');
                alert('Failed to create announcement. All changes have been rolled back.');
            }
                
          transaction.set(announcementRef, {
            gameId,
            announcementId,
            content,
            timestamp: new Date(),
          });
    
        });
      
        onClose();
        alert('Anncouncement created successfully!');
      } catch (error) {
        console.error('Error creating announcement:', error);
        alert('Failed to create announcment. All changes have been rolled back.');
      }
    };

  if (!isOpen) return null; 

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">&times;</button>
        <h2>Make an Announcement</h2>
        <form onSubmit={handleCreateAnnouncement}>
          <div className="form-group">
            <label>Content</label>
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
            />
          </div>
          
          <button type="submit">Create Announcement</button>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncement;
