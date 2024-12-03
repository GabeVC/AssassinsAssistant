import { collection, runTransaction, doc, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../Frontend/src/firebaseConfig'; 
import { v4 as uuidv4 } from 'uuid';

export const createAnnouncement = async (content, gameId) => {

    const announcementId = uuidv4();

    try {
      await runTransaction(db, async (transaction) => {
        const announcementRef = doc(db, "announcements", announcementId);

        if (!announcementId || !gameId || !content) {
          console.error("Error creating announcement");
          alert("Failed to create announcment. All changes have been rolled back.");
        }

        transaction.set(announcementRef, {
          gameId,
          announcementId,
          content,
          timestamp: new Date(),
        });
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to create announcment. All changes have been rolled back.");
    }
};