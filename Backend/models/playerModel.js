import { v4 as uuidv4 } from "uuid";
const db = require('./database');

class PlayerModel {

    constructor() {
      this.collection = 'players';
    }
  
    async addPlayer({ userId, playerName, gameId, isAlive = true, isAdmin = false, targetId = '' }) {
      const playerId = uuidv4();
      const data = { userId, playerName, gameId, isAlive, isAdmin, targetId , playerId};
      const Id = await db.addDoc(this.collection, data);
      return { Id, ...data };
    }
  
    async getPlayer(playerId) {
      const player = await db.getDoc(this.collection, playerId);
      return player ? { playerId, ...player } : null;
    }
  
    async updatePlayer(playerId, updates) {
      await db.updateDoc(this.collection, playerId, updates);
      return this.getPlayer(playerId);
    }
  
    async removePlayer(playerId) {
      await db.deleteDoc(this.collection, playerId);
    }
  }
  
  module.exports = new PlayerModel();