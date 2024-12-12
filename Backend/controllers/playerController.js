import { 
    doc, 
    runTransaction, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    getDoc,
    arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../Frontend/src/firebaseConfig'; 
import { updateGame } from './gameController';
import { createAnnouncement } from './feedController';
import Player from '../models/playerModel';
import User from '../models/userModel';
import Game from '../models/gameModel';

import { v4 as uuidv4 } from 'uuid';
const allowedEvidenceTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/mov'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB to accommodate videos

/**
 * Handles uploading evidence to the data source (Firebase)
 * 
 * @param {File} file - The file uploaded
 * @param {string} gameId - The corresponding game's ID
 * @param {string} playerId - The corresponding player's ID
 * @returns {Promise<any>} Uploads evidence to the data source (Firebase)
 */
async function uploadEvidence(file, gameId, playerId) {
    if (!file) return null;
    
    try {
        // Create a safe filename
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileRef = ref(storage, `evidence/${gameId}/${playerId}/${safeFileName}`);
        
        // Upload with metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                'gameId': gameId,
                'playerId': playerId
            }
        };
        
        const uploadResult = await uploadBytes(fileRef, file, metadata);
        return await getDownloadURL(uploadResult.ref);
    } catch (error) {
        console.error('Error uploading evidence:', error);
        throw new Error(`Failed to upload evidence: ${error.message}`);
    }
}

/**
 * Handles eliminating a player from a specific game
 * 
 * @param {List} playerList - A list containing all of the game's players
 * @param {string} gameId - The corresponding game's ID
 * @param {File} file - The file uploaded  for evidence of elimination
 * @returns {Promise} Eliminates a target player from the corresponding game
 */
export const handleElimination = async (gameId, file) => {
    // Basic validations
    const userId = auth.currentUser?.uid;
    if (!userId) {
        throw new Error("User is not authenticated!");
    }

    if (file) {
        if (!allowedEvidenceTypes.includes(file.type)) {
            throw new Error("Invalid file type. Only JPEG, PNG images and MP4 videos are allowed.");
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error("File size exceeds 50MB limit.");
        }
    }
    

    try {
        const currentPlayer = await Player.findByUserAndGame(userId, gameId);
        if (!currentPlayer) {
            throw new Error("Current user not found in game");
        }

        const target = await currentPlayer.findTarget();
        if (!target) {
            throw new Error("Target not found");
        }

        if (!target.canBeEliminated()) {
            throw new Error("Target cannot be eliminated at this time");
        }

        // Upload evidence if provided
        let evidenceUrl = null;
        if (file) {
            evidenceUrl = await uploadEvidence(file, gameId, target.id);
        }


        const eliminationAttempt = {
            id: uuidv4(),
            timestamp: new Date(),
            evidenceUrl: evidenceUrl,
            dispute: null,
            disputeTimestamp: null,
            verifiedAt: null,
            status: 'pending',
            verifiedBy: null
        };

        await runTransaction(db, async (transaction) => {
            const targetRef = doc(db, 'players', target.id);
            target.addEliminationAttempt(eliminationAttempt);
            transaction.update(targetRef, target.toFirestore());
        });

        

        return { 
            success: true, 
            message: "Successfully submitted elimination",
            evidenceUrl 
        };
        
    } catch (error) {
        console.error("Error in submitting elimination:", error);
        throw error;
    }
};
export const fetchPendingKills = async (gameId) => {
    try {
        const pendingPlayers = await Player.findPendingPlayersByGameId(gameId);
        return pendingPlayers.map(player => ({
            id: player.id,
            ...player.toFirestore(),
            evidenceUrl: player.getLatestEliminationAttempt()?.evidenceUrl,
            dispute: player.getLatestEliminationAttempt()?.dispute,
            disputeTimestamp: player.getLatestEliminationAttempt()?.disputeTimestamp,
            eliminationAttemptId: player.getLatestEliminationAttempt()?.id
        }));
    } catch (error) {
        console.error("Error fetching pending kills:", error);
        throw error;
    }
};

export const verifyKill = async (playerId) => {
    if (!playerId) {
        return { success: false, message: 'Invalid player ID' };
    }

    try {
        await runTransaction(db, async (transaction) => {
            // Get target player
            const target = await Player.findPlayerById(playerId);
            if (!target) {
                throw new Error('Player not found');
            }

            // Validate elimination attempt
            const latestAttempt = target.getLatestEliminationAttempt();
            if (!latestAttempt || latestAttempt.verified) {
                throw new Error('No pending elimination attempt');
            }

            // Get killer and game
            const killer = await target.findKiller();
            if (!killer) {
                throw new Error('No killer found');
            }

            const game = await Game.getGamebyId(target.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            // Get killer's user document
            const killerUser = await User.findUserById(killer.userId);
            if (!killerUser) {
                throw new Error('Killer user not found');
            }

            // Get remaining players count
            const livingPlayers = await Game.getLivingPlayers(game.id);
            const aliveCount = livingPlayers.length - 1; // Subtract 1 for soon-to-be-eliminated player

            // Perform updates
            const playerRef = doc(db, 'players', target.id);
            const killerRef = doc(db, 'players', killer.id);
            const userRef = doc(db, 'users', killer.userId);
            const gameRef = doc(db, 'games', game.id);

            // Update target
            target.verifyElimination();
            transaction.update(playerRef, target.toFirestore());

            // Update killer
            killer.eliminations += 1;
            killer.targetId = target.targetId;
            transaction.update(killerRef, killer.toFirestore());

            // Update killer's stats
            killerUser.incrementStats('eliminations');
            transaction.update(userRef, killerUser.toFirestore());

            // Update game
            if (aliveCount <= 1) {
                game.markAsComplete(killer.id, killer.playerName);
                killerUser.incrementStats('gamesWon');
                transaction.update(userRef, killerUser.toFirestore());
            }

            game.addElimination(killer.id, target.id);
            transaction.update(gameRef, game.toFirestore());
        });

        // Create announcement after transaction
        const target = await Player.findPlayerById(playerId);
        await createAnnouncement(`${target.playerName} was eliminated!`, target.gameId);

        return { 
            success: true, 
            message: 'Kill verified successfully' 
        };
    } catch (error) {
        console.error("Error verifying kill:", error);
        return {
            success: false,
            message: error.message
        };
    }
};

export const rejectKill = async (playerId) => {
    if (!playerId) {
        return false;
    }

    try {
        const player = await Player.findPlayerById(playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        player.isPending = false;
        await updateDoc(doc(db, 'players', player.id), player.toFirestore());
        return true;
    } catch (error) {
        console.error("Error rejecting kill:", error);
        throw error;
    }
};