'use client';

import React from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Droplets, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { Member, Guest } from '@/lib/types';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { getDirectImageUrl } from '@/lib/utils';

export default function MembershipCard({ member, isGuest = false }: { member: Member | Guest, isGuest?: boolean }) {
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

  const formatISTDate = (dateStr: any) => {
    if (!dateStr || dateStr === '') return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch (e) {
      return String(dateStr) || 'N/A';
    }
  };

  const getPlanName = (type: string | undefined) => {
    if (!type) return 'N/A';
    if (type === '1Day') return '1 Day Pass';
    if (type === '15Day') return '15 Days Pass';
    if (type === '1Month') return '1 Month Pass';
    if (type === '2Month') return '2 Months Pass';
    if (type === '3Month') return '3 Months Pass';
    if (type === '6Month') return '6 Months Pass';
    return type;
  };

  const expiryStatus = getExpiryStatus();
  const formattedExpiry = formatISTDate(member.expiryDate);
  const formattedJoined = formatISTDate(isGuest ? (member as Guest).date : (member as Member).dateOfJoining);

  const timingSlot = isGuest ? (member as Guest).timing : (member as Member).timingSlot;
  const qrValue = `TYPE: ${isGuest ? 'GUEST' : 'MEMBER'}\nID: ${member.id}\nJoined: ${formattedJoined}\nExpiry: ${formattedExpiry}\nSlot: ${timingSlot || 'N/A'}`;

  const photoUrl = !isGuest ? (member as Member).photoUrl : undefined;

  return (
    <div 
      id={`member-card-${member.id}`} 
      style={{
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto',
        aspectRatio: '1.58 / 1',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '1rem',
        padding: '1.25rem',
        color: '#ffffff',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Background patterns */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%', background: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      </div>
      <div style={{ position: 'absolute', top: '-10rem', right: '-10rem', width: '25rem', height: '25rem', borderRadius: '9999px', backgroundColor: 'rgba(59, 130, 246, 0.15)', filter: 'blur(80px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10rem', left: '-10rem', width: '25rem', height: '25rem', borderRadius: '9999px', backgroundColor: 'rgba(139, 92, 246, 0.15)', filter: 'blur(80px)' }}></div>
      
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '0.4rem', borderRadius: '0.6rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              <Droplets size={20} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0, lineHeight: 1.1, color: '#f8fafc' }}>The Capital Sports</h2>
              <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, color: '#94a3b8', margin: 0, marginTop: '2px' }}>Premium Fitness Club</p>
            </div>
          </div>
          <div 
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: member.status === 'Active' || member.status === 'Approved' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
              color: member.status === 'Active' || member.status === 'Approved' ? '#34d399' : '#fbbf24',
              border: `1px solid ${member.status === 'Active' || member.status === 'Approved' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
              backdropFilter: 'blur(4px)'
            }}
          >
            {member.status === 'Approved' ? 'Active' : member.status}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '90px 1fr 90px', gap: '0.75rem', alignItems: 'center' }}>
          {/* Left: Photo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: '5rem', 
                  height: '5rem', 
                  borderRadius: '1rem', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.5)',
                  position: 'relative'
                }}
              >
                {photoUrl ? (
                  <Image 
                    src={getDirectImageUrl(photoUrl)} 
                    alt={member.name} 
                    fill
                    style={{ objectFit: 'cover' }}
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <User size={40} style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
                )}
              </div>
          </div>

          {/* Center: Member Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
            <div>
              <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '2px', fontWeight: 700 }}>{isGuest ? 'Guest Name' : 'Member Name'}</p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>{member.name}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.3rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={10} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p style={{ fontSize: '6px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', margin: 0 }}>Timing Slot</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, margin: 0, color: '#e2e8f0' }}>{timingSlot || 'N/A'}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.3rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={10} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p style={{ fontSize: '6px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', margin: 0 }}>Expiry Date</p>
                  <p style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    margin: 0,
                    color: expiryStatus.isExpired ? '#ef4444' : 
                           expiryStatus.isSoon ? '#f59e0b' : '#e2e8f0'
                  }}>
                    {formattedExpiry}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: QR Code */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div 
              style={{ 
                padding: '0.4rem', 
                borderRadius: '0.75rem', 
                backgroundColor: '#ffffff', 
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <QRCodeSVG 
                value={qrValue} 
                size={85} 
                bgColor="#ffffff" 
                fgColor="#000000" 
                level="M" 
                includeMargin={false}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#3b82f6', margin: 0, letterSpacing: '0.05em' }}>ID: {member.id.toUpperCase()}</p>
              <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginTop: '2px' }}>Scan to Verify</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.75rem' }}>
          <div>
            <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '2px', margin: 0 }}>Membership Plan</p>
            <p style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: '#3b82f6' }}>{getPlanName(member.membershipType)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '8px', color: '#ffffff', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>THE CAPITAL SPORTS</p>
            <p style={{ fontSize: '6px', color: '#64748b', margin: 0 }}>Premium Swimming Pool</p>
          </div>
        </div>
      </div>
    </div>
  );
}
