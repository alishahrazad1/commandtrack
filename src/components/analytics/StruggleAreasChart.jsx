import React from 'react';
import { Card } from "@/components/ui/card";
import { AlertTriangle, TrendingDown } from 'lucide-react';

export default function StruggleAreasChart({ activities, completions, users }) {
  const getStruggleAreas = () => {
    const activityStats = {};

    activities.forEach(activity => {
      activityStats[activity.id] = {
        title: activity.title,
        type: activity.activity_type,
        attempts: 0,
        completions: 0,
        avgScore: 0,
        totalScore: 0,
        scoredCount: 0,
        failureRate: 0
      };
    });

    completions.forEach(c => {
      if (activityStats[c.activity_id]) {
        activityStats[c.activity_id].attempts++;
        if (c.status === 'completed') {
          activityStats[c.activity_id].completions++;
        }
        if (c.score) {
          activityStats[c.activity_id].totalScore += c.score;
          activityStats[c.activity_id].scoredCount++;
        }
      }
    });

    return Object.values(activityStats)
      .map(stat => ({
        ...stat,
        avgScore: stat.scoredCount > 0 ? Math.round(stat.totalScore / stat.scoredCount) : 0,
        failureRate: stat.attempts > 0 ? Math.round(((stat.attempts - stat.completions) / stat.attempts) * 100) : 0
      }))
      .filter(stat => stat.attempts > 0)
      .sort((a, b) => {
        if (a.avgScore === b.avgScore) {
          return b.failureRate - a.failureRate;
        }
        return a.avgScore - b.avgScore;
      })
      .slice(0, 8);
  };

  const struggles = getStruggleAreas();

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-400" />
        Activities Users Are Struggling With
      </h3>
      {struggles.length > 0 ? (
        <div className="space-y-3">
          {struggles.map((activity) => (
            <div key={activity.title} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-semibold">{activity.title}</p>
                  <p className="text-slate-400 text-xs capitalize">{activity.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-red-400 font-bold">
                    <TrendingDown className="w-4 h-4" />
                    {activity.failureRate}%
                  </div>
                  <p className="text-slate-400 text-xs">failure rate</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-slate-400 text-xs">Avg Score</p>
                  <p className="text-cyan-400 font-bold text-lg">{activity.avgScore}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Attempts</p>
                  <p className="text-purple-400 font-bold text-lg">{activity.attempts}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Completed</p>
                  <p className="text-green-400 font-bold text-lg">{activity.completions}</p>
                </div>
              </div>

              {activity.avgScore < 70 && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                  ⚠️ Low average score - Consider additional support or review
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-center py-8">No data available</p>
      )}
    </Card>
  );
}