import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, TrendingUp, Settings, BarChart3 } from "lucide-react";
import { createPageUrl } from "./utils";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.ActivityCompletion.list(),
  });

  if (!user || user.role !== 'admin') return null;

  const totalUsers = users.length;
  const activeUsers = users.filter(u => (u.total_xp || 0) > 0).length;
  const totalActivities = activities.length;
  const completionRate = totalActivities > 0 
    ? Math.round((completions.filter(c => c.status === 'completed').length / (totalUsers * totalActivities)) * 100)
    : 0;

  const avgScore = completions.filter(c => c.score).length > 0
    ? Math.round(completions.filter(c => c.score).reduce((sum, c) => sum + c.score, 0) / completions.filter(c => c.score).length)
    : 0;

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent mb-2">
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-slate-400">Manage training program and monitor progress</p>
          </div>
          <Link to={createPageUrl('AdminActivities')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-600 hover:to-magenta-600">
              <Settings className="w-4 h-4 mr-2" />
              Manage Activities
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-900/50 to-slate-900 border-cyan-500/30 p-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative">
                <Users className="w-8 h-8 text-cyan-400 mb-3" />
                <p className="text-sm text-cyan-400 font-medium">TOTAL USERS</p>
                <p className="text-3xl font-bold text-white">{totalUsers}</p>
                <p className="text-xs text-slate-400 mt-1">{activeUsers} active</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-magenta-900/50 to-slate-900 border-magenta-500/30 p-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative">
                <Target className="w-8 h-8 text-magenta-400 mb-3" />
                <p className="text-sm text-magenta-400 font-medium">ACTIVITIES</p>
                <p className="text-3xl font-bold text-white">{totalActivities}</p>
                <p className="text-xs text-slate-400 mt-1">training quests</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-900/50 to-slate-900 border-orange-500/30 p-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative">
                <TrendingUp className="w-8 h-8 text-orange-400 mb-3" />
                <p className="text-sm text-orange-400 font-medium">COMPLETION RATE</p>
                <p className="text-3xl font-bold text-white">{completionRate}%</p>
                <p className="text-xs text-slate-400 mt-1">overall progress</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-slate-900 border-purple-500/30 p-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative">
                <BarChart3 className="w-8 h-8 text-purple-400 mb-3" />
                <p className="text-sm text-purple-400 font-medium">AVG SCORE</p>
                <p className="text-3xl font-bold text-white">{avgScore}</p>
                <p className="text-xs text-slate-400 mt-1">on uploads</p>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-900 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">TOP PERFORMERS</h2>
            <div className="space-y-3">
              {users
                .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
                .slice(0, 10)
                .map((u, index) => (
                  <div key={u.id} className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg">
                    <span className="text-slate-400 font-bold w-8">#{index + 1}</span>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: u.avatar_color || '#06b6d4' }}
                    >
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{u.full_name}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-400">{(u.total_xp || 0).toLocaleString()} XP</p>
                      <p className="text-xs text-slate-400">Level {u.level || 1}</p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}