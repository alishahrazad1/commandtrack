import React from 'react';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UserProgressChart({ users, completions }) {
  const getProgressData = () => {
    // Group users by level
    const levelGroups = {};
    users.forEach(u => {
      const level = u.level || 1;
      if (!levelGroups[level]) {
        levelGroups[level] = { level, count: 0, totalXP: 0, avgXP: 0 };
      }
      levelGroups[level].count++;
      levelGroups[level].totalXP += u.total_xp || 0;
    });

    // Calculate averages
    Object.keys(levelGroups).forEach(level => {
      levelGroups[level].avgXP = Math.round(levelGroups[level].totalXP / levelGroups[level].count);
    });

    return Object.values(levelGroups).sort((a, b) => a.level - b.level);
  };

  const data = getProgressData();

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-4">User Progress by Level</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="level" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="count" fill="#06b6d4" name="User Count" />
            <Bar dataKey="avgXP" fill="#fbbf24" name="Avg XP" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-slate-400 text-center py-8">No data available</p>
      )}
    </Card>
  );
}