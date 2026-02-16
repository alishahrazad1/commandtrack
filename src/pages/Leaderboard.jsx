import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Award, Zap, Users, Filter, TrendingUp, Crown, Star, X } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.ActivityCompletion.list('-completed_at'),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const getDateRange = () => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (timeFilter === 'week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      endDate = now;
    } else if (timeFilter === 'month') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1);
      endDate = now;
    } else if (timeFilter === 'quarter') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 3);
      endDate = now;
    } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    }

    return { startDate, endDate };
  };

  const getFilteredUsers = () => {
    let filteredCompletions = completions;
    const { startDate, endDate } = getDateRange();

    // Filter by date range
    if (startDate && endDate) {
      filteredCompletions = completions.filter(c => 
        c.completed_at && new Date(c.completed_at) >= startDate && new Date(c.completed_at) <= endDate
      );
    }

    // Filter by team/department
    let filteredUsers = users;
    if (teamFilter !== 'all') {
      filteredUsers = users.filter(u => u.team_id === teamFilter);
    } else if (deptFilter !== 'all') {
      filteredUsers = users.filter(u => u.department_id === deptFilter);
    }

    const userXP = {};
    filteredCompletions.forEach(c => {
      if (c.status === 'completed') {
        userXP[c.user_email] = (userXP[c.user_email] || 0) + (c.xp_earned || 0);
      }
    });

    return filteredUsers
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

  // Team leaderboard calculation
  const getTeamStandings = () => {
    let filteredCompletions = completions;
    const { startDate, endDate } = getDateRange();

    if (startDate && endDate) {
      filteredCompletions = completions.filter(c => 
        c.completed_at && new Date(c.completed_at) >= startDate && new Date(c.completed_at) <= endDate
      );
    }

    let filteredTeams = teams;
    if (deptFilter !== 'all') {
      filteredTeams = teams.filter(t => t.department_id === deptFilter);
    }

    return filteredTeams.map(team => {
      const teamMembers = users.filter(u => u.team_id === team.id);
      const teamMemberEmails = teamMembers.map(u => u.email);
      
      const teamCompletions = filteredCompletions.filter(c => 
        teamMemberEmails.includes(c.user_email) && c.status === 'completed'
      );
      
      const totalXP = teamCompletions.reduce((sum, c) => sum + (c.xp_earned || 0), 0);
      const avgXP = teamMembers.length > 0 ? Math.round(totalXP / teamMembers.length) : 0;
      
      return {
        ...team,
        totalXP,
        avgXP,
        memberCount: teamMembers.length
      };
    })
      .filter(t => t.totalXP > 0)
      .sort((a, b) => b.totalXP - a.totalXP);
  };

  const teamStandings = getTeamStandings();
  
  const getTopPerformerInfo = () => {
    if (rankedUsers.length === 0) return null;
    const topUser = rankedUsers[0];
    const xp = timeFilter === 'all' ? topUser.total_xp : topUser.period_xp;
    return { user: topUser, xp };
  };

  const topPerformer = getTopPerformerInfo();

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
            <h1 className="text-5xl font-bold text-yellow-400 mb-2">
              HIGH SCORES
            </h1>
            <p className="text-slate-400">Top players and teams in the Command of the Message challenge</p>
          </div>
        </motion.div>

        {topPerformer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-yellow-500/50 border-2">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative p-6">
                <div className="flex items-center gap-4">
                  <Crown className="w-12 h-12 text-yellow-400 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-400 font-semibold mb-1">
                      {timeFilter === 'all' ? 'ALL-TIME CHAMPION' : 
                       timeFilter === 'week' ? 'PLAYER OF THE WEEK' :
                       timeFilter === 'month' ? 'PLAYER OF THE MONTH' :
                       timeFilter === 'quarter' ? 'PLAYER OF THE QUARTER' : 'TOP PERFORMER'}
                    </p>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-yellow-400"
                        style={{ backgroundColor: topPerformer.user.avatar_color || '#06b6d4' }}
                      >
                        {topPerformer.user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{topPerformer.user.full_name}</h3>
                        <p className="text-sm text-slate-300">Level {topPerformer.user.level || 1}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Star className="w-6 h-6 text-yellow-400" />
                      <span className="text-3xl font-bold text-yellow-400">
                        {topPerformer.xp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-yellow-200">XP EARNED</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <Card className="bg-slate-900 border-slate-700 p-4">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Advanced Filters'}
          </Button>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">Time Period</Label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 text-sm mb-2 block">Department</Label>
                <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setTeamFilter('all'); }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 text-sm mb-2 block">Team</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams
                      .filter(t => deptFilter === 'all' || t.department_id === deptFilter)
                      .map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {user && (
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">Quick Filters</Label>
                  <div className="flex gap-2">
                    {user.team_id && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setTeamFilter(user.team_id);
                          setDeptFilter('all');
                        }}
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs"
                      >
                        My Team
                      </Button>
                    )}
                    {user.department_id && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setDeptFilter(user.department_id);
                          setTeamFilter('all');
                        }}
                        variant="outline"
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs"
                      >
                        My Dept
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {timeFilter === 'custom' && showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700"
            >
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </motion.div>
          )}

          {(teamFilter !== 'all' || deptFilter !== 'all' || timeFilter !== 'all') && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {deptFilter !== 'all' && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {departments.find(d => d.id === deptFilter)?.name}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setDeptFilter('all')} />
                </Badge>
              )}
              {teamFilter !== 'all' && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {teams.find(t => t.id === teamFilter)?.name}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setTeamFilter('all')} />
                </Badge>
              )}
              {timeFilter !== 'all' && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {timeFilter === 'week' ? 'This Week' :
                   timeFilter === 'month' ? 'This Month' :
                   timeFilter === 'quarter' ? 'This Quarter' :
                   timeFilter === 'custom' && customStartDate && customEndDate ? 
                     `${format(new Date(customStartDate), 'MMM d')} - ${format(new Date(customEndDate), 'MMM d')}` : 
                     'Custom'}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setTimeFilter('all')} />
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTeamFilter('all');
                  setDeptFilter('all');
                  setTimeFilter('all');
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear All
              </Button>
            </div>
          )}
        </Card>

        <Tabs defaultValue="players" className="space-y-6">
          <div className="flex items-center justify-center">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="players" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <Trophy className="w-4 h-4 mr-2" />
                Players
              </TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Teams
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="players">

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
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-white">{user.full_name}</h3>
                        {index === 0 && <Crown className="w-5 h-5 text-yellow-400" />}
                        {index === 1 && <Star className="w-5 h-5 text-slate-300" />}
                        {index === 2 && <TrendingUp className="w-5 h-5 text-orange-400" />}
                      </div>
                      <p className="text-sm text-slate-400">Level {user.level || 1}</p>
                      {(user.team_id || user.department_id) && (
                        <div className="flex gap-1 mt-1">
                          {user.team_id && (
                            <span className="text-xs text-purple-400">
                              {teams.find(t => t.id === user.team_id)?.name}
                            </span>
                          )}
                          {user.team_id && user.department_id && (
                            <span className="text-xs text-slate-500">•</span>
                          )}
                          {user.department_id && (
                            <span className="text-xs text-orange-400">
                              {departments.find(d => d.id === user.department_id)?.name}
                            </span>
                          )}
                        </div>
                      )}
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
          </TabsContent>

          <TabsContent value="teams">
            <div className="space-y-3">
              {teamStandings.map((team, index) => {
                const dept = departments.find(d => d.id === team.department_id);
                const Icon = index === 0 ? Trophy : index === 1 ? Medal : index === 2 ? Award : Users;
                const iconColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-orange-400' : 'text-cyan-400';
                
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`relative overflow-hidden bg-gradient-to-r ${getRankColor(index + 1)} border`}>
                      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                      
                      <div className="relative p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12">
                              {index < 3 ? (
                                <Icon className={iconColor} style={{ width: '24px', height: '24px' }} />
                              ) : (
                                <span className="text-2xl font-bold text-slate-400">#{index + 1}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-white">{team.name}</h3>
                            {dept && <p className="text-sm text-orange-400">{dept.name}</p>}
                            <p className="text-xs text-slate-400">{team.memberCount} members</p>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <Zap className="w-5 h-5 text-cyan-400" />
                              <span className="text-2xl font-bold text-cyan-400">
                                {team.totalXP.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Avg: {team.avgXP.toLocaleString()} XP
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}

              {teamStandings.length === 0 && (
                <Card className="bg-slate-900 border-slate-700 p-12 text-center">
                  <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No teams on the leaderboard yet.</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}