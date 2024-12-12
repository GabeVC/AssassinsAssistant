import Player from "./playerModel"
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
  } from 'firebase/firestore';
import { db } from '../../Frontend/src/firebaseConfig';
  
const default_rules = "(1) Everyone playing is assigned a target that only they know. \n(2) They must kill their target. \n(3) When killed, their target's target become their own. \n(4) Goes until the last man standing."; 
class Game {
    constructor({
        id,
        title,
        rules= default_rules ,
        playerIds = [], 
        eliminations = [],
        isActive = false,
        createdAt = new Date(),   
        endTime = null,
        winner = null,
        winnerName = null,
        gameStatus = 'setup',     
    }) {
        this.id = id;
        this.title = title;
        this.rules = rules;
        this.playerIds = playerIds;
        this.eliminations = eliminations;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.endTime = endTime;
        this.winner = winner;
        this.winnerName = winnerName;
        this.gameStatus = gameStatus;        
    }
    toFirestore() {
        return {
            gameId: this.id,
            title: this.title,         
            rules: this.rules,
            playerIds: this.playerIds,
            eliminations: this.eliminations,
            isActive: this.isActive,
            createdAt: this.createdAt,
            endTime: this.endTime,
            winner: this.winner,
            winnerName: this.winnerName,
            gameStatus: this.gameStatus,
        };
    }
    static fromFirestore(doc) {
        const data = doc.data();
        return new Game({
            id: doc.id,
            title: data.title,
            rules: data.rules,
            playerIds: data.playerIds || [],
            isActive: data.isActive,
            createdAt: data.createdAt?.toDate(),
            endTime: data.endTime?.toDate(),
            winner: data.winner,
            winnerName: data.winnerName,
            gameStatus: data.gameStatus,
            createdBy: data.createdBy,
            eliminations: (data.eliminations || []).map(elim => ({
                ...elim,
                timestamp: elim.timestamp?.toDate()
            }))
        });
    }

    static async getGamebyId(gameId) {
        try
        {const gameRef = doc(db, 'games', gameId);
        const gameDoc = await getDoc(gameRef);

        if (!gameDoc.exists()) {
            return null;
        }

        return Game.fromFirestore(gameDoc);}
        catch {
            console.log("Error getting game by id");
            return null;
        }
    }

    async isComplete() {
        let livingPlayers = await this.getLivingPlayers(this.id);
        return livingPlayers.length == 1;
    }

    static async getLivingPlayers(gameId) {
        try {
            const playersRef = collection(db, 'players');
            const gameQuery = query(playersRef, where('gameId', '==', gameId), where('isAlive', '==', true));
            const livingSnap = await getDocs(gameQuery);

            return livingSnap.docs.map(doc => Player.fromFirestore(doc));
        } catch (e) {
            console.error('Error finding living players:', e);
            throw e;
        }
    }
    
    addElimination(killerId, killedPlayerId) {
        this.eliminations.push({
            killerId,
            killedPlayerId,
            timestamp: new Date()
        });
    }

    markAsComplete(winnerId, winnerName) {
        this.isActive = false;
        this.endTime = new Date();
        this.winner = winnerId;
        this.winnerName = winnerName;
        this.gameStatus = 'completed';
    }
    canStart() {
        return !this.isActive && this.gameStatus === 'setup';
    }

}

export default Game;