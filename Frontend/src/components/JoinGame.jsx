import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, collection, query, where, getDocs, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * This component handles joining and already existing game
 * 
 * @returns {React.JSX.Element} A react element used for joining an existing game.
 */
const JoinGame = () => {
  const { gameId } = useParams(); // Extract gameId from the URL
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        // Redirect to login with gameId
        navigate(`/login?redirect=join/${gameId}`);
      }
    });

    return () => unsubscribe();
  }, [navigate, gameId]);

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter a valid player name.");
      return;
    }

    try {
      const gameRef = doc(db, 'games', gameId);
      const gameDoc = await getDoc(gameRef);

      if (!gameDoc.exists()) {
        setError('Game not found. Please check the invite code.');
        return;
      }

      const gameData = gameDoc.data();
      if (gameData.isActive) {
        setError('This game has already begun.');
        return;
      }
      

      const user = auth.currentUser;
      const userId = user.uid;
      const playersRef = collection(db, 'players');
      const playerQuery = query(playersRef, where('gameId', '==', gameId));
      const playerSnapshot = await getDocs(playerQuery);
      const playerList = playerSnapshot.docs.map((doc) => doc.data());
      const playerId = uuidv4();
      const playerRef = doc(db, 'players', playerId);
      const existingPlayer = playerList.find(player => player.userId === user.uid);
      if (existingPlayer) {
        setError('You are already part of this game.');
        return;
      }

      await setDoc(playerRef, {
        playerId,
        userId,
        playerName,
        gameId,
        isAlive: true,
        isPendingReview: false, 
        TargetId: '',
        isAdmin: false,
      });

      await updateDoc(gameRef, {
        playerIds: arrayUnion(playerId),
      });

      navigate('/home');
    } catch (error) {
      console.error("Error joining game:", error);
      setError('There was an issue joining the game. Please try again.');
    }
  };

  return (
    <div>
      <h2>Join Game</h2>
      {isAuthenticated && (
        <>
          <p>Game ID: {gameId}</p>
          <div className="form-group">
            <label>Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your player name"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button onClick={handleJoinGame}>Join Game</button>
        </>
      )}
    </div>
  );
};

export default JoinGame;