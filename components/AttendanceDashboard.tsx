'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CheckCircle2, 
  LogOut, 
  LogIn,
  Calendar,
  History,
  AlertCircle,
  X
} from 'lucide-react';
import { Database, Member, Attendance } from '@/lib/types';
import MembershipCard from './MembershipCard';

const getISTDateString = (date: Date) => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    return `${y}-${m}-${d}`;
  } catch (e) {
    // Fallback
    return date.toISOString().split('T')[0];
  }
};

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  try {
    const todayIST = getISTDateString(new Date());
    
    // Normalize input dateStr
    let inputDateIST = dateStr;
    if (dateStr.includes('T')) {
      inputDateIST = dateStr.split('T')[0];
    }
    
    // If it's already in YYYY-MM-DD format, we can try to parse it to be sure
    const parsed = new Date(inputDateIST);
    if (!isNaN(parsed.getTime())) {
      inputDateIST = getISTDateString(parsed);
    }

    // Final comparison of YYYY-MM-DD strings
    const normalize = (s: string) => {
      const parts = s.split(/[-/]/);
      if (parts.length === 3) {
        // Handle both YYYY-MM-DD and DD-MM-YYYY
        const y = parts[0].length === 4 ? parts[0] : parts[2];
        const m = parts[1].padStart(2, '0');
        const d = (parts[0].length === 4 ? parts[2] : parts[0]).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return s;
    };

    return normalize(inputDateIST) === normalize(todayIST);
  } catch {
    return false;
  }
};

