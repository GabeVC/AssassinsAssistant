import { collection, doc, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
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