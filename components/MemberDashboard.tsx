'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  History, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Database, Member } from '@/lib/types';
import MembershipCard from './MembershipCard';
import { downloadCardAsPDF, printCard } from '@/lib/cardUtils';

export default function MemberDashboard({ db, member }: { db: Database, member: Member }) {
  if (!member) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card & Status */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Your Digital ID</h3>
          <div className="space-y-4">
            <MembershipCard member={member} />
            <div className="flex gap-3">
              <button 
                onClick={() => printCard(`member-card-${member.id}`)}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                Print Card
              </button>
              <button 
                onClick={() => downloadCardAsPDF(`member-card-${member.id}`, member.name)}
                className="flex-1 bg-white text-slate-600 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Download PDF
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-blue-600" />
              Membership Status
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Current Plan</span>
                <span className="font-bold text-slate-900">{member.membershipType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Valid Until</span>
                <span className="font-bold text-slate-900">{member.expiryDate}</span>
              </div>
              <div className="pt-4 border-t border-slate-50">
                {member.status === 'Active' ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 size={16} />
                    Account is Active
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                    <Clock size={16} />
                    Awaiting Admin Approval
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Your Schedule
              </h3>
              <button className="text-blue-600 text-sm font-bold hover:underline">Book Session</button>
            </div>
            <div className="p-12 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Clock size={32} />
              </div>
              <p className="text-slate-500 font-medium">No upcoming sessions booked.</p>
              <p className="text-xs text-slate-400 mt-1">Your fixed slot is {member.timingSlot}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-blue-600" />
                Visit History
              </h3>
            </div>
            <div className="p-12 text-center text-slate-400">
              Your visit history will appear here once you start swimming.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
