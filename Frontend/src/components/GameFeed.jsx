import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deleteAnnouncement } from "../../../Backend/controllers/feedController";
import Announcement from "../../../Backend/models/announcementModel";
import {
  Card,
  CardContent,
} from "./ui/card";
import {
  Alert,
  AlertDescription,
} from "./ui/alert";
import {DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Dialog,} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Pencil, Trash2 } from "lucide-react";
import Player from "../../../Backend/models/playerModel";
import { useToast } from "./ui/use-toast";

export const AnnouncementItem = ({ announcement, isAdmin }) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedContent, setEditedContent] = useState(announcement.content);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = async () => {
    try {
      setIsLoading(true);
      const updatedAnnouncement = new Announcement({
        ...announcement,
        content: editedContent
      });
      await updatedAnnouncement.update();
      toast({
        title: "Success",
        description: "Announcement updated successfully",
        variant: "success"
      });
      setShowEditDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString();
  };

  const handleDelete = async () => {
    try {
      await deleteAnnouncement(announcement.id);
      toast({
        title: "Success",
        description: "Announcement deleted",
        variant: "success",
      });
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="bg-gray-700/50 border-gray-600">
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <p className="text-gray-100">{announcement.content}</p>
              <p className="text-sm text-gray-400">
              {formatTimestamp(announcement.timestamp)}
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditDialog(true)}
                  className="text-gray-400 hover:text-white hover:bg-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to your announcement below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="announcement">Announcement Text</Label>
              <Input
                id="announcement"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="text-black border-gray-600 hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="text-black border-gray-600 hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Deleting...
                </div>
              ) : (
                "Delete Announcement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const GameFeed = () => {
  const { gameId } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        // Get announcements
        const announcementsList = await Announcement.findByGameId(gameId);
        setAnnouncements(announcementsList);

        // Get player to check admin status
        const player = await Player.findByUserAndGame(auth.currentUser.uid, gameId);

        if (player) {
          // Set isAdmin based on the player's data
          setIsAdmin(player.isAdmin);
        } else {
          console.log('Player not found for the current user and game');
        }
      } catch (error) {
        console.error("Error fetching feed data:", error);
        toast({
          title: "Error",
          description: "Failed to load feed data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, [gameId, toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Game Feed</h2>
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="border-gray-700 text-gray-200"
        >
          Back to Home
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="bg-gray-800/80 border-gray-700">
            <CardContent className="p-6 text-center text-gray-400">
              No announcements yet
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              announcement={announcement}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GameFeed;
