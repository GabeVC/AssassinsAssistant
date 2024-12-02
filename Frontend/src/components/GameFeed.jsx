import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * This component handles announcments and editing them.
 *
 * @param {String} announcement - The contents of the announcement
 * @param {Boolean} isAdmin - Whether the client is the admin or not
 * @returns {React.JSX.Element} A React element that contains the announcment and some edit functionality.
 */
const AnnouncementItem = ({ announcement, isAdmin }) => {
  const { id, content, timestamp } = announcement;
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const announcementRef = doc(db, "announcements", id);
      await updateDoc(announcementRef, { content: editedContent });
      setShowEditDialog(false);
    } catch (error) {
      setError("Failed to update announcement. Please try again.");
      console.error("Error updating announcement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const announcementRef = doc(db, "announcements", id);
      await deleteDoc(announcementRef);
      setShowDeleteDialog(false);
    } catch (error) {
      setError("Failed to delete announcement. Please try again.");
      console.error("Error deleting announcement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="bg-gray-700/50 border-gray-600">
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <p className="text-gray-100">{content}</p>
              <p className="text-sm text-gray-400">
                {new Date(timestamp.seconds * 1000).toLocaleString()}
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
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/50 border-red-800"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
              className="border-gray-600 hover:bg-gray-700"
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
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/50 border-red-800"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-600 hover:bg-gray-700"
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

/**
 * This component handles displaying AnnouncementItem components
 *
 * @returns {React.JSX.Element} A React element that displays all the AnnouncementItem components
 */
const GameFeed = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const gameRef = doc(db, "games", gameId);
        const gameDoc = await getDoc(gameRef);

        if (gameDoc.exists()) {
          const gameInfo = gameDoc.data();
          setGameData(gameInfo);

          const playersRef = collection(db, "players");
          const playerQuery = query(playersRef, where("gameId", "==", gameId));
          const playerSnapshot = await getDocs(playerQuery);
          const playerList = playerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPlayers(playerList);

          // Set up a listener for announcements
          const announcementsRef = collection(db, "announcements");
          const announcementQuery = query(
            announcementsRef,
            where("gameId", "==", gameId)
          );
          const unsubscribe = onSnapshot(announcementQuery, (snapshot) => {
            const announcementList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Sort announcements by timestamp (assuming timestamp is a Firestore Timestamp)
            const sortedAnnouncements = announcementList.sort((a, b) => {
              return b.timestamp.seconds - a.timestamp.seconds; // Sort in descending order
            });

            setAnnouncements(sortedAnnouncements);
          });

          const currentUser = playerList.find((player) => player.isAdmin);
          setIsAdmin(currentUser ? currentUser.isAdmin : false);

          return () => unsubscribe();
        } else {
          console.error("No such game exists!");
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  if (loading) return <p>Loading game details...</p>;

  return (
    <div className="game-details">
      <button className="back-button" onClick={() => navigate("/")}>
        Back to Home
      </button>
      {gameData ? (
        <>
          <h2>{gameData.title} Feed</h2>

          {/* Scrollable player list */}
          <div>
            <h3>Announcements</h3>
            <div className="player-list">
              {announcements.map((announcement) => (
                <div key={announcement.id}>
                  <AnnouncementItem
                    announcement={announcement}
                    isAdmin={isAdmin}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p>Game not found.</p>
      )}
    </div>
  );
};

export default GameFeed;
export { AnnouncementItem };
