"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlockrunners } from "@/hooks/useBlockrunners";
import { BN } from "@coral-xyz/anchor";

export function PlayerStats() {
  const { playerState } = useBlockrunners();

  if (!playerState) {
    return (
      <Card className="p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center text-gray-500 font-mono">
          <p>RUNNER STATUS: DISCONNECTED</p>
          <p className="text-xs mt-1">Connect wallet to access personal records</p>
        </div>
      </Card>
    );
  }

  const achievements = [
    {
      key: "ghostProtocol",
      name: "Ghost Protocol",
      description: "Completed run without detection systems",
    },
    {
      key: "dataHoarder",
      name: "Data Hoarder",
      description: "Accumulated 100+ protocol fragments",
    },
    {
      key: "consensusBreaker",
      name: "Consensus Breaker",
      description: "Penetrated deep into The Consensus network",
    },
    {
      key: "cipherLord",
      name: "Cipher Lord",
      description: "Mastered computational resource acquisition",
    },
  ];

  const stats = [
    {
      label: "Best Infiltration Depth",
      value: `${playerState.bestPosition || 0} steps`,
      icon: "🎯",
    },
    { label: "Total Breaches", value: playerState.gamesWon?.toString() || "0", icon: "🏆" },
    { label: "Win Streak", value: playerState.consecutiveWins?.toString() || "0", icon: "🔥" },
    { label: "Best Streak", value: playerState.bestWinStreak?.toString() || "0", icon: "⚡" },
    { label: "Security Resets", value: playerState.totalResets?.toString() || "0", icon: "💀" },
    {
      label: "Defense Protocols Used",
      value: playerState.shieldsUsed?.toString() || "0",
      icon: "🛡️",
    },
    { label: "System Breaches", value: playerState.systemBreaches?.toString() || "0", icon: "🚨" },
    {
      label: "Total Cipher Reserves",
      value: playerState.totalCiphersBought?.toString() || "0",
      icon: "🔋",
    },
  ];

  return (
    <Card className="p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-2">
          <h3 className="font-mono font-bold text-lg">RUNNER PROFILE</h3>
          <p className="text-xs text-gray-600 font-mono">Classification: Data Smuggler</p>
        </div>

        {/* Achievements */}
        <div>
          <h4 className="font-mono font-bold text-sm mb-2">PROTOCOL FRAGMENTS RECOVERED</h4>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((achievement) => {
              const isUnlocked = playerState[
                achievement.key as keyof typeof playerState
              ] as boolean;
              return (
                <div
                  key={achievement.key}
                  className={`p-2 border-2 rounded ${
                    isUnlocked
                      ? "border-purple-500 bg-purple-900 text-white"
                      : "border-gray-400 bg-gray-100 text-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isUnlocked ? "🏆" : "🔒"}</span>
                    <div>
                      <p className="font-mono text-xs font-bold">{achievement.name}</p>
                      <p className="text-xs">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h4 className="font-mono font-bold text-sm mb-2">OPERATIONAL METRICS</h4>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-2 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{stat.icon}</span>
                  <div>
                    <p className="font-mono text-xs font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Indicators */}
        <div>
          <h4 className="font-mono font-bold text-sm mb-2">CURRENT STATUS</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Position: {playerState.position || 0}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              Ciphers: {playerState.ciphers?.toString() || "0"}
            </Badge>
            <Badge
              variant={playerState.consecutiveWins?.gt(new BN(0)) ? "default" : "outline"}
              className="font-mono text-xs"
            >
              {playerState.consecutiveWins?.gt(new BN(0))
                ? `HOT STREAK: ${playerState.consecutiveWins}`
                : "COLD"}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
