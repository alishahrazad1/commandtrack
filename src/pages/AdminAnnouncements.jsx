import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Mail, Bell, Users, Building2 } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
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

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      let recipients = [];
      
      if (recipientType === 'all') {
        recipients = users.map(u => u.email);
      } else if (recipientType === 'team') {
        recipients = users.filter(u => u.team_id === selectedTeam).map(u => u.email);
      } else if (recipientType === 'department') {
        recipients = users.filter(u => u.department_id === selectedDept).map(u => u.email);
      }

      const notifications = recipients.map(email => ({
        user_email: email,
        type: 'announcement',
        title: data.title,
        message: data.message,
        priority: data.priority,
        icon: 'mail'
      }));

      await base44.entities.Notification.bulkCreate(notifications);

      if (sendEmail) {
        await Promise.all(
          recipients.map(email => 
            base44.integrations.Core.SendEmail({
              to: email,
              subject: `📢 Announcement: ${data.title}`,
              body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #06b6d4;">${data.title}</h2>
                  <p style="color: #64748b; margin: 20px 0;">${data.message}</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                  <p style="color: #94a3b8; font-size: 12px;">
                    This is an automated message from Command of the Message Training Tracker.
                  </p>
                </div>
              `
            })
          )
        );
      }

      return { recipients: recipients.length };
    },
    onSuccess: (data) => {
      toast.success(`Announcement sent to ${data.recipients} user${data.recipients > 1 ? 's' : ''}`);
      setTitle('');
      setMessage('');
      setPriority('normal');
      setRecipientType('all');
      setSendEmail(false);
      queryClient.invalidateQueries(['notifications']);
    },
    onError: () => {
      toast.error('Failed to send announcement');
    },
  });

  const handleSend = () => {
    if (!title || !message) {
      toast.error('Please fill in title and message');
      return;
    }

    if (recipientType === 'team' && !selectedTeam) {
      toast.error('Please select a team');
      return;
    }

    if (recipientType === 'department' && !selectedDept) {
      toast.error('Please select a department');
      return;
    }

    sendAnnouncementMutation.mutate({ title, message, priority });
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>

          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            SEND ANNOUNCEMENT
          </h1>
          <p className="text-slate-400">Broadcast important messages to users</p>
        </motion.div>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <div className="space-y-6">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Announcement Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., New Training Module Available"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Message *</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your announcement message..."
                rows={6}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Send To *</label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        All Users
                      </div>
                    </SelectItem>
                    <SelectItem value="department">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Specific Department
                      </div>
                    </SelectItem>
                    <SelectItem value="team">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Specific Team
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {recipientType === 'team' && (
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Select Team *</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {recipientType === 'department' && (
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Select Department *</label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="sendEmail" className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <Mail className="w-4 h-4 text-cyan-400" />
                Also send as email notification
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSend}
                disabled={!title || !message || sendAnnouncementMutation.isPending}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendAnnouncementMutation.isPending ? 'Sending...' : 'Send Announcement'}
              </Button>
            </div>

            <div className="text-xs text-slate-500 text-center">
              <Bell className="w-4 h-4 inline mr-1" />
              Recipients will receive this as an in-app notification
              {sendEmail && ' and via email'}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}