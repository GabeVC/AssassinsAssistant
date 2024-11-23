import React, { useState } from 'react';
import { handleElimination } from '../../../Backend/controllers/playerController';
/**
 * This component handles the creation of the eliminate player window
 * 
 * @param {Boolean} isOpen - Whether the eliminate player window is open or not
 * @param {Function} onClose - What function gets called when the eliminate player window is closed
 * @param {List} playerList - The list of players for this particular game.
 * @param {String} gameId - The ID for this particular game.
 * @returns {React.JSX.Element} A React element that displays the eliminate player window
 */
const EliminatePlayer = ({ isOpen, onClose, playerList, gameId }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const submitElimination = async () => {
        await handleElimination(playerList, gameId, file);
        onClose(); // Close the modal after submission
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="close-button">
                    &times;
                </button>
                <h2>Eliminate Target</h2>
                <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <button onClick={submitElimination}>Submit</button>
            </div>
        </div>
    );
};

export default EliminatePlayer;
