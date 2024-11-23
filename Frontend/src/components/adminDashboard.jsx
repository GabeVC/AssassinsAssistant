import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const AdminDashboard = ({ gameId }) => {
    const [pendingKills, setPendingKills] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingKills();
    }, [gameId]);

    const fetchPendingKills = async () => {
        try {
            setLoading(true);
            const playersRef = collection(db, 'players');
            const pendingQuery = query(
                playersRef, 
                where('gameId', '==', gameId),
                where('isPending', '==', true)
            );
            
            const querySnapshot = await getDocs(pendingQuery);
            const kills = querySnapshot.docs.map(doc => {
                const playerData = doc.data();
                const latestAttempt = playerData.eliminationAttempts?.[playerData.eliminationAttempts.length - 1] || {};
                
                return {
                    id: doc.id,
                    ...playerData,
                    evidenceUrl: latestAttempt.evidenceUrl,
                    dispute: latestAttempt.dispute,
                    disputeTimestamp: latestAttempt.disputeTimestamp,
                    eliminationAttemptId: latestAttempt.id
                };
            });
            
            setPendingKills(kills);
            setError(null);
        } catch (err) {
            console.error("Error fetching pending kills:", err);
            setError("Failed to load pending kills. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyKill = async (playerId, eliminationAttemptId) => {
        try {
            const playerRef = doc(db, 'players', playerId);
            await updateDoc(playerRef, { 
                isPending: false,
                isAlive: false,
                verifiedAt: new Date()
            });
            
            setPendingKills(prevKills => prevKills.filter(kill => kill.id !== playerId));
        } catch (error) {
            console.error("Error verifying kill:", error);
            setError("Failed to verify kill. Please try again.");
        }
    };

    const rejectKill = async (playerId) => {
        try {
            const playerRef = doc(db, 'players', playerId);
            await updateDoc(playerRef, { 
                isPending: false,
                evidenceUrl: null
            });
            
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

                                {/* Display dispute if it exists */}
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
                                    onClick={() => rejectKill(player.id)}
                                >
                                    Reject
                                </button>
                                <button 
                                    className="verify-button"
                                    onClick={() => verifyKill(player.id)}
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