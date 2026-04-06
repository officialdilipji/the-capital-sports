'use client';

import React from 'react';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import { Droplets, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { Member } from '@/lib/types';
import { differenceInDays, parseISO, isValid, format } from 'date-fns';
import { getDirectImageUrl } from '@/lib/utils';

export default function MembershipCard({ member }: { member: Member }) {
  const getExpiryStatus = () => {
    if (!member.expiryDate) return { isSoon: false, isExpired: false };
    try {
      const expiry = parseISO(member.expiryDate);
      if (!isValid(expiry)) return { isSoon: false, isExpired: false };
      
      const daysLeft = differenceInDays(expiry, new Date());
      return {
        isSoon: daysLeft >= 0 && daysLeft <= 7,
        isExpired: daysLeft < 0,
        daysLeft
      };
    } catch (e) {
      return { isSoon: false, isExpired: false };
    }
  };

  const formatISTDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch (e) {
      return dateStr || 'N/A';
    }
  };

  const expiryStatus = getExpiryStatus();
  const formattedExpiry = formatISTDate(member.expiryDate);
  const formattedJoined = formatISTDate(member.dateOfJoining);

  const qrValue = `ID: ${member.id}\nName: ${member.name}\nStatus: ${member.status}\nExpiry: ${formattedExpiry}\nDays Left: ${expiryStatus.daysLeft ?? 'N/A'}`;

  return (
    <div 
      id={`member-card-${member.id}`} 
      style={{
        width: '100%',
        aspectRatio: '1.6 / 1',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '1.5rem',
        padding: '1.25rem',
        color: '#ffffff',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Background patterns */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%', background: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      </div>
      <div style={{ position: 'absolute', top: '-10rem', right: '-10rem', width: '25rem', height: '25rem', borderRadius: '9999px', backgroundColor: 'rgba(59, 130, 246, 0.1)', filter: 'blur(80px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10rem', left: '-10rem', width: '25rem', height: '25rem', borderRadius: '9999px', backgroundColor: 'rgba(139, 92, 246, 0.1)', filter: 'blur(80px)' }}></div>
      
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <Droplets size={18} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>The Capital Sports</h2>
              <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, color: '#94a3b8', margin: 0, marginTop: '2px' }}>Premium Fitness Club</p>
            </div>
          </div>
          <div 
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '9px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: member.status === 'Active' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)',
              color: member.status === 'Active' ? '#34d399' : '#fbbf24',
              border: `1px solid ${member.status === 'Active' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`
            }}
          >
            {member.status}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
          {/* Left: Member Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div 
              style={{ 
                width: '4rem', 
                height: '4rem', 
                borderRadius: '1rem', 
                overflow: 'hidden', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 12px -3px rgba(0, 0, 0, 0.3)'
              }}
            >
              {member.photoUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img 
                    src={getDirectImageUrl(member.photoUrl)} 
                    alt={member.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #1e293b; color: rgba(255, 255, 255, 0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
                      }
                    }}
                  />
                </div>
              ) : (
                <User size={24} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
              )}
            </div>
            <div>
              <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '1px', margin: 0 }}>Member Name</p>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{member.name}</h3>
              <p style={{ fontSize: '8px', fontWeight: 600, color: '#3b82f6', margin: 0 }}>ID: {member.id}</p>
            </div>
          </div>

          {/* Center: QR Code - More Prominent */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div 
              style={{ 
                padding: '0.75rem', 
                borderRadius: '1.5rem', 
                backgroundColor: '#ffffff', 
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                position: 'relative',
                zIndex: 10,
                border: '4px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <QRCodeCanvas value={qrValue} size={130} bgColor="#ffffff" fgColor="#000000" level="H" />
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '160%', height: '160%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }}></div>
            <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#3b82f6', marginTop: '0.75rem', fontWeight: 900 }}>Scan to Verify</p>
          </div>

          {/* Right: Plan Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end', textAlign: 'right' }}>
            <div>
              <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '1px', margin: 0 }}>Plan</p>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>{member.membershipType}</p>
            </div>
            <div>
              <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '1px', margin: 0 }}>Expiry</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                <p style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  margin: 0,
                  color: expiryStatus.isExpired ? '#ef4444' : 
                         expiryStatus.isSoon ? '#f59e0b' : '#f8fafc'
                }}>
                  {formattedExpiry}
                </p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '1px', margin: 0 }}>Slot</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end', color: '#f8fafc' }}>
                <Clock size={9} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                  {member.timingSlot ? (member.timingSlot.includes(' ') ? member.timingSlot.split(' ')[1] : member.timingSlot) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={10} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '8px', color: '#64748b' }}>Joined: {formattedJoined}</span>
          </div>
          <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 600 }}>VALID AT ALL BRANCHES</span>
        </div>
      </div>
    </div>
  );
}
