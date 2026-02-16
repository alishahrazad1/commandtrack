import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, GitBranch, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "../utils";

export default function AdminPaths() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
    is_active: true,
    department_id: '',
    team_id: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }
    });
  }, []);

  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.ActivityPath.list('order'),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ActivityPath.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['paths']);
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ActivityPath.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['paths']);
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ActivityPath.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['paths']);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      order: 0,
      is_active: true,
      department_id: '',
      team_id: ''
    });
    setEditingPath(null);
  };

  const handleEdit = (path) => {
    setEditingPath(path);
    setFormData({
      name: path.name,
      description: path.description || '',
      order: path.order,
      is_active: path.is_active,
      department_id: path.department_id || '',
      team_id: path.team_id || ''
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingPath) {
      updateMutation.mutate({ id: editingPath.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-cyan-400">
              Manage Activity Paths
            </h1>
            <p className="text-slate-400 mt-2">Create sequential learning journeys</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Path
          </Button>
        </div>

        <div className="space-y-4">
          {paths.map((path) => {
            const pathActivities = activities
              .filter(a => a.path_id === path.id)
              .sort((a, b) => (a.path_order || 0) - (b.path_order || 0));
            
            const dept = departments.find(d => d.id === path.department_id);
            const team = teams.find(t => t.id === path.team_id);

            return (
              <Card key={path.id} className="bg-slate-900 border-slate-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <GitBranch className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-white text-lg">{path.name}</h3>
                        <p className="text-slate-400 text-sm mt-1">{path.description}</p>
                        {(dept || team) && (
                          <div className="flex gap-2 mt-2">
                            {dept && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                {dept.name}
                              </Badge>
                            )}
                            {team && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                {team.name}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEdit(path)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(path.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {pathActivities.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {pathActivities.map((activity, idx) => (
                          <React.Fragment key={activity.id}>
                            <div className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-300">
                              {activity.title}
                            </div>
                            {idx < pathActivities.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-slate-600" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-4 text-sm mt-3">
                      <span className="text-cyan-400">{pathActivities.length} activities</span>
                      <span className="text-slate-500">•</span>
                      <span className={path.is_active ? "text-green-400" : "text-red-400"}>
                        {path.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {paths.length === 0 && (
          <Card className="bg-slate-900 border-slate-700 p-12 text-center">
            <GitBranch className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No learning paths configured yet</p>
            <p className="text-slate-500 text-sm">Create sequential paths to guide users through related activities</p>
          </Card>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-cyan-400">
                {editingPath ? 'Edit Path' : 'Create New Path'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Path Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Sales Fundamentals, Advanced Techniques"
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What will users learn in this path?"
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-slate-300">Display Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Assign to Department (Optional)</Label>
                  <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v, team_id: ''})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value={null}>All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Assign to Team (Optional)</Label>
                  <Select value={formData.team_id} onValueChange={(v) => setFormData({...formData, team_id: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                      <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value={null}>All Teams</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                />
                <label htmlFor="is_active" className="text-sm text-slate-300">Active</label>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
                  {editingPath ? 'Update' : 'Create'} Path
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}