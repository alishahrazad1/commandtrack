import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkUploadDialog({ open, onClose, onSuccess, teams, departments }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const downloadTemplate = () => {
    const csv = [
      'email,role,team_name',
      'user@example.com,user,Sales Team',
      'admin@example.com,admin,',
      'member@example.com,user,Marketing Team'
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-bulk-upload-template.csv';
    a.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast.error('Please select a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsProcessing(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from CSV
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  role: { type: 'string' },
                  team_name: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === 'error') {
        toast.error('Failed to parse CSV: ' + extractResult.details);
        setIsProcessing(false);
        return;
      }

      const usersToInvite = extractResult.output.users || [];
      const inviteResults = [];

      // Process each user
      for (const userData of usersToInvite) {
        try {
          const email = userData.email?.trim();
          const role = userData.role?.trim() || 'user';
          const teamName = userData.team_name?.trim();

          if (!email) {
            inviteResults.push({ email: 'N/A', success: false, error: 'Missing email' });
            continue;
          }

          // Validate role
          if (!['user', 'admin'].includes(role)) {
            inviteResults.push({ email, success: false, error: `Invalid role: ${role}` });
            continue;
          }

          // Find team if specified
          let teamId = null;
          if (teamName) {
            const team = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
            if (!team) {
              inviteResults.push({ email, success: false, error: `Team not found: ${teamName}` });
              continue;
            }
            teamId = team.id;
          }

          // Invite user
          await base44.users.inviteUser(email, role);

          inviteResults.push({
            email,
            role,
            team: teamName || 'None',
            success: true
          });

        } catch (error) {
          inviteResults.push({
            email: userData.email || 'N/A',
            success: false,
            error: error.message || 'Failed to invite'
          });
        }
      }

      setResults(inviteResults);
      
      const successCount = inviteResults.filter(r => r.success).length;
      const failCount = inviteResults.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} invitation(s) sent successfully`);
        onSuccess();
      }
      if (failCount > 0) {
        toast.error(`${failCount} invitation(s) failed`);
      }

    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">
            Bulk Upload Users
          </DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Instructions:</h3>
              <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                <li>Download the CSV template below</li>
                <li>Fill in user email, role (user/admin), and team name (optional)</li>
                <li>Upload the completed CSV file</li>
                <li>Users will receive invitation emails</li>
                <li>Assign teams in the Team Members table after they accept</li>
              </ul>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Upload CSV File</label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="bg-slate-800 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
              />
              {file && (
                <p className="text-sm text-green-400 mt-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {file.name}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isProcessing}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{result.email}</p>
                      {result.success ? (
                        <p className="text-xs text-slate-400">
                          Role: {result.role} • Team: {result.team}
                        </p>
                      ) : (
                        <p className="text-xs text-red-400">{result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-cyan-500 hover:bg-cyan-600"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}