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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

/**
 * This component handles the creation of an announcement
 *
 * @param {boolean} isOpen - Whether the announcement window is open or not
 * @param {Function} onClose - What function gets called when the announcement window is closed
 * @param {string} gameId - The corresponding game's ID
 * @returns {React.JSX.Element} A React element that displays the announcement window.
 */
const CreateAnnouncement = ({ isOpen, onClose, gameId }) => {
  const [content, setContent] = useState("");

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("Announcement cannot be empty");
      return;
    }

    const announcementId = uuidv4();

    try {
      await runTransaction(db, async (transaction) => {
        const userId = auth.currentUser ? auth.currentUser.uid : null;

        if (!userId) {
          throw new Error("User is not authenticated");
        }
        const announcementRef = doc(db, "announcements", announcementId);

        if (!announcementId || !gameId || !content) {
          console.error("Error creating announcement");
          alert(
            "Failed to create announcement. All changes have been rolled back."
          );
        }

        transaction.set(announcementRef, {
          gameId,
          announcementId,
          content,
          timestamp: new Date(),
        });
      });

      onClose();
      alert("Anncouncement created successfully!");
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to create announcment. All changes have been rolled back.");
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make an Announcement</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create an announcement for all players to see
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateAnnouncement}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Announcement</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your announcement..."
                className="bg-gray-900/50 border-gray-700 text-white resize-none"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Post Announcement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncement;
