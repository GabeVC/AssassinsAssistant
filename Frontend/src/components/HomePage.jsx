import { React, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth} from "../firebaseConfig";
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
        const userId = auth.currentUser.uid;
        const playersRef = collection(db, 'players');
        const playerQuery = query(playersRef, where('userId', '==', userId));
        const playerSnapshot = await getDocs(playerQuery);
        
        const gamePromises = playerSnapshot.docs.map(async (playerDoc) => {
          const playerData = playerDoc.data();
          const gameRef = doc(db, 'games', playerData.gameId);
          const gameDoc = await getDoc(gameRef);
          
          if (!gameDoc.exists()) return null;
          
          // Get alive players count
          const alivePlayersQuery = query(
            collection(db, 'players'),
            where('gameId', '==', playerData.gameId),
            where('isAlive', '==', true)
          );
          const alivePlayersSnapshot = await getDocs(alivePlayersQuery);
          
          return {
            id: gameDoc.id,
            ...gameDoc.data(),
            isAdmin: playerData.isAdmin,
            playerStatus: playerData.isAlive ? 'Alive' : 'Eliminated',
            alivePlayers: alivePlayersSnapshot.size
          };
        });
        
        const gamesData = await Promise.all(gamePromises);
        setGames(gamesData.filter(game => game !== null));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchGames();  // Removed uid parameter as it's not needed
    }
  }, [user]);

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
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
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
