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

      // Score the call agenda using AI
      const scoringPrompt = `You are evaluating a sales call agenda for Force Management's Command of the Message training. 
      
Scoring Criteria:
${activity.scoring_criteria || `
- Clear objective and desired outcome
- Proper discovery questions
- Value proposition alignment
- Competitive differentiation
- Strong call to action
`}

Analyze the uploaded document and provide:
1. A score from 0-100
2. Brief feedback on strengths and areas for improvement

Be constructive and specific in your feedback.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: scoringPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" }
          }
        }
      });

      const score = Math.min(100, Math.max(0, aiResponse.score));
      const xpEarned = Math.round(activity.xp_value * (score / 100));

      // Get current user
      const user = await base44.auth.me();

      // Create completion record
      await base44.entities.ActivityCompletion.create({
        activity_id: activity.id,
        user_email: user.email,
        status: 'completed',
        score: score,
        notes: aiResponse.feedback,
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

      setResult({ score, feedback: aiResponse.feedback, xpEarned });
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

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h4 className="font-semibold text-cyan-400 mb-2">AI Feedback:</h4>
              <p className="text-slate-300 text-sm">{result.feedback}</p>
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