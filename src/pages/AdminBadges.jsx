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
import { ArrowLeft, Plus, Pencil, Trash2, Trophy, Award, Star, Medal, Crown, Zap, Target, Flame } from "lucide-react";
import { createPageUrl } from "../utils";

const iconOptions = {
  Trophy: Trophy,
  Award: Award,
  Star: Star,
  Medal: Medal,
  Crown: Crown,
  Zap: Zap,
  Target: Target,
  Flame: Flame
};

const criteriaLabels = {
  activities_completed: 'Activities Completed',
  total_xp: 'Total XP Earned',
  high_score_count: 'High Scores (90+)',
  perfect_score: 'Perfect Scores (100)',
  streak_days: 'Streak Days',
  level_reached: 'Level Reached'
};

export default function AdminBadges() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Trophy',
    color: '#06b6d4',
    criteria_type: 'activities_completed',
    criteria_value: 5,
    is_active: true
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

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Badge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['badges']);
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Badge.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['badges']);
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Badge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['badges']);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Trophy',
      color: '#06b6d4',
      criteria_type: 'activities_completed',
      criteria_value: 5,
      is_active: true
    });
    setEditingBadge(null);
  };

  const handleEdit = (badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || '',
      icon: badge.icon || 'Trophy',
      color: badge.color || '#06b6d4',
      criteria_type: badge.criteria_type,
      criteria_value: badge.criteria_value,
      is_active: badge.is_active
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingBadge) {
      updateMutation.mutate({ id: editingBadge.id, data: formData });
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
              Manage Achievement Badges
            </h1>
            <p className="text-slate-400 mt-2">Configure badge criteria and thresholds</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Badge
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge) => {
            const Icon = iconOptions[badge.icon] || Trophy;
            return (
              <Card key={badge.id} className="bg-slate-900 border-slate-700 p-5">
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${badge.color}20`, borderColor: `${badge.color}50`, borderWidth: '1px' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: badge.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-white text-lg">{badge.name}</h3>
                        <p className="text-slate-400 text-sm mt-1">{badge.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEdit(badge)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(badge.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3 text-sm mt-3">
                      <span className="text-cyan-400">
                        {criteriaLabels[badge.criteria_type]}: {badge.criteria_value}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className={badge.is_active ? "text-green-400" : "text-red-400"}>
                        {badge.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {badges.length === 0 && (
          <Card className="bg-slate-900 border-slate-700 p-12 text-center">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No badges configured yet</p>
            <p className="text-slate-500 text-sm">Create your first achievement badge to motivate your team</p>
          </Card>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-cyan-400">
                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Badge Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., First Steps, XP Master, Perfect Streak"
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What does this badge represent?"
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Icon</Label>
                  <Select value={formData.icon} onValueChange={(v) => setFormData({...formData, icon: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {Object.keys(iconOptions).map(iconName => {
                        const IconComponent = iconOptions[iconName];
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {iconName}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Color</Label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white mt-2 h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Achievement Type</Label>
                  <Select value={formData.criteria_type} onValueChange={(v) => setFormData({...formData, criteria_type: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {Object.entries(criteriaLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Threshold Value</Label>
                  <Input
                    type="number"
                    value={formData.criteria_value}
                    onChange={(e) => setFormData({...formData, criteria_value: parseInt(e.target.value)})}
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
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
                  disabled={!formData.name || !formData.criteria_value}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
                  {editingBadge ? 'Update' : 'Create'} Badge
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}