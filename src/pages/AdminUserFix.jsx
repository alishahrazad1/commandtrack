import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "../utils";

export default function AdminUserFix() {
  const [userId, setUserId] = useState('69915dcde39e5510242c4dfc');
  const [newXP, setNewXP] = useState(400);
  const [newLevel, setNewLevel] = useState(1);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: userId });
      return users[0];
    },
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.User.update(userId, {
        total_xp: newXP,
        level: newLevel
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      alert('User updated successfully!');
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to={createPageUrl('AdminDashboard')}>
          <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-cyan-400">Fix User XP</h1>

        <Card className="bg-slate-900 border-slate-700 p-6 space-y-4">
          {user && (
            <div className="bg-slate-800 p-4 rounded-lg mb-4">
              <p className="text-sm text-slate-400">Current User</p>
              <p className="text-lg font-bold text-white">{user.full_name}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
              <p className="text-cyan-400 mt-2">Current XP: {user.total_xp || 0}</p>
              <p className="text-cyan-400">Current Level: {user.level || 1}</p>
            </div>
          )}

          <div>
            <Label className="text-slate-300">User ID</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mt-2"
            />
          </div>

          <div>
            <Label className="text-slate-300">New Total XP</Label>
            <Input
              type="number"
              value={newXP}
              onChange={(e) => setNewXP(parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white mt-2"
            />
          </div>

          <div>
            <Label className="text-slate-300">New Level</Label>
            <Input
              type="number"
              value={newLevel}
              onChange={(e) => setNewLevel(parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white mt-2"
            />
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update User'}
          </Button>
        </Card>
      </div>
    </div>
  );
}