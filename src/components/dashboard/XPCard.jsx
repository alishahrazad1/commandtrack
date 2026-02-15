import React from 'react';
import { Card } from "@/components/ui/card";
import { Trophy, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function XPCard({ totalXP, level, rank }) {
  const xpForNextLevel = level * 500;
  const currentLevelXP = totalXP % 500;
  const progress = (currentLevelXP / xpForNextLevel) * 100;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-magenta-500/20 rounded-full blur-3xl" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-cyan-400 font-medium">TOTAL XP</p>
              <p className="text-3xl font-bold text-white">{totalXP.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-magenta-400 font-medium">LEVEL</p>
            <p className="text-3xl font-bold text-white">{level}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Progress to Level {level + 1}</span>
            <span>{currentLevelXP} / {xpForNextLevel} XP</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-400 to-magenta-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-orange-400" />
          <span className="text-slate-300">Leaderboard Rank:</span>
          <span className="text-orange-400 font-bold">#{rank}</span>
        </div>
      </div>
    </Card>
  );
}