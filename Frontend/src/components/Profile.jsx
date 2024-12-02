import { React, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  User,
  Mail,
  Calendar,
  Target,
  ArrowLeft,
  Trophy,
  Shield,
  Gamepad as GamepadIcon,
} from "lucide-react";
import { Skeleton } from "./ui/skeleton";

/**
 * This component handles the profile page for the user
 *
 * @returns {JSX.Element} A JSX element that displays the profile page for the user
 */

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user?.uid) return;
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const userInfo = userDoc.data();
        setProfileData(userInfo);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="container mx-auto max-w-2xl">
          <LoadingProfile />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="container mx-auto max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            <p className="text-gray-400">
              View and manage your account details
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="border-gray-700 text-black hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <Card className="bg-gray-800/80 border-gray-700 mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-2xl">
                  {profileData?.username}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Player Profile
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="h-5 w-5 text-blue-400" />
                <span>Email:</span>
                <span className="text-white">{profileData?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Shield className="h-5 w-5 text-blue-400" />
                <span>User ID:</span>
                <span className="text-white">{user.uid}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span>Joined:</span>
                <span className="text-white">
                  {profileData?.createdAt &&
                    new Date(
                      profileData.createdAt.seconds * 1000
                    ).toLocaleString()}
                </span>
              </div>
            </div>

            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Player Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-red-400" />
                  <span className="text-gray-300">Total Eliminations:</span>
                  <span className="text-white font-semibold">
                    {profileData?.stats?.eliminations || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">Games Won:</span>
                  <span className="text-white font-semibold">
                    {profileData?.stats?.gamesWon || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GamepadIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">Games Played:</span>
                  <span className="text-white font-semibold">
                    {profileData?.stats?.gamesPlayed || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Loading skeleton component
const LoadingProfile = () => (
  <>
    <div className="flex justify-between items-center mb-8">
      <div>
        <Skeleton className="h-8 w-32 bg-gray-700" />
        <Skeleton className="h-4 w-48 mt-2 bg-gray-700" />
      </div>
      <Skeleton className="h-10 w-32 bg-gray-700" />
    </div>
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full bg-gray-700" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 bg-gray-700" />
            <Skeleton className="h-4 w-24 bg-gray-700" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 bg-gray-700" />
              <Skeleton className="h-4 w-48 bg-gray-700" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </>
);

export default ProfilePage;
