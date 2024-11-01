import { React, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import CreateGame from './CreateGame';
import './HomePage.css';

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [games, setGames] = useState([]);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  useEffect(() => {
    const fetchGames = async (userId) => {
      try {
        // Query the players collection to find entries with the user's ID
        const playersRef = collection(db, 'players');
        const playerQuery = query(playersRef, where('userId', '==', userId));
        const playerSnapshot = await getDocs(playerQuery);

        // Retrieve each associated game
        const gamesList = [];
        for (const playerDoc of playerSnapshot.docs) {
          const playerData = playerDoc.data();
          const gameRef = doc(db, 'games', playerData.gameId);
          const gameDoc = await getDoc(gameRef);
          
          if (gameDoc.exists()) {
            gamesList.push({ 
              id: gameDoc.id, 
              ...gameDoc.data(), 
              playerStatus: playerData.isAlive ? 'Alive' : 'Eliminated', 
              isAdmin: playerData.isAdmin 
            });
          }
        }
        
        setGames(gamesList);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };

    if (user) {
      fetchGames(user.uid);
    }
  }, [user]);

return (
    <div className="home-page">
        <h1>Welcome to Assassins Assistant!</h1>

    
    <div className="navigation-buttons"> 
        <Link to="/profile">
        <button>Profile</button>
        </Link>
        <button onClick={handleLogout}>Logout</button>
      
        
    </div>
    <div className="active-games">
        <h2>Active Games</h2>
        <div className="games-grid">
          {games.length > 0 ? (
            games.map((game) => (
              <div className="game-card" key={game.id}>
                <h3>{game.title}</h3>
                <p><strong>Game Status:</strong> {game.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Players Remaining:</strong> {game.playerIds.length}</p>
                <p><strong>Your Role:</strong> {game.isAdmin ? 'Admin' : 'Player'}</p>
                <p><strong>Your Status:</strong> {game.playerStatus}</p>
                <button onClick={() => navigate(`/games/${game.id}`)}>View Game</button>
              </div>
            ))
          ) : (
            <p>No active games found.</p>
          )}
        </div>
      </div>
  
        
        <button onClick={openModal}>Create New Game</button>
        <CreateGame isOpen={isModalOpen} onClose={closeModal} />
    </div>
    );
};

export default HomePage;
