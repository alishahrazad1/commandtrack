import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Upload, Users, BookOpen, MessageSquare, Zap } from "lucide-react";
import { motion } from "framer-motion";

const activityIcons = {
  training_module: BookOpen,
  roleplay: Users,
  manager_checkin: MessageSquare,
  call_agenda_upload: Upload
};

const activityColors = {
  training_module: "text-cyan-400",
  roleplay: "text-magenta-400",
  manager_checkin: "text-orange-400",
  call_agenda_upload: "text-purple-400"
};

export default function ActivityCard({ activity, completion, onComplete, onUpload }) {
  const isCompleted = completion?.status === 'completed';
  const Icon = activityIcons[activity.activity_type] || Circle;
  const colorClass = activityColors[activity.activity_type] || "text-slate-400";

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
                <h3 className={`font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                  {activity.title}
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {activity.xp_value} XP
                </Badge>
              </div>

              <p className="text-sm text-slate-400 mb-4">{activity.description}</p>

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

              {!isCompleted && (
                <div className="flex gap-2">
                  {activity.activity_type === 'call_agenda_upload' ? (
                    <Button 
                      onClick={() => onUpload(activity)}
                      className="bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-600 hover:to-magenta-600 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Score
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => onComplete(activity)}
                      className="bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-600 hover:to-magenta-600 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              )}

              {isCompleted && (
                <div className="flex items-center gap-2 text-sm text-green-400">
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