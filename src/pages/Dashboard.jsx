import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Target, User } from "lucide-react";
import { createPageUrl } from "../utils";
import XPCard from "../components/dashboard/XPCard";
import ProgressOverview from "../components/dashboard/ProgressOverview";
import ActivityCard from "../components/dashboard/ActivityCard";
import UploadDialog from "../components/UploadDialog";
import VideoPlayer from "../components/VideoPlayer";
import BadgeCard from "../components/badges/BadgeCard";
import PathProgress from "../components/paths/PathProgress";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [uploadActivity, setUploadActivity] = useState(null);
  const [videoActivity, setVideoActivity] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: allActivities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.filter({ is_active: true }, 'order'),
  });

  const { data: allPaths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.ActivityPath.filter({ is_active: true }, 'order'),
  });

  const paths = allPaths.filter(path => {
    if (!path.department_id && !path.team_id) return true;
    if (path.team_id && user?.team_id === path.team_id) return true;
    if (path.department_id && user?.department_id === path.department_id && !path.team_id) return true;
    return false;
  });

  const activities = allActivities;
  const standaloneActivities = activities.filter(a => !a.path_id);

  const { data: completions = [] } = useQuery({
    queryKey: ['completions', user?.email],
    queryFn: () => base44.entities.ActivityCompletion.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.email],
    queryFn: () => base44.entities.UserBadge.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (activity) => {
      const now = new Date();
      const startDate = activity.start_date ? new Date(activity.start_date) : null;
      const endDate = activity.end_date ? new Date(activity.end_date) : null;
      
      if (startDate && now < startDate) {
        throw new Error('This activity is not available yet.');
      }
      if (endDate && now > endDate) {
        throw new Error('This activity has expired.');
      }

      // Allow re-completion of activities
      await base44.entities.ActivityCompletion.create({
        activity_id: activity.id,
        user_email: user.email,
        status: 'completed',
        xp_earned: activity.xp_value,
        completed_at: new Date().toISOString()
      });

      const newTotalXP = (user.total_xp || 0) + activity.xp_value;
      const newLevel = Math.floor(newTotalXP / 500) + 1;
      const leveledUp = newLevel > (user.level || 1);
      
      await base44.auth.updateMe({
        total_xp: newTotalXP,
        level: newLevel
      });

      // Create notification for level up
      if (leveledUp && user.notification_preferences?.inapp_milestones !== false) {
        await base44.entities.Notification.create({
          user_email: user.email,
          type: 'level_up',
          title: '⭐ Level Up!',
          message: `Amazing! You've reached Level ${newLevel}!`,
          priority: 'high',
          action_url: createPageUrl('Profile')
        });
      }

      await checkAndAwardBadges();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['completions']);
      queryClient.invalidateQueries(['userBadges']);
      base44.auth.me().then(setUser);
    },
  });

  const checkAndAwardBadges = async () => {
    const completedCount = completions.filter(c => c.status === 'completed' && c.user_email === user.email).length + 1;
    const scores = completions.filter(c => c.score && c.user_email === user.email).map(c => c.score);
    const highScoreCount = scores.filter(s => s >= 90).length;
    const perfectScoreCount = scores.filter(s => s === 100).length;
    const newTotalXP = (user.total_xp || 0);
    const newLevel = Math.floor(newTotalXP / 500) + 1;

    for (const badge of badges) {
      const alreadyEarned = userBadges.some(ub => ub.badge_id === badge.id);
      if (alreadyEarned) continue;

      let shouldAward = false;
      switch (badge.criteria_type) {
        case 'activities_completed':
          shouldAward = completedCount >= badge.criteria_value;
          break;
        case 'total_xp':
          shouldAward = newTotalXP >= badge.criteria_value;
          break;
        case 'high_score_count':
          shouldAward = highScoreCount >= badge.criteria_value;
          break;
        case 'perfect_score':
          shouldAward = perfectScoreCount >= badge.criteria_value;
          break;
        case 'level_reached':
          shouldAward = newLevel >= badge.criteria_value;
          break;
      }

      if (shouldAward) {
        await base44.entities.UserBadge.create({
          user_email: user.email,
          badge_id: badge.id,
          earned_at: new Date().toISOString()
        });

        // Create notification for badge earned
        if (user.notification_preferences?.inapp_achievements !== false) {
          await base44.entities.Notification.create({
            user_email: user.email,
            type: 'badge_earned',
            title: '🏆 Badge Earned!',
            message: `Congratulations! You've earned the "${badge.name}" badge.`,
            priority: 'normal',
            action_url: createPageUrl('Profile')
          });
        }
      }
    }
  };

  if (!user) return null;

  const completedActivities = completions.filter(c => c.status === 'completed').length;
  const totalXP = user.total_xp || 0;
  const level = user.level || 1;

  const sortedUsers = [...allUsers].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
  const rank = sortedUsers.findIndex(u => u.email === user.email) + 1;

  const getActivityCompletion = (activity) => {
    return completions.find(c => c.activity_id === activity.id);
  };

  const isActivityUnlocked = (activity) => {
    if (!activity.path_id) return true;
    
    const pathActivities = activities
      .filter(a => a.path_id === activity.path_id)
      .sort((a, b) => (a.path_order || 0) - (b.path_order || 0));
    
    const activityIndex = pathActivities.findIndex(a => a.id === activity.id);
    if (activityIndex === 0) return true;
    
    const previousActivity = pathActivities[activityIndex - 1];
    return completions.some(
      c => c.activity_id === previousActivity.id && c.status === 'completed'
    );
  };

  const earnedBadges = badges.filter(b => userBadges.some(ub => ub.badge_id === b.id)).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              DASHBOARD
            </h1>
            <p className="text-slate-400">Welcome back, Player {user.full_name}</p>
          </div>
          <div className="flex gap-3">
            {user.role === 'admin' && (
              <Link to={createPageUrl('AdminDashboard')}>
                <Button className="bg-cyan-500 hover:bg-cyan-600">
                  <Target className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
            {(user.role === 'team_lead' || user.role === 'department_head') && (
              <Link to={createPageUrl('TeamLeadDashboard')}>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Target className="w-4 h-4 mr-2" />
                  Team Dashboard
                </Button>
              </Link>
            )}
            <Link to={createPageUrl('Profile')}>
              <Button className="bg-purple-500 hover:bg-purple-600">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Link to={createPageUrl('Leaderboard')}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Trophy className="w-4 h-4 mr-2" />
                High Scores
              </Button>
            </Link>
            <Button 
              onClick={() => base44.auth.logout()}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Logout
            </Button>
            </div>
            </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <XPCard totalXP={totalXP} level={level} rank={rank} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ProgressOverview
            totalActivities={activities.length}
            completedActivities={completedActivities}
            totalXP={totalXP}
          />
        </motion.div>

        {earnedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-slate-900 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">RECENT BADGES</h2>
              </div>
              <Link to={createPageUrl('Profile')}>
                <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {earnedBadges.map(badge => {
                const earned = userBadges.find(ub => ub.badge_id === badge.id);
                return <BadgeCard key={badge.id} badge={badge} earned={earned} small />;
              })}
            </div>
          </motion.div>
        )}

        {paths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">LEARNING PATHS</h2>
            </div>
            <div className="space-y-4">
              {paths.map((path) => (
                <PathProgress
                  key={path.id}
                  path={path}
                  activities={activities}
                  completions={completions}
                />
              ))}
            </div>
          </motion.div>
        )}

        {paths.map((path) => {
          const pathActivities = activities
            .filter(a => a.path_id === path.id)
            .sort((a, b) => (a.path_order || 0) - (b.path_order || 0));

          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">{path.name.toUpperCase()}</h2>
              </div>
              <div className="space-y-4">
                {pathActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <ActivityCard
                      activity={activity}
                      completion={getActivityCompletion(activity)}
                      onComplete={(act) => completeActivityMutation.mutate(act)}
                      onUpload={(act) => setUploadActivity(act)}
                      onWatchVideo={(act) => setVideoActivity(act)}
                      isLocked={!isActivityUnlocked(activity)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {standaloneActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">ACTIVE QUESTS</h2>
            </div>
            <div className="space-y-4">
              {standaloneActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + index * 0.05 }}
                >
                  <ActivityCard
                    activity={activity}
                    completion={getActivityCompletion(activity)}
                    onComplete={(act) => completeActivityMutation.mutate(act)}
                    onUpload={(act) => setUploadActivity(act)}
                    onWatchVideo={(act) => setVideoActivity(act)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <UploadDialog
        activity={uploadActivity}
        open={!!uploadActivity}
        onClose={() => setUploadActivity(null)}
        onSuccess={() => {
          queryClient.invalidateQueries(['completions']);
          base44.auth.me().then(setUser);
        }}
      />

      <VideoPlayer
        activity={videoActivity}
        open={!!videoActivity}
        onClose={() => setVideoActivity(null)}
        onComplete={(act) => {
          completeActivityMutation.mutate(act);
          setVideoActivity(null);
        }}
      />
      </div>
      );
      }