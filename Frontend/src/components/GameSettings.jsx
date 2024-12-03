import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  runTransaction,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

/**
 * This component handles the game settings window
 *
 * @param {Boolean} isOpen - Whether the game settings window is open or not
 * @param {Function} onClose - What function gets called when the game settings window is closed
 * @param {String} inviteLink - The invite link for this game.
 * @returns {React.JSX.Element} A React element that displays the game settings window
 */
const GameSettings = ({ isOpen, onClose, inviteLink }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your game settings and invite players
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Invite Link</Label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                onClick={(e) => e.target.select()}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
              <Button
                variant="outline"
                className="border-gray-700 text-black hover:bg-gray-700"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameSettings;
