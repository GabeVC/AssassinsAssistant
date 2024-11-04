import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, deleteDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import './GamePage.css';
import './GameFeed.css';

const AnnouncementItem = ({ announcement, isAdmin }) => {

    const { id, content, timestamp } = announcement;

    const handleEdit = async () => {
        const newContent = prompt("Edit the announcement:", content);
        if (newContent) {
        const announcementRef = doc(db, 'announcements', id);
        await updateDoc(announcementRef, { content: newContent });
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this announcement?");
        if (confirmDelete) {
        const announcementRef = doc(db, 'announcements', id);
        await deleteDoc(announcementRef);
        }
    };
    
    return (
        <div className="feed-item">
                <>
                    <div className="content"><p>{content}</p></div>
                    <p className="timestamp">{new Date(timestamp.seconds * 1000).toLocaleString()}</p>
                </>
            
                {isAdmin && (
                    <div className="admin-actions">
                    <button onClick={handleEdit} className="edit-button">Edit</button>
                    <button onClick={handleDelete} className="delete-button">Delete</button>
                    </div>
                )}
        </div>
    );
};

export default AnnouncementItem;
