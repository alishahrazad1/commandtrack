import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Trophy, Target, Star, Mail, Check, Trash2, CheckCheck } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import moment from "moment";

const iconMap = {
  achievement: Trophy,
  milestone: Target,
  level_up: Star,
  badge_earned: Trophy,
  activity_completed: Check,
  announcement: Mail,
  reminder: Bell
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: user.email },
      '-created_date',
      100
    ),
    enabled: !!user?.email,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification deleted');
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const read = notifications.filter(n => n.is_read);
      await Promise.all(read.map(n => base44.entities.Notification.delete(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All read notifications deleted');
    },
  });

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 mb-2">
                NOTIFICATIONS
              </h1>
              <p className="text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={() => markAllAsReadMutation.mutate()}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
              )}
              {notifications.some(n => n.is_read) && (
                <Button
                  onClick={() => {
                    if (confirm('Delete all read notifications?')) {
                      deleteAllReadMutation.mutate();
                    }
                  }}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear read
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Read ({notifications.length - unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-3 mt-6">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-slate-900 border-slate-700 p-12 text-center">
                <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {filter === 'unread' ? 'No unread notifications' : 
                   filter === 'read' ? 'No read notifications' : 
                   'No notifications yet'}
                </p>
              </Card>
            ) : (
              filteredNotifications.map((notification, index) => {
                const Icon = iconMap[notification.type] || Bell;
                const isUnread = !notification.is_read;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`bg-slate-900 border-slate-700 p-5 ${
                      isUnread ? 'border-cyan-500/30 bg-cyan-500/5' : ''
                    }`}>
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-lg h-fit ${
                          notification.priority === 'high' ? 'bg-red-500/20' :
                          notification.priority === 'normal' ? 'bg-cyan-500/20' :
                          'bg-slate-800'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            notification.priority === 'high' ? 'text-red-400' :
                            notification.priority === 'normal' ? 'text-cyan-400' :
                            'text-slate-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className={`font-bold ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-slate-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-2">
                                {moment(notification.created_date).format('MMM D, YYYY [at] h:mm A')}
                                {' • '}
                                {moment(notification.created_date).fromNow()}
                              </p>
                            </div>
                            {isUnread && (
                              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1 ml-2" />
                            )}
                          </div>

                          <div className="flex gap-2 mt-3">
                            {isUnread && (
                              <Button
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                variant="outline"
                                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            {notification.action_url && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!notification.is_read) {
                                    markAsReadMutation.mutate(notification.id);
                                  }
                                  window.location.href = notification.action_url;
                                }}
                                className="bg-cyan-500 hover:bg-cyan-600 text-xs"
                              >
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}