import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';


const EliminatePlayer = ({ isOpen, onClose, playerList }) => {
    const allowedEvidenceTypes = ['image/jpeg', 'image/png'];

    const handleElimination = async () =>
        {
        
          const livingPlayers = playerList.filter(p => p.isAlive);
          if (livingPlayers.length == 1) {
            // Dont.
            return;
          }
            // For now this pretends that there are no disputes.
            // Sets target.isAlive to false
            // Dispute logic would need to encapsulate this behavior, some kinda timeout before it triggers
            try {
                await runTransaction(db, async (transaction) => {
                  const userId = auth.currentUser ? auth.currentUser.uid : null;
                  
                  
                  
                  if (!userId) {
                    throw new Error("User is not authenticated! How did you get here?");
                  }
                  
                  const userInfo = livingPlayers.find(player => 
                    player.userId == userId
                  );
                  
                  const userIdx = livingPlayers.indexOf(userInfo);
                  
                  if (userIdx == -1) {
                      throw new Error("Failed to find index of current user");
                    }
                    
                    const victimIdx = (userIdx + 1) % livingPlayers.length;
                    const victimId = livingPlayers[victimIdx].id;
                    
                    const playerRef = doc(db, 'players', victimId);
                    
                    // not sure how else to check if it exists already
                    const playerDoc = await transaction.get(playerRef);
                    
                    if (!playerDoc.exists) {
                        throw new Error('Player with ID ${victimId} not found!');
                    }
                    
                    transaction.update(playerRef, {isAlive : false});
                    
                    // Update kill feed
                    const announcementId = uuidv4();
                    const announcementRef = doc(db, 'announcements', announcementId);
                    
                //   if ()
                });
                
    
              } catch (error) {
              alert("Error in eliminating player:", error);
            }
        };
    
      const fileUpload = async () => {
        const fileIn = document.getElementById('fileInput');
            const file = fileIn.files[0];
            
            if (!file) {
                alert("Please select a file to upload");
            }
    
            if (!allowedEvidenceTypes.includes(file.type)) {
                alert("Please select a valid image file (JPEG/PNG)");
                fileIn.value = "";
            }
    
            console.log("Test: Valid evidence file submitted, uploading...");
            // TODO:: put evidence upload in here
            
          }

    if (!isOpen) return null;

    return (
            <div className="modal-overlay">
              <div className="modal-content">
                  <button onClick={onClose} className="close-button">
                    &times;
                    </button>
                  <h2>Eliminate Target</h2>
                  <input type="file" id="fileInput" required/>
                  <button onClick={() => handleElimination()}>Submit</button>
              </div>
            <form onChange={() => fileUpload()}></form>
            </div>
    );

};

export default EliminatePlayer;