import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Users, MessageSquare, Upload } from "lucide-react";
import { createPageUrl } from "../utils";

const activityIcons = {
  training_module: BookOpen,
  roleplay: Users,
  manager_checkin: MessageSquare,
  call_agenda_upload: Upload
};

export default function AdminActivities() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'training_module',
    xp_value: 100,
    scoring_criteria: '',
    order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
    path_id: '',
    path_order: 0
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

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('order'),
  });

  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.ActivityPath.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      activity_type: 'training_module',
      xp_value: 100,
      scoring_criteria: '',
      order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
      path_id: '',
      path_order: 0
    });
    setEditingActivity(null);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      activity_type: activity.activity_type,
      xp_value: activity.xp_value,
      scoring_criteria: activity.scoring_criteria || '',
      order: activity.order,
      is_active: activity.is_active,
      start_date: activity.start_date ? new Date(activity.start_date).toISOString().slice(0, 16) : '',
      end_date: activity.end_date ? new Date(activity.end_date).toISOString().slice(0, 16) : '',
      path_id: activity.path_id || '',
      path_order: activity.path_order || 0
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const dataToSubmit = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      path_id: formData.path_id || null,
      path_order: formData.path_id ? formData.path_order : null
    };
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
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
              Manage Activities
            </h1>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Activity
          </Button>
        </div>

        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activity_type];
            return (
              <Card key={activity.id} className="bg-slate-900 border-slate-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-white text-lg">{activity.title}</h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEdit(activity)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(activity.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{activity.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-cyan-400">+{activity.xp_value} XP</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{activity.activity_type.replace(/_/g, ' ')}</span>
                      <span className="text-slate-500">•</span>
                      <span className={activity.is_active ? "text-green-400" : "text-red-400"}>
                        {activity.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-cyan-400">
                {editingActivity ? 'Edit Activity' : 'Create New Activity'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Activity Type</Label>
                  <Select value={formData.activity_type} onValueChange={(v) => setFormData({...formData, activity_type: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="training_module">Training Module</SelectItem>
                      <SelectItem value="roleplay">Roleplay</SelectItem>
                      <SelectItem value="manager_checkin">Manager Check-in</SelectItem>
                      <SelectItem value="call_agenda_upload">Call Agenda Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">XP Value</Label>
                  <Input
                    type="number"
                    value={formData.xp_value}
                    onChange={(e) => setFormData({...formData, xp_value: parseInt(e.target.value)})}
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                  />
                </div>
              </div>

              {formData.activity_type === 'call_agenda_upload' && (
                <div>
                  <Label className="text-slate-300">AI Scoring Criteria</Label>
                  <Textarea
                    value={formData.scoring_criteria}
                    onChange={(e) => setFormData({...formData, scoring_criteria: e.target.value})}
                    placeholder="Define what the AI should look for when scoring submissions..."
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                    rows={4}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Start Date/Time (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">End Date/Time (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Activity Path (Optional)</Label>
                  <Select value={formData.path_id} onValueChange={(v) => setFormData({...formData, path_id: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                      <SelectValue placeholder="No path" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value={null}>No Path</SelectItem>
                      {paths.map(path => (
                        <SelectItem key={path.id} value={path.id}>{path.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.path_id && (
                  <div>
                    <Label className="text-slate-300">Order in Path</Label>
                    <Input
                      type="number"
                      value={formData.path_order}
                      onChange={(e) => setFormData({...formData, path_order: parseInt(e.target.value)})}
                      className="bg-slate-800 border-slate-700 text-white mt-2"
                      min="0"
                    />
                  </div>
                )}
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
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
                  {editingActivity ? 'Update' : 'Create'} Activity
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}