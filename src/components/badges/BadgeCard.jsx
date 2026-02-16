import React from 'react';
import { Trophy, Star, Target, Zap, Award, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  Trophy, Star, Target, Zap, Award, Flame
};

export default function BadgeCard({ badge, earned, small = false }) {
  const Icon = iconMap[badge.icon] || Award;
  const isEarned = !!earned;

  if (small) {
    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
          isEarned 
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50' 
            : 'bg-slate-800 border-2 border-slate-700'
        }`}
        title={badge.name}
      >
        <Icon className={`w-6 h-6 ${isEarned ? 'text-white' : 'text-slate-600'}`} />
        {!isEarned && (
          <div className="absolute inset-0 bg-slate-900/50 rounded-full backdrop-blur-[1px]" />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative overflow-hidden rounded-xl p-4 ${
        isEarned
          ? 'bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500/50'
          : 'bg-slate-800/50 border-2 border-slate-700'
      }`}
    >
      {isEarned && (
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      )}
      <div className="relative flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isEarned
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50'
              : 'bg-slate-700'
          }`}
        >
          <Icon className={`w-8 h-8 ${isEarned ? 'text-white' : 'text-slate-500'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${isEarned ? 'text-yellow-400' : 'text-slate-500'}`}>
            {badge.name}
          </h3>
          <p className={`text-sm ${isEarned ? 'text-slate-300' : 'text-slate-600'}`}>
            {badge.description}
          </p>
          {earned && (
            <p className="text-xs text-yellow-500 mt-1">
              Earned {new Date(earned.earned_at).toLocaleDateString()}
            </p>
          )}
        </div>
        {!isEarned && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] rounded-xl" />
        )}
      </div>
    </motion.div>
  );
}