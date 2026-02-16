import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Home, Trophy, Users, Settings, LogOut, BarChart3, Megaphone } from "lucide-react";
import NotificationBell from "./components/notifications/NotificationBell";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdmin = user?.role === 'admin';
  const isTeamLead = user?.role === 'team_lead' || user?.role === 'department_head';

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-cyan-400" />
                <span className="text-white font-bold text-lg">Command Tracker</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-2">
                <Link to={createPageUrl('Dashboard')}>
                  <Button
                    variant="ghost"
                    className={currentPageName === 'Dashboard' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl('Leaderboard')}>
                  <Button
                    variant="ghost"
                    className={currentPageName === 'Leaderboard' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </Button>
                </Link>
                <Link to={createPageUrl('Profile')}>
                  <Button
                    variant="ghost"
                    className={currentPageName === 'Profile' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                {(isAdmin || isTeamLead) && (
                  <>
                    <Link to={createPageUrl(isAdmin ? 'AdminDashboard' : 'TeamLeadDashboard')}>
                      <Button
                        variant="ghost"
                        className="text-orange-400 hover:text-orange-300"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        {isAdmin ? 'Admin' : 'Team Lead'}
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link to={createPageUrl('AdminAnnouncements')}>
                        <Button
                          variant="ghost"
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <Megaphone className="w-4 h-4 mr-2" />
                          Announcements
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && <NotificationBell user={user} />}
              {user && (
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-slate-400">Level {user.level || 1}</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: user.avatar_color || '#06b6d4' }}
                  >
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}