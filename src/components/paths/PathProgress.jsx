import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GitBranch, CheckCircle, Lock } from "lucide-react";

export default function PathProgress({ path, activities, completions }) {
  const pathActivities = activities
    .filter(a => a.path_id === path.id)
    .sort((a, b) => (a.path_order || 0) - (b.path_order || 0));

  const completedActivities = pathActivities.filter(activity => 
    completions.some(c => c.activity_id === activity.id && c.status === 'completed')
  );

  const progressPercent = pathActivities.length > 0 
    ? Math.round((completedActivities.length / pathActivities.length) * 100)
    : 0;

  return (
    <Card className="bg-slate-900 border-slate-700 p-6 hover:border-cyan-500/50 transition-all">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-slate-800 border border-cyan-500/30">
          <GitBranch className="w-6 h-6 text-cyan-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{path.name}</h3>
          {path.description && (
            <p className="text-sm text-slate-400 mb-3">{path.description}</p>
          )}
          
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">
                {completedActivities.length} / {pathActivities.length} completed
              </span>
              <span className="text-cyan-400 font-semibold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="flex gap-2 flex-wrap">
            {pathActivities.map((activity, idx) => {
              const isCompleted = completions.some(
                c => c.activity_id === activity.id && c.status === 'completed'
              );
              const previousCompleted = idx === 0 || completions.some(
                c => c.activity_id === pathActivities[idx - 1].id && c.status === 'completed'
              );

              return (
                <div
                  key={activity.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isCompleted
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : previousCompleted
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : !previousCompleted ? (
                    <Lock className="w-3 h-3" />
                  ) : null}
                  <span>{activity.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}