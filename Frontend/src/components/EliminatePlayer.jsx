import React, { useState } from "react";
import { handleElimination } from "../../../Backend/controllers/playerController";
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
import { useToast } from "./ui/use-toast";

/**
 * This component handles the creation of the eliminate player window
 *
 * @param {Boolean} isOpen - Whether the eliminate player window is open or not
 * @param {Function} onClose - What function gets called when the eliminate player window is closed
 * @param {List} playerList - The list of players for this particular game.
 * @param {String} gameId - The ID for this particular game.
 * @returns {React.JSX.Element} A React element that displays the eliminate player window
 */
const EliminatePlayer = ({ isOpen, onClose, gameId }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const submitElimination = async () => {
    try {
      setIsSubmitting(true);
      await handleElimination(gameId, file);
      toast({
        title: "Success",
        description: "Elimination submitted successfully",
        variant: "success",
      });
      onClose(); // Close the modal after submission
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminate Target</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload evidence of your elimination
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 hover:border-gray-600"
            }`}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) {
                setFile(droppedFile);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Input
              type="file"
              id="fileInput"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Label
              htmlFor="fileInput"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-400">
                {file ? file.name : "Click or drag to upload evidence"}
              </span>
            </Label>
          </div>
          <Button
            onClick={submitElimination}
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={!file || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Elimination"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EliminatePlayer;