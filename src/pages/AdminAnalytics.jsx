import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, TrendingUp, Users, Target, AlertTriangle } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import UserProgressChart from "../components/analytics/UserProgressChart";
import PopularActivitiesChart from "../components/analytics/PopularActivitiesChart";
import PathCompletionChart from "../components/analytics/PathCompletionChart";
import StruggleAreasChart from "../components/analytics/StruggleAreasChart";
import AnalyticsExport from "../components/analytics/AnalyticsExport";

export default function AdminAnalytics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.ActivityPath.list(),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions'],
    queryFn: () => base44.entities.ActivityCompletion.list(),
  });

  // Redirect non-admins
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Card className="bg-slate-900 border-slate-700 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-4">You do not have permission to view this page.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-cyan-600 hover:bg-cyan-700">Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Calculate analytics metrics
  const calculateMetrics = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.total_xp > 0).length;
    const avgXP = users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.total_xp || 0), 0) / users.length) : 0;
    const avgCompletions = completions.length > 0 ? Math.round(completions.filter(c => c.status === 'completed').length / users.length) : 0;

    return { totalUsers, activeUsers, avgXP, avgCompletions };
  };

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Panel
            </Button>
          </Link>

          <div className="mb-6">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              ANALYTICS
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="bg-slate-900 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-cyan-400">{metrics.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-cyan-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-green-400">{metrics.activeUsers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg XP per User</p>
                <p className="text-3xl font-bold text-yellow-400">{metrics.avgXP.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Completions</p>
                <p className="text-3xl font-bold text-purple-400">{metrics.avgCompletions}</p>
              </div>
              <Target className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </Card>
        </motion.div>

        <Tabs defaultValue="progress" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="progress" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                User Progress
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <Target className="w-4 h-4 mr-2" />
                Popular Activities
              </TabsTrigger>
              <TabsTrigger value="paths" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <Target className="w-4 h-4 mr-2" />
                Path Completion
              </TabsTrigger>
              <TabsTrigger value="struggles" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Struggle Areas
              </TabsTrigger>
            </TabsList>
            <AnalyticsExport users={users} activities={activities} paths={paths} completions={completions} />
          </div>

          <TabsContent value="progress">
            <UserProgressChart users={users} completions={completions} />
          </TabsContent>

          <TabsContent value="activities">
            <PopularActivitiesChart activities={activities} completions={completions} />
          </TabsContent>

          <TabsContent value="paths">
            <PathCompletionChart paths={paths} activities={activities} completions={completions} users={users} />
          </TabsContent>

          <TabsContent value="struggles">
            <StruggleAreasChart activities={activities} completions={completions} users={users} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}