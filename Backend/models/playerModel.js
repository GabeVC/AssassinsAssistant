import { v4 as uuidv4 } from "uuid";
const db = require('./database');
class Player {
  constructor({
      id,
      userId,
      gameId,
      playerName,
      isAdmin = false,
      isAlive = true,
      isPending = false,
      targetId = null,
      eliminations = 0,
      eliminationAttempts = [],
      joinedAt = new Date()
  }) {
      this.id = id;
      this.userId = userId;
      this.gameId = gameId;
      this.playerName = playerName;
      this.isAdmin = isAdmin;
      this.isAlive = isAlive;
      this.isPending = isPending;
      this.targetId = targetId;
      this.eliminations = eliminations;
      this.eliminationAttempts = eliminationAttempts;
      this.joinedAt = joinedAt;
  }
  toFirestore() {
    return {
        userId: this.userId,
        gameId: this.gameId,
        playerName: this.playerName,
        isAdmin: this.isAdmin,
        isAlive: this.isAlive,
        isPending: this.isPending,
        targetId: this.targetId,
        eliminations: this.eliminations,
        eliminationAttempts: this.eliminationAttempts,
        joinedAt: this.joinedAt
    };
  }
  static fromFirestore(doc) {
    const data = doc.data();
    return new Player({
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt?.toDate(),
        eliminationAttempts: data.eliminationAttempts?.map(attempt => ({
            ...attempt,
            timestamp: attempt.timestamp?.toDate(),
            disputeTimestamp: attempt.disputeTimestamp?.toDate(),
            verifiedAt: attempt.verifiedAt?.toDate()
        }))
    });
  }
  static async findPlayerById(playerId) {
    try {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await getDoc(playerRef);
        
        if (!playerDoc.exists()) {
            return null;
        }
        
        return Player.fromFirestore(playerDoc);
    } catch (error) {
        console.error('Error fetching player:', error);
        return null;
    }
  }
  static async findPlayersByGameId(gameId) {
    try {
        const playersRef = collection(db, 'players');
        const playerQuery = query(playersRef, where('gameId', '==', gameId));
        const playerSnapshot = await getDocs(playerQuery);
        
        return playerSnapshot.docs.map(doc => Player.fromFirestore(doc));
    } catch (error) {
        console.error('Error fetching game players:', error);
        throw error;
    }
  } 
  async findTarget() {
    if (!this.targetId) return null;
    return Player.findById(this.targetId);
  }
  async findKiller() {
    try {
        const playersRef = collection(db, 'players');
        const killerQuery = query(
            playersRef, 
            where('gameId', '==', this.gameId),
            where('targetId', '==', this.id),
            where('isAlive', '==', true)
        );
        const killerSnapshot = await getDocs(killerQuery);
        
        if (killerSnapshot.empty) {
            return null;
        }
        
        return Player.fromFirestore(killerSnapshot.docs[0]);
    } catch (error) {
        console.error('Error fetching killer:', error);
        throw error;
    }
  }
  canBeEliminated() {
    return this.isAlive && !this.isPending;
  }
  addEliminationAttempt(attempt) {
    if (!this.canBeEliminated()) {
        throw new Error('Player cannot be eliminated');
    }
    
    this.eliminationAttempts.push({
        ...attempt,
        timestamp: new Date()
    });
    this.isPending = true;
  }

  verifyElimination() {

      const latestAttempt = this.getLatestEliminationAttempt();
      if (!latestAttempt || latestAttempt.verified) {
          throw new Error('No pending elimination attempt to verify');
      }
      //Dont need to check canBeEliminated, already checked earlier in flow

      this.isAlive = false;
      this.isPending = false;
      latestAttempt.verified = true;
      latestAttempt.verifiedAt = new Date();
  }

  
}
export default Player;