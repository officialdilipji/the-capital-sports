'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Shield, CheckCircle2, CreditCard, Banknote, QrCode, ChevronRight, ChevronLeft } from 'lucide-react';
import { Database, MembershipType, Payment } from '@/lib/types';
import { QRCodeCanvas } from 'qrcode.react';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.string().min(1, 'DOB is required'),
  contact: z.string().length(10, 'Contact must be exactly 10 digits').regex(/^\d+$/, 'Must be only numbers'),
  address: z.string().min(5, 'Address is required'),
  emergencyContact: z.string().min(10, 'Emergency contact (Name & Number) is required'),
  medicalCondition: z.string().optional(),
  membershipType: z.enum(['15Day', '1Month', '2Month', '3Month', '6Month']),
  timingSlot: z.string().min(1, 'Timing slot is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  photoUrl: z.string().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
  transactionId: z.string().optional(),
  cashStaffName: z.string().optional(),
  receivedAmount: z.string().optional(),
});

type RegistrationData = z.infer<typeof schema>;

const compressImage = (base64Str: string, maxWidth = 200, maxHeight = 200, quality = 0.3): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const slots = [
  'Morning 06:00-06:45AM', 'Morning 07:00-07:45AM', 'Morning 08:00-08:45AM', 'Morning 09:00-09:45AM',
  'Evening 05:00-05:45PM', 'Evening 06:00-06:45PM', 'Evening 07:00-07:45PM', 'Evening 08:00-08:45PM'
];

