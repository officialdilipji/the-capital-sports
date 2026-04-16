'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  ClipboardList, 
  UserPlus,
  LogOut,
  ChevronRight,
  Droplets,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import RegistrationForm from '@/components/RegistrationForm';
import AdminDashboard from '@/components/AdminDashboard';
import AttendanceDashboard from '@/components/AttendanceDashboard';
import StaffDashboard from '@/components/StaffDashboard';
import { Database, UserRole } from '@/lib/types';

import { fetchJson } from '@/lib/api';

export default function Home() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!showLogin || !db) return;
    
    // Simple check against staff/members in DB
    const isStaffRole = showLogin === 'Receptionist' || showLogin === 'Instructor' || showLogin === 'Admin';
    
    let staff = null;
    if (isStaffRole) {
      staff = (db.staff || []).find(s => 
        s.role === showLogin && 
        s.name.toLowerCase() === username.toLowerCase() && 
        s.password === password
      );
    }
 
    let member = null;
    if (showLogin === 'Member') {
      // For members, username is the identifier (Last 4 digits of ID or Contact Number)
      // Filter to find EXACT matches first, then partials
      const members = db.members || [];
      member = members.find(m => m.id === username || m.contact === username);
      
      if (!member) {
        member = members.find(m => 
          m.id.endsWith(username) ||
          (username.length >= 4 && m.id.slice(-4) === username)
        );
      }
    }

    if (staff || member) {
      setRole(showLogin);
      setCurrentUser(staff || member);
      setShowLogin(null);
      setUsername('');
      setPassword('');
      setError('');
    } else {
      setError(showLogin === 'Member' ? 'Invalid Member ID or Contact Number.' : 'Invalid username or password.');
    }
  };

  const fetchData = React.useCallback(async () => {
    try {
      const data = await fetchJson<Database>('/api/data');
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received from server');
      }
      
      // Ensure we have at least an empty array for all required collections
      const sanitizedData = {
        ...data,
        members: Array.isArray(data.members) ? data.members : [],
        staff: Array.isArray(data.staff) ? data.staff : [],
        attendance: Array.isArray(data.attendance) ? data.attendance : [],
        guests: Array.isArray(data.guests) ? data.guests : [],
        payments: Array.isArray(data.payments) ? data.payments : [],
      };
      
      if (sanitizedData.staff.length === 0) {
        console.warn('Staff list is empty. Authentication may fail.');
      }
      
      setDb(sanitizedData);
      
      // Update current user if already logged in - use functional update to avoid dependency on currentUser
      setCurrentUser((prevUser: any) => {
        if (!prevUser || !prevUser.id) return prevUser;
        
        if (role === 'Member') {
          const updatedMember = data.members?.find((m: any) => m.id === prevUser.id);
          return updatedMember || prevUser;
        } else {
          const updatedStaff = data.staff?.find((s: any) => s.id === prevUser.id);
          return updatedStaff || prevUser;
        }
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Connection error. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [role]); // Removed currentUser from dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading The Capital Sports...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        {/* Configuration Warning */}
        {db && !db.staff.length && (
          <div className="fixed top-0 left-0 right-0 bg-amber-50 border-b border-amber-100 p-3 text-center z-50">
            <p className="text-amber-700 text-sm font-medium flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              Google Sheets connection pending. Please check GOOGLE_SHEET_SETUP.md for instructions.
            </p>
          </div>
        )}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              THE CAPITAL <span className="text-blue-600">SPORTS</span>
            </h1>
            <p className="text-xl text-slate-600">Swimming Pool Management System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { r: 'Admin', icon: ShieldCheck, color: 'bg-red-100 text-red-600', desc: 'Full system control' },
              { r: 'Receptionist', icon: Users, color: 'bg-blue-100 text-blue-600', desc: 'Member check-ins & payments' },
              { r: 'Instructor', icon: Clock, color: 'bg-emerald-100 text-emerald-600', desc: 'Schedules & maintenance' },
              { r: 'Member', icon: ClipboardList, color: 'bg-indigo-100 text-indigo-600', desc: 'Attendance (ID or Contact)' }
            ].map((item) => (
              <motion.button
                key={item.r}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLogin(item.r as UserRole)}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all hover:shadow-md"
              >
                <div className={`p-4 rounded-2xl ${item.color} mb-4`}>
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.r}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Login Modal */}
        <AnimatePresence>
          {showLogin && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Login as {showLogin}</h2>
                <p className="text-slate-500 mb-6 text-sm">Please enter your credentials to continue.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {showLogin === 'Member' ? 'Member ID (Last 4 digits) or Contact Number' : 'Username / Name'}
                    </label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && showLogin === 'Member' && handleLogin()}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={showLogin === 'Member' ? 'e.g. 1234 or 9876543210' : 'Enter your name'}
                      autoFocus
                    />
                  </div>
                  {showLogin !== 'Member' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Password
                      </label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                  {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setShowLogin(null); setError(''); setPassword(''); setUsername(''); }}
                      className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleLogin}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar/Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Droplets size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">THE CAPITAL SPORTS</span>
          <span className="ml-4 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider">
            {role} Mode
          </span>
        </div>
        <button 
          onClick={() => setRole(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-medium"
        >
          <LogOut size={18} />
          <span>Exit</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {role === 'Admin' && (
            <div className="space-y-8">
              <AdminDashboard db={db!} onUpdate={fetchData} role={role} />
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Quick Registration</h2>
                <RegistrationForm db={db!} onUpdate={fetchData} role={role} currentUser={currentUser} />
              </div>
            </div>
          )}
          {role === 'Receptionist' && (
            <div className="space-y-8">
              <AdminDashboard db={db!} onUpdate={fetchData} role={role} />
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">New Member Registration</h2>
                <RegistrationForm db={db!} onUpdate={fetchData} role={role} currentUser={currentUser} />
              </div>
            </div>
          )}
          {role === 'Instructor' && (
            <div className="space-y-8">
              <StaffDashboard db={db!} onUpdate={fetchData} currentUser={currentUser} />
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">New Member Registration</h2>
                <RegistrationForm db={db!} onUpdate={fetchData} role={role} currentUser={currentUser} />
              </div>
            </div>
          )}
          {role === 'Member' && (
            <div className="space-y-8">
              <AttendanceDashboard db={db!} member={currentUser} onUpdate={fetchData} />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
