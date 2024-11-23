import React, { useState, useEffect } from 'react';
import { fetchPendingKills, verifyKill, rejectKill } from '../../../Backend/controllers/playerController';

/**
 * This component handles the creation of the admin page
 * 
 * @param {string} gameId - The corresponding game's ID
 * @returns {React.JSX.Element} A React element that displays the admin page
 */
const AdminDashboard = ({ gameId }) => {
    const [pendingKills, setPendingKills] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadPendingKills = async () => {
        try {
            setLoading(true);
            const kills = await fetchPendingKills(gameId);
            setPendingKills(kills);
            setError(null);
        } catch (err) {
            console.error("Error loading pending kills:", err);
            setError("Failed to load pending kills. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPendingKills();
    }, [gameId]);

    const handleVerifyKill = async (playerId) => {
        try {
            await verifyKill(playerId);
            setPendingKills(prevKills => prevKills.filter(kill => kill.id !== playerId));
        } catch (error) {
            console.error("Error verifying kill:", error);
            setError("Failed to verify kill. Please try again.");
        }
    };

    const handleRejectKill = async (playerId) => {
        try {
            await rejectKill(playerId);
            setPendingKills(prevKills => prevKills.filter(kill => kill.id !== playerId));
        } catch (error) {
            console.error("Error rejecting kill:", error);
            setError("Failed to reject kill. Please try again.");
        }
    };

    if (loading) {
        return <div className="loading">Loading pending kills...</div>;
    }

    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            
            {error && (
                <div className="error-message">{error}</div>
            )}

            {pendingKills.length === 0 ? (
                <div className="no-kills-message">
                    No pending kills to review
                </div>
            ) : (
                <div className="pending-kills-list">
                    {pendingKills.map(player => (
                        <div key={player.id} className="kill-card">
                            <div className="kill-card-header">
                                <h3>Player: {player.playerName}</h3>
                                <span className="timestamp">
                                    Submitted: {player.lastUpdated?.toDate().toLocaleString()}
                                </span>
                            </div>
                            
                            <div className="kill-card-content">
                                {player.evidenceUrl && (
                                    <div className="evidence-container">
                                        {player.evidenceUrl.includes('.mp4') ? (
                                            <video controls className="evidence-media">
                                                <source src={player.evidenceUrl} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <img 
                                                src={player.evidenceUrl} 
                                                alt="Kill Evidence" 
                                                className="evidence-media"
                                            />
                                        )}
                                    </div>
                                )}

                                {player.dispute && (
                                    <div className="dispute-container">
                                        <h4>Player Dispute:</h4>
                                        <p>{player.dispute}</p>
                                        <span className="dispute-timestamp">
                                            Disputed: {player.disputeTimestamp?.toDate().toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="kill-card-footer">
                                <button 
                                    className="reject-button"
                                    onClick={() => handleRejectKill(player.id)}
                                >
                                    Reject
                                </button>
                                <button 
                                    className="verify-button"
                                    onClick={() => handleVerifyKill(player.id)}
                                >
                                    Verify Kill
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;