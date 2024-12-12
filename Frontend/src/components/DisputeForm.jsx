import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import Player from "../../../Backend/models/playerModel";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  CheckCircle
} from "lucide-react";

/**
 * This component handles the creation of the dispute form window
 *
 * @param {String} playerId - The eliminated person's ID
 * @param {String} eliminationAttemptId - The eliminatation's ID
 * @returns {React.JSX.Element} A React element that displays the dispute form window
 */
const DisputeForm = ({ playerId, eliminationAttemptId, onClose }) => {
  const [disputeText, setDisputeText] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!disputeText.trim()) {
        setError('Please enter a dispute explanation');
        return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Use Player model to find the player by ID
      const player = await Player.findPlayerById(playerId);

      if (!player) {
        throw new Error('Player not found');
      }

      // Update the specific elimination attempt
      const updatedAttempts = player.eliminationAttempts.map(attempt => {
        if (attempt.id === eliminationAttemptId) {
          return {
            ...attempt,
            dispute: disputeText,
            disputeTimestamp: new Date()
          };
        }
        return attempt;
      });

      // Update the player data in Firestore using the model's method
      await updateDoc(doc(db, 'players', playerId), {
        eliminationAttempts: updatedAttempts
      });

        setSuccess(true);
        // Wait for 2 seconds to show success message before closing
        setTimeout(() => {
            onClose();
        }, 2000);

    } catch (error) {
        console.error('Error submitting dispute:', error);
        setError('Failed to submit dispute. Please try again.');
    } finally {
        setSubmitting(false);
    }
  };
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Dispute</DialogTitle>
          <DialogDescription className="text-gray-400">
            Explain why you believe the elimination was invalid
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-400">Dispute successfully submitted!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dispute">Dispute Reason</Label>
              <Textarea
                id="dispute"
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                placeholder="Explain why you believe you were not eliminated..."
                className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-700 text-black hover:bg-gray-700"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Dispute"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DisputeForm;
