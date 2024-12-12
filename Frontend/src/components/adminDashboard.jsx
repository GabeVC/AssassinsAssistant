import React, { useState, useEffect } from "react";
import {
  fetchPendingKills,
  verifyKill,
  rejectKill,
} from "../../../Backend/controllers/playerController";
import Player from "../../../Backend/models/playerModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useToast } from "./ui/use-toast";

const AdminDashboard = ({ gameId }) => {
  const [pendingKills, setPendingKills] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPendingKills = async () => {
    try {
      setLoading(true);
      const kills = await Player.findPendingPlayersByGameId(gameId);
      setPendingKills(kills);
      setError(null);
    } catch (err) {
      console.error("Error loading pending kills:", err);
      setError("Failed to load pending kills. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load pending kills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingKills();
  }, [gameId]);

  const formatDate = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
        return date.toLocaleString();
    }
    return date;
};
  const handleVerifyKill = async (playerId) => {
    try {
      const result = await verifyKill(playerId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Kill verified successfully",
          variant: "success",
        });
        await loadPendingKills(); // Reload the list instead of full page refresh
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error verifying kill:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify kill",
        variant: "destructive",
      });
    }
  };

  const handleRejectKill = async (playerId) => {
    try {
      const result = await rejectKill(playerId);
      if (result) {
        toast({
          title: "Success",
          description: "Kill rejected successfully",
          variant: "success",
        });
        await loadPendingKills(); // Reload the list instead of full page refresh
      }
    } catch (error) {
      console.error("Error rejecting kill:", error);
      toast({
        title: "Error",
        description: "Failed to reject kill",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/50 border-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pendingKills.length === 0 ? (
        <Card className="bg-gray-800/80 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-gray-400">No pending kills to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingKills.map((player) => {
            const latestAttempt = player.getLatestEliminationAttempt();
            
            return (
              <Card key={player.id} className="bg-gray-800/80 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">
                        {player.playerName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {formatDate(latestAttempt?.timestamp)}
                    </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestAttempt?.evidenceUrl && (
                    <div className="rounded-lg overflow-hidden bg-gray-900/50">
                      {latestAttempt.evidenceUrl.includes(".mp4") ? (
                        <video
                          controls
                          className="w-full max-h-[400px] object-contain"
                        >
                          <source src={latestAttempt.evidenceUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={latestAttempt.evidenceUrl}
                          alt="Kill Evidence"
                          className="w-full max-h-[400px] object-contain"
                        />
                      )}
                    </div>
                  )}

                  {latestAttempt?.dispute && (
                    <Card className="bg-yellow-900/20 border-yellow-700">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-yellow-500" />
                          Dispute Submitted
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {formatDate(latestAttempt?.disputeTimestamp)}
                      </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300">{latestAttempt.dispute}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="border-red-800 hover:bg-red-900/50 text-red-500"
                    onClick={() => handleRejectKill(player.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerifyKill(player.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Kill
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;