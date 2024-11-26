import { 
    doc, 
    runTransaction, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../Frontend/src/firebaseConfig'; 

import { v4 as uuidv4 } from 'uuid';
const allowedEvidenceTypes = ['image/jpeg', 'image/png', 'video/mp4'];
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
export const handleElimination = async (playerList, gameId, file) => {
    // Basic validations
    const livingPlayers = playerList.filter(p => p.isAlive);
    if (livingPlayers.length === 1) {
        throw new Error("Only one player remaining, game over.");
    }

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
        const userInfo = livingPlayers.find(player => player.userId === userId);
        if (!userInfo) {
            throw new Error("Current user not found in player list");
        }

        const userIdx = livingPlayers.indexOf(userInfo);
        const victimIdx = (userIdx + 1) % livingPlayers.length;
        const victimInfo = livingPlayers[victimIdx];
        
        let evidenceUrl = null;
        if (file) {
            evidenceUrl = await uploadEvidence(file, gameId, victimInfo.id);
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
            const playerRef = doc(db, 'players', victimInfo.id);
            const playerDoc = await transaction.get(playerRef);
            
            if (!playerDoc.exists()) {
                throw new Error(`Player with ID ${victimInfo.id} not found!`);
            }

            const currentAttempts = playerDoc.data().eliminationAttempts || [];

            transaction.update(playerRef, {
                isPending: true,
                eliminationAttempts: [...currentAttempts, eliminationAttempt]
            });
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
        
        return kills;
    } catch (error) {
        console.error("Error fetching pending kills:", error);
        throw error;
    }
};

export const verifyKill = async (playerId) => {
    try {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await getDoc(playerRef);
        
        if (!playerDoc.exists()) {
            throw new Error('Player not found');
        }

        const playerData = playerDoc.data();
        const attempts = playerData.eliminationAttempts || [];
        const latestAttempt = attempts[attempts.length - 1];

        const playersRef = collection(db, 'players');
        const killerQuery = query(
            playersRef, 
            where('gameId', '==', playerData.gameId),
            where('targetId', '==', playerId)
        );
        
        const killerSnapshot = await getDocs(killerQuery);
        
        if (!killerSnapshot.empty) {
            const killerDoc = killerSnapshot.docs[0];
            const killerRef = doc(db, 'players', killerDoc.id);
            
            await updateDoc(killerRef, {
                'eliminations': (killerDoc.data().eliminations || 0) + 1
            });
        }

        await updateDoc(playerRef, { 
            isPending: false,
            isAlive: false,
            verifiedAt: new Date()
        });

        return true;
    } catch (error) {
        console.error("Error verifying kill:", error);
        throw error;
    }
};

export const rejectKill = async (playerId) => {
    try {
        const playerRef = doc(db, 'players', playerId);
        await updateDoc(playerRef, { 
            isPending: false,
            evidenceUrl: null
        });
        return true;
    } catch (error) {
        console.error("Error rejecting kill:", error);
        throw error;
    }
};