export default function AttendanceDashboard({ db, member, onUpdate }: { db: Database, member: Member, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [popMessage, setPopMessage] = useState<{title: string, message: string, type: 'success' | 'error'} | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<'none' | 'checking-in' | 'checked-in' | 'checking-out' | 'checked-out'>('none');

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

  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr === '-') return '-';
    try {
      if (timeStr.includes(':') && !timeStr.includes('T')) return timeStr;
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }) + ' IST';
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    if (!member) return;
    const allAttendanceRaw = db.attendance || [];
    const todayRecords = allAttendanceRaw.filter(a => a.memberId === member.id && isToday(a.date));
    
    // Use the same logic as in the component body for consistency
    const activeAttendance = todayRecords.find(a => a.status === 'In') || 
      allAttendanceRaw.filter(a => a.memberId === member.id && a.status === 'In')
        .sort((a, b) => {
          try {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } catch {
            return 0;
          }
        })[0];

    const hasCheckedOutToday = todayRecords.some(a => a.status === 'Out');

    if (optimisticStatus === 'checked-in' && activeAttendance) {
      setOptimisticStatus('none');
    } else if (optimisticStatus === 'checked-out' && hasCheckedOutToday) {
      setOptimisticStatus('none');
    }
  }, [db, member, optimisticStatus]);

  if (!member) return null;

  // Find any attendance for today
  const allAttendanceRaw = db.attendance || [];
  const todayRecords = allAttendanceRaw.filter(a => a.memberId === member.id && isToday(a.date));
  
  // Find active attendance (status 'In')
  // First try today's records, then fallback to any 'In' record as a safety measure
  const activeAttendance = todayRecords.find(a => a.status === 'In') || 
    allAttendanceRaw.filter(a => a.memberId === member.id && a.status === 'In')
      .sort((a, b) => {
        try {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } catch {
          return 0;
        }
      })[0];

  const hasCheckedOutToday = todayRecords.some(a => a.status === 'Out');

  // Determine current status including optimistic updates
  const getStatus = () => {
    if (optimisticStatus === 'checking-in') return 'checking-in';
    if (optimisticStatus === 'checking-out') return 'checking-out';
    if (optimisticStatus === 'checked-in' || activeAttendance) return 'checked-in';
    if (optimisticStatus === 'checked-out' || hasCheckedOutToday) return 'checked-out';
    return 'none';
  };

  const status = getStatus();
  
  const allAttendance = allAttendanceRaw.filter(a => a.memberId === member.id).sort((a, b) => {
    try {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } catch {
      return b.date.localeCompare(a.date);
    }
  });

  const handleCheckIn = async () => {
    if (status !== 'none') return;
    setLoading(true);
    setOptimisticStatus('checking-in');
    
    // Immediate pop message
    setPopMessage({
      title: 'Checking In...',
      message: 'Please wait while we record your entry.',
      type: 'success'
    });

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkIn',
          memberId: member.id,
          memberName: member.name,
          slot: member.timingSlot
        }),
      });
      if (res.ok) {
        setOptimisticStatus('checked-in');
        setPopMessage({
          title: 'Check-In Successful!',
          message: `Welcome, ${member.name}! Your entry has been recorded.`,
          type: 'success'
        });
        onUpdate();
      } else {
        throw new Error('Failed to check in');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setPopMessage({
        title: 'Check-In Failed',
        message: 'There was an error recording your attendance. Please try again.',
        type: 'error'
      });
      setOptimisticStatus('none');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeAttendance || status === 'checked-out') return;
    setLoading(true);
    setOptimisticStatus('checking-out');

    // Immediate pop message
    setPopMessage({
      title: 'Checking Out...',
      message: 'Please wait while we record your departure.',
      type: 'success'
    });

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkOut',
          id: activeAttendance.id
        }),
      });
      if (res.ok) {
        setOptimisticStatus('checked-out');
        setPopMessage({
          title: 'Check-Out Successful!',
          message: `Goodbye, ${member.name}! Your departure has been recorded.`,
          type: 'success'
        });
        onUpdate();
      } else {
        throw new Error('Failed to check out');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      setPopMessage({
        title: 'Check-Out Failed',
        message: 'There was an error recording your departure. Please try again.',
        type: 'error'
      });
      setOptimisticStatus('checked-in');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = new Date(member.expiryDate) < new Date();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card & Status */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Member Info</h3>
          <MembershipCard member={member} />
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-blue-600" />
              Membership Status
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Status</span>
                <span className={`font-bold ${member.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {member.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Timing Slot</span>
                <span className="font-bold text-slate-900">{member.timingSlot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Expiry Date</span>
                <span className={`font-bold ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatDate(member.expiryDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Control */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Capture Attendance
              </h3>
            </div>
            <div className="p-12 text-center relative">
              <AnimatePresence>
                {popMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                  >
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative">
                      <button 
                        onClick={() => setPopMessage(null)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                      
                      <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
                        popMessage.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {popMessage.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                      </div>
                      
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{popMessage.title}</h4>
                      <p className="text-slate-500 mb-6">{popMessage.message}</p>
                      
                      <button 
                        onClick={() => setPopMessage(null)}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${
                          popMessage.type === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {member.status !== 'Active' ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl mb-4 flex items-center gap-3 text-left">
                    <AlertCircle size={24} className="shrink-0" />
                    <p className="text-sm font-medium">Your membership is currently pending approval. Please contact the receptionist to activate your account.</p>
                  </div>
                </div>
              ) : isExpired ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-4 flex items-center gap-3 text-left">
                    <AlertCircle size={24} className="shrink-0" />
                    <p className="text-sm font-medium">Your membership has expired. Please renew your membership to continue using the facility.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    {/* Check In Button */}
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-full ${status !== 'none' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                        <LogIn size={32} />
                      </div>
                      <button
                        onClick={handleCheckIn}
                        disabled={loading || status !== 'none'}
                        className={`px-8 py-3 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center gap-2 ${
                          status !== 'none'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                        }`}
                      >
                        {status === 'checking-in' ? 'Checking In...' : (status === 'none' ? 'Check In' : 'Checked In')}
                      </button>
                      {status !== 'none' && (
                        <p className="text-xs text-slate-400 font-medium">Recorded for today</p>
                      )}
                    </div>

                    {/* Divider for desktop */}
                    <div className="hidden md:block h-12 w-px bg-slate-100"></div>

                    {/* Check Out Button */}
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-full ${status !== 'checked-in' ? 'bg-slate-100 text-slate-400' : 'bg-red-100 text-red-600'}`}>
                        <LogOut size={32} />
                      </div>
                      <button
                        onClick={handleCheckOut}
                        disabled={loading || status !== 'checked-in'}
                        className={`px-8 py-3 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center gap-2 ${
                          status !== 'checked-in'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                        }`}
                      >
                        {status === 'checking-out' ? 'Checking Out...' : (status === 'checked-out' ? 'Checked Out' : 'Check Out')}
                      </button>
                      {status === 'checked-in' && activeAttendance && (
                        <p className="text-xs text-emerald-600 font-medium italic">Active since {formatTime(activeAttendance.checkIn)}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="max-w-md mx-auto">
                    {status === 'checked-in' ? (
                      <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 text-sm font-medium">
                        You are currently checked in. Don&apos;t forget to check out when you leave!
                      </div>
                    ) : status === 'checked-out' ? (
                      <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-medium">
                        Your attendance for today is complete. See you tomorrow!
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 text-sm font-medium">
                        Please record your attendance when you arrive at the pool.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-blue-600" />
                Your Attendance History
              </h3>
            </div>
            <div className="overflow-x-auto">
              {allAttendance.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Slot</th>
                      <th className="px-6 py-4 font-bold">In</th>
                      <th className="px-6 py-4 font-bold">Out</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatDate(record.date)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{record.slot}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatTime(record.checkIn)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{record.checkOut ? formatTime(record.checkOut) : '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                            record.status === 'In' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  No attendance records found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
