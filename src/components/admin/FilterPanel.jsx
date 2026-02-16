import React from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function FilterPanel({ filters, onFilterChange, users, departments = [], teams = [] }) {
  const deptNames = departments.map(d => d.name);
  const teamNames = teams.map(t => t.name);

  return (
    <Card className="bg-slate-900 border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-5 h-5 text-cyan-400" />
        <h3 className="font-semibold text-white">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Department</label>
          <Select value={filters.department} onValueChange={(v) => onFilterChange({ ...filters, department: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Team</label>
          <Select value={filters.team} onValueChange={(v) => onFilterChange({ ...filters, team: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}