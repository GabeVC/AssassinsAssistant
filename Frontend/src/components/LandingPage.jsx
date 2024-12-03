import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Target, LogIn, UserPlus } from "lucide-react";

/**
 * This component handles the landing page when you first get to the site
 *
 * @returns {JSX.Element} A JSX element that prompts the user to login or register
 */

const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <Target className="h-16 w-16 text-blue-500" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Assassins Assistant
            </h1>
            <p className="text-xl text-gray-300">
              Welcome to the ultimate Assassins game management app!
            </p>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ready to Play?</CardTitle>
              <CardDescription className="text-gray-400">
                Join the most thrilling social deduction game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Join exclusive game sessions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Receive secret target assignments
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Track your progress on the leaderboard
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex gap-4 justify-center">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Link to="/login" className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Log In
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-gray-600 hover:bg-gray-700"
              >
                <Link to="/register" className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Register
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
