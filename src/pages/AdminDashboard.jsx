import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Users, Target, TrendingUp, Settings, BarChart3, Download, Eye, Edit2, Check, X, Building2, ChevronRight, Trophy, GitBranch, Megaphone } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import FilterPanel from "../components/admin/FilterPanel";
import ActivityPerformance from "../components/admin/ActivityPerformance";
import TrendsChart from "../components/admin/TrendsChart";
import EmployeeReport from "../components/admin/EmployeeReport";
import ComparisonReport from "../components/admin/ComparisonReport";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({ department: 'all', team: 'all' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editValues, setEditValues] = useState({ department: '', team: '' });
  
  const queryClient = useQueryClient();

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

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      await base44.entities.User.update(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setEditingUser(null);
    },
  });

  const handleEditUser = (u) => {
    setEditingUser(u.id);
    setEditValues({ department_id: u.department_id || '', team_id: u.team_id || '' });
  };

  const handleSaveUser = (userId) => {
    updateUserMutation.mutate({ userId, data: editValues });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditValues({ department_id: '', team_id: '' });
  };

  if (!user || user.role !== 'admin') return null;

  // Apply filters
  const filteredUsers = users.filter(u => {
    if (filters.department !== 'all') {
      const dept = departments.find(d => d.name === filters.department);
      if (dept && u.department_id !== dept.id) return false;
    }
    if (filters.team !== 'all') {
      const team = teams.find(t => t.name === filters.team);
      if (team && u.team_id !== team.id) return false;
    }
    return true;
  });

  const filteredUserEmails = filteredUsers.map(u => u.email);
  const filteredCompletions = completions.filter(c => filteredUserEmails.includes(c.user_email));

  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(u => (u.total_xp || 0) > 0).length;
  const totalActivities = activities.length;
  const completionRate = totalActivities > 0 && totalUsers > 0
    ? Math.round((filteredCompletions.filter(c => c.status === 'completed').length / (totalUsers * totalActivities)) * 100)
    : 0;

  const scores = filteredCompletions.filter(c => c.score).map(c => c.score);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : 0;

  const exportAllData = () => {
    const data = filteredUsers.map(u => {
      const userCompletions = filteredCompletions.filter(c => c.user_email === u.email);
      const completed = userCompletions.filter(c => c.status === 'completed').length;
      const userScores = userCompletions.filter(c => c.score).map(c => c.score);
      const avgUserScore = userScores.length > 0 ? Math.round(userScores.reduce((sum, s) => sum + s, 0) / userScores.length) : 'N/A';

      const userDept = departments.find(d => d.id === u.department_id);
      const userTeam = teams.find(t => t.id === u.team_id);

      return {
        Name: u.full_name,
        Email: u.email,
        Department: userDept?.name || 'N/A',
        Team: userTeam?.name || 'N/A',
        'Total XP': u.total_xp || 0,
        Level: u.level || 1,
        'Activities Completed': `${completed}/${totalActivities}`,
        'Completion Rate': `${Math.round((completed / totalActivities) * 100)}%`,
        'Average Score': avgUserScore
      };
    });

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportEmployeeReport = (employee) => {
    const userCompletions = completions.filter(c => c.user_email === employee.email);
    
    const data = activities.map(activity => {
      const completion = userCompletions.find(c => c.activity_id === activity.id);
      return {
        Activity: activity.title,
        Type: activity.activity_type.replace(/_/g, ' '),
        Status: completion?.status || 'not_started',
        Score: completion?.score || 'N/A',
        'XP Earned': completion?.xp_earned || 0,
        'Completed At': completion?.completed_at ? new Date(completion.completed_at).toLocaleDateString() : 'N/A',
        Feedback: completion?.notes || 'N/A'
      };
    });

    const csv = [
      `Employee Report: ${employee.full_name} (${employee.email})`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-report-${employee.email}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link to={createPageUrl('Dashboard')} className="text-slate-400 hover:text-cyan-400 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="text-cyan-400">Admin Panel</span>
            </div>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-slate-400">Advanced analytics and program management</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportAllData}
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Link to={createPageUrl('AdminOrganization')}>
              <Button className="bg-slate-500 hover:bg-slate-600">
                <Building2 className="w-4 h-4 mr-2" />
                Organization
              </Button>
            </Link>
            <Link to={createPageUrl('AdminPaths')}>
              <Button className="bg-purple-500 hover:bg-purple-600">
                <GitBranch className="w-4 h-4 mr-2" />
                Paths
              </Button>
            </Link>
            <Link to={createPageUrl('AdminBadges')}>
              <Button className="bg-yellow-500 hover:bg-yellow-600">
                <Trophy className="w-4 h-4 mr-2" />
                Badges
              </Button>
            </Link>
            <Link to={createPageUrl('AdminActivities')}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Settings className="w-4 h-4 mr-2" />
                Activities
              </Button>
            </Link>
            <Link to={createPageUrl('AdminAnnouncements')}>
              <Button className="bg-green-500 hover:bg-green-600">
                <Megaphone className="w-4 h-4 mr-2" />
                Announcements
              </Button>
            </Link>
            <Link to={createPageUrl('AdminAnalytics')}>
              <Button className="bg-indigo-500 hover:bg-indigo-600">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
          </div>
        </motion.div>

        <FilterPanel filters={filters} onFilterChange={setFilters} users={users} departments={departments} teams={teams} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
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
                <p className="text-xs text-slate-400 mt-1">overall progress</p>
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

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="employees" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Employee Progress
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Dept/Team Comparison
            </TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Activity Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card className="bg-slate-900 border-slate-700 p-6">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Employee Progress</h2>
              <div className="space-y-3">
                {filteredUsers
                  .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
                  .map((u) => {
                    const userCompletions = filteredCompletions.filter(c => c.user_email === u.email);
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
                          {editingUser === u.id ? (
                            <div className="flex gap-2 mt-1">
                              <select
                                value={editValues.department_id}
                                onChange={(e) => setEditValues({ ...editValues, department_id: e.target.value })}
                                className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white w-32"
                              >
                                <option value="">No Department</option>
                                {departments.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                              <select
                                value={editValues.team_id}
                                onChange={(e) => setEditValues({ ...editValues, team_id: e.target.value })}
                                className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white w-32"
                              >
                                <option value="">No Team</option>
                                {teams.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">
                              {[
                                departments.find(d => d.id === u.department_id)?.name,
                                teams.find(t => t.id === u.team_id)?.name,
                                u.email
                              ].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right mr-4">
                          <p className="font-bold text-cyan-400">{(u.total_xp || 0).toLocaleString()} XP</p>
                          <p className="text-xs text-slate-400">{completed}/{totalActivities} • {userCompletion}%</p>
                        </div>
                        <div className="flex gap-2">
                          {editingUser === u.id ? (
                            <>
                              <Button
                                onClick={() => handleSaveUser(u.id)}
                                size="sm"
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleEditUser(u)}
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-cyan-400"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setSelectedEmployee(u)}
                                size="sm"
                                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Report
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="comparison">
            <ComparisonReport
              departments={departments}
              teams={teams}
              users={filteredUsers}
              completions={filteredCompletions}
              activities={activities}
            />
          </TabsContent>

          <TabsContent value="activities">
            <ActivityPerformance 
              activities={activities} 
              completions={filteredCompletions} 
              totalUsers={totalUsers}
            />
          </TabsContent>

          <TabsContent value="trends">
            <TrendsChart completions={filteredCompletions} />
          </TabsContent>
        </Tabs>
      </div>

      <EmployeeReport
        user={selectedEmployee}
        activities={activities}
        completions={completions}
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onExport={exportEmployeeReport}
      />
    </div>
  );
}