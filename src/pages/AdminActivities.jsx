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
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Users, MessageSquare, Upload, Video, CheckCircle2, GripVertical } from "lucide-react";
import { createPageUrl } from "../utils";
import BulkCompletionDialog from "../components/admin/BulkCompletionDialog";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


const activityIcons = {
  training_module: BookOpen,
  roleplay: Users,
  manager_checkin: MessageSquare,
  call_agenda_upload: Upload,
  microlearning_video: Video
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
    video_url: '',
    scoring_criteria: '',
    order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
    path_id: '',
    path_order: 0
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }
    });
  }, []);

  const { data: activities = [], refetch: refetchActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('order'),
  });

  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.ActivityPath.list('order'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: allCompletions = [] } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.ActivityCompletion.list(),
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

  const bulkCompleteMutation = useMutation({
    mutationFn: async ({ activityIds, targetUsers }) => {
      const completions = [];
      const userXPMap = new Map();

      for (const activity of activities.filter(a => activityIds.includes(a.id))) {
        for (const targetUser of targetUsers) {
          // Check if this activity is already completed by this user
          const alreadyCompleted = allCompletions.some(
            c => c.activity_id === activity.id && c.user_email === targetUser.email
          );

          if (!alreadyCompleted) {
            // Only create completion if it doesn't exist
            completions.push({
              activity_id: activity.id,
              user_email: targetUser.email,
              status: 'completed',
              xp_earned: activity.xp_value,
              completed_at: new Date().toISOString()
            });

            // Accumulate XP per user (only for new completions)
            const currentXP = userXPMap.get(targetUser.id) || 0;
            userXPMap.set(targetUser.id, currentXP + activity.xp_value);
          }
        }
      }

      // Only create completions if there are new ones
      if (completions.length > 0) {
        await base44.entities.ActivityCompletion.bulkCreate(completions);
      }

      // Update user XP and levels
      for (const targetUser of targetUsers) {
        const xpToAdd = userXPMap.get(targetUser.id);
        if (xpToAdd) {
          const newTotalXP = (targetUser.total_xp || 0) + xpToAdd;
          const newLevel = Math.floor(newTotalXP / 500) + 1;
          await base44.entities.User.update(targetUser.id, {
            total_xp: newTotalXP,
            level: newLevel
          });
        }
      }

      return completions.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['completions']);
      queryClient.invalidateQueries(['users']);
      setShowBulkDialog(false);
      setSelectedActivities([]);
      alert(`${count} new completions created (duplicates were skipped)`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      activity_type: 'training_module',
      xp_value: 100,
      video_url: '',
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

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      alert('Video must be less than 50MB (approximately 5 minutes)');
      return;
    }

    setUploadingVideo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, video_url: file_url });
    } catch (error) {
      alert('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      activity_type: activity.activity_type,
      xp_value: activity.xp_value,
      video_url: activity.video_url || '',
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

  const toggleActivitySelection = (activityId) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleBulkComplete = (targetUsers) => {
    bulkCompleteMutation.mutate({
      activityIds: selectedActivities,
      targetUsers
    });
  };

  const reorderMutation = useMutation({
    mutationFn: async ({ reordered }) => {
      for (let i = 0; i < reordered.length; i++) {
        await base44.entities.Activity.update(reordered[i].id, { path_order: i });
      }
    },
    onSuccess: async () => {
      // Wait a bit for database to commit changes
      await new Promise(resolve => setTimeout(resolve, 300));
      queryClient.removeQueries(['activities']);
      await refetchActivities();
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination || !selectedPath) return;

    const pathActivities = activities
      .filter(a => a.path_id === selectedPath)
      .sort((a, b) => (a.path_order || 0) - (b.path_order || 0));

    const reordered = Array.from(pathActivities);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    reorderMutation.mutate({ reordered });
  };

  if (!user || user.role !== 'admin') return null;

  const pathActivities = selectedPath 
    ? activities
        .filter(a => a.path_id === selectedPath)
        .sort((a, b) => (a.path_order || 0) - (b.path_order || 0))
    : [];

  const standaloneActivities = activities.filter(a => !a.path_id);

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

        {paths.length > 0 && (
          <Card className="bg-slate-900 border-slate-700 p-4">
            <Label className="text-slate-300 mb-2 block">Reorder Activities in Path</Label>
            <Select value={selectedPath} onValueChange={setSelectedPath}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select a path to reorder activities" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {paths.map(path => (
                  <SelectItem key={path.id} value={path.id}>{path.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        )}

        {selectedPath && pathActivities.length > 0 && (
          <Card className="bg-slate-900 border-slate-700 p-4">
            <h3 className="font-bold text-white mb-3">Drag to Reorder Path Activities</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="path-activities">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {pathActivities.map((activity, index) => {
                      const Icon = activityIcons[activity.activity_type];
                      return (
                        <Draggable key={activity.id} draggableId={activity.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-3"
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="p-2 bg-slate-900 rounded border border-slate-700">
                                <Icon className="w-5 h-5 text-cyan-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white">{activity.title}</p>
                                <p className="text-xs text-slate-400">Order: {index + 1}</p>
                              </div>
                              <span className="text-xs text-cyan-400">+{activity.xp_value} XP</span>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Card>
        )}

        <h2 className="text-xl font-bold text-white mt-8">
          {selectedPath ? 'Standalone Activities' : 'All Activities'}
        </h2>

        <div className="space-y-3">
          {(selectedPath ? standaloneActivities : activities).map((activity) => {
            const Icon = activityIcons[activity.activity_type];
            const isSelected = selectedActivities.includes(activity.id);
            return (
              <Card key={activity.id} className={`bg-slate-900 border-slate-700 p-5 transition-all ${isSelected ? 'ring-2 ring-cyan-500' : ''}`}>
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleActivitySelection(activity.id)}
                    className="mt-4 w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
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
                    <p className="text-slate-400 text-sm mb-2 whitespace-pre-wrap">
                      {activity.description}
                    </p>
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
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                  rows={4}
                  placeholder="Enter activity description..."
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
                      <SelectItem value="microlearning_video">Microlearning Video</SelectItem>
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

              {formData.activity_type === 'microlearning_video' && (
                <div>
                  <Label className="text-slate-300">Video Upload (Max 5 min / 50MB)</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploadingVideo}
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                  />
                  {uploadingVideo && (
                    <p className="text-xs text-cyan-400 mt-2">Uploading video...</p>
                  )}
                  {formData.video_url && (
                    <p className="text-xs text-green-400 mt-2">✓ Video uploaded</p>
                  )}
                </div>
              )}

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

        <BulkCompletionDialog
          open={showBulkDialog}
          onClose={() => setShowBulkDialog(false)}
          onConfirm={handleBulkComplete}
          selectedActivities={selectedActivities}
          users={allUsers}
          departments={departments}
          teams={teams}
        />

        {selectedActivities.length > 0 && (
          <div className="fixed bottom-6 right-6 bg-cyan-500 text-white rounded-full shadow-lg p-4 flex items-center gap-3">
            <span className="font-bold">{selectedActivities.length} selected</span>
            <Button
              onClick={() => setShowBulkDialog(true)}
              className="bg-white text-cyan-600 hover:bg-slate-100"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button
              onClick={() => setSelectedActivities([])}
              variant="ghost"
              className="text-white hover:bg-cyan-600"
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}