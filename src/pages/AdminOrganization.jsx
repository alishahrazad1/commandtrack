import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Building2, Users, Edit2, Trash2, Plus, ArrowLeft, UserPlus, X, TrendingUp, Target, Mail, Upload } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import BulkUploadDialog from "../components/admin/BulkUploadDialog";

export default function AdminOrganization() {
  const [user, setUser] = useState(null);
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteTeamId, setInviteTeamId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }
    });
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

  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ['pendingInvitations'],
    queryFn: () => base44.entities.PendingInvitation.filter({ status: 'pending' }),
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

  const createDeptMutation = useMutation({
    mutationFn: (data) => base44.entities.Department.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      setShowDeptDialog(false);
      setEditingDept(null);
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Department.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      setShowDeptDialog(false);
      setEditingDept(null);
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id) => base44.entities.Department.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['departments']),
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setShowTeamDialog(false);
      setEditingTeam(null);
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setShowTeamDialog(false);
      setEditingTeam(null);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['teams']),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User updated successfully');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User removed successfully');
    },
  });

  const deletePendingInvitationMutation = useMutation({
    mutationFn: (invitationId) => base44.entities.PendingInvitation.delete(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingInvitations']);
      toast.success('Invitation cancelled');
    },
  });

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      
      // Track pending invitation
      await base44.entities.PendingInvitation.create({
        email: inviteEmail,
        role: inviteRole,
        team_id: inviteTeamId || null,
        invited_by: user.email,
        status: 'pending'
      });
      
      if (inviteTeamId) {
        toast.success(`Invitation sent to ${inviteEmail}. Assign them to the team after they accept.`);
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
      }
      
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('user');
      setInviteTeamId('');
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['pendingInvitations']);
    } catch (error) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const getDepartmentTeams = (deptId) => teams.filter(t => t.department_id === deptId);
  const getTeamUsers = (teamId) => users.filter(u => u.team_id === teamId);
  
  const getTeamStats = (teamId) => {
    const members = getTeamUsers(teamId);
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
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" className="mb-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              ORGANIZATION MANAGEMENT
            </h1>
            <p className="text-slate-400">Manage departments, teams, and team member assignments</p>
          </div>
        </motion.div>

        <Tabs defaultValue="departments" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="departments" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <Building2 className="w-4 h-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Team Members
            </TabsTrigger>
          </TabsList>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Departments
                </h2>
                <Button
                  onClick={() => {
                    setEditingDept(null);
                    setShowDeptDialog(true);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Department
                </Button>
              </div>

              <div className="space-y-3">
                {departments.map(dept => (
                  <div key={dept.id} className="bg-slate-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{dept.name}</h3>
                        {dept.description && (
                          <p className="text-sm text-slate-400 mt-1">{dept.description}</p>
                        )}
                        {dept.head_email && (
                          <p className="text-xs text-cyan-400 mt-1">Head: {dept.head_email}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingDept(dept);
                            setShowDeptDialog(true);
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-cyan-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('Delete this department?')) {
                              deleteDeptMutation.mutate(dept.id);
                            }
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {getDepartmentTeams(dept.id).length} teams • {users.filter(u => u.department_id === dept.id).length} members
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Teams
                </h2>
                <Button
                  onClick={() => {
                    setEditingTeam(null);
                    setShowTeamDialog(true);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600"
                  disabled={departments.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              </div>

              <div className="space-y-3">
                {teams.map(team => {
                  const dept = departments.find(d => d.id === team.department_id);
                  return (
                    <div key={team.id} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{team.name}</h3>
                          {dept && (
                            <p className="text-xs text-orange-400">{dept.name}</p>
                          )}
                          {team.description && (
                            <p className="text-sm text-slate-400 mt-1">{team.description}</p>
                          )}
                          {team.lead_email && (
                            <p className="text-xs text-cyan-400 mt-1">Lead: {team.lead_email}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingTeam(team);
                              setShowTeamDialog(true);
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-cyan-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm('Delete this team?')) {
                                deleteTeamMutation.mutate(team.id);
                              }
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {getTeamUsers(team.id).length} members
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="members">
            <Card className="bg-slate-900 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Users
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowBulkUploadDialog(true)}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Invite New User
                  </Button>
                </div>
              </div>

              {pendingInvitations.length > 0 && (
                <Accordion type="single" collapsible className="mb-4">
                  <AccordionItem value="pending" className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2 text-yellow-400 font-semibold">
                        <Mail className="w-4 h-4" />
                        Pending Invitations ({pendingInvitations.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {pendingInvitations.map(inv => {
                          const invitedTeam = teams.find(t => t.id === inv.team_id);
                          return (
                            <div key={inv.id} className="flex items-center justify-between bg-slate-800/50 rounded p-2">
                              <div>
                                <span className="text-white text-sm">{inv.email}</span>
                                <div className="text-xs text-slate-400">
                                  Role: {inv.role} {invitedTeam && `• Team: ${invitedTeam.name}`}
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  if (confirm(`Cancel invitation for ${inv.email}?`)) {
                                    deletePendingInvitationMutation.mutate(inv.id);
                                  }
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Team</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">XP</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const userDept = departments.find(d => d.id === u.department_id);
                      const userTeam = teams.find(t => t.id === u.team_id);
                      
                      return (
                        <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ backgroundColor: u.avatar_color || '#06b6d4' }}
                              >
                                {u.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-white">{u.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-400">{u.email}</td>
                          <td className="py-3 px-4">
                            <Select
                              value={u.role}
                              onValueChange={(value) => {
                                updateUserMutation.mutate({
                                  userId: u.id,
                                  data: { role: value }
                                });
                              }}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="team_lead">Team Lead</SelectItem>
                                <SelectItem value="department_head">Department Head</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-400">
                            {userDept?.name || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <Select
                              value={u.team_id || 'none'}
                              onValueChange={(value) => {
                                const newTeamId = value === 'none' ? null : value;
                                const newTeam = teams.find(t => t.id === newTeamId);
                                updateUserMutation.mutate({
                                  userId: u.id,
                                  data: {
                                    team_id: newTeamId,
                                    department_id: newTeam ? newTeam.department_id : u.department_id
                                  }
                                });
                              }}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="none">No Team</SelectItem>
                                {teams.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-cyan-400">
                            {u.total_xp || 0}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-400">
                            {u.level || 1}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              onClick={() => {
                                if (confirm(`Remove ${u.full_name} from the system?`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                          </tr>
                          );
                          })}
                          </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Department Dialog */}
        <DepartmentDialog
          open={showDeptDialog}
          onClose={() => {
            setShowDeptDialog(false);
            setEditingDept(null);
          }}
          department={editingDept}
          users={users}
          onSave={(data) => {
            if (editingDept) {
              updateDeptMutation.mutate({ id: editingDept.id, data });
            } else {
              createDeptMutation.mutate(data);
            }
          }}
        />

        {/* Team Dialog */}
        <TeamDialog
          open={showTeamDialog}
          onClose={() => {
            setShowTeamDialog(false);
            setEditingTeam(null);
          }}
          team={editingTeam}
          departments={departments}
          users={users}
          onSave={(data) => {
            if (editingTeam) {
              updateTeamMutation.mutate({ id: editingTeam.id, data });
            } else {
              createTeamMutation.mutate(data);
            }
          }}
        />

        {/* Bulk Upload Dialog */}
        <BulkUploadDialog
          open={showBulkUploadDialog}
          onClose={() => setShowBulkUploadDialog(false)}
          onSuccess={() => queryClient.invalidateQueries(['users'])}
          teams={teams}
          departments={departments}
        />

        {/* Invite User Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={() => setShowInviteDialog(false)}>
          <DialogContent className="bg-slate-900 border-green-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Invite New User
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Email Address *</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="newuser@example.com"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Role *</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Team (Optional)</label>
                <Select value={inviteTeamId} onValueChange={setInviteTeamId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select team (can assign later)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value={null}>No Team</SelectItem>
                    {teams.map(t => {
                      const dept = departments.find(d => d.id === t.department_id);
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} {dept ? `(${dept.name})` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Note: Team assignment will be saved for reference. Assign in the Team Members table after they accept.</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteEmail('');
                    setInviteRole('user');
                    setInviteTeamId('');
                  }}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteUser}
                  disabled={!inviteEmail || isInviting}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function DepartmentDialog({ open, onClose, department, users, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head_email: ''
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        head_email: department.head_email || ''
      });
    } else {
      setFormData({ name: '', description: '', head_email: '' });
    }
  }, [department, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">
            {department ? 'Edit Department' : 'Create Department'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="e.g., Sales, Marketing"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Department Head</label>
            <Select value={formData.head_email} onValueChange={(value) => setFormData({ ...formData, head_email: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value={null}>None</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => onSave(formData)}
            disabled={!formData.name}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
          >
            {department ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeamDialog({ open, onClose, team, departments, users, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    description: '',
    lead_email: ''
  });

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        department_id: team.department_id || '',
        description: team.description || '',
        lead_email: team.lead_email || ''
      });
    } else {
      setFormData({ name: '', department_id: '', description: '', lead_email: '' });
    }
  }, [team, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">
            {team ? 'Edit Team' : 'Create Team'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="e.g., Alpha Team, Beta Squad"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Department *</label>
            <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-slate-300">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Team Lead</label>
            <Select value={formData.lead_email} onValueChange={(value) => setFormData({ ...formData, lead_email: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value={null}>None</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => onSave(formData)}
            disabled={!formData.name || !formData.department_id}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
          >
            {team ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}