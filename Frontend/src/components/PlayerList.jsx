import React, { useState } from "react";
import { doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Shield, UserX, Award, Skull } from "lucide-react";

/**
 * This component handles the creation of the remove player window
 *
 * @param {Boolean} isOpen - If the window is open or not
 * @param {Function} onClose - The function called when this window is closed
 * @param {Function} onConfirm - The function called when the player removal is confirmed
 * @param {String} playerName - The name of the player being removed
 * @returns {React.JSX.Element} A React element that displays the remove player window
 */
const RemovePlayerModal = ({ isOpen, onClose, onConfirm, playerName }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Remove Player</DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to remove {playerName} from the game?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-black hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Remove Player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * This component handles the creation of the player list
 *
 * @param {List} players - The players of the corresponding game
 * @param {String} gameId - The ID of the corresponding game
 * @param {Boolean} isAdmin - Whether the user is the game's admin or not
 * @returns {React.JSX.Element} A List containing all players in a game
 */

const PlayerList = ({ players, gameId, isAdmin }) => {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [error, setError] = useState(null);

  const handleRemoveClick = (player) => {
    setSelectedPlayer(player);
    setShowRemoveModal(true);
    setError(null);
  };

  const handleRemovePlayer = async () => {
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        playerIds: arrayRemove(selectedPlayer.id),
      });

      const playerRef = doc(db, "players", selectedPlayer.id);
      await deleteDoc(playerRef);

      setShowRemoveModal(false);
      setSelectedPlayer(null);
      window.location.reload();
    } catch (error) {
      console.error("Error removing player:", error);
      setError("Failed to remove player. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {players.map((player) => (
        <Card
          key={player.id}
          className="bg-gray-800/80 border-gray-700 hover:bg-gray-800/60 transition-colors"
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {player.isAlive ? (
                <Award className="h-5 w-5 text-green-400" />
              ) : (
                <Skull className="h-5 w-5 text-red-400" />
              )}
              <div>
              <p className="font-medium text-white flex items-center gap-1">
  {player.playerName}
  {player.isAdmin && (
    <Shield className="h-5 w-5 text-blue-400" />
  )}
</p>

                <p className="text-sm text-gray-400">
                  {player.isAlive
                    ? "Alive"
                    : "Eliminated"}
                    {player.isAdmin
                    && (" (Admin)")}
                </p>
              </div>
            </div>
            {isAdmin && !player.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveClick(player)}
                className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
              >
                <UserX className="h-5 w-5" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <RemovePlayerModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemovePlayer}
        playerName={selectedPlayer?.playerName}
      />
    </div>
  );
};

export default PlayerList;
