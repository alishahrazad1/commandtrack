import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingDown } from "lucide-react";

export default function ActivityPerformance({ activities, completions, totalUsers }) {
  const activityStats = activities.map(activity => {
    const activityCompletions = completions.filter(c => c.activity_id === activity.id && c.status === 'completed');
    const completionRate = totalUsers > 0 ? (activityCompletions.length / totalUsers) * 100 : 0;
    const scores = activityCompletions.filter(c => c.score).map(c => c.score);
    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

    return {
      ...activity,
      completionRate,
      avgScore,
      completionCount: activityCompletions.length,
      needsAttention: completionRate < 50 || (avgScore !== null && avgScore < 70)
    };
  }).sort((a, b) => a.completionRate - b.completionRate);

  const lowPerformers = activityStats.filter(a => a.needsAttention);

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-400" />
        <h3 className="font-semibold text-white text-lg">Activity Performance Analysis</h3>
      </div>

      {lowPerformers.length > 0 && (
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-400" />
            <p className="text-sm font-semibold text-orange-400">
              {lowPerformers.length} {lowPerformers.length === 1 ? 'activity needs' : 'activities need'} attention
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Low completion rate (&lt;50%) or low average score (&lt;70)
          </p>
        </div>
      )}

      <div className="space-y-4">
        {activityStats.map((activity) => (
          <div 
            key={activity.id} 
            className={`p-4 rounded-lg border ${
              activity.needsAttention 
                ? 'bg-orange-500/5 border-orange-500/30' 
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{activity.title}</h4>
                <p className="text-xs text-slate-400">{activity.activity_type.replace(/_/g, ' ')}</p>
              </div>
              {activity.needsAttention && (
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Completion Rate</span>
                  <span className={activity.completionRate < 50 ? 'text-orange-400 font-semibold' : 'text-cyan-400'}>
                    {Math.round(activity.completionRate)}% ({activity.completionCount}/{totalUsers})
                  </span>
                </div>
                <Progress value={activity.completionRate} className="h-2" />
              </div>

              {activity.avgScore !== null && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Average Score</span>
                    <span className={activity.avgScore < 70 ? 'text-orange-400 font-semibold' : 'text-green-400'}>
                      {Math.round(activity.avgScore)}/100
                    </span>
                  </div>
                  <Progress value={activity.avgScore} className="h-2" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}