import React from 'react';
import { Card } from "@/components/ui/card";
import { Target, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProgressOverview({ totalActivities, completedActivities, totalXP }) {
  const completionPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-900/50 to-slate-900 border-cyan-500/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-cyan-400 font-medium">COMPLETION RATE</p>
              <p className="text-2xl font-bold text-white">{Math.round(completionPercentage)}%</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-slate-900 border-purple-500/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <CheckCircle2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-purple-400 font-medium">QUESTS COMPLETED</p>
              <p className="text-2xl font-bold text-white">{completedActivities} / {totalActivities}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-orange-900/50 to-slate-900 border-orange-500/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-orange-400 font-medium">TOTAL XP EARNED</p>
              <p className="text-2xl font-bold text-white">{totalXP.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}