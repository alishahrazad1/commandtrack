import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Mail, Trophy, Target, MessageSquare, Save } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    email_achievements: true,
    email_milestones: true,
    email_announcements: true,
    email_weekly_summary: true,
    email_monthly_summary: false,
    email_reminders: true,
    inapp_achievements: true,
    inapp_milestones: true,
    inapp_announcements: true,
    inapp_reminders: true,
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.notification_preferences) {
        setPreferences({ ...preferences, ...u.notification_preferences });
      }
    });
  }, []);

  const savePreferencesMutation = useMutation({
    mutationFn: (prefs) => base44.auth.updateMe({ notification_preferences: prefs }),
    onSuccess: () => {
      toast.success('Notification preferences saved');
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const handleSave = () => {
    savePreferencesMutation.mutate(preferences);
  };

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl('Notifications')}>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Notifications
            </Button>
          </Link>

          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            NOTIFICATION SETTINGS
          </h1>
          <p className="text-slate-400">Customize how and when you receive notifications</p>
        </motion.div>

        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-xl font-bold text-white">In-App Notifications</h2>
                <p className="text-sm text-slate-400">Notifications displayed in the app</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <Label className="text-white font-medium">Achievements & Badges</Label>
                    <p className="text-xs text-slate-400">When you earn a new badge or achievement</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.inapp_achievements}
                  onCheckedChange={() => togglePreference('inapp_achievements')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <div>
                    <Label className="text-white font-medium">Milestones & Progress</Label>
                    <p className="text-xs text-slate-400">Level ups and milestone completions</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.inapp_milestones}
                  onCheckedChange={() => togglePreference('inapp_milestones')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  <div>
                    <Label className="text-white font-medium">Announcements</Label>
                    <p className="text-xs text-slate-400">Important updates from admins</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.inapp_announcements}
                  onCheckedChange={() => togglePreference('inapp_announcements')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <div>
                    <Label className="text-white font-medium">Reminders</Label>
                    <p className="text-xs text-slate-400">Activity and task reminders</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.inapp_reminders}
                  onCheckedChange={() => togglePreference('inapp_reminders')}
                />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Email Notifications</h2>
                <p className="text-sm text-slate-400">Notifications sent to {user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <Label className="text-white font-medium">Achievements & Badges</Label>
                    <p className="text-xs text-slate-400">Instant email when you earn badges</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_achievements}
                  onCheckedChange={() => togglePreference('email_achievements')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <div>
                    <Label className="text-white font-medium">Milestones & Progress</Label>
                    <p className="text-xs text-slate-400">Level ups and major milestones</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_milestones}
                  onCheckedChange={() => togglePreference('email_milestones')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  <div>
                    <Label className="text-white font-medium">Announcements</Label>
                    <p className="text-xs text-slate-400">Important updates from admins</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_announcements}
                  onCheckedChange={() => togglePreference('email_announcements')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <div>
                    <Label className="text-white font-medium">Reminders</Label>
                    <p className="text-xs text-slate-400">Activity and task reminders</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_reminders}
                  onCheckedChange={() => togglePreference('email_reminders')}
                />
              </div>

              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label className="text-white font-medium">Weekly Summary</Label>
                      <p className="text-xs text-slate-400">Your weekly progress report</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.email_weekly_summary}
                    onCheckedChange={() => togglePreference('email_weekly_summary')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg mt-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <Label className="text-white font-medium">Monthly Summary</Label>
                      <p className="text-xs text-slate-400">Your monthly achievements report</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.email_monthly_summary}
                    onCheckedChange={() => togglePreference('email_monthly_summary')}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleSave}
            disabled={savePreferencesMutation.isPending}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {savePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}