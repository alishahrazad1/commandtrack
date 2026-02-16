import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

export default function BulkCompletionDialog({ open, onClose, onConfirm, selectedActivities, users, departments, teams }) {
  const [selectionType, setSelectionType] = useState('user');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const handleConfirm = () => {
    let targetUsers = [];
    
    if (selectionType === 'user' && selectedUser) {
      targetUsers = [users.find(u => u.id === selectedUser)];
    } else if (selectionType === 'team' && selectedTeam) {
      targetUsers = users.filter(u => u.team_id === selectedTeam);
    } else if (selectionType === 'department' && selectedDepartment) {
      targetUsers = users.filter(u => u.department_id === selectedDepartment);
    }

    if (targetUsers.length === 0) {
      alert('Please select a valid target');
      return;
    }

    onConfirm(targetUsers);
  };

  const getTargetCount = () => {
    if (selectionType === 'user') return selectedUser ? 1 : 0;
    if (selectionType === 'team' && selectedTeam) {
      return users.filter(u => u.team_id === selectedTeam).length;
    }
    if (selectionType === 'department' && selectedDepartment) {
      return users.filter(u => u.department_id === selectedDepartment).length;
    }
    return 0;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            Mark Activities Complete
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              Selected Activities: <span className="font-bold text-cyan-400">{selectedActivities.length}</span>
            </p>
          </div>

          <div>
            <Label className="text-slate-300">Mark Complete For</Label>
            <Select value={selectionType} onValueChange={setSelectionType}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="user">Individual User</SelectItem>
                <SelectItem value="team">Entire Team</SelectItem>
                <SelectItem value="department">Entire Department</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectionType === 'user' && (
            <div>
              <Label className="text-slate-300">Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectionType === 'team' && (
            <div>
              <Label className="text-slate-300">Select Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectionType === 'department' && (
            <div>
              <Label className="text-slate-300">Select Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-2">
                  <SelectValue placeholder="Choose a department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {getTargetCount() > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-sm text-cyan-400">
                This will create <span className="font-bold">{selectedActivities.length * getTargetCount()}</span> completions
                ({selectedActivities.length} activities × {getTargetCount()} users)
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={getTargetCount() === 0}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600"
            >
              Mark Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}