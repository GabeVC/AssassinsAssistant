import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../Frontend/src/firebaseConfig';

class Announcement {
    constructor({
        id,
        content,
        gameId,
        timestamp = new Date()
    }) {
        this.id = id;
        this.content = content;
        this.gameId = gameId;
        this.timestamp = timestamp;
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new Announcement({
            id: doc.id,
            content: data.content,
            gameId: data.gameId,
            timestamp: data.timestamp?.toDate()
        });
    }

    toFirestore() {
        return {
            content: this.content,
            gameId: this.gameId,
            timestamp: this.timestamp
        };
    }


    static async findById(announcementId) {
        try {
            const announcementRef = doc(db, 'announcements', announcementId);
            const announcementDoc = await getDoc(announcementRef);
            
            if (!announcementDoc.exists()) {
                return null;
            }
            
            return Announcement.fromFirestore(announcementDoc);
        } catch (error) {
            console.error('Error fetching announcement:', error);
            throw error;
        }
    }

    static async findByGameId(gameId) {
        try {
            const announcementsRef = collection(db, 'announcements');
            const announcementQuery = query(
                announcementsRef, 
                where('gameId', '==', gameId)
            );
            
            const announcementSnapshot = await getDocs(announcementQuery);
            return announcementSnapshot.docs
                .map(doc => Announcement.fromFirestore(doc))
                .sort((a, b) => b.timestamp - a.timestamp);  // Sort newest first
        } catch (error) {
            console.error('Error fetching game announcements:', error);
            throw error;
        }
    }


    static async getRecentAnnouncements(gameId, limit = 5) {
        try {
            const announcements = await this.findByGameId(gameId);
            return announcements.slice(0, limit);
        } catch (error) {
            console.error('Error fetching recent announcements:', error);
            throw error;
        }
    }


    getFormattedTimestamp() {
        return this.timestamp.toLocaleString();
    }


    getTimeElapsed() {
        const now = new Date();
        const diffInMinutes = Math.floor((now - this.timestamp) / 1000 / 60);
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }


    isRecent() {
        const now = new Date();
        return (now - this.timestamp) < 1000 * 60 * 60; // 1 hour
    }
}

export default Announcement;