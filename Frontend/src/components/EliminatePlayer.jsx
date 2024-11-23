import React, { useState } from 'react';
import { handleElimination } from '../../../Backend/controllers/playerController';

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
