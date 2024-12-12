import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../Frontend/src/firebaseConfig';
import Game from './gameModel';
class User {
    constructor({
        id,
        email,
        username,
        userId,
        createdAt = new Date(),
        stats = {
            eliminations: 0,
            gamesPlayed: 0,
            gamesWon: 0
        }
    }) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.userId = userId;
        this.createdAt = createdAt;
        this.stats = stats;
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new User({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            stats: {
                eliminations: data.stats?.eliminations || 0,
                gamesPlayed: data.stats?.gamesPlayed || 0,
                gamesWon: data.stats?.gamesWon || 0
            }
        });
    }

    toFirestore() {
        return {
            email: this.email,
            username: this.username,
            userId: this.userId,
            createdAt: this.createdAt,
            stats: this.stats
        };
    }


    static async findUserById(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                return null;
            }
            
            return User.fromFirestore(userDoc);
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    /**
     * Find a user by their email
     */
    static async findUserByEmail(email) {
        try {
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('email', '==', email));
            const userSnapshot = await getDocs(userQuery);
            
            if (userSnapshot.empty) {
                return null;
            }
            
            return User.fromFirestore(userSnapshot.docs[0]);
        } catch (error) {
            console.error('Error fetching user by email:', error);
            throw error;
        }
    }
    async findGames() {
        try {
            const playersRef = collection(db, 'players');
            const playerQuery = query(playersRef, where('userId', '==', this.userId));
            const playerSnapshot = await getDocs(playerQuery);
            
            const gameIds = playerSnapshot.docs.map(doc => doc.data().gameId);
            const gamePromises = gameIds.map(id => Game.getGamebyId(id));
            
            return (await Promise.all(gamePromises)).filter(game => game !== null);
        } catch (error) {
            console.error('Error finding user games:', error);
            throw error;
        }
    }
    async findActiveGames() {
        const games = await this.findGames();
        return games.filter(game => game.isActive);
    }


    incrementStats(statType) {
        if (!['eliminations', 'gamesPlayed', 'gamesWon'].includes(statType)) {
            throw new Error('Invalid stat type');
        }
        this.stats[statType] = (this.stats[statType] || 0) + 1;
    }

    isNewUser() {
        return this.stats.gamesPlayed === 0;
    }
}

export default User;
