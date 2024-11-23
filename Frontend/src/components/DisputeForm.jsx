import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * This component handles the creation of the dispute form window
 * 
 * @param {String} playerId - The eliminated person's ID
 * @param {String} eliminationAttemptId - The eliminatation's ID
 * @returns {React.JSX.Element} A React element that displays the dispute form window
 */
const DisputeForm = ({ playerId, eliminationAttemptId, onClose }) => {
    const [disputeText, setDisputeText] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!disputeText.trim()) {
            setError('Please enter a dispute explanation');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const playerRef = doc(db, 'players', playerId);
            const playerDoc = await getDoc(playerRef);
            
            if (!playerDoc.exists()) {
                throw new Error('Player not found');
            }

            const attempts = playerDoc.data().eliminationAttempts || [];
            const updatedAttempts = attempts.map(attempt => {
                if (attempt.id === eliminationAttemptId) {
                    return {
                        ...attempt,
                        dispute: disputeText,
                        disputeTimestamp: new Date()
                    };
                }
                return attempt;
            });

            await updateDoc(playerRef, {
                eliminationAttempts: updatedAttempts
            });
            
            setSuccess(true);
            // Wait for 2 seconds to show success message before closing
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error submitting dispute:', error);
            setError('Failed to submit dispute. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="dispute-form">
            <h3>Submit Dispute</h3>
            {error && <div className="error-message">{error}</div>}
            {success ? (
                <div className="success-message">
                    Dispute successfully submitted!
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={disputeText}
                        onChange={(e) => setDisputeText(e.target.value)}
                        placeholder="Explain why you believe you were not eliminated..."
                        rows={4}
                        maxLength={500}
                    />
                    <div className="button-container">
                        <button 
                            type="button" 
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Dispute'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DisputeForm;