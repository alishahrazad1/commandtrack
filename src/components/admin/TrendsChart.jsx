import React from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";

export default function TrendsChart({ completions }) {
  // Group completions by week
  const getWeekKey = (date) => {
    const d = new Date(date);
    const weekStart = new Date(d.setDate(d.getDate() - d.getDay()));
    return weekStart.toISOString().split('T')[0];
  };

  const weeklyData = {};
  completions.forEach(c => {
    if (c.completed_at && c.status === 'completed') {
      const weekKey = getWeekKey(c.completed_at);
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, completions: 0, totalXP: 0, count: 0, totalScore: 0, scoreCount: 0 };
      }
      weeklyData[weekKey].completions++;
      weeklyData[weekKey].totalXP += c.xp_earned || 0;
      if (c.score) {
        weeklyData[weekKey].totalScore += c.score;
        weeklyData[weekKey].scoreCount++;
      }
    }
  });

  const chartData = Object.values(weeklyData)
    .map(d => ({
      week: new Date(d.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completions: d.completions,
      avgScore: d.scoreCount > 0 ? Math.round(d.totalScore / d.scoreCount) : null,
      totalXP: d.totalXP
    }))
    .sort((a, b) => new Date(a.week) - new Date(b.week))
    .slice(-8); // Last 8 weeks

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h3 className="font-semibold text-white text-lg">Engagement Trends</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="week" 
            stroke="#94a3b8" 
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#94a3b8" 
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="completions" 
            stroke="#06b6d4" 
            strokeWidth={2}
            name="Completions"
            dot={{ fill: '#06b6d4', r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="avgScore" 
            stroke="#22c55e" 
            strokeWidth={2}
            name="Avg Score"
            dot={{ fill: '#22c55e', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}