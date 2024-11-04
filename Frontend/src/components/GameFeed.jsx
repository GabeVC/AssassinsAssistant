import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import './GamePage.css';
import './GameFeed.css';

const AnnouncementItem = ({ announcementId }) => { 
    const [announcementData, setAnnouncementData] = useState(null);

    useEffect(() => {
        const fetchAnnouncementData = async () => {
            if (!announcementId) return;  // Ensure there's an announcementId

            try {
                const announcementRef = doc(db, 'announcements', announcementId);
                const announcementSnap = await getDoc(announcementRef);

                if (announcementSnap.exists()) {
                    setAnnouncementData(announcementSnap.data());
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching announcement:', error);
            }
        };

        fetchAnnouncementData();
    }, [announcementId]);
    
    return (
        <div className="feed-item">
            {announcementData ? (
                <>
                    <p>{announcementData.content}</p>
                    <p>{new Date(announcementData.timestamp.seconds * 1000).toLocaleString()}</p>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default AnnouncementItem;
