import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trophy, Medal } from "lucide-react";

/**
 * This component handles displaying the leaderboard
 *
 * @param {List} players - The players displayed on this leaderboard
 * @returns {React.JSX.Element} A React element that displays the leaderboard
 */

const Leaderboard = ({ players }) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const aElims = a.stats?.eliminations || 0;
    const bElims = b.stats?.eliminations || 0;
    return bElims - aElims;
  });

  const getMedalColor = (index) => {
    switch (index) {
      case 0:
        return "text-yellow-400";
      case 1:
        return "text-gray-300";
      case 2:
        return "text-amber-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader className="border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <CardTitle className="text-white">Leaderboard</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-700">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 hover:bg-gray-800/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 ${getMedalColor(
                    index
                  )}`}
                >
                  {index < 3 ? (
                    <Medal className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <span className="text-white font-medium">
                  {player.playerName}
                </span>
              </div>
              <span className="text-blue-400 font-medium">
                {player.stats?.eliminations || 0} eliminations
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
