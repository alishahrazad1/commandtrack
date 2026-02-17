import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, Award, Download, CheckCircle2, Circle, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function EmployeeReport({ user, activities, completions, open, onClose, onExport }) {
  const queryClient = useQueryClient();

  const deleteCompletionMutation = useMutation({
    mutationFn: async (completionId) => {
      await base44.entities.ActivityCompletion.delete(completionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['completions']);
    },
  });

  if (!user) return null;

  const userCompletions = completions.filter(c => c.user_email === user.email);
  const completedCount = userCompletions.filter(c => c.status === 'completed').length;
  const completionRate = activities.length > 0 ? (completedCount / activities.length) * 100 : 0;
  const scores = userCompletions.filter(c => c.score).map(c => c.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null;

  const activityDetails = activities.map(activity => {
    const completion = userCompletions.find(c => c.activity_id === activity.id);
    return {
      activity,
      completion,
      isCompleted: completion?.status === 'completed'
    };
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-cyan-400">
              Employee Progress Report
            </DialogTitle>
            <Button
              onClick={() => onExport(user)}
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-600 hover:to-magenta-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Overview */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2"
                style={{ backgroundColor: user.avatar_color || '#06b6d4' }}
              >
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{user.full_name}</h3>
                <p className="text-slate-400">{user.email}</p>
                {(user.department || user.team) && (
                  <p className="text-sm text-slate-500">
                    {[user.department, user.team].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <p className="text-xs text-slate-400">TOTAL XP</p>
                </div>
                <p className="text-2xl font-bold text-white">{(user.total_xp || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500">Level {user.level || 1}</p>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-magenta-400" />
                  <p className="text-xs text-slate-400">COMPLETION</p>
                </div>
                <p className="text-2xl font-bold text-white">{Math.round(completionRate)}%</p>
                <p className="text-xs text-slate-500">{completedCount}/{activities.length} activities</p>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-orange-400" />
                  <p className="text-xs text-slate-400">AVG SCORE</p>
                </div>
                <p className="text-2xl font-bold text-white">{avgScore !== null ? avgScore : 'N/A'}</p>
                <p className="text-xs text-slate-500">{scores.length} scored activities</p>
              </div>
            </div>
          </Card>

          {/* Activity Details */}
          <div>
            <h4 className="font-semibold text-white mb-3">Activity History</h4>
            <div className="space-y-3">
              {activityDetails.map(({ activity, completion, isCompleted }) => (
                <Card key={activity.id} className="bg-slate-800 border-slate-700 p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20' : 'bg-slate-900'}`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h5 className={`font-semibold ${isCompleted ? 'text-white' : 'text-slate-400'}`}>
                        {activity.title}
                      </h5>
                      <p className="text-sm text-slate-500 mb-2">{activity.activity_type.replace(/_/g, ' ')}</p>

                      {isCompleted && (
                        <div className="space-y-2">
                          {completion.completed_at && (
                            <p className="text-xs text-slate-400">
                              Completed: {new Date(completion.completed_at).toLocaleDateString()}
                            </p>
                          )}
                          
                          {completion.score !== null && completion.score !== undefined && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Score</span>
                                <span className="text-cyan-400 font-semibold">{completion.score}/100</span>
                              </div>
                              <Progress value={completion.score} className="h-2" />
                            </div>
                          )}

                          {completion.notes && (
                            <div className="mt-2 p-3 bg-slate-900 rounded border border-slate-700">
                              <p className="text-xs text-slate-400 mb-1">Feedback:</p>
                              <p className="text-sm text-slate-300">{completion.notes}</p>
                            </div>
                          )}

                          <p className="text-sm text-orange-400">
                            +{completion.xp_earned || activity.xp_value} XP
                          </p>
                        </div>
                      )}
                    </div>

                    {isCompleted && (
                      <Button
                        onClick={() => deleteCompletionMutation.mutate(completion.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}