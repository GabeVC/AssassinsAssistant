import React from 'react';
import './Leaderboard.css';

/**
 * This component handles displaying the leaderboard
 * 
 * @param {List} players - The players displayed on this leaderboard
 * @returns {React.JSX.Element} A React element that displays the leaderboard
 */
const Leaderboard = ({ players }) => {
    // Sort players by eliminations
    const sortedPlayers = [...players].sort((a, b) => {
        const aElims = a.stats?.eliminations || 0;
        const bElims = b.stats?.eliminations || 0;
        return bElims - aElims;  
    });

    return (
        <div className="leaderboard-container">
            <h3>Leaderboard</h3>
            <div className="leaderboard">
                <div className="leaderboard-header">
                    <span className="rank">Rank</span>
                    <span className="player-name">Player</span>
                    <span className="eliminations">Eliminations</span>
                </div>
                {sortedPlayers.map((player, index) => (
                    <div key={player.id} className="leaderboard-entry">
                        <span className="rank">{index + 1}</span>
                        <span className="player-name">{player.playerName}</span>
                        <span className="eliminations">
                            {(player && player.eliminations) || 0}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Leaderboard;