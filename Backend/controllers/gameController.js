import { collection, runTransaction, doc, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../Frontend/src/firebaseConfig'; 
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles assigning players their targets in the specific game
 * 
 * @param {string} gameId - The corresponding game's ID
 * @returns {Promise<void>} assigns players their targets in the specific game
 */
export const assignTargets = async (gameId) => {
  try {
    const playersRef = collection(db, 'players');
    const playerQuery = query(
      playersRef,
      where('gameId', '==', gameId),
      where('isAlive', '==', true)  
    );
    const playerSnapshot = await getDocs(playerQuery);
    const playerList = playerSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    // Shuffle players
    playerList.sort(() => Math.random() - 0.5);

    // Assign targets
    const updates = playerList.map((player, index) => {
      const targetIndex = (index + 1) % playerList.length;
      return updateDoc(doc(db, 'players', player.id), {
        targetId: playerList[targetIndex].id,
      });
    });

    await Promise.all(updates);
    console.log('Targets assigned successfully.');
  } catch (error) {
    console.error('Error assigning targets:', error);
    throw error;
  }
};

/**
 * Starts any specific game
 * 
 * @param {string} gameId - The corresponding game's ID
 * @returns {Promise<void>} Starts the specific game for all players.
 */
export const startGame = async (gameId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, { isActive: true });
    await assignTargets(gameId);
    console.log('Game started and targets assigned.');
  } catch (error) {
    console.error('Error starting the game:', error);
    throw error;
  }
};


export const updateGame = async (gameId, killerId, killedPlayerId) => {
  try {
      await runTransaction(db, async (transaction) => {
          // Get all relevant document references
          const gameRef = doc(db, 'games', gameId);
          const killerRef = doc(db, 'players', killerId);
          const killedPlayerRef = doc(db, 'players', killedPlayerId);

          // Get current documents
          const [gameDoc, killerDoc, killedPlayerDoc] = await Promise.all([
              transaction.get(gameRef),
              transaction.get(killerRef),
              transaction.get(killedPlayerRef)
          ]);

          if (!gameDoc.exists() || !killerDoc.exists() || !killedPlayerDoc.exists()) {
              throw new Error('Required documents not found');
          }

          const killedPlayerData = killedPlayerDoc.data();
          const gameData = gameDoc.data();

          // Get the killed player's target (this will be the killer's new target)
          const newTargetId = killedPlayerData.targetId;

          if (!newTargetId) {
              throw new Error('Killed player has no target ID');
          }

          // Update killer's target to the killed player's target
          transaction.update(killerRef, {
              targetId: newTargetId
          });

          // Get count of remaining alive players
          const playersRef = collection(db, 'players');
          const alivePlayersQuery = query(
              playersRef,
              where('gameId', '==', gameId),
              where('isAlive', '==', true)
          );
          
          const alivePlayers = await getDocs(alivePlayersQuery);
          const aliveCount = alivePlayers.size - 1; // Subtract 1 because the killed player is still counted as alive

          // If only one player remains (the killer), end the game
          if (aliveCount <= 1) {
              transaction.update(gameRef, {
                  isActive: false,
                  endTime: new Date(),
                  winner: killerId,
                  winnerName: killerDoc.data().displayName || 'Unknown',
                  gameStatus: 'completed'
              });
          }

          // Update elimination history
          const elimination = {
              killerId,
              killedPlayerId,
              timestamp: new Date(),
          };

          transaction.update(gameRef, {
              eliminations: [...(gameData.eliminations || []), elimination]
          });
      });

      return { 
          success: true,
          message: 'Game updated successfully'
      };
  } catch (error) {
      console.error('Error updating game:', error);
      throw error; // Let the calling function handle the error
  }
};