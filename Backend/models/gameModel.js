import Player from "./playerModel"

const db = require('./database');
const default_rules = "(1) Everyone playing is assigned a target that only they know. \n(2) They must kill their target. \n(3) When killed, their target's target become their own. \n(4) Goes until the last man standing."; 
class Game {
    constructor({
        id,
        title,
        rules= default_rules ,
        playerIds = [], 
        eliminations = [],
        isActive = false
    }) {
        this.id = id;
        this.title = title;
        this.rules = rules;
        this.playerIds = playerIds;
        this.eliminations = eliminations;
        this.isActive = isActive;

    }
    toFirestore() {
        return {
            gameId: this.id,
            title: this.title,
            rules: this.rules,
            playerIds: this.playerIds,
            eliminations: this.eliminations,
            isActive: this.isActive
        };
    }
    static fromFirestore(doc) {
        const data = doc.data();
        return new Game({
            id:doc.id,
            ...data,
            eliminations: data.eliminations.map(elim => ({
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

}

export default Game;