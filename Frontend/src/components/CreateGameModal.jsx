import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  runTransaction,
} from "firebase/firestore";
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
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * This component handles the creation of a game
 *
 * @param {boolean} isOpen - Whether the game creation window is open or not
 * @param {Function} onClose - What function gets called when the game creation window is closed
 * @returns {React.JSX.Element} A React element that displays the game creation window
 */

const CreateGameModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [rules, setRules] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const defaultRules = "(1) Everyone playing is assigned a target that only they know. (2) They must kill their target. (3) When killed, their target’s target become their own. (4) Goes until the last man standing.";

  const handleCreateGame = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!title.trim()) {
      setError("Game name is required");
      setIsLoading(false);
      return;
    }

    const gameId = uuidv4();
    const playerId = uuidv4();

    try {
      await runTransaction(db, async (transaction) => {
        const userId = auth.currentUser ? auth.currentUser.uid : null;

        if (!userId) {
          throw new Error("User is not authenticated");
        }
        const gameRef = doc(db, "games", gameId);
        const playerRef = doc(db, "players", playerId);
        const isAdmin = true;
        const isActive = false;
        const isAlive = true;

        transaction.set(gameRef, {
          gameId,
          title,
          isActive,
          rules: rules || defaultRules,
          playerIds: [],
          createdAt: new Date(),
        });

        if (isPlaying) {
          transaction.set(playerRef, {
            playerId,
            userId,
            playerName,
            gameId,
            isAlive,
            TargetId: "",
            isAdmin,
          });
        

          transaction.update(gameRef, {
            playerIds: arrayUnion(playerId),
          });
        }
        else {
          transaction.set(playerRef, {
            playerId,
            userId,
            playerName,
            gameId,
            isAlive: false,
            TargetId: "",
            isAdmin,
          });
        

          transaction.update(gameRef, {
            playerIds: arrayUnion(playerId),
          });
        }

      });

      setPlayerName("");
      setIsPlaying(false);
      onClose();
      window.location.reload();
    } catch (error) {
      setError("Failed to create game. All changes have been rolled back.");
      console.error("Error creating game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Game</DialogTitle>
          <DialogDescription className="text-gray-400">
            Set up your game details and rules
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateGame} className="space-y-4">
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
            <Label htmlFor="title">Game Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPlaying"
              checked={isPlaying}
              onCheckedChange={setIsPlaying}
            />
            <Label htmlFor="isPlaying">
              I would like to participate in this game
            </Label>
          </div>

          {isPlaying && (
            <div className="space-y-2">
              <Label htmlFor="playerName">Your Player Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white"
                placeholder="This will be visible to other players"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rules">Rules</Label>
            <Textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
              placeholder="Enter custom rules or leave blank for default rules"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              "Create Game"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGameModal;
