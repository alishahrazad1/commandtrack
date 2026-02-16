import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from 'lucide-react';

export default function BadgeProgress({ badge, currentValue, earned }) {
  if (earned) return null;

  const progress = Math.min((currentValue / badge.criteria_value) * 100, 100);
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-5 h-5 text-cyan-400" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{badge.name}</h4>
          <p className="text-xs text-slate-400">{badge.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1 h-2" />
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {currentValue} / {badge.criteria_value}
        </span>
      </div>
    </Card>
  );
}