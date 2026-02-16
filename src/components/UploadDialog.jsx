import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UploadDialog({ activity, open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file || !activity) return;

    setIsProcessing(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Score the call agenda using AI with coaching
      const scoringPrompt = `You are an expert sales coach evaluating a call agenda for Force Management's Command of the Message training. 

      Scoring Criteria:
      ${activity.scoring_criteria || `
      - Clear objective and desired outcome
      - Proper discovery questions aligned to customer's business issues
      - Value proposition that differentiates from competition
      - Competitive differentiation messaging
      - Strong, specific call to action with next steps
      `}

      Provide a comprehensive coaching evaluation:

      1. SCORE (0-100): Rate the overall quality

      2. STRENGTHS: Identify 2-3 specific things done well with examples from the submission

      3. AREAS FOR IMPROVEMENT: Provide 3-4 actionable, specific recommendations for enhancement

      4. COACHING TIPS: Share 2-3 best practices or examples of what a great agenda includes for Command of the Message (e.g., "Start with a compelling business issue: 'I noticed companies in your industry struggle with X, which costs Y...'")

      5. NEXT STEPS: Suggest 1-2 immediate actions they can take to improve their next agenda

      Be specific, actionable, and encouraging. Reference actual content from their submission when giving feedback.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: scoringPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            strengths: { type: "string" },
            areas_for_improvement: { type: "string" },
            coaching_tips: { type: "string" },
            next_steps: { type: "string" }
          }
        }
      });

      const score = Math.min(100, Math.max(0, aiResponse.score));
      const xpEarned = Math.round(activity.xp_value * (score / 100));

      // Compile comprehensive feedback
      const fullFeedback = `STRENGTHS:\n${aiResponse.strengths}\n\nAREAS FOR IMPROVEMENT:\n${aiResponse.areas_for_improvement}\n\nCOACHING TIPS:\n${aiResponse.coaching_tips}\n\nNEXT STEPS:\n${aiResponse.next_steps}`;

      // Get current user
      const user = await base44.auth.me();

      // Create completion record
      await base44.entities.ActivityCompletion.create({
        activity_id: activity.id,
        user_email: user.email,
        status: 'completed',
        score: score,
        notes: fullFeedback,
        file_url: file_url,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString()
      });

      // Update user XP
      const newTotalXP = (user.total_xp || 0) + xpEarned;
      const newLevel = Math.floor(newTotalXP / 500) + 1;
      await base44.auth.updateMe({
        total_xp: newTotalXP,
        level: newLevel
      });

      setResult({ 
        score, 
        strengths: aiResponse.strengths,
        areas_for_improvement: aiResponse.areas_for_improvement,
        coaching_tips: aiResponse.coaching_tips,
        next_steps: aiResponse.next_steps,
        xpEarned 
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      alert('Failed to process upload. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setNotes('');
    setResult(null);
    onClose();
    if (result) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">
            {result ? 'Quest Complete!' : 'Upload Call Agenda'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {result ? 'Your submission has been scored' : activity?.title}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="file" className="text-slate-300">Call Agenda File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="bg-slate-800 border-slate-700 text-white mt-2"
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-slate-300">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your submission..."
                className="bg-slate-800 border-slate-700 text-white mt-2"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!file || isProcessing}
              className="w-full bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-600 hover:to-magenta-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing & Scoring...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit & Score
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center p-8 bg-slate-800 rounded-lg border border-cyan-500/30">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-4xl font-bold text-cyan-400 mb-2">{result.score}/100</p>
              <p className="text-xl font-bold text-orange-400">+{result.xpEarned} XP Earned!</p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                <h4 className="font-semibold text-green-400 mb-2">💪 Strengths</h4>
                <p className="text-slate-300 text-sm whitespace-pre-line">{result.strengths}</p>
              </div>

              <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-500/30">
                <h4 className="font-semibold text-orange-400 mb-2">🎯 Areas for Improvement</h4>
                <p className="text-slate-300 text-sm whitespace-pre-line">{result.areas_for_improvement}</p>
              </div>

              <div className="bg-cyan-900/30 rounded-lg p-4 border border-cyan-500/30">
                <h4 className="font-semibold text-cyan-400 mb-2">🏆 Coaching Tips</h4>
                <p className="text-slate-300 text-sm whitespace-pre-line">{result.coaching_tips}</p>
              </div>

              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                <h4 className="font-semibold text-purple-400 mb-2">⚡ Next Steps</h4>
                <p className="text-slate-300 text-sm whitespace-pre-line">{result.next_steps}</p>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-600 hover:to-magenta-600"
            >
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}