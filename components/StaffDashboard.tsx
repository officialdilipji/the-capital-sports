'use client';

import React, { useState } from 'react';
import { 
  ClipboardList, 
  Droplets, 
  Trash2, 
  Plus, 
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Database, MaintenanceLog, Staff } from '@/lib/types';

export default function StaffDashboard({ db, onUpdate, currentUser }: { db: Database, onUpdate: () => void, currentUser: Staff }) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return dateStr;
    }
  };

  const addLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      staffId: currentUser.id || 's1', // Use logged in staff ID
      date: new Date().toISOString(),
      chemicalLevels: formData.get('chemicalLevels'),
      cleaningStatus: formData.get('cleaningStatus'),
      repairs: formData.get('repairs'),
    };

    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'addMaintenance', data })
      });
      onUpdate();
      setShowLogForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Operations & Maintenance</h2>
          <p className="text-slate-500">Manage pool health and facility schedules.</p>
        </div>
        <button 
          onClick={() => setShowLogForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          New Log Entry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Maintenance Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList size={20} className="text-blue-600" />
                Recent Maintenance Logs
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {db.maintenanceLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  No logs recorded yet.
                </div>
              ) : (
                db.maintenanceLogs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-slate-900">{formatDate(log.date)}</p>
                        <p className="text-xs text-slate-500">Recorded by: {db.staff.find(s => s.id === log.staffId)?.name}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">Verified</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Chemicals</p>
                        <p className="text-sm font-medium text-slate-700">{log.chemicalLevels}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cleaning</p>
                        <p className="text-sm font-medium text-slate-700">{log.cleaningStatus}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Repairs</p>
                        <p className="text-sm font-medium text-slate-700">{log.repairs || 'None'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Staff & Shifts */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Staff Availability
            </h3>
            <div className="space-y-4">
              {db.staff.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-blue-600 border border-slate-100">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md uppercase">On Duty</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              Shift Handover
            </h3>
            <p className="text-sm text-slate-400 mb-6">Record cashflow and member count for the next shift.</p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span>Today&apos;s Check-ins</span>
                <span className="font-bold">
                  {db.attendance?.filter(a => a.date === new Date().toISOString().split('T')[0]).length || 0} Members
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cash Collected</span>
                <span className="font-bold">
                  ₹{(db.payments || []).filter(p => {
                    const isToday = p.date.startsWith(new Date().toISOString().split('T')[0]);
                    const memberExists = db.members.some(m => m.id === p.memberId);
                    const guestExists = db.guests.some(g => g.id === p.memberId);
                    return isToday && (memberExists || guestExists);
                  }).reduce((acc, p) => {
                    const amt = Number(p.amount);
                    return acc + (isNaN(amt) || amt < 0 ? 0 : amt);
                  }, 0)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => alert('Handover recorded successfully!')}
              className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold transition-all border border-white/10"
            >
              Complete Handover
            </button>
          </div>
        </div>
      </div>

      {/* Log Form Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Maintenance Entry</h3>
            <form onSubmit={addLog} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Chemical Levels (pH/Chlorine)</label>
                <input name="chemicalLevels" required className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. pH 7.2, Cl 1.5ppm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cleaning Status</label>
                <select name="cleaningStatus" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Completed</option>
                  <option>In Progress</option>
                  <option>Needs Attention</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Repairs/Notes</label>
                <textarea name="repairs" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Any issues found?" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowLogForm(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
