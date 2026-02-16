import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, TrendingUp, BarChart3, ArrowLeft, Eye } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import TrendsChart from "../components/admin/TrendsChart";
import EmployeeReport from "../components/admin/EmployeeReport";

export default function TeamLeadDashboard() {
  const [user, setUser] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

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

  if (!user) return null;

  // Get user's team/department
  const userTeam = teams.find(t => t.lead_email === user.email || t.id === user.team_id);
  const userDept = departments.find(d => d.head_email === user.email || d.id === user.department_id);

  // Determine what data to show
  const isTeamLead = userTeam?.lead_email === user.email;
  const isDeptHead = userDept?.head_email === user.email;

  if (!isTeamLead && !isDeptHead) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Card className="bg-slate-900 border-slate-700 p-8 text-center">
          <p className="text-slate-400">You don't have team lead or department head access.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="mt-4 bg-cyan-500 hover:bg-cyan-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Get team members
  let teamMembers = [];
  if (isDeptHead && userDept) {
    teamMembers = users.filter(u => u.department_id === userDept.id);
  } else if (isTeamLead && userTeam) {
    teamMembers = users.filter(u => u.team_id === userTeam.id);
  }

  const teamMemberEmails = teamMembers.map(u => u.email);
  const teamCompletions = completions.filter(c => teamMemberEmails.includes(c.user_email));

  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(u => (u.total_xp || 0) > 0).length;
  const totalActivities = activities.length;
  const completionRate = totalActivities > 0 && totalMembers > 0
    ? Math.round((teamCompletions.filter(c => c.status === 'completed').length / (totalMembers * totalActivities)) * 100)
    : 0;

  const scores = teamCompletions.filter(c => c.score).map(c => c.score);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : 0;

  const title = isDeptHead ? `${userDept.name} Department` : `${userTeam.name} Team`;

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
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" className="mb-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              {title.toUpperCase()}
            </h1>
            <p className="text-slate-400">Team performance and analytics</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-900/50 to-slate-900 border-cyan-500/30 p-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative">
                <Users className="w-8 h-8 text-cyan-400 mb-3" />
                <p className="text-sm text-cyan-400 font-medium">TEAM MEMBERS</p>
                <p className="text-3xl font-bold text-white">{totalMembers}</p>
                <p className="text-xs text-slate-400 mt-1">{activeMembers} active</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
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

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-900/50 to-slate-900 border-orange-500/30 p-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative">
                <TrendingUp className="w-8 h-8 text-orange-400 mb-3" />
                <p className="text-sm text-orange-400 font-medium">COMPLETION RATE</p>
                <p className="text-3xl font-bold text-white">{completionRate}%</p>
                <p className="text-xs text-slate-400 mt-1">team progress</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
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

        <Card className="bg-slate-900 border-slate-700 p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Team Member Progress</h2>
          <div className="space-y-3">
            {teamMembers
              .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
              .map((u) => {
                const userCompletions = teamCompletions.filter(c => c.user_email === u.email);
                const completed = userCompletions.filter(c => c.status === 'completed').length;
                const userCompletion = totalActivities > 0 ? Math.round((completed / totalActivities) * 100) : 0;

                return (
                  <div key={u.id} className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-800/70 transition-colors">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: u.avatar_color || '#06b6d4' }}
                    >
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{u.full_name}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-cyan-400">{(u.total_xp || 0).toLocaleString()} XP</p>
                      <p className="text-xs text-slate-400">{completed}/{totalActivities} • {userCompletion}%</p>
                    </div>
                    <Button
                      onClick={() => setSelectedEmployee(u)}
                      size="sm"
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Report
                    </Button>
                  </div>
                );
              })}
          </div>
        </Card>

        <TrendsChart completions={teamCompletions} />
      </div>

      <EmployeeReport
        user={selectedEmployee}
        activities={activities}
        completions={completions}
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onExport={() => {}}
      />
    </div>
  );
}