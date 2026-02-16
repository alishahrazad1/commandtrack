import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Star, TrendingUp, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import BadgeCard from "../components/badges/BadgeCard";
import BadgeProgress from "../components/badges/BadgeProgress";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.email],
    queryFn: () => base44.entities.UserBadge.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['userCompletions', user?.email],
    queryFn: () => base44.entities.ActivityCompletion.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: allPaths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.ActivityPath.filter({ is_active: true }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  if (!user) return null;

  const completedCount = completions.filter(c => c.status === 'completed').length;
  const scores = completions.filter(c => c.score).map(c => c.score);
  const highScoreCount = scores.filter(s => s >= 90).length;
  const perfectScoreCount = scores.filter(s => s === 100).length;

  const earnedBadges = badges.filter(b => userBadges.some(ub => ub.badge_id === b.id));
  const unearnedBadges = badges.filter(b => !userBadges.some(ub => ub.badge_id === b.id));

  const assignedPaths = allPaths.filter(path => {
    if (!path.department_id && !path.team_id) return true;
    if (path.team_id && user.team_id === path.team_id) return true;
    if (path.department_id && user.department_id === path.department_id && !path.team_id) return true;
    return false;
  });

  const getPathProgress = (pathId) => {
    const pathActivities = activities.filter(a => a.path_id === pathId);
    const completed = pathActivities.filter(a => 
      completions.some(c => c.activity_id === a.id && c.status === 'completed')
    ).length;
    return { total: pathActivities.length, completed };
  };

  const getProgress = (badge) => {
    switch (badge.criteria_type) {
      case 'activities_completed':
        return completedCount;
      case 'total_xp':
        return user.total_xp || 0;
      case 'high_score_count':
        return highScoreCount;
      case 'perfect_score':
        return perfectScoreCount;
      case 'level_reached':
        return user.level || 1;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-6xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="mb-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Command Center
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            PLAYER PROFILE
          </h1>
          <p className="text-slate-400">Your achievements and progress</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-cyan-900/50 to-slate-900 border-cyan-500/30 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: user.avatar_color || '#06b6d4' }}
                >
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
                  <p className="text-sm text-cyan-400">Level {user.level || 1}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              {(user.department_id || user.team_id) && (
                <div className="border-t border-slate-700 pt-3 space-y-1">
                  {user.department_id && (
                    <p className="text-xs text-slate-400">
                      <span className="text-slate-500">Department:</span>{' '}
                      <span className="text-orange-400">{departments.find(d => d.id === user.department_id)?.name}</span>
                    </p>
                  )}
                  {user.team_id && (
                    <p className="text-xs text-slate-400">
                      <span className="text-slate-500">Team:</span>{' '}
                      <span className="text-purple-400">{teams.find(t => t.id === user.team_id)?.name}</span>
                    </p>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-orange-900/50 to-slate-900 border-orange-500/30 p-6">
              <TrendingUp className="w-8 h-8 text-orange-400 mb-2" />
              <p className="text-sm text-orange-400">Total XP</p>
              <p className="text-3xl font-bold text-white">{(user.total_xp || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{completedCount} activities completed</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-yellow-900/50 to-slate-900 border-yellow-500/30 p-6">
              <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
              <p className="text-sm text-yellow-400">Badges Earned</p>
              <p className="text-3xl font-bold text-white">{earnedBadges.length}</p>
              <p className="text-xs text-slate-400 mt-1">out of {badges.length}</p>
            </Card>
          </motion.div>
        </div>

        {assignedPaths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-white">YOUR LEARNING PATHS</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedPaths.map(path => {
                  const progress = getPathProgress(path.id);
                  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
                  const dept = departments.find(d => d.id === path.department_id);
                  const team = teams.find(t => t.id === path.team_id);

                  return (
                    <Card key={path.id} className="bg-slate-800 border-slate-700 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white">{path.name}</h3>
                          <p className="text-sm text-slate-400 mt-1">{path.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-400">{percentage}%</p>
                        </div>
                      </div>

                      <Progress value={percentage} className="mb-3 h-2" />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          {progress.completed} of {progress.total} completed
                        </span>
                        {(dept || team) && (
                          <div className="flex gap-2">
                            {team && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                {team.name}
                              </Badge>
                            )}
                            {dept && !team && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                {dept.name}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">ACHIEVEMENT BADGES</h2>
          </div>

          {earnedBadges.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Unlocked ({earnedBadges.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {earnedBadges.map(badge => {
                  const earned = userBadges.find(ub => ub.badge_id === badge.id);
                  return <BadgeCard key={badge.id} badge={badge} earned={earned} />;
                })}
              </div>
            </>
          )}

          {unearnedBadges.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-slate-400 mb-4">In Progress ({unearnedBadges.length})</h3>
              <div className="space-y-3 mb-6">
                {unearnedBadges.map(badge => (
                  <BadgeProgress
                    key={badge.id}
                    badge={badge}
                    currentValue={getProgress(badge)}
                    earned={null}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unearnedBadges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} earned={null} />
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}