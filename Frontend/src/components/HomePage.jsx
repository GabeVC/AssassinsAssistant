import { React, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth} from "../firebaseConfig";
import Game from "../../../Backend/models/gameModel";
import User from "../../../Backend/models/userModel";
import Player from "../../../Backend/models/playerModel";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import CreateGameModal from "./CreateGameModal";
import JoinGameModal from "./JoinGameModal";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  LogOut,
  Plus,
  UserCircle,
  GamepadIcon,
  Target,
  Users,
  AlertTriangle,
  AlertCircle
} from "lucide-react";

/**
 * This component creates and displays the interactive home page
 *
 * @returns {JSX.Element} A JSX element which renders the interactive home page
 */

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);  // Added loading state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [games, setGames] = useState([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Get user instance and their games
    const user = await User.findUserById(userId);
    if (!user) throw new Error('User not found');
    
    const userGames = await user.findGames();
    
    // Transform games for UI
    const gamePromises = userGames.map(async (game) => {
      const [alivePlayers, pendingPlayers] = await Promise.all([
        Game.getLivingPlayers(game.id),
        Player.findPendingPlayersByGameId(game.id)
      ]);

      // Get current player's status in this game
      const player = await Player.findByUserAndGame(userId, game.id);
      
      return {
        id: game.id,
        ...game.toFirestore(),
        isAdmin: player?.isAdmin || false,
        playerStatus: player?.isAlive ? 'Alive' : 'Eliminated',
        alivePlayers: alivePlayers.length,
        hasEliminationAttempt: player?.isPending || false,
        canDispute: player?.getLatestEliminationAttempt()?.canDispute || false,
        pendingEliminations: pendingPlayers.length,
      };
    });
        
        const gamesData = await Promise.all(gamePromises);
        setGames(gamesData.filter(game => game !== null));
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome to Assassins Assistant!
          </h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border-gray-700 text-white hover:bg-blue-700 bg-blue-600 hover:text-white"
              onClick={() => navigate("/profile")}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Action Buttons - Moved above Active Games */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Game
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
            onClick={() => setIsJoinModalOpen(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            Join Game
          </Button>
        </div>

        {/* Active Games Section */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <GamepadIcon className="h-6 w-6" />
              Active Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            {games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <Card
                    key={game.id}
                    className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors"
                  >
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        {game.title}
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        {game.isAdmin ? "Admin" : "Player"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-gray-300">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            game.isActive ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                        <span>{game.isActive ? "Active" : "Inactive"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{game.alivePlayers} Players Remaining</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>Status: {game.playerStatus}</span>
                      </div>
                      {game.isAdmin && game.pendingEliminations > 0 && (
                        <div className="mt-2 p-2 bg-yellow-500/20 rounded-md flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-500">
                            {game.pendingEliminations} pending elimination{game.pendingEliminations !== 1 ? 's' : ''} to review
                          </span>
                        </div>
                      )}
                      {!game.isAdmin && game.hasEliminationAttempt && (
                        <div className="mt-2 p-2 bg-red-500/20 rounded-md flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <div className="flex flex-col">
                            <span className="text-red-500">Elimination attempt pending</span>
                            {game.canDispute && (
                              <span className="text-red-400 text-sm">Click to view and dispute</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        className={`w-full ${
                          game.hasEliminationAttempt 
                            ? "bg-red-600 hover:bg-red-700" 
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        onClick={() => navigate(`/games/${game.id}`)}
                      >
                        View Game
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active games found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateGameModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
        <JoinGameModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default HomePage;
