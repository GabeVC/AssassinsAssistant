import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { useParams } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc,collection, onSnapshot,where, query,getDocs} from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import './GamePage.css';
import './GameFeed.css';

/**
 * This component handles announcments and editing them.
 * 
 * @param {String} announcement - The contents of the announcement
 * @param {Boolean} isAdmin - Whether the client is the admin or not
 * @returns {React.JSX.Element} A React element that contains the announcment and some edit functionality.
 */
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
            {isAdmin && (
                    <div className="admin-actions">
                    <button onClick={handleEdit} className="icon-button edit-button">
                        <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                    <button onClick={handleDelete} className="icon-button delete-button">
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                    </div>
                )}
                
                <>
                    <div className="content"><p>{content}</p></div>
                    <p className="timestamp">{new Date(timestamp.seconds * 1000).toLocaleString()}</p>
                </>
        </div>
    );
};


/**
 * This component handles displaying AnnouncementItem components
 * 
 * @returns {React.JSX.Element} A React element that displays all the AnnouncementItem components
 */
const GameFeed = () => {
    const { gameId } = useParams();
    const [gameData, setGameData] = useState(null);
    const [players, setPlayers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false); 
    const navigate = useNavigate();
    
    useEffect(() => {
      const fetchGameData = async () => {
        try {
          const gameRef = doc(db, 'games', gameId);
          const gameDoc = await getDoc(gameRef);
  
          if (gameDoc.exists()) {
            const gameInfo = gameDoc.data();
            setGameData(gameInfo);


            const playersRef = collection(db, 'players');
            const playerQuery = query(playersRef, where('gameId', '==', gameId));
            const playerSnapshot = await getDocs(playerQuery);
            const playerList = playerSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPlayers(playerList);
  
            // Set up a listener for announcements
            const announcementsRef = collection(db, 'announcements');
            const announcementQuery = query(announcementsRef, where('gameId', '==', gameId));
            const unsubscribe = onSnapshot(announcementQuery, (snapshot) => {
              const announcementList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
  
              // Sort announcements by timestamp (assuming timestamp is a Firestore Timestamp)
              const sortedAnnouncements = announcementList.sort((a, b) => {
                return b.timestamp.seconds - a.timestamp.seconds; // Sort in descending order
              });
  
              setAnnouncements(sortedAnnouncements);
            });
  
  
            const currentUser = playerList.find(player => player.isAdmin);
            setIsAdmin(currentUser ? currentUser.isAdmin : false); 
  
            return () => unsubscribe();
          } else {
            console.error("No such game exists!");
          }
        } catch (error) {
          console.error("Error fetching game data:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchGameData();
    }, [gameId]);
  
    if (loading) return <p>Loading game details...</p>;
  
    return (
      <div className="game-details">
        <button className="back-button" onClick={() => navigate('/')}>
        Back to Home
      </button>
        {gameData ? (
          <>
            <h2>{gameData.title} Feed</h2>
  
            {/* Scrollable player list */}
            <div >
              <h3>Announcements</h3>
              <div className="player-list">
                {announcements.map((announcement) => (
                  <div key={announcement.id}>
                  <AnnouncementItem announcement={announcement}  isAdmin={isAdmin}/>
              </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p>Game not found.</p>
        )}
      </div>
    );
  };

export default GameFeed;
export {AnnouncementItem};
