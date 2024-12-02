import React, { useState } from "react";
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
import { db, auth } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * This component handles creating the join game window.
 *
 * @param {Boolean} isOpen - Whether the join game window is open or not
 * @param {Function} onClose - What function gets called when the join game window is closed
 * @returns {React.JSX.Element} A React element that displays the join game window
 */

const JoinGameModal = ({ isOpen, onClose }) => {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    if (!gameId.trim()) {
      setError("Please enter a valid game ID.");
      setIsLoading(false);
      return;
    }

    try {
      const gameRef = doc(db, "games", gameId.trim());
      const gameDoc = await getDoc(gameRef);

      if (!gameDoc.exists()) {
        setError("Game not found. Please check the invite code.");
        return;
      }

      const user = auth.currentUser;
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
        userId: user ? user.uid : null,
        playerId,
        playerName,
        gameId: gameId.trim(),
        isAlive: true,
        isAdmin: false,
        targetId: "",
        isPendingReview: "",
      });

      await updateDoc(gameRef, {
        playerIds: arrayUnion(playerId),
      });

      onClose();
    } catch (error) {
      console.error("Error joining game:", error);
      setError("There was an issue joining the game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Game</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your details to join an existing game
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/50 border-red-800 text-red-200"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white"
              placeholder="Enter your player name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameId">Game ID</Label>
            <Input
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white"
              placeholder="Paste the game ID here"
              required
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Joining...
              </div>
            ) : (
              "Join Game"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGameModal;
