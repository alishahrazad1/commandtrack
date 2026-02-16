import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Target } from "lucide-react";
import { createPageUrl } from "../utils";
import XPCard from "../components/dashboard/XPCard";
import ProgressOverview from "../components/dashboard/ProgressOverview";
import ActivityCard from "../components/dashboard/ActivityCard";
import UploadDialog from "../components/UploadDialog";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [uploadActivity, setUploadActivity] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.filter({ is_active: true }, 'order'),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions', user?.email],
    queryFn: () => base44.entities.ActivityCompletion.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (activity) => {
      await base44.entities.ActivityCompletion.create({
        activity_id: activity.id,
        user_email: user.email,
        status: 'completed',
        xp_earned: activity.xp_value,
        completed_at: new Date().toISOString()
      });

      const newTotalXP = (user.total_xp || 0) + activity.xp_value;
      const newLevel = Math.floor(newTotalXP / 500) + 1;
      await base44.auth.updateMe({
        total_xp: newTotalXP,
        level: newLevel
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['completions']);
      base44.auth.me().then(setUser);
    },
  });

  if (!user) return null;

  const completedActivities = completions.filter(c => c.status === 'completed').length;
  const totalXP = user.total_xp || 0;
  const level = user.level || 1;

  const sortedUsers = [...allUsers].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
  const rank = sortedUsers.findIndex(u => u.email === user.email) + 1;

  const getActivityCompletion = (activity) => {
    return completions.find(c => c.activity_id === activity.id);
  };

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
              COMMAND CENTER
            </h1>
            <p className="text-slate-400">Welcome back, Player {user.full_name}</p>
          </div>
          <Link to={createPageUrl('Leaderboard')}>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Trophy className="w-4 h-4 mr-2" />
              High Scores
            </Button>
          </Link>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">ACTIVE QUESTS</h2>
          </div>
          <div className="space-y-4">
            {activities.map((activity, index) => (
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
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
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
    </div>
  );
}