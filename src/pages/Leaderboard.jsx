import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Award, Zap } from "lucide-react";
import { createPageUrl } from "./utils";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState('all');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.ActivityCompletion.list('-completed_at'),
  });

  const getFilteredUsers = () => {
    let filteredCompletions = completions;

    if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredCompletions = completions.filter(c => 
        c.completed_at && new Date(c.completed_at) >= weekAgo
      );
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredCompletions = completions.filter(c => 
        c.completed_at && new Date(c.completed_at) >= monthAgo
      );
    }

    const userXP = {};
    filteredCompletions.forEach(c => {
      if (c.status === 'completed') {
        userXP[c.user_email] = (userXP[c.user_email] || 0) + (c.xp_earned || 0);
      }
    });

    return users
      .map(user => ({
        ...user,
        period_xp: userXP[user.email] || 0
      }))
      .sort((a, b) => {
        if (timeFilter === 'all') {
          return (b.total_xp || 0) - (a.total_xp || 0);
        }
        return b.period_xp - a.period_xp;
      })
      .filter(u => timeFilter === 'all' ? (u.total_xp || 0) > 0 : u.period_xp > 0);
  };

  const rankedUsers = getFilteredUsers();

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "from-yellow-500/20 to-orange-500/20 border-yellow-500/30";
    if (rank === 2) return "from-slate-400/20 to-slate-600/20 border-slate-400/30";
    if (rank === 3) return "from-orange-500/20 to-red-500/20 border-orange-500/30";
    return "from-slate-800 to-slate-900 border-slate-700";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-5xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Command Center
            </Button>
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent mb-2">
              HIGH SCORES
            </h1>
            <p className="text-slate-400">Top players in the Command of the Message challenge</p>
          </div>

          <div className="flex justify-center mb-6">
            <Tabs value={timeFilter} onValueChange={setTimeFilter}>
              <TabsList className="bg-slate-800 border border-slate-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  All Time
                </TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  This Month
                </TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  This Week
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        <div className="space-y-3">
          {rankedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`relative overflow-hidden bg-gradient-to-r ${getRankColor(index + 1)} border`}>
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                
                <div className="relative p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(index + 1) || (
                        <span className="text-2xl font-bold text-slate-400">#{index + 1}</span>
                      )}
                    </div>

                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl border-2"
                      style={{ 
                        backgroundColor: user.avatar_color || '#06b6d4',
                        borderColor: index < 3 ? '#fff' : '#475569'
                      }}
                    >
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white">{user.full_name}</h3>
                      <p className="text-sm text-slate-400">Level {user.level || 1}</p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Zap className="w-5 h-5 text-cyan-400" />
                        <span className="text-2xl font-bold text-cyan-400">
                          {timeFilter === 'all' 
                            ? (user.total_xp || 0).toLocaleString()
                            : user.period_xp.toLocaleString()
                          }
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {timeFilter === 'all' ? 'TOTAL XP' : 'PERIOD XP'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {rankedUsers.length === 0 && (
          <Card className="bg-slate-900 border-slate-700 p-12 text-center">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No players on the leaderboard yet. Start completing quests!</p>
          </Card>
        )}
      </div>
    </div>
  );
}