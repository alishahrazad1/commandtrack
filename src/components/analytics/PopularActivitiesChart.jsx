import React from 'react';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PopularActivitiesChart({ activities, completions }) {
  const getPopularActivities = () => {
    const activityStats = {};

    activities.forEach(activity => {
      activityStats[activity.id] = {
        title: activity.title,
        completions: 0,
        avgScore: 0,
        totalScore: 0,
        scoredCount: 0
      };
    });

    completions.forEach(c => {
      if (activityStats[c.activity_id]) {
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
        avgScore: stat.scoredCount > 0 ? Math.round(stat.totalScore / stat.scoredCount) : 0
      }))
      .filter(stat => stat.completions > 0)
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 10);
  };

  const data = getPopularActivities();

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-4">Top 10 Popular Activities</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis dataKey="title" type="category" stroke="#94a3b8" width={150} tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="completions" fill="#06b6d4" name="Completions" />
            <Bar dataKey="avgScore" fill="#10b981" name="Avg Score" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-slate-400 text-center py-8">No data available</p>
      )}
    </Card>
  );
}