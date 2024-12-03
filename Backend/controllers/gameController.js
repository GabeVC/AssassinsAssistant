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
      await runTransaction(db, async (transaction) => {
          const playersRef = collection(db, 'players');
          const playerQuery = query(playersRef, where('gameId', '==', gameId));
          const playerSnapshot = await getDocs(playerQuery);
          
          if (playerSnapshot.empty) {
              throw new Error('No players found in the game');
          }

          const gameRef = doc(db, 'games', gameId);
          const gameDoc = await transaction.get(gameRef);

          if (!gameDoc.exists()) {
              throw new Error('Game not found');
          }

          const userDocs = await Promise.all(
              playerSnapshot.docs.map(async (playerDoc) => {
                  const userData = playerDoc.data();
                  if (!userData.userId) return null;
                  const userRef = doc(db, 'users', userData.userId);
                  return await transaction.get(userRef);
              })
          );

          transaction.update(gameRef, { isActive: true });

          playerSnapshot.docs.forEach((playerDoc, index) => {
              const userData = playerDoc.data();
              const userDoc = userDocs[index];
              
              if (userDoc && userDoc.exists()) {
                  const currentStats = userDoc.data().stats || {};
                  transaction.update(doc(db, 'users', userData.userId), {
                      'stats.gamesPlayed': (currentStats.gamesPlayed || 0) + 1
                  });
              }
          });
      });

      // Assign targets after transaction completes
      await assignTargets(gameId);
      console.log('Game started, targets assigned, and player stats updated.');

  } catch (error) {
      console.error('Error starting the game:', error);
      throw error;
  }
};

export const updateGame = async (gameId, killerId, killedPlayerId) => {
  try {
      await runTransaction(db, async (transaction) => {
          const gameRef = doc(db, 'games', gameId);
          const killerRef = doc(db, 'players', killerId);
          const killedPlayerRef = doc(db, 'players', killedPlayerId);

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
          const killerData = killerDoc.data();

          // Get the killed player's target
          const newTargetId = killedPlayerData.targetId;

          if (!newTargetId) {
              throw new Error('Killed player has no target ID');
          }

          // Update killer's target
          transaction.update(killerRef, {
              targetId: newTargetId
          });

          // Check remaining players
          const playersRef = collection(db, 'players');
          const alivePlayersQuery = query(
              playersRef,
              where('gameId', '==', gameId),
              where('isAlive', '==', true)
          );
          
          const alivePlayers = await getDocs(alivePlayersQuery);
          const aliveCount = alivePlayers.size - 1; // Subtract 1 for the killed player

          // If game is ending, update winner's stats
          if (aliveCount <= 1) {
              // Update game state
              transaction.update(gameRef, {
                  isActive: false,
                  endTime: new Date(),
                  winner: killerId,
                  winnerName: killerData.displayName || 'Unknown',
                  gameStatus: 'completed'
              });

              // Update winner's stats
              if (killerData.userId) {
                  const userRef = doc(db, 'users', killerData.userId);
                  const userDoc = await transaction.get(userRef);
                  
                  if (userDoc.exists()) {
                      const currentStats = userDoc.data().stats || {};
                      transaction.update(userRef, {
                          'stats.gamesWon': (currentStats.gamesWon || 0) + 1
                      });
                  }
              }
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
      throw error;
  }
};