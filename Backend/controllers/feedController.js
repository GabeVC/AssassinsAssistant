import { collection, runTransaction, doc, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../Frontend/src/firebaseConfig'; 
import { v4 as uuidv4 } from 'uuid';
import Announcement from '../models/announcementModel';

export const createAnnouncement = async (content, gameId) => {
  try {
      const announcement = new Announcement({
          id: uuidv4(),
          content,
          gameId,
          timestamp: new Date()
      });

      await runTransaction(db, async (transaction) => {
          const announcementRef = doc(db, 'announcements', announcement.id);
          transaction.set(announcementRef, announcement.toFirestore());
      });

      return { success: true, announcement };
  } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
  }
};

export const deleteAnnouncement = async (announcementId) => {
  try {
      const announcement = await Announcement.findById(announcementId);
      if (!announcement) {
          throw new Error('Announcement not found');
      }

      await runTransaction(db, async (transaction) => {
          const announcementRef = doc(db, 'announcements', announcementId);
          transaction.delete(announcementRef);
      });

      return { success: true };
  } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
  }
};