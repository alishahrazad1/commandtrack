import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

export default function AnalyticsExport({ users, activities, paths, completions }) {
  const exportToCSV = () => {
    const userProgressData = users.map(u => ({
      'User Name': u.full_name || '',
      'Email': u.email,
      'Level': u.level || 1,
      'Total XP': u.total_xp || 0,
      'Activities Completed': completions.filter(c => c.user_email === u.email && c.status === 'completed').length,
      'Avg Score': Math.round(
        completions
          .filter(c => c.user_email === u.email && c.score)
          .reduce((sum, c) => sum + c.score, 0) / 
        (completions.filter(c => c.user_email === u.email && c.score).length || 1)
      )
    }));

    const activityStatsData = activities.map(a => {
      const actCompletions = completions.filter(c => c.activity_id === a.id);
      const completedCount = actCompletions.filter(c => c.status === 'completed').length;
      const avgScore = actCompletions.filter(c => c.score)
        .reduce((sum, c) => sum + c.score, 0) / (actCompletions.filter(c => c.score).length || 1);

      return {
        'Activity': a.title,
        'Type': a.activity_type,
        'Total Attempts': actCompletions.length,
        'Completions': completedCount,
        'Completion Rate': actCompletions.length > 0 ? Math.round((completedCount / actCompletions.length) * 100) + '%' : '0%',
        'Avg Score': Math.round(avgScore) || 'N/A',
        'XP Value': a.xp_value || 0
      };
    });

    const headers = (data) => Object.keys(data[0]);
    const csvContent = (data, name) => {
      const h = headers(data);
      const rows = data.map(row => h.map(header => JSON.stringify(row[header] || '')).join(','));
      return [name, h.join(','), ...rows].join('\n');
    };

    const allCSV = [
      csvContent(userProgressData, 'USER PROGRESS'),
      csvContent(activityStatsData, 'ACTIVITY STATS')
    ].join('\n\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(allCSV));
    element.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Button
      onClick={exportToCSV}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Download className="w-4 h-4 mr-2" />
      Export Analytics
    </Button>
  );
}