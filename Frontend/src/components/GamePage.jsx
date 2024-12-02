import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  where,
  query,
  getDocs,
} from "firebase/firestore";
import GameSettings from "./GameSettings";
import CreateAnnouncement from "./CreateAnnouncement";
import { AnnouncementItem } from "./GameFeed";
import AdminDashboard from "./adminDashboard";
import { startGame } from "../../../Backend/controllers/gameController";
import EliminatePlayer from "./EliminatePlayer";
import DisputeForm from "./DisputeForm";
import PlayerList from "./PlayerList";
import Leaderboard from "./Leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Settings,
  MessageSquarePlus,
  Target,
  PlayCircle,
  Users,
  ArrowLeft,
  Award,
  Shield,
  Flag,
  MessageSquare,
} from "lucide-react";

/**
 * This component handles displaying and containing all elements of the game page
 *
 * @returns {React.JSX.Element} A React element that displays an interactive game page
 */

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // State management
  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTargetName, setUserTargetName] = useState("");
  const [numLivingPlayers, setLiving] = useState(0);

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEliminateModal, setShowEliminateModal] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        // Fetch game data
        const gameRef = doc(db, "games", gameId);
        const gameDoc = await getDoc(gameRef);

        if (!gameDoc.exists()) {
          console.error("Game not found!");
          navigate("/");
          return;
        }

        const gameInfo = gameDoc.data();
        setGameData(gameInfo);

        // Fetch players
        const playersRef = collection(db, "players");
        const playerQuery = query(playersRef, where("gameId", "==", gameId));
        const playerSnapshot = await getDocs(playerQuery);
        const playerList = playerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(playerList);
        setLiving(playerList.filter((p) => p.isAlive).length);

        // Set up announcements listener
        const announcementsRef = collection(db, "announcements");
        const announcementQuery = query(
          announcementsRef,
          where("gameId", "==", gameId)
        );
        const unsubscribe = onSnapshot(announcementQuery, (snapshot) => {
          const announcementList = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

          setAnnouncements(announcementList);
        });

        // Process current user data
        const userId = auth.currentUser.uid;
        const currentUser = playerList.find(
          (player) => player.userId === userId
        );

        if (currentUser) {
          const eliminationAttempts = currentUser.eliminationAttempts || [];
          const latestAttempt =
            eliminationAttempts[eliminationAttempts.length - 1];

          setCurrentPlayer({
            ...currentUser,
            latestAttempt,
            canDispute:
              currentUser.isPending && latestAttempt && !latestAttempt.dispute,
          });

          const targetPlayer = playerList.find(
            (player) => player.id === currentUser.targetId
          );
          setUserTargetName(
            targetPlayer ? targetPlayer.playerName : "No target assigned"
          );
          setIsAdmin(currentUser.isAdmin);
        }

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching game data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, navigate]);

  const handleBeginGame = async () => {
    try {
      await startGame(gameId);
      setGameData((prev) => ({ ...prev, isActive: true }));
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">{gameData?.title}</h1>
            <p className="text-blue-400">
              {gameData?.isActive ? "Game in Progress" : "Game Setup"}
            </p>
          </div>
          <div className="flex gap-4">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setShowAdminDashboard(!showAdminDashboard)}
                className="border-gray-700 text-black hover:bg-gray-700"
              >
                {showAdminDashboard ? "Show Game View" : "Show Admin Dashboard"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-gray-700 text-black hover:bg-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>

        {showAdminDashboard && isAdmin ? (
          <AdminDashboard gameId={gameId} />
        ) : (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Player Status */}
              <Card className="bg-gray-800/80 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Your Status</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <Shield className="text-blue-400" />
                      ) : (
                        <Users className="text-blue-400" />
                      )}
                      <span>
                        Role:{" "}
                        <span className="text-blue-400">
                          {isAdmin ? "Admin" : "Player"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="text-blue-400" />
                      <span>
                        Target:{" "}
                        <span className="text-yellow-400">
                          {userTargetName}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="text-green-400" />
                      <span>
                        Status:{" "}
                        <span
                          className={
                            currentPlayer?.isAlive
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {currentPlayer?.isAlive ? "Alive" : "Eliminated"}
                        </span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Status */}
              <Card className="bg-gray-800/80 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Game Status</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          gameData?.isActive ? "bg-green-500" : "bg-yellow-400"
                        }`}
                      />
                      <span>
                        {gameData?.isActive ? "Active" : "Setup Phase"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="text-blue-400" />
                      <span>{numLivingPlayers} Players Remaining</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-gray-800/80 border-gray-700">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="text-white">Actions</CardTitle>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSettings(true)}
                      className="text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {isAdmin && !gameData?.isActive && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      onClick={handleBeginGame}
                    >
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Begin Game
                    </Button>
                  )}
                  {isAdmin && gameData?.isActive && (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowAnnouncementModal(true)}
                    >
                      <MessageSquarePlus className="mr-2 h-5 w-5" />
                      Make Announcement
                    </Button>
                  )}
                  {gameData?.isActive && currentPlayer?.isAlive && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowEliminateModal(true)}
                    >
                      <Target className="mr-2 h-5 w-5" />
                      Eliminate Target
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="players" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-gray-800/80 border-gray-700 rounded-lg p-1">
                <TabsTrigger
                  value="players"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  Players
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger
                  value="announcements"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  Announcements
                </TabsTrigger>
                <TabsTrigger
                  value="rules"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                >
                  Rules
                </TabsTrigger>
              </TabsList>

              <TabsContent value="players">
                <PlayerList
                  players={players}
                  gameId={gameId}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="leaderboard">
                <Leaderboard players={players} />
              </TabsContent>

              <TabsContent value="announcements">
                <Card className="bg-gray-800/80 border-gray-700">
                  <CardContent className="p-6 space-y-4">
                    {announcements.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No announcements yet</p>
                      </div>
                    ) : (
                      announcements.map((announcement) => (
                        <AnnouncementItem
                          key={announcement.id}
                          announcement={announcement}
                          isAdmin={isAdmin}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules">
                <Card className="bg-gray-800/80 border-gray-700">
                  <CardContent className="p-6">
                    <p className="text-gray-200">{gameData?.rules}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Dispute Alert */}
            {currentPlayer?.canDispute && (
              <Alert className="mt-4 bg-yellow-900/50 border-yellow-800">
                <Flag className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>Your elimination is pending review</span>
                  <Button
                    variant="outline"
                    className="border-yellow-800 hover:bg-yellow-800"
                    onClick={() => setShowDisputeForm(true)}
                  >
                    Submit Dispute
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Modals */}
            <GameSettings
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              inviteLink={`${window.location.origin}/join/${gameId}`}
            />

            <CreateAnnouncement
              isOpen={showAnnouncementModal}
              onClose={() => setShowAnnouncementModal(false)}
              gameId={gameId}
            />

            <EliminatePlayer
              isOpen={showEliminateModal}
              onClose={() => setShowEliminateModal(false)}
              playerList={players}
              gameId={gameId}
            />

            {showDisputeForm && currentPlayer?.latestAttempt && (
              <DisputeForm
                playerId={currentPlayer.id}
                eliminationAttemptId={currentPlayer.latestAttempt.id}
                onClose={() => setShowDisputeForm(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GamePage;
