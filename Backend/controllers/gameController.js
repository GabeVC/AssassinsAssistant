import { doc, runTransaction, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../Frontend/src/firebaseConfig';
import Game from '../models/gameModel';
import Player from '../models/playerModel';
import User from '../models/userModel';

export const assignTargets = async (gameId) => {
  try {
    const livingPlayers = await Game.getLivingPlayers(gameId);
    // Shuffle players
    livingPlayers.sort(() => Math.random() - 0.5);

    await runTransaction(db, async (transaction) => {
      // Update each player's target in the transaction
      livingPlayers.forEach((player, index) => {
        const targetIndex = (index + 1) % livingPlayers.length;
        player.targetId = livingPlayers[targetIndex].id;
        transaction.update(doc(db, 'players', player.id), player.toFirestore());
      });
    });

    console.log('Targets assigned successfully.');
  } catch (error) {
    console.error('Error assigning targets:', error);
    throw error;
  }
};

export const startGame = async (gameId) => {
  try {
    await runTransaction(db, async (transaction) => {
      // Get game and validate
      const game = await Game.getGamebyId(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (!game.canStart()) {
        throw new Error('Game cannot be started');
      }

      // Get all players
      const playersRef = collection(db, 'players');
      const playerQuery = query(playersRef, where('gameId', '==', gameId));
      const playerSnapshot = await getDocs(playerQuery);

      if (playerSnapshot.empty) {
        throw new Error('No players found in the game');
      }

      // Convert to Player models and get their users
      const players = playerSnapshot.docs.map(doc => Player.fromFirestore(doc));
      const users = await Promise.all(
        players.map(player => User.findUserById(player.userId))
      );

      // Update game state
      game.isActive = true;
      game.gameStatus = 'active';
      transaction.update(doc(db, 'games', game.id), game.toFirestore());

      // Update each user's stats
      users.forEach(user => {
        if (user) {
          user.incrementStats('gamesPlayed');
          transaction.update(doc(db, 'users', user.id), user.toFirestore());
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
      // Get all required documents and convert to models
      const [game, killer, killedPlayer] = await Promise.all([
        Game.getGamebyId(gameId),
        Player.findPlayerById(killerId),
        Player.findPlayerById(killedPlayerId)
      ]);

      if (!game || !killer || !killedPlayer) {
        throw new Error('Required documents not found');
      }

      // Get killer's user document
      const killerUser = await User.findPlayerById(killer.userId);
      if (!killerUser) {
        throw new Error('Killer user not found');
      }

      // Update killer's target
      killer.targetId = killedPlayer.targetId;

      // Get count of remaining alive players
      const livingPlayers = await Game.getLivingPlayers(gameId);
      const aliveCount = livingPlayers.length - 1; // Subtract 1 for soon-to-be-eliminated player

      // Add elimination to game history
      game.addElimination(killerId, killedPlayerId);

      if (aliveCount <= 1) {
        // Game is ending
        game.markAsComplete(killerId, killer.playerName);
        killerUser.incrementStats('gamesWon');
      }

      // Perform all updates
      transaction.update(doc(db, 'players', killer.id), killer.toFirestore());
      transaction.update(doc(db, 'players', killedPlayer.id), killedPlayer.toFirestore());
      transaction.update(doc(db, 'games', game.id), game.toFirestore());
      transaction.update(doc(db, 'users', killerUser.id), killerUser.toFirestore());
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