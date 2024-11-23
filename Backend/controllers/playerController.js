import { doc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../Frontend/src/firebaseConfig'; 
import { v4 as uuidv4 } from 'uuid';
const allowedEvidenceTypes = ['image/jpeg', 'image/png', 'video/mp4'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB to accommodate videos

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

    // File validation
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
        
        // Upload evidence first if provided
        let evidenceUrl = null;
        if (file) {
            evidenceUrl = await uploadEvidence(file, gameId, victimInfo.id);
        }

        // Create new elimination attempt
        const eliminationAttempt = {
            id: uuidv4(),
            timestamp: new Date(),
            evidenceUrl: evidenceUrl,
            dispute: null,
            disputeTimestamp: null
        };

        // Update player document
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