export default function RegistrationForm({ db, onUpdate, role, currentUser }: { db: Database, onUpdate: () => void, role?: string | null, currentUser?: any }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash'>('UPI');

  // DOB state for custom picker
  const [dobYear, setDobYear] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');

  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
    { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
    { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
    { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset, trigger, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      membershipType: '1Month' as MembershipType,
      gender: 'Male' as any,
      joiningDate: new Date().toISOString().split('T')[0],
      agreedToTerms: false,
      photoUrl: '',
      timingSlot: slots[0],
      cashStaffName: currentUser?.name || ''
    }
  });

  // Update cashStaffName if currentUser changes
  useEffect(() => {
    if (currentUser?.name && !watch('cashStaffName')) {
      setValue('cashStaffName', currentUser.name);
    }
  }, [currentUser, setValue, watch]);

  const selectedPlan = watch('membershipType');
  const planAmount = db.adminConfig.amounts[selectedPlan] || 0;
  const upiId = db.adminConfig.upiId || 'capitalsports@upi';
  const upiUrl = `upi://pay?pa=${upiId}&pn=TheCapitalSports&am=${planAmount}&cu=INR`;

  React.useEffect(() => {
    if (dobYear && dobMonth && dobDay) {
      setValue('dob', `${dobYear}-${dobMonth}-${dobDay}`, { shouldValidate: true });
    } else {
      setValue('dob', '', { shouldValidate: true });
    }
  }, [dobYear, dobMonth, dobDay, setValue]);

  // Background sync retry for cached registrations
  React.useEffect(() => {
    const syncPending = async () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('pending_reg_'));
      for (const key of keys) {
        try {
          const item = localStorage.getItem(key);
          if (!item) continue;
          const data = JSON.parse(item);
          const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'register', data })
          });
          if (res.ok) {
            localStorage.removeItem(key);
            onUpdate();
          }
        } catch (e) {
          console.error('Failed to sync pending registration', e);
        }
      }
    };
    syncPending();
  }, [onUpdate]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const compressed = await compressImage(base64String);
          setPhotoPreview(compressed);
          setValue('photoUrl', compressed);
        } catch (err) {
          console.error('Compression failed', err);
          setPhotoPreview(base64String);
          setValue('photoUrl', base64String);
        } finally {
          setIsCompressing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateExpiry = (type: string, joiningDateStr: string) => {
    const joiningDate = new Date(joiningDateStr);
    let days = 30;
    if (type === '15Day') days = 15;
    else if (type === '1Month') days = 30;
    else if (type === '2Month') days = 60;
    else if (type === '3Month') days = 90;
    else if (type === '6Month') days = 180;
    
    const expiry = new Date(joiningDate.getTime() + days * 24 * 60 * 60 * 1000);
    return expiry.toISOString().split('T')[0];
  };

  const nextStep = async () => {
    const isValid = await trigger(['name', 'gender', 'dob', 'contact', 'address', 'emergencyContact', 'membershipType', 'timingSlot', 'joiningDate', 'agreedToTerms']);
    if (isValid) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to top to show errors if validation fails
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onInvalid = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: RegistrationData) => {
    if (isSubmitting) return;

    // Manual validation for payment fields
    if (paymentMethod === 'UPI' && !data.transactionId) {
      trigger('transactionId');
      return;
    }
    if (paymentMethod === 'Cash') {
      if (!data.cashStaffName || data.cashStaffName === '') {
        setError('cashStaffName', { type: 'manual', message: 'Please select the staff who received the cash' });
        return;
      }
      if (!data.receivedAmount || Number(data.receivedAmount) <= 0) {
        setError('receivedAmount', { type: 'manual', message: 'Please enter a valid amount received' });
        return;
      }
    }

    setIsSubmitting(true);
    setSubmittedName(data.name);
    setSubmitted(true); // Immediate feedback

    // Calculate expiry date based on plan
    const expiryDate = calculateExpiry(data.membershipType, data.joiningDate);
    
    // Create payment object
    const payment: Partial<Payment> = {
      amount: planAmount,
      method: paymentMethod,
      date: new Date().toISOString(),
      type: 'Membership',
      transactionId: paymentMethod === 'UPI' ? data.transactionId : undefined,
      cashStaffName: paymentMethod === 'Cash' ? data.cashStaffName : undefined,
      receivedAmount: paymentMethod === 'Cash' ? Number(data.receivedAmount) : undefined,
      status: (paymentMethod === 'Cash' && (role === 'Admin' || role === 'Receptionist' || role === 'Instructor')) ? 'Completed' : 'Pending'
    };

    const enrichedData = { ...data, expiryDate, payment };

    // Save to cache (localStorage) as requested
    const pendingId = `pending_reg_${data.contact}`;
    try {
      localStorage.setItem(pendingId, JSON.stringify({ ...enrichedData, timestamp: new Date().toISOString() }));
    } catch (e) {
      console.error('Failed to save to cache', e);
    }

    // Background sync to Google Sheets/Database
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'register', data: enrichedData })
    }).then(res => {
      if (res.ok) {
        localStorage.removeItem(pendingId); // Clear from cache on success
        onUpdate();
      } else {
        console.error('Background sync failed');
      }
    }).catch(err => {
      console.error('Background sync error:', err);
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center max-w-2xl mx-auto"
      >
        <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Registration Submitted!</h2>
        <p className="text-slate-600 mb-8 text-lg">
          Hello <span className="font-bold text-blue-600">{submittedName}</span>, your membership request for THE CAPITAL SPORTS is now pending admin approval. 
          You will receive a notification once your account is active.
        </p>
        <button 
          onClick={() => {
            reset();
            setPhotoPreview(null);
            setSubmitted(false);
            setStep(1);
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Register Another Member
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
      <div className="bg-blue-600 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UserPlus size={24} />
              <h2 className="text-2xl font-bold">Member Registration</h2>
            </div>
            <p className="opacity-90">Join THE CAPITAL SPORTS swimming community today.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-white' : 'bg-white/30'}`}></div>
            <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-white' : 'bg-white/30'}`}></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input {...register('name')} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="John Doe" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                    <select {...register('gender')} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select 
                        value={dobDay} 
                        onChange={(e) => setDobDay(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                      >
                        <option value="">Day</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        value={dobMonth} 
                        onChange={(e) => setDobMonth(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                      >
                        <option value="">Month</option>
                        {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                      </select>
                      <select 
                        value={dobYear} 
                        onChange={(e) => setDobYear(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                      >
                        <option value="">Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                  <input 
                    {...register('contact')} 
                    maxLength={10}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="10-digit mobile number" 
                  />
                  {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <textarea {...register('address')} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" rows={2} placeholder="Street, City, Zip" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Member Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                      {isCompressing && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
                        </div>
                      )}
                      {photoPreview ? (
                        <Image 
                          src={photoPreview} 
                          alt="Preview" 
                          fill 
                          className="object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <UserPlus className="text-slate-400" size={24} />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange}
                      className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">Membership Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Membership Type</label>
                  <select {...register('membershipType')} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="15Day">15 Days (₹{db.adminConfig.amounts['15Day'] || 2000})</option>
                    <option value="1Month">1 Month (₹{db.adminConfig.amounts['1Month'] || 3500})</option>
                    <option value="2Month">2 Months (₹{db.adminConfig.amounts['2Month'] || 6000})</option>
                    <option value="3Month">3 Months (₹{db.adminConfig.amounts['3Month'] || 8000})</option>
                    <option value="6Month">6 Months (₹{db.adminConfig.amounts['6Month'] || 15000})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input 
                    type="date" 
                    {...register('joiningDate')} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
                  {errors.joiningDate && <p className="text-red-500 text-xs mt-1">{errors.joiningDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Timing Slot</label>
                  <select {...register('timingSlot')} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    {slots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.timingSlot && <p className="text-red-500 text-xs mt-1">{errors.timingSlot.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input {...register('emergencyContact')} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Name & Number" />
                  {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Medical Conditions (If any)</label>
                  <input {...register('medicalCondition')} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Asthma, etc." />
                </div>
              </div>

              <div className="md:col-span-2 mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <input type="checkbox" {...register('agreedToTerms')} id="terms" className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                    I hereby declare that I am physically fit for swimming and agree to abide by all the rules and regulations of <strong>THE CAPITAL SPORTS</strong>. I accept the liability waiver and understand that the management is not responsible for any accidents or loss of property.
                  </label>
                </div>
                {errors.agreedToTerms && <p className="text-red-500 text-xs mt-2 ml-8">{errors.agreedToTerms.message}</p>}
              </div>

              <div className="md:col-span-2 flex flex-col items-end mt-4 gap-2">
                {Object.keys(errors).length > 0 && (
                  <p className="text-red-500 text-sm font-bold">Please fix the errors above to proceed.</p>
                )}
                <button 
                  type="button"
                  onClick={nextStep}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700"
                >
                  Next: Payment
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Payment</h3>
                <p className="text-slate-500">Select your preferred payment method for the <span className="font-bold text-blue-600">{selectedPlan}</span> plan.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-600 font-medium">Plan Amount:</span>
                  <span className="text-3xl font-extrabold text-slate-900">₹{planAmount}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'UPI' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                  >
                    <QrCode size={32} />
                    <span className="font-bold">UPI Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'Cash' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                  >
                    <Banknote size={32} />
                    <span className="font-bold">Cash Payment</span>
                  </button>
                </div>

                {paymentMethod === 'UPI' && (
                  <div className="flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="mb-4 p-4 bg-slate-50 rounded-2xl">
                      <QRCodeCanvas 
                        value={upiUrl} 
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-slate-500 text-center mb-2">Scan this QR code with any UPI app</p>
                    <p className="font-mono text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 mb-6">{upiId}</p>
                    
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-slate-700 mb-1 text-left">UPI Transaction ID (Required)</label>
                      <input 
                        {...register('transactionId')} 
                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.transactionId ? 'border-red-500' : 'border-slate-200'}`}
                        placeholder="Enter 12-digit Ref No. / Txn ID" 
                      />
                      {errors.transactionId && <p className="text-red-500 text-xs mt-1 text-left">Transaction ID is required for UPI</p>}
                    </div>
                  </div>
                )}

                {paymentMethod === 'Cash' && (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Banknote size={32} />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2 text-center">Pay at Reception</h4>
                    <p className="text-sm text-slate-500 text-center mb-6">Please provide the following details to record your cash payment.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Handed over to (Staff Name)</label>
                        <select 
                          {...register('cashStaffName')} 
                          className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.cashStaffName ? 'border-red-500' : 'border-slate-200'}`}
                        >
                          <option value="">Select Staff</option>
                          {currentUser?.name && !db.staff.some(s => s.name === currentUser.name) && (
                            <option value={currentUser.name}>{currentUser.name} (You)</option>
                          )}
                          {db.staff.map(s => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
                        </select>
                        {errors.cashStaffName && <p className="text-red-500 text-xs mt-1">Please select the staff who received the cash</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Received (₹)</label>
                        <input 
                          type="number"
                          {...register('receivedAmount')} 
                          className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.receivedAmount ? 'border-red-500' : 'border-slate-200'}`}
                          placeholder={`Enter amount (Plan: ₹${planAmount})`}
                        />
                        {errors.receivedAmount && <p className="text-red-500 text-xs mt-1">Please enter the amount received</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Register'}
                  <Shield size={20} className={isSubmitting ? 'animate-pulse' : ''} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
