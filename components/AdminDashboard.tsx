'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Settings, 
  CreditCard, 
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle2,
  Trash2,
  UserPlus,
  Calendar,
  LogOut,
  Filter,
  Shield,
  QrCode,
  Banknote,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LayoutDashboard,
  Activity,
  Wrench,
  ClipboardList,
  BarChart3,
  Droplets,
  AlertTriangle
} from 'lucide-react';
import { Database, Member, MembershipType, Payment, AdminConfig } from '@/lib/types';
import { slots } from '@/lib/constants';
import { fetchJson, safeFetch } from '@/lib/api';
import MembershipCard from './MembershipCard';
import QRScanner from './QRScanner';
import { getDirectImageUrl } from '@/lib/utils';
import { downloadCardAsPDF, printCard } from '@/lib/cardUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';

const ReceiptTemplate = ({ payment, member, config, isForGeneration = false }: { payment: Payment, member: Member | undefined, config: AdminConfig, isForGeneration?: boolean }) => {
  const today = new Date(payment.date).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxSizing: 'border-box',
    width: '4in',
    minHeight: '6in',
    lineHeight: '1.4',
    letterSpacing: 'normal',
    padding: '0.3in',
    ...(isForGeneration ? {
      position: 'fixed',
      left: '-9999px',
      top: 0,
      zIndex: -100
    } : {
      position: 'relative'
    })
  };

  return (
    <div id={isForGeneration ? `receipt-${payment.id}` : undefined} style={containerStyle} className="font-sans border border-slate-200 shadow-sm">
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', margin: 0 }}>The Capital Sports</h1>
        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Payment Receipt</p>
      </div>

      <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
          <span style={{ color: '#64748b' }}>Date:</span>
          <span style={{ fontWeight: 'bold' }}>{today}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
          <span style={{ color: '#64748b' }}>Receipt No:</span>
          <span style={{ fontWeight: 'bold' }}>#{payment.id.split('-')[0].toUpperCase()}</span>
        </div>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #f1f5f9' }}>
        <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Payment Details</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
          <span style={{ color: '#64748b' }}>Member Name:</span>
          <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{member?.name || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
          <span style={{ color: '#64748b' }}>Payment For:</span>
          <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{payment.type}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
          <span style={{ color: '#64748b' }}>Payment Method:</span>
          <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{payment.method}</span>
        </div>
        {payment.transactionId && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>Transaction ID:</span>
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#0f172a' }}>{payment.transactionId}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '15px', textAlign: 'right' }}>
        <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Total Amount Paid</p>
        <p style={{ fontSize: '28px', fontWeight: 900, color: '#1e40af', margin: 0 }}>₹{payment.amount.toLocaleString('en-IN')}.00</p>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', border: '2px solid #10b981', color: '#10b981', padding: '4px 15px', borderRadius: '6px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>
          Payment Successful
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard({ db, onUpdate, role }: { db: Database, onUpdate: () => void, role: string }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'config' | 'payments' | 'guests' | 'staff' | 'attendance' | 'maintenance'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [manualId, setManualId] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [renewingMemberId, setRenewingMemberId] = useState<string | null>(null);
  const [memberToDeleteId, setMemberToDeleteId] = useState<string | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<any | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [isManualAmount, setIsManualAmount] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

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
      });
    } catch {
      return timeStr;
    }
  };
  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '-';
    
    let processedDate = dateStr;
    
    // Handle object types (sometimes from Google Sheets)
    if (typeof dateStr === 'object' && dateStr !== null) {
      if (dateStr.date) processedDate = dateStr.date;
      else if (dateStr.value) processedDate = dateStr.value;
      else if (dateStr instanceof Date) processedDate = dateStr.toISOString();
      else processedDate = String(dateStr);
    }

    try {
      // Handle numeric dates from Excel/Sheets (days since 1900-01-01)
      if (typeof processedDate === 'number' || (typeof processedDate === 'string' && !isNaN(Number(processedDate)) && !processedDate.includes('-') && !processedDate.includes('/') && !processedDate.includes(':'))) {
        const date = new Date((Number(processedDate) - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
          }) + ' IST';
        }
      }

      // Try standard Date parsing
      const date = new Date(processedDate);
      if (!isNaN(date.getTime())) {
        // If the string doesn't have a timezone offset, assume it's already in IST or local
        // toLocaleString with timeZone: 'Asia/Kolkata' will handle the conversion correctly
        return date.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        }) + ' IST';
      }

      // Custom parsing for common formats (DD/MM/YYYY or YYYY-MM-DD)
      if (typeof processedDate === 'string') {
        const cleanDateStr = processedDate.trim();
        const parts = cleanDateStr.split(/[\/\-\s:]/);
        
        if (parts.length >= 3) {
          let d = 0, m = 0, y = 0, h = 0, min = 0, s = 0;
          
          if (parts[0].length === 4) {
            // YYYY/MM/DD
            y = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            d = parseInt(parts[2]);
            h = parts.length >= 4 ? parseInt(parts[3]) : 0;
            min = parts.length >= 5 ? parseInt(parts[4]) : 0;
            s = parts.length >= 6 ? parseInt(parts[5]) : 0;
          } else if (parts[2].length === 4) {
            // DD/MM/YYYY
            d = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            y = parseInt(parts[2]);
            h = parts.length >= 4 ? parseInt(parts[3]) : 0;
            min = parts.length >= 5 ? parseInt(parts[4]) : 0;
            s = parts.length >= 6 ? parseInt(parts[5]) : 0;
          } else if (parts[2].length === 2) {
            // DD/MM/YY
            d = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            y = 2000 + parseInt(parts[2]);
            h = parts.length >= 4 ? parseInt(parts[3]) : 0;
            min = parts.length >= 5 ? parseInt(parts[4]) : 0;
            s = parts.length >= 6 ? parseInt(parts[5]) : 0;
          }
          
          if (y && !isNaN(y)) {
            // Construct ISO string with IST offset (+05:30) to ensure correct moment
            const isoStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}+05:30`;
            const newDate = new Date(isoStr);
            if (!isNaN(newDate.getTime())) {
              return newDate.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
              }) + ' IST';
            }
          }
        }
      }
      
      return String(processedDate);
    } catch {
      return String(processedDate);
    }
  };

  const [showSuccessPopup, setShowSuccessPopup] = useState<{show: boolean, name: string} | null>(null);
  const isAdmin = role === 'Admin';

  const generateReceipt = async (payment: Payment) => {
    setIsGeneratingReceipt(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById(`receipt-${payment.id}`);
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove ALL style and link tags to prevent oklch/modern CSS from crashing html2canvas
          // The receipt itself uses inline styles so it will still look correct
          const styles = Array.from(clonedDoc.getElementsByTagName('style'));
          styles.forEach(s => s.remove());
          
          const links = Array.from(clonedDoc.getElementsByTagName('link'));
          links.forEach(l => {
            if (l.rel === 'stylesheet') l.remove();
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 6]
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${payment.id}.pdf`);
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setIsGeneratingReceipt(false);
      setReceiptPayment(null);
    }
  };

  const handleRenew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!renewingMemberId) return;
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const membershipType = formData.get('membershipType') as MembershipType;
    const method = formData.get('method') as 'UPI' | 'Cash';
    const amount = Number(formData.get('amount'));
    const transactionId = formData.get('transactionId') as string;

    const member = db.members.find(m => m.id === renewingMemberId);
    if (!member) return;

    try {
      const res = await safeFetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'renew',
          memberId: renewingMemberId,
          memberName: member.name,
          membershipType,
          method,
          amount,
          cashStaffName: method === 'Cash' ? transactionId : '',
          receivedAmount: amount,
          transactionId: method === 'UPI' ? transactionId : '',
          status: method === 'Cash' ? 'Completed' : 'Pending'
        })
      });

      if (res.ok) {
        onUpdate();
        setRenewingMemberId(null);
      }
    } catch (error) {
      console.error('Renewal failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckIn = async (member: Member) => {
    setIsSubmitting(true);
    try {
      console.log('Attempting check-in for:', member.id, member.name);
      const res = await safeFetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkIn',
          memberId: member.id,
          memberName: member.name,
          slot: member.timingSlot || (member as any).timing || 'General'
        })
      });
      if (res.ok) {
        console.log('Check-in successful');
        onUpdate();
        return true;
      } else {
        const err = await res.text();
        console.error('Check-in failed server-side:', err);
        return false;
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    setIsSubmitting(true);
    try {
      console.log('Attempting check-out for attendance ID:', attendanceId);
      const res = await safeFetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkOut',
          id: attendanceId
        })
      });
      if (res.ok) {
        console.log('Check-out successful');
        onUpdate();
        return true;
      } else {
        const err = await res.text();
        console.error('Check-out failed server-side:', err);
        return false;
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    const val = manualId.trim();
    const member = db.members.find(m => m.id === val || m.contact === val);
    const guest = !member ? db.guests.find(g => g.id === val || g.contact === val) : null;
    const person = member || guest;

    if (person) {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const existing = db.attendance?.find(a => a.memberId === person.id && a.date === today && a.status === 'In');
      
      let success = false;
      if (existing) {
        success = await handleCheckOut(existing.id);
      } else {
        const slot = (person as any).timingSlot || (person as any).timing || 'General';
        success = await handleCheckIn({ ...person, timingSlot: slot } as Member);
      }
      
      if (success) {
        setManualId('');
        alert(`${person.name} ${existing ? 'Checked Out' : 'Checked In'} successfully!`);
      } else {
        alert('Operation failed. Please check connection.');
      }
    } else {
      alert('Member/Guest not found with this ID or Contact Number.');
    }
  };

  const approveMember = async (id: string) => {
    if (isSubmitting) return;
    
    const member = db.members.find(m => m.id === id);
    if (!member) return;

    // Show success popup immediately (optimistic feedback)
    setShowSuccessPopup({ show: true, name: member.name });
    
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'approve', id })
      });
      onUpdate();
    } catch (err) {
      console.error(err);
      // In a real app we might rollback, but for now we just log
    }
  };

  const removeMember = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'removeMember', id })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }
      
      setMemberToDeleteId(null);
      onUpdate();
    } catch (err) {
      console.error('Remove member error:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove member. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeGuest = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'removeGuest', id })
      });
      
      if (!res.ok) throw new Error('Failed to remove guest');
      
      setGuestToDelete(null);
      onUpdate();
    } catch (err) {
      console.error('Remove guest error:', err);
      alert('Failed to remove guest. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeStaff = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'removeStaff', id })
      });
      
      if (!res.ok) throw new Error('Failed to remove staff');
      
      setStaffToDelete(null);
      onUpdate();
    } catch (err) {
      console.error('Remove staff error:', err);
      alert('Failed to remove staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const staffData = {
      name: formData.get('name') as string,
      role: formData.get('role') as any,
      contact: formData.get('contact') as string,
      password: formData.get('password') as string,
      availability: []
    };
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'addStaff', data: staffData })
      });
      onUpdate();
      setShowAddStaff(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add staff.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const guestData = {
      name: formData.get('name') as string,
      contact: formData.get('contact') as string,
      timing: formData.get('timing') as string,
      membershipType: formData.get('membershipType') as MembershipType,
      amount: Number(formData.get('amount')),
      date: new Date().toISOString().split('T')[0]
    };
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'addGuest', data: guestData })
      });
      if (res.ok) {
        onUpdate();
        setShowAddGuest(false);
      } else {
        throw new Error('Failed to add guest');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add guest.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newConfig = {
      upiId: formData.get('upiId') as string,
      amounts: {
        '1Day': Number(formData.get('1Day')),
        '15Day': Number(formData.get('15Day')),
        '1Month': Number(formData.get('1Month')),
        '2Month': Number(formData.get('2Month')),
        '3Month': Number(formData.get('3Month')),
        '6Month': Number(formData.get('6Month')),
      }
    };
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'updateConfig', data: newConfig })
      });
      onUpdate();
      alert('Configuration updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = db.members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.contact.includes(searchTerm)
  );

  const stats = [
    { label: 'Total Members', value: db.members.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Currently In', value: db.attendance?.filter(a => a.status === 'In').length || 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approval', value: db.members.filter(m => m.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    ...(isAdmin ? [{ 
      label: 'Revenue (MTD)', 
      value: `₹${(db.payments || [])
        .filter(p => {
          const pDate = new Date(p.date);
          const now = new Date();
          const isCurrentMonth = pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
          // Count revenue for existing members OR guests
          const memberExists = db.members.some(m => m.id === p.memberId);
          const guestExists = db.guests.some(g => g.id === p.memberId);
          return isCurrentMonth && (memberExists || guestExists);
        })
        .reduce((acc, p) => {
          const amt = Number(p.amount);
          return acc + (isNaN(amt) || amt < 0 ? 0 : amt);
        }, 0)}`, 
      icon: TrendingUp, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    }] : []),
  ];

  // Chart Data Preparation
  const attendanceByDay = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: db.attendance?.filter(a => a.date.startsWith(date)).length || 0
    }));
  }, [db.attendance]);

  const membershipDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    db.members.forEach(m => {
      counts[m.membershipType] = (counts[m.membershipType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [db.members]);

  const expiringMembers = React.useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return db.members.filter(m => {
      const expiry = new Date(m.expiryDate);
      return m.status === 'Active' && expiry <= nextWeek;
    }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [db.members]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 md:gap-6`}>
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-8 py-5 font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-8 py-5 font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={18} />
            Members
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('staff')}
              className={`px-8 py-5 font-bold transition-all flex items-center gap-2 ${activeTab === 'staff' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserCheck size={18} />
              Staff
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('config')}
              className={`px-8 py-5 font-bold transition-all flex items-center gap-2 ${activeTab === 'config' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Settings size={18} />
              Pricing & Config
            </button>
          )}
          <button 
            onClick={() => setActiveTab('payments')}
            className={`px-8 py-5 font-bold transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CreditCard size={18} />
            Payments
          </button>
          <button 
            onClick={() => setActiveTab('guests')}
            className={`px-8 py-5 font-bold transition-all flex items-center gap-2 ${activeTab === 'guests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserCheck size={18} />
            Guests
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`px-8 py-5 font-bold transition-all flex items-center gap-2 ${activeTab === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ClipboardList size={18} />
            Attendance
          </button>
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`px-8 py-5 font-bold transition-all flex items-center gap-2 ${activeTab === 'maintenance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Droplets size={18} />
            Maintenance
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Sync Status Banner */}
              {db._sync && (
                <div className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${db._sync.isSheets ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                  <div className="flex items-center gap-3">
                    {db._sync.isSheets ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={20} className="text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-bold">
                        {db._sync.isSheets ? 'Google Sheets Connected' : 'Running in Local Mode'}
                      </p>
                      <p className="text-xs opacity-80">
                        {db._sync.isSheets 
                          ? 'All data is synchronized with your spreadsheet.' 
                          : db._sync.isLoginError
                            ? 'CRITICAL: Google Script requires login. Set "Who has access" to "Anyone" in your deployment.'
                            : db._sync.isHtmlError 
                              ? 'Google Script returned an error page. Check your deployment settings.' 
                              : 'Failed to connect to Google Sheets. Data will not persist on Vercel.'}
                      </p>
                    </div>
                  </div>
                  {!db._sync.isSheets && (
                    <button 
                      onClick={() => setActiveTab('config')}
                      className="text-xs font-bold underline hover:no-underline"
                    >
                      Troubleshoot Sync
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Attendance Chart */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 size={20} className="text-blue-600" />
                      Weekly Attendance
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase">Last 7 Days</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceByDay}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: '#f1f5f9' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Membership Distribution */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Activity size={20} className="text-emerald-600" />
                      Membership Mix
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase">All Members</span>
                  </div>
                  <div className="h-64 w-full flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={membershipDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {membershipDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-2">
                      {membershipDistribution.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-xs font-medium text-slate-600">{entry.name}:</span>
                          <span className="text-xs font-bold text-slate-900">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed & Expiry Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {db.attendance?.slice(-5).reverse().map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {record.memberName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{record.memberName} checked in</p>
                            <p className="text-xs text-slate-500">{formatDateTime(record.checkIn)}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md uppercase">Check-In</span>
                      </div>
                    ))}
                    {db.payments?.slice(-5).reverse().map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            ₹
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Payment of ₹{payment.amount} received</p>
                            <p className="text-xs text-slate-500">{formatDateTime(payment.date)}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md uppercase">Payment</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-rose-600" />
                    Membership Expiry Alerts
                  </h3>
                  <div className="space-y-4">
                    {expiringMembers.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
                        No memberships expiring soon.
                      </div>
                    ) : (
                      expiringMembers.map((member) => {
                        const isExpired = new Date(member.expiryDate) < new Date();
                        return (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isExpired ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                {member.name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{member.name}</p>
                                <p className={`text-xs font-medium ${isExpired ? 'text-rose-500' : 'text-amber-500'}`}>
                                  {isExpired ? 'Expired on' : 'Expires on'} {formatDate(member.expiryDate)}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setActiveTab('members');
                                setSearchTerm(member.name);
                              }}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Details
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name or phone..." 
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setShowAddGuest(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
                >
                  <Plus size={18} />
                  Add Guest
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm uppercase tracking-wider">
                      <th className="pb-4 font-bold">Member</th>
                      <th className="pb-4 font-bold">Plan</th>
                      <th className="pb-4 font-bold">Joined</th>
                      <th className="pb-4 font-bold">Expires</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden" style={{ position: 'relative' }}>
                              {member.photoUrl ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                  <Image 
                                    src={getDirectImageUrl(member.photoUrl)} 
                                    alt={member.name} 
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    referrerPolicy="no-referrer" 
                                  />
                                </div>
                              ) : (
                                member.name[0]
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.contact}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-sm font-medium text-slate-700">{member.membershipType}</span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{member.timingSlot}</p>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-medium text-slate-500">{formatDate(member.dateOfJoining)}</span>
                        </td>
                        <td className="py-4">
                          <span className={`text-xs font-bold ${
                            new Date(member.expiryDate) < new Date() ? 'text-rose-600' : 
                            new Date(member.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {formatDate(member.expiryDate)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            member.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 
                            member.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {member.status === 'Pending' && isAdmin && (
                              <button 
                                disabled={isSubmitting}
                                onClick={() => approveMember(member.id)}
                                className={`p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Approve"
                              >
                                {isSubmitting ? <Clock size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                              </button>
                            )}
                            <button 
                              onClick={() => setRenewingMemberId(member.id)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-semibold text-xs"
                              title="Renew Membership"
                            >
                              <Plus size={14} />
                              <span>Renew</span>
                            </button>
                            <button 
                              onClick={() => setSelectedMemberId(member.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Card"
                            >
                              <ArrowUpRight size={20} />
                            </button>
                            {isAdmin && (
                              <button 
                                disabled={isSubmitting}
                                onClick={() => setMemberToDeleteId(member.id)}
                                className={`p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Remove Member"
                              >
                                {isSubmitting && memberToDeleteId === member.id ? <Clock size={20} className="animate-spin" /> : <Trash2 size={20} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Staff Management</h3>
                <button 
                  onClick={() => setShowAddStaff(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                  <Plus size={16} /> Add Staff
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm uppercase tracking-wider">
                      <th className="pb-4 font-bold">Name</th>
                      <th className="pb-4 font-bold">Role</th>
                      <th className="pb-4 font-bold">Contact</th>
                      <th className="pb-4 font-bold">Password</th>
                      <th className="pb-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {db.staff.map((s) => (
                      <tr key={s.id}>
                        <td className="py-4 font-bold">{s.name}</td>
                        <td className="py-4 text-sm">{s.role}</td>
                        <td className="py-4 text-sm">{s.contact}</td>
                        <td className="py-4 text-sm font-mono">{s.password || 'N/A'}</td>
                        <td className="py-4">
                          <button 
                            disabled={isSubmitting}
                            onClick={() => setStaffToDelete(s)}
                            className={`text-red-600 hover:underline text-xs font-bold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <form onSubmit={updateConfig} className="max-w-2xl space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Payment Settings</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business UPI ID</label>
                  <input name="upiId" defaultValue={db.adminConfig.upiId} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Membership Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(['1Day', '15Day', '1Month', '2Month', '3Month', '6Month'] as MembershipType[]).map((type) => (
                    <div key={type}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{type} Amount (₹)</label>
                      <input 
                        type="number" 
                        name={type} 
                        defaultValue={db.adminConfig.amounts[type] || (type === '1Day' ? 200 : type === '15Day' ? 2000 : type === '1Month' ? 3500 : type === '2Month' ? 6000 : type === '3Month' ? 8000 : 15000)} 
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>

              {/* Sync Troubleshooting Section */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" />
                  Google Sheets Sync Troubleshooting
                </h3>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border ${db._sync?.isSheets ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Connection Status</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${db._sync?.isSheets ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                        {db._sync?.isSheets ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>URL Source:</strong> {db._sync?.url || 'Unknown'}<br/>
                      {db._sync?.error && <><strong>Error:</strong> {db._sync.error}<br/></>}
                      {db._sync?.isLoginError && <span className="text-red-600 font-bold">CRITICAL: Your Google Script is asking for a login. You MUST set &quot;Who has access&quot; to &quot;Anyone&quot; in the deployment settings.</span>}
                      {db._sync?.isHtmlError && !db._sync?.isLoginError && <span className="text-red-600 font-bold">CRITICAL: Received HTML instead of JSON. This means your Google Script is returning an error page.</span>}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-sm font-bold mb-2">Common Fixes:</h4>
                    <ul className="text-xs space-y-2 text-slate-600 list-disc pl-4">
                      <li><strong>Authorization:</strong> Open your Google Script, click &quot;Run&quot; on the <code>testConnection</code> function, and follow the prompts to authorize.</li>
                      <li><strong>Deployment:</strong> Click &quot;Deploy&quot; &gt; &quot;New Deployment&quot;. Ensure &quot;Execute as&quot; is <strong>Me</strong> and &quot;Who has access&quot; is <strong>Anyone</strong>.</li>
                      <li><strong>Bound Script:</strong> Ensure you created the script via <em>Extensions &gt; Apps Script</em> inside the sheet, not as a standalone script.</li>
                      <li><strong>Environment Variable:</strong> Ensure <code>GOOGLE_SCRIPT_URL</code> is set in your Vercel/AI Studio settings.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
                <p className="text-sm text-slate-500">Recent transactions across all services.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm uppercase tracking-wider">
                      <th className="pb-4 font-bold">Date & Time</th>
                      <th className="pb-4 font-bold">Member</th>
                      <th className="pb-4 font-bold">Type</th>
                      <th className="pb-4 font-bold">Amount</th>
                      <th className="pb-4 font-bold">Method / Received By</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {db.payments?.slice().reverse().map((payment) => {
                      const member = db.members.find(m => m.id === payment.memberId);
                      return (
                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-sm text-slate-600 font-medium">
                            {formatDateTime(payment.date)}
                          </td>
                          <td className="py-4">
                            <p className="font-bold text-slate-900">{payment.memberName || member?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{member?.contact || payment.memberId}</p>
                          </td>
                          <td className="py-4">
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600">{payment.type}</span>
                          </td>
                          <td className="py-4 font-bold text-slate-900">₹{payment.amount}</td>
                          <td className="py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                                String(payment.method || '').includes('UPI') ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {payment.method}
                              </span>
                              {(String(payment.method || '').includes('Cash') || !payment.method) && (
                                <div className="flex flex-col bg-amber-50 p-2 rounded-lg border border-amber-100 mt-1">
                                  <span className="text-[10px] font-bold text-amber-800 uppercase">Received By:</span>
                                  <span className="text-xs font-medium text-amber-900">
                                    {payment.cashStaffName || (payment as any).receivedBy || (payment as any).staffName || (payment as any).ReceivedBy || (payment as any).StaffName || (payment as any).Staff || (payment as any).staff || (payment as any).Received_By || (payment as any).received_by || (payment as any)['Received By'] || (payment as any)['Staff Name'] || (payment as any)['Staff_Name'] || (payment as any).Receiver || (payment as any).receiver || (payment as any).HandledBy || (payment as any).handled_by || 'Not Specified'}
                                  </span>
                                  {typeof payment.receivedAmount === 'number' && payment.receivedAmount > 0 && (
                                    <span className="text-[10px] text-amber-700 mt-1">Amount: ₹{payment.receivedAmount}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                              }`}>
                                {payment.status || 'Pending'}
                              </span>
                              {payment.status === 'Pending' && (
                                <button
                                  onClick={async () => {
                                    if (!confirm('Confirm payment completion?')) return;
                                    try {
                                      const res = await fetch('/api/data', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ type: 'confirmPayment', id: payment.id })
                                      });
                                      if (res.ok) {
                                        onUpdate();
                                      }
                                    } catch (e) {
                                      console.error('Failed to confirm payment', e);
                                    }
                                  }}
                                  className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                  title="Mark as Completed"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-500">{payment.transactionId || '-'}</span>
                              <button
                                onClick={() => setReceiptPayment(payment)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-semibold text-xs"
                                title="Download Receipt"
                              >
                                <CreditCard size={14} />
                                <span>Receipt</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!db.payments || db.payments.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">No payment records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Guest Access Requests</h3>
                  <p className="text-sm text-slate-500">Approval required for temporary pool access.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsManualAmount(false);
                    setShowAddGuest(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                  <Plus size={16} /> Add Guest
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm uppercase tracking-wider">
                      <th className="pb-4 font-bold">Guest Name</th>
                      <th className="pb-4 font-bold">Membership</th>
                      <th className="pb-4 font-bold">Timing</th>
                      <th className="pb-4 font-bold">Amount</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {db.guests?.map((guest: any) => (
                      <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4">
                          <p className="font-bold text-slate-900">{guest.name}</p>
                          <p className="text-xs text-slate-500">{guest.contact || 'No contact'}</p>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-blue-600">{guest.membershipType || 'One-time'}</span>
                            {guest.expiryDate && (
                              <span className="text-[10px] text-slate-400">Expires: {formatDate(guest.expiryDate)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-600">{guest.timing}</td>
                        <td className="py-4 text-sm font-bold text-slate-900">₹{guest.amount}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${guest.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {guest.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {guest.status === 'Approved' && (
                              <button 
                                onClick={() => setSelectedGuestId(guest.id)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title="View Guest Card"
                              >
                                <QrCode size={16} />
                              </button>
                            )}
                            {guest.status === 'Pending' && isAdmin && (
                              <button 
                                disabled={isSubmitting}
                                onClick={async () => {
                                  if (isSubmitting) return;
                                  setIsSubmitting(true);
                                  try {
                                    await fetch('/api/data', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ type: 'approveGuest', id: guest.id })
                                    });
                                    onUpdate();
                                  } catch (err) {
                                    console.error(err);
                                    alert('Failed to approve guest.');
                                  } finally {
                                    setIsSubmitting(false);
                                  }
                                }}
                                className={`bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isSubmitting ? '...' : 'Approve'}
                              </button>
                            )}
                            {guest.status === 'Pending' && !isAdmin && (
                              <span className="text-xs text-slate-400 italic">Awaiting Admin</span>
                            )}
                            {isAdmin && (
                              <button 
                                disabled={isSubmitting}
                                onClick={() => setGuestToDelete(guest)}
                                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                title="Remove Guest"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!db.guests || db.guests.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">No guest requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Daily Attendance</h3>
                  <p className="text-sm text-slate-500">Track member check-ins and check-outs.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      setScanError(null);
                      setShowScanner(true);
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all"
                  >
                    <QrCode size={16} /> Scan QR
                  </button>
                  <form onSubmit={handleManualAttendance} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter ID or Contact..." 
                      className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm w-40"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                    >
                      Go
                    </button>
                  </form>
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search attendance by name..." 
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm uppercase tracking-wider">
                      <th className="pb-4 font-bold">Member</th>
                      <th className="pb-4 font-bold">Date</th>
                      <th className="pb-4 font-bold">Slot</th>
                      <th className="pb-4 font-bold">In</th>
                      <th className="pb-4 font-bold">Out</th>
                      <th className="pb-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {db.attendance?.slice().reverse()
                      .filter(r => r.memberName.toLowerCase().includes(attendanceSearch.toLowerCase()))
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <p className="font-bold text-slate-900">{record.memberName}</p>
                            <p className="text-xs text-slate-500">{record.memberId}</p>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{formatDate(record.date)}</td>
                          <td className="py-4 text-sm text-slate-600">{record.slot}</td>
                          <td className="py-4 text-sm text-slate-600">{formatTime(record.checkIn)}</td>
                          <td className="py-4 text-sm text-slate-600">{record.checkOut ? formatTime(record.checkOut) : '-'}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                                record.status === 'In' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {record.status}
                              </span>
                              {record.status === 'In' && (
                                <button 
                                  onClick={() => handleCheckOut(record.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Manual Check-out"
                                >
                                  <LogOut size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {(!db.attendance || db.attendance.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">No attendance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Maintenance Logs</h3>
                  <p className="text-sm text-slate-500">Pool health and facility maintenance records.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {db.maintenanceLogs?.slice().reverse().map((log) => (
                  <div key={log.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-slate-900">{formatDateTime(log.date)}</p>
                        <p className="text-xs text-slate-500">Recorded by: {db.staff.find(s => s.id === log.staffId)?.name || 'Unknown'}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase">Verified</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Chemicals</span>
                        <span className="text-sm font-bold text-slate-700">{log.chemicalLevels}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Cleaning</span>
                        <span className="text-sm font-bold text-slate-700">{log.cleaningStatus}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Repairs/Notes</p>
                        <p className="text-sm text-slate-700 italic">{log.repairs || 'No repairs needed.'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!db.maintenanceLogs || db.maintenanceLogs.length === 0) && (
                  <div className="col-span-full py-12 text-center text-slate-400">No maintenance logs found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Membership Renewal Modal */}
      <AnimatePresence>
        {renewingMemberId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRenewingMemberId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Renew Membership</h3>
                  <p className="text-sm text-slate-500">Member: {db.members.find(m => m.id === renewingMemberId)?.name}</p>
                </div>
                <button onClick={() => setRenewingMemberId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleRenew} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Membership Plan</label>
                    <select name="membershipType" defaultValue={db.members.find(m => m.id === renewingMemberId)?.membershipType} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="1Day">1 Day</option>
                      <option value="15Day">15 Days</option>
                      <option value="1Month">1 Month</option>
                      <option value="2Month">2 Months</option>
                      <option value="3Month">3 Months</option>
                      <option value="6Month">6 Months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select name="method" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
                    <input type="number" name="amount" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Transaction ID / Received By</label>
                    <input name="transactionId" placeholder="For UPI / Cashier Name" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full bg-blue-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 hover:-translate-y-1'}`}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Renewal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {receiptPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptPayment(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Receipt Preview</h3>
                <button onClick={() => setReceiptPayment(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50 flex justify-center">
                <div className="scale-75 origin-top">
                  <ReceiptTemplate 
                    payment={receiptPayment} 
                    member={db.members.find(m => m.id === receiptPayment.memberId)} 
                    config={db.adminConfig} 
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setReceiptPayment(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => generateReceipt(receiptPayment)}
                  disabled={isGeneratingReceipt}
                  className={`flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isGeneratingReceipt ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {isGeneratingReceipt ? <Clock size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  {isGeneratingReceipt ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Receipt for Generation */}
      {receiptPayment && (
        <ReceiptTemplate 
          payment={receiptPayment} 
          member={db.members.find(m => m.id === receiptPayment.memberId)} 
          config={db.adminConfig} 
          isForGeneration={true}
        />
      )}

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScanner(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white">
                <h3 className="text-lg font-bold">Attendance Scanner</h3>
                <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-emerald-500 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {scanError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {scanError}
                  </div>
                )}
                <div className="rounded-2xl overflow-hidden border-2 border-emerald-100">
                  <QRScanner 
                    onScanSuccess={async (decodedText) => {
                      if (decodedText) {
                        let val = decodedText;
                        console.log('Scanned text:', val);
                        // Extract ID if it's in the multi-line format
                        if (val.includes('ID: ')) {
                          const lines = val.split('\n');
                          const idLine = lines.find(l => l.startsWith('ID: '));
                          if (idLine) {
                            val = idLine.replace('ID: ', '').trim();
                          }
                        }
                        
                        // Find member or guest
                        const member = db.members.find(m => m.id === val || m.qrCode === val || m.contact === val);
                        const guest = !member ? db.guests.find(g => g.id === val || g.qrCode === val || g.contact === val) : null;
                        const person = member || guest;

                        if (person) {
                          setScanError(null);
                          const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
                          const existing = db.attendance?.find(a => a.memberId === person.id && a.date === today && a.status === 'In');
                          
                          let success = false;
                          if (existing) {
                            success = await handleCheckOut(existing.id);
                          } else {
                            const slot = (person as any).timingSlot || (person as any).timing || 'General';
                            success = await handleCheckIn({ ...person, timingSlot: slot } as Member);
                          }
                          
                          if (success) {
                            setShowScanner(false);
                            alert(`${person.name} ${existing ? 'Checked Out' : 'Checked In'} successfully!`);
                          } else {
                            setScanError('Failed to record attendance. Check connection.');
                          }
                        } else {
                          console.warn('Person not found for ID:', val);
                          setScanError(`Member/Guest not found for ID: ${val}`);
                        }
                      }
                    }}
                    onScanFailure={(err) => {
                      // Only log significant errors, ignore frequent "no QR code found" noise
                      if (!err.includes('No QR code found')) {
                        console.warn('Scan failure:', err);
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Manual ID or Contact Entry</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter ID or Contact Number..." 
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualAttendance(e);
                        }
                      }}
                    />
                    <button 
                      onClick={handleManualAttendance}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all"
                    >
                      Go
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Tip: You can enter the Member ID or their registered Contact Number.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Card Modal */}
      {selectedMemberId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setSelectedMemberId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XCircle size={24} />
            </button>
            {db.members.find(m => m.id === selectedMemberId) && (
              <MembershipCard member={db.members.find(m => m.id === selectedMemberId)!} />
            )}
            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => printCard(`member-card-${selectedMemberId}`)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Print Card
              </button>
              <button 
                onClick={() => {
                  const member = db.members.find(m => m.id === selectedMemberId);
                  if (member) downloadCardAsPDF(`member-card-${selectedMemberId}`, member.name);
                }}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Card Modal */}
      {selectedGuestId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setSelectedGuestId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Guest Membership Card</h2>
            <div className="mb-8">
              <MembershipCard 
                member={db.guests.find(g => g.id === selectedGuestId) as any} 
                isGuest={true} 
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => printCard(`member-card-${selectedGuestId}`)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Print Card
              </button>
              <button 
                onClick={() => {
                  const guest = db.guests.find(g => g.id === selectedGuestId);
                  if (guest) downloadCardAsPDF(`member-card-${selectedGuestId}`, guest.name);
                }}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {memberToDeleteId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-2xl font-bold">Remove Member?</h2>
              </div>
              
              <p className="text-slate-600 mb-8">
                Are you sure you want to remove <span className="font-bold text-slate-900">{db.members.find(m => m.id === memberToDeleteId)?.name}</span>? 
                This will permanently delete their record from the dashboard and Google Sheet.
              </p>
              
              <div className="flex gap-3">
                <button 
                  disabled={isSubmitting}
                  onClick={() => setMemberToDeleteId(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => removeMember(memberToDeleteId)}
                  className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Clock size={20} className="animate-spin" /> : 'Delete Member'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {guestToDelete && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-2xl font-bold">Remove Guest?</h2>
              </div>
              
              <p className="text-slate-600 mb-8">
                Are you sure you want to remove guest <span className="font-bold text-slate-900">{guestToDelete.name}</span>? 
                This will permanently delete their request.
              </p>
              
              <div className="flex gap-3">
                <button 
                  disabled={isSubmitting}
                  onClick={() => setGuestToDelete(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => removeGuest(guestToDelete.id)}
                  className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Clock size={20} className="animate-spin" /> : 'Delete Guest'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {staffToDelete && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-2xl font-bold">Remove Staff?</h2>
              </div>
              
              <p className="text-slate-600 mb-8">
                Are you sure you want to remove staff member <span className="font-bold text-slate-900">{staffToDelete.name}</span>? 
                This will permanently delete their account.
              </p>
              
              <div className="flex gap-3">
                <button 
                  disabled={isSubmitting}
                  onClick={() => setStaffToDelete(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => removeStaff(staffToDelete.id)}
                  className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Clock size={20} className="animate-spin" /> : 'Delete Staff'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSuccessPopup?.show && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Member Activated!</h3>
              <p className="text-slate-500 mb-8">
                <span className="font-bold text-slate-700">{showSuccessPopup.name}</span> has been successfully approved and activated.
              </p>
              <button 
                onClick={() => setShowSuccessPopup(null)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Back to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setShowAddStaff(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Add New Staff</h2>
            <form onSubmit={updateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input name="name" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select name="role" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Receptionist">Receptionist</option>
                  <option value="Instructor">Instructor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                <input name="contact" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Login Password</label>
                <input name="password" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full bg-blue-600 text-white py-3 rounded-xl font-bold transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {showAddGuest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setShowAddGuest(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Add New Guest</h2>
            <form onSubmit={addGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Guest Name</label>
                <input name="name" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter guest name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                <input 
                  name="contact" 
                  required 
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="10-digit mobile number" 
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/[^0-9]/g, '');
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Membership</label>
                  <select 
                    name="membershipType" 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => {
                      if (!isManualAmount) {
                        const val = e.target.value;
                        const amountInput = (e.target.form as HTMLFormElement).elements.namedItem('amount') as HTMLInputElement;
                        if (val === '1Day') amountInput.value = '200';
                        else if (val === '15Day') amountInput.value = '1000';
                        else if (val === '1Month') amountInput.value = '1800';
                        else if (val === '2Month') amountInput.value = '3200';
                        else if (val === '3Month') amountInput.value = '4500';
                        else if (val === '6Month') amountInput.value = '8000';
                      }
                    }}
                  >
                    <option value="1Day">1 Day</option>
                    <option value="15Day">15 Days</option>
                    <option value="1Month">1 Month</option>
                    <option value="2Month">2 Months</option>
                    <option value="3Month">3 Months</option>
                    <option value="6Month">6 Months</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-slate-700">Amount (₹)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Manual</span>
                      <button 
                        type="button"
                        onClick={() => setIsManualAmount(!isManualAmount)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${isManualAmount ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isManualAmount ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                  <input 
                    type="number" 
                    name="amount" 
                    required 
                    readOnly={!isManualAmount}
                    className={`w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none ${!isManualAmount ? 'bg-slate-50 text-slate-500' : ''}`} 
                    placeholder="Amount" 
                    defaultValue="200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Timing Slot</label>
                <select name="timing" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  {slots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full bg-blue-600 text-white py-3 rounded-xl font-bold transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Adding Guest...' : 'Add Guest Membership'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
