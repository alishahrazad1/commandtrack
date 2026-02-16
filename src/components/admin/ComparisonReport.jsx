import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";

export default function ComparisonReport({ departments, teams, users, completions, activities }) {
  const calculateMetrics = (userList) => {
    const userEmails = userList.map(u => u.email);
    const relevantCompletions = completions.filter(c => userEmails.includes(c.user_email));
    
    const completed = relevantCompletions.filter(c => c.status === 'completed').length;
    const totalPossible = userList.length * activities.length;
    const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    
    const scores = relevantCompletions.filter(c => c.score).map(c => c.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
    
    const totalXP = userList.reduce((sum, u) => sum + (u.total_xp || 0), 0);
    const avgXP = userList.length > 0 ? Math.round(totalXP / userList.length) : 0;
    
    return { completionRate, avgScore, avgXP, memberCount: userList.length };
  };

  const deptMetrics = departments.map(dept => ({
    name: dept.name,
    ...calculateMetrics(users.filter(u => u.department_id === dept.id))
  }));

  const teamMetrics = teams.map(team => ({
    name: team.name,
    departmentId: team.department_id,
    ...calculateMetrics(users.filter(u => u.team_id === team.id))
  }));

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Department Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deptMetrics.map((dept) => (
              <div key={dept.name} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{dept.name}</h3>
                  <span className="text-xs text-slate-400">{dept.memberCount} members</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Completion Rate</p>
                    <p className="text-lg font-bold text-orange-400">{dept.completionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Avg Score</p>
                    <p className="text-lg font-bold text-purple-400">{dept.avgScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Avg XP</p>
                    <p className="text-lg font-bold text-cyan-400">{dept.avgXP.toLocaleString()}</p>
                  </div>
                </div>
                <Progress value={dept.completionRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Team Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMetrics.map((team) => {
              const dept = departments.find(d => d.id === team.departmentId);
              return (
                <div key={team.name} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{team.name}</h3>
                      {dept && <p className="text-xs text-orange-400">{dept.name}</p>}
                    </div>
                    <span className="text-xs text-slate-400">{team.memberCount} members</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-400">Completion Rate</p>
                      <p className="text-lg font-bold text-orange-400">{team.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Avg Score</p>
                      <p className="text-lg font-bold text-purple-400">{team.avgScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Avg XP</p>
                      <p className="text-lg font-bold text-cyan-400">{team.avgXP.toLocaleString()}</p>
                    </div>
                  </div>
                  <Progress value={team.completionRate} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}