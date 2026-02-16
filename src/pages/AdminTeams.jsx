import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, X, TrendingUp, Target, Trophy } from "lucide-react";
import { createPageUrl } from "../utils";

export default function AdminTeams() {
  const [user, setUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }
    });
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.ActivityCompletion.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.ActivityPath.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSearchEmail('');
    },
  });

  const handleAddUserToTeam = (teamId) => {
    const userToAdd = users.find(u => u.email.toLowerCase() === searchEmail.toLowerCase());
    if (!userToAdd) {
      alert('User not found');
      return;
    }
    
    const team = teams.find(t => t.id === teamId);
    updateUserMutation.mutate({
      userId: userToAdd.id,
      data: { team_id: teamId, department_id: team.department_id }
    });
  };

  const handleRemoveUser = (userId) => {
    updateUserMutation.mutate({
      userId,
      data: { team_id: null }
    });
  };

  const getTeamMembers = (teamId) => {
    return users.filter(u => u.team_id === teamId);
  };

  const getTeamStats = (teamId) => {
    const members = getTeamMembers(teamId);
    const memberEmails = members.map(m => m.email);
    
    const teamCompletions = completions.filter(c => memberEmails.includes(c.user_email));
    const totalXP = members.reduce((sum, m) => sum + (m.total_xp || 0), 0);
    const avgXP = members.length > 0 ? Math.round(totalXP / members.length) : 0;
    
    const completedCount = teamCompletions.filter(c => c.status === 'completed').length;
    const totalPossible = members.length * activities.length;
    const completionRate = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;

    return { members: members.length, totalXP, avgXP, completionRate };
  };

  const getAssignedPaths = (teamId) => {
    return paths.filter(p => p.team_id === teamId);
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-cyan-400">Team Management</h1>
            <p className="text-slate-400 mt-2">Manage team members, assignments, and performance</p>
          </div>
          <Link to={createPageUrl('AdminOrganization')}>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <Users className="w-4 h-4 mr-2" />
              Organization Settings
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map((team) => {
            const dept = departments.find(d => d.id === team.department_id);
            const stats = getTeamStats(team.id);
            const members = getTeamMembers(team.id);
            const assignedPaths = getAssignedPaths(team.id);
            
            return (
              <Card key={team.id} className="bg-slate-900 border-slate-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <p className="text-sm text-slate-400">{dept?.name}</p>
                    {team.description && (
                      <p className="text-sm text-slate-500 mt-1">{team.description}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => setSelectedTeam(team.id)}
                    size="sm"
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <Users className="w-4 h-4 text-cyan-400 mb-1" />
                    <p className="text-2xl font-bold text-white">{stats.members}</p>
                    <p className="text-xs text-slate-400">Members</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <TrendingUp className="w-4 h-4 text-orange-400 mb-1" />
                    <p className="text-2xl font-bold text-white">{stats.avgXP}</p>
                    <p className="text-xs text-slate-400">Avg XP</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <Target className="w-4 h-4 text-purple-400 mb-1" />
                    <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
                    <p className="text-xs text-slate-400">Complete</p>
                  </div>
                </div>

                {assignedPaths.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-400 mb-2">Assigned Paths:</p>
                    <div className="flex flex-wrap gap-2">
                      {assignedPaths.map(path => (
                        <Badge key={path.id} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {path.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-400 mb-2">Team Members:</p>
                  {members.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No members assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center justify-between bg-slate-800 rounded p-2 border border-slate-700">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: member.avatar_color || '#06b6d4' }}
                            >
                              {member.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{member.full_name}</p>
                              <p className="text-xs text-slate-400">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-bold text-cyan-400">{member.total_xp || 0} XP</p>
                              <p className="text-xs text-slate-500">Level {member.level || 1}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveUser(member.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {teams.length === 0 && (
          <Card className="bg-slate-900 border-slate-700 p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No teams created yet</p>
            <p className="text-slate-500 text-sm mb-4">Create teams in Organization Settings</p>
            <Link to={createPageUrl('AdminOrganization')}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Go to Organization Settings
              </Button>
            </Link>
          </Card>
        )}

        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="bg-slate-900 border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-cyan-400">
                Add Team Member
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">User Email</label>
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedTeam(null)}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAddUserToTeam(selectedTeam)}
                  disabled={!searchEmail}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
                  Add to Team
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}