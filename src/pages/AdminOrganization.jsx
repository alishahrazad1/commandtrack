import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Building2, Users, Edit2, Trash2, Plus, ArrowLeft } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";

export default function AdminOrganization() {
  const [user, setUser] = useState(null);
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  
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

  if (!user || user.role !== 'admin') return null;

  const getDepartmentTeams = (deptId) => teams.filter(t => t.department_id === deptId);
  const getTeamUsers = (teamId) => users.filter(u => u.team_id === teamId);

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
            <p className="text-slate-400">Manage departments, teams, and assignments</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departments Section */}
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

          {/* Teams Section */}
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
        </div>

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