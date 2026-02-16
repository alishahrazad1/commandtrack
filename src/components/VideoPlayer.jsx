import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

export default function VideoPlayer({ activity, open, onClose, onComplete }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setHasWatched(true);
  };

  const handleComplete = () => {
    onComplete(activity);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">
            {activity?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {activity?.description && (
            <p className="text-sm text-slate-400">{activity.description}</p>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={activity?.video_url}
              className="w-full aspect-video"
              onEnded={handleVideoEnd}
              onClick={handlePlayPause}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handlePlayPause}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={handleMute}
                  className="bg-slate-700/50 hover:bg-slate-700"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={handleFullscreen}
                  className="bg-slate-700/50 hover:bg-slate-700"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Close
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!hasWatched}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-600 hover:to-magenta-600"
            >
              {hasWatched ? 'Mark Complete & Claim XP' : 'Watch to Complete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}