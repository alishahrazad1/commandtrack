import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Upload, Users, BookOpen, MessageSquare, Zap, Lock, Clock, Video } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const activityIcons = {
  training_module: BookOpen,
  roleplay: Users,
  manager_checkin: MessageSquare,
  call_agenda_upload: Upload,
  microlearning_video: Video
};

const activityColors = {
  training_module: "text-cyan-400",
  roleplay: "text-magenta-400",
  manager_checkin: "text-orange-400",
  call_agenda_upload: "text-purple-400",
  microlearning_video: "text-green-400"
};

export default function ActivityCard({ activity, completion, onComplete, onUpload, onWatchVideo, isLocked = false }) {
  const isCompleted = completion?.status === 'completed';
  const Icon = activityIcons[activity.activity_type] || Circle;
  const colorClass = activityColors[activity.activity_type] || "text-slate-400";

  const now = new Date();
  const startDate = activity.start_date ? new Date(activity.start_date) : null;
  const endDate = activity.end_date ? new Date(activity.end_date) : null;
  
  const isScheduled = startDate || endDate;
  const isUpcoming = startDate && now < startDate;
  const isExpired = endDate && now > endDate;
  const isAvailable = !isUpcoming && !isExpired && !isLocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden border transition-all ${
        isCompleted 
          ? 'bg-slate-800/50 border-green-500/30' 
          : isLocked || isUpcoming || isExpired
          ? 'bg-slate-900/50 border-slate-700 opacity-75'
          : 'bg-slate-900 border-slate-700 hover:border-cyan-500/50'
      }`}>
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="relative p-5">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              isCompleted ? 'bg-green-500/20 border-green-500/30' : 'bg-slate-800 border-slate-700'
            } border`}>
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <Icon className={`w-6 h-6 ${colorClass}`} />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className={`font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {activity.title}
                  </h3>
                  {(isLocked || isScheduled) && (
                    <div className="flex gap-2 mt-1">
                      {isLocked && (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                      {!isLocked && isUpcoming && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Upcoming
                        </Badge>
                      )}
                      {!isLocked && isExpired && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Lock className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {activity.xp_value} XP
                </Badge>
              </div>

              <div 
                className="text-sm text-slate-400 mb-4 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_strong]:font-bold [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: activity.description || '' }}
              />

              {isScheduled && (
                <div className="text-xs text-slate-500 mb-3">
                  {startDate && <div>Available: {format(startDate, 'MMM d, yyyy h:mm a')}</div>}
                  {endDate && <div>Expires: {format(endDate, 'MMM d, yyyy h:mm a')}</div>}
                </div>
              )}

              {completion?.score && (
                <div className="mb-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">SCORE</span>
                    <span className="text-lg font-bold text-cyan-400">{completion.score}/100</span>
                  </div>
                  {completion.notes && (
                    <p className="text-xs text-slate-500 mt-2">{completion.notes}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {isAvailable && activity.activity_type === 'call_agenda_upload' ? (
                  <Button 
                    onClick={() => onUpload(activity)}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isCompleted ? 'Upload Again' : 'Upload & Score'}
                  </Button>
                ) : isAvailable && activity.activity_type === 'microlearning_video' ? (
                  <Button 
                    onClick={() => onWatchVideo(activity)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {isCompleted ? 'Watch Again' : 'Watch Video'}
                  </Button>
                ) : isAvailable ? (
                  <Button 
                    onClick={() => onComplete(activity)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isCompleted ? 'Complete Again' : 'Mark Complete'}
                  </Button>
                ) : isLocked ? (
                  <Button disabled className="bg-slate-700 text-slate-400 cursor-not-allowed">
                    <Lock className="w-4 h-4 mr-2" />
                    Complete Previous Activity
                  </Button>
                ) : isUpcoming ? (
                  <Button disabled className="bg-slate-700 text-slate-400 cursor-not-allowed">
                    <Clock className="w-4 h-4 mr-2" />
                    Not Available Yet
                  </Button>
                ) : isExpired ? (
                  <Button disabled className="bg-slate-700 text-slate-400 cursor-not-allowed">
                    <Lock className="w-4 h-4 mr-2" />
                    Activity Expired
                  </Button>
                ) : null}
              </div>

              {isCompleted && (
                <div className="flex items-center gap-2 text-sm text-green-400 mt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Quest Complete! +{completion.xp_earned} XP</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}