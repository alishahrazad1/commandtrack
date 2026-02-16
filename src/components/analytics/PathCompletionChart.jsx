import React from 'react';
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

export default function PathCompletionChart({ paths, activities, completions, users }) {
  const getPathCompletionData = () => {
    return paths.map(path => {
      const pathActivities = activities.filter(a => a.path_id === path.id);
      const pathActivityIds = pathActivities.map(a => a.id);

      // Count users who completed all activities in the path
      const completedUsers = new Set();
      users.forEach(user => {
        const userCompletions = completions.filter(c => 
          c.user_email === user.email && pathActivityIds.includes(c.activity_id) && c.status === 'completed'
        );
        if (userCompletions.length === pathActivityIds.length && pathActivityIds.length > 0) {
          completedUsers.add(user.email);
        }
      });

      const completionRate = pathActivityIds.length > 0 
        ? Math.round((completedUsers.size / users.length) * 100)
        : 0;

      return {
        name: path.name,
        value: completionRate,
        completed: completedUsers.size,
        total: users.length
      };
    });
  };

  const data = getPathCompletionData();
  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <Card className="bg-slate-900 border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-4">Learning Path Completion Rates</h3>
      {data.length > 0 ? (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {data.map((path, idx) => (
              <Card key={path.name} className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{path.name}</p>
                    <p className="text-slate-400 text-xs">{path.completed}/{path.total} users</p>
                  </div>
                  <p className="text-cyan-400 font-bold">{path.value}%</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-slate-400 text-center py-8">No data available</p>
      )}
    </Card>
  );
}