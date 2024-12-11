const db = require('./database');

class GameModel {
    constructor() {
        this.collection = 'games';
    }

    async createGame({title, rules, playerIds = [], isActive=false}) {

        
        const data = {eliminations:[],
            gameId:gameId,
            isActive:isActive,
            playerIds:playerIds,
            rules:rules,
            title:title
        };
        
        const gameId = await db.addDoc(this.collection, data);
        return {gameId, ...data };
    }

    async getGame(gameId) {
        const game = await db.getDoc(this.collection, gameId);
        if (game) {
            return {gameId, ...game};
        }
        return null;
    }

    async updateGame(gameId, updates) {
        await db.updateDoc(this.collection, gameId, updates);
        return this.getGame(gameId);
    }

}

module.exports = new GameModel();