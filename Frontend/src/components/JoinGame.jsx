import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Users, Loader2, AlertCircle, ArrowLeft, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
/**
 * This component handles joining and already existing game
 *
 * @returns {React.JSX.Element} A react element used for joining an existing game.
 */

const JoinGame = () => {
  const { gameId } = useParams();
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameInfo, setGameInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        const gameRef = doc(db, "games", gameId);
        const gameDoc = await getDoc(gameRef);
        if (gameDoc.exists()) {
          setGameInfo(gameDoc.data());
        }
      } catch (error) {
        console.error("Error fetching game info:", error);
      }
    };

    fetchGameInfo();
  }, [gameId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
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

    setLoading(true);
    setError("");

    try {
      const gameRef = doc(db, "games", gameId);
      const gameDoc = await getDoc(gameRef);

      if (!gameDoc.exists()) {
        setError("Game not found. Please check the invite code.");
        return;
      }

      const gameData = gameDoc.data();
      if (gameData.isActive) {
        setError("This game has already begun.");
        return;
      }

      const user = auth.currentUser;
      const userId = user.uid;
      const playersRef = collection(db, "players");
      const playerQuery = query(playersRef, where("gameId", "==", gameId));
      const playerSnapshot = await getDocs(playerQuery);
      const playerList = playerSnapshot.docs.map((doc) => doc.data());
      const playerId = uuidv4();
      const playerRef = doc(db, "players", playerId);
      const existingPlayer = playerList.find(
        (player) => player.userId === user.uid
      );

      if (existingPlayer) {
        setError("You are already part of this game.");
        return;
      }

      await setDoc(playerRef, {
        id: playerId,
        userId,
        playerName,
        gameId,
        isAlive: true,
        isPending: false,
        targetId: null,
        isAdmin: false,
        createdAt: new Date(),
        lastUpdated: new Date(),
        eliminationAttempts: [],
        eliminations: 0,
      });

      await updateDoc(gameRef, {
        playerIds: arrayUnion(playerId),
      });

      navigate("/home");
    } catch (error) {
      console.error("Error joining game:", error);
      setError("There was an issue joining the game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Join Game</h1>
          <p className="text-gray-400">Enter your details to join the game</p>
        </div>

        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Game Details</CardTitle>
            <CardDescription className="text-gray-400">
              {gameInfo?.title || "Loading game information..."}
            </CardDescription>
          </CardHeader>
          {isAuthenticated && (
            <CardContent className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/50 border-red-800"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="playerName" className="text-gray-200">
                  Player Name
                </Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your player name"
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>
            </CardContent>
          )}
          <CardFooter className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-gray-700 text-black hover:bg-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleJoinGame}
              disabled={loading || !isAuthenticated}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Game
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default JoinGame;
