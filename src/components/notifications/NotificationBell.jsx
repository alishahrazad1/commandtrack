import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, Settings, Trophy, Target, Star, Zap, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
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

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: user.email },
      '-created_date',
      50
    ),
    enabled: !!user?.email,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

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

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
      setOpen(false);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative text-slate-400 hover:text-cyan-400">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-slate-900 border-slate-700 text-white p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="font-bold text-cyan-400">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-slate-400 hover:text-cyan-400"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Link to={createPageUrl('NotificationSettings')}>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-cyan-400">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <ScrollArea className="h-96">
          <AnimatePresence>
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentNotifications.map((notification) => {
                  const Icon = iconMap[notification.type] || Bell;
                  const isUnread = !notification.is_read;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isUnread ? 'bg-cyan-500/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg h-fit ${
                          notification.priority === 'high' ? 'bg-red-500/20' :
                          notification.priority === 'normal' ? 'bg-cyan-500/20' :
                          'bg-slate-700'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            notification.priority === 'high' ? 'text-red-400' :
                            notification.priority === 'normal' ? 'text-cyan-400' :
                            'text-slate-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                              {notification.title}
                            </p>
                            {isUnread && (
                              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {moment(notification.created_date).fromNow()}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          className="text-slate-500 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {notifications.length > 5 && (
          <div className="p-3 border-t border-slate-700">
            <Link to={createPageUrl('Notifications')}>
              <Button
                variant="ghost"
                className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}