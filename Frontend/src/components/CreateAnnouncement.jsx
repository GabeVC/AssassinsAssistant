import { React,  useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  runTransaction,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { createAnnouncement } from "../../../Backend/controllers/feedController";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { Label } from "./ui/label";


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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Announcement content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createAnnouncement(content, gameId);
      toast({
        title: "Success",
        description: "Announcement created successfully",
        variant: "success",
      });
      setContent("");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Enter your announcement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-gray-900/50 border-gray-700"
          />
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Announcement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncement;