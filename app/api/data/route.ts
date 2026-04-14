import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { Member, Payment } from '@/lib/types';
import { addDays } from 'date-fns';
import { fetchFromSheets, sendToSheets } from '@/lib/googlesheetService';

export async function GET() {
  try {
    const sheetData = await fetchFromSheets();
    const localDb = getDb();
    
    // Merge sheets data with local DB to ensure we have all required fields
    // Sheets data takes precedence for members and payments, but we keep local data if sheets is missing them
    const data = sheetData ? { 
      ...localDb, 
      ...sheetData,
      members: (Array.isArray(sheetData.members) && sheetData.members.length > 0) ? sheetData.members : localDb.members,
      staff: (Array.isArray(sheetData.staff) && sheetData.staff.length > 0) ? sheetData.staff : localDb.staff,
      payments: (Array.isArray(sheetData.payments) && sheetData.payments.length > 0) ? sheetData.payments : localDb.payments,
      adminConfig: sheetData.adminConfig || localDb.adminConfig,
    } : localDb;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/data error:', error);
    return NextResponse.json(getDb());
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    let responseData: any = { success: true };
    
    if (body.type === 'register') {
      const memberId = `m${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const memberData = body.data.member || body.data;
      const paymentData = body.data.payment;

      const newMember: Member = {
        ...memberData,
        id: memberId,
        status: 'Pending',
        dateOfJoining: memberData.joiningDate || new Date().toISOString().split('T')[0],
        expiryDate: memberData.expiryDate || calculateExpiry(memberData.membershipType, memberData.joiningDate),
        qrCode: `GYM-${memberId}-${Date.now()}`
      };

      // Handle payment if present
      if (paymentData) {
        const newPayment: Payment = {
          ...paymentData,
          memberName: newMember.name,
          id: `p${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          memberId: memberId,
          date: new Date().toISOString(),
          status: paymentData.status || 'Pending'
        };
        db.payments = db.payments || [];
        db.payments.push(newPayment);
        
        // Update body data to include enriched payment and member ID for sheets
        // This ensures Google Sheets gets the correct fields
        body.data.payment = {
          ...newPayment,
          receivedBy: newPayment.cashStaffName,
          ReceivedBy: newPayment.cashStaffName,
          staffName: newPayment.cashStaffName,
          StaffName: newPayment.cashStaffName,
          amountReceived: newPayment.receivedAmount,
          AmountReceived: newPayment.receivedAmount,
        };
        body.data.member = newMember;
        body.data.id = memberId;
        body.data.memberId = memberId;
        body.data.dateOfJoining = newMember.dateOfJoining;
        body.data.expiryDate = newMember.expiryDate;
        body.data.photo = newMember.photoUrl;
        body.data.Photo = newMember.photoUrl;
        body.data.Image = newMember.photoUrl;
        body.data.qrCode = newMember.qrCode;
      }

      db.members.push(newMember);
      responseData = newMember;
    }

    else if (body.type === 'renew') {
      const member = db.members.find(m => m.id === body.memberId);
      if (member) {
        const oldExpiry = new Date(member.expiryDate);
        const now = new Date();
        // If already expired, start from now. If not, start from old expiry.
        const baseDate = oldExpiry > now ? oldExpiry : now;
        const newExpiry = calculateExpiry(body.membershipType, baseDate.toISOString().split('T')[0]);
        
        member.membershipType = body.membershipType;
        member.expiryDate = newExpiry;
        member.status = 'Active';

        // Create payment record
        const newPayment: Payment = {
          id: `p${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          memberId: member.id,
          memberName: member.name,
          amount: body.amount,
          method: body.method,
          date: new Date().toISOString(),
          type: 'Membership',
          status: body.status || 'Completed',
          cashStaffName: body.cashStaffName,
          receivedAmount: body.receivedAmount,
          transactionId: body.transactionId
        };
        db.payments = db.payments || [];
        db.payments.push(newPayment);

        // Enrich body for sheets
        body.data = {
          member,
          payment: {
            ...newPayment,
            receivedBy: newPayment.cashStaffName,
            amountReceived: newPayment.receivedAmount,
            staffName: newPayment.cashStaffName,
            ReceivedBy: newPayment.cashStaffName,
            StaffName: newPayment.cashStaffName,
            AmountReceived: newPayment.receivedAmount,
          }
        };
        responseData = { member, payment: newPayment };
      }
    }

    else if (body.type === 'approve') {
      const member = db.members.find(m => m.id === body.id);
      if (member) {
        member.status = 'Active';
        body.data = member;
        responseData = member;
      }
    }

    else if (body.type === 'confirmPayment') {
      const payment = db.payments?.find(p => p.id === body.id);
      if (payment) {
        payment.status = 'Completed';
        // Enrich body for sheets so it knows what to update
        body.data = payment;
        responseData = payment;
      }
    }

    else if (body.type === 'updateConfig') {
      db.adminConfig = body.data;
    }

    else if (body.type === 'addStaff') {
      const newStaff = { ...body.data, id: `s${Date.now()}` };
      db.staff.push(newStaff);
      responseData = newStaff;
    }

    else if (body.type === 'removeStaff') {
      db.staff = db.staff.filter(s => s.id !== body.id);
    }

    else if (body.type === 'removeMember') {
      db.members = db.members.filter(m => m.id !== body.id);
    }

    else if (body.type === 'addGuest') {
      const guestId = `g${Date.now()}`;
      const guestData = body.data;
      
      // Calculate expiry if membership type is provided
      let expiryDate = '';
      if (guestData.membershipType) {
        expiryDate = calculateExpiry(guestData.membershipType, guestData.date || new Date().toISOString().split('T')[0]);
      }

      const guest = { 
        ...guestData, 
        id: guestId, 
        status: 'Pending',
        expiryDate,
        qrCode: `GUEST-${guestId}-${Date.now()}`
      };
      db.guests.push(guest);
      
      // Create a payment record for the guest
      const paymentId = `p${Date.now()}`;
      const payment: Payment = {
        id: paymentId,
        memberId: guestId,
        memberName: guest.name,
        amount: Number(guest.amount),
        method: 'Cash', // Guests usually pay cash at reception
        date: new Date().toISOString(),
        type: 'Guest',
        status: 'Pending'
      };
      db.payments.push(payment);
      
      // Enrich body data for Google Sheets
      body.data = guest;
      
      responseData = guest;
    }

    else if (body.type === 'approveGuest') {
      const guest = db.guests.find(g => g.id === body.id);
      if (guest) {
        guest.status = 'Approved';
      }
    }

    else if (body.type === 'removeGuest') {
      db.guests = db.guests.filter(g => g.id !== body.id);
    }

    else if (body.type === 'checkIn') {
      const now = new Date();
      const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const istTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
      
      const attendanceId = `a${Date.now()}`;
      const newAttendance = {
        id: attendanceId,
        memberId: body.memberId,
        memberName: body.memberName,
        date: istDate,
        checkIn: istTime,
        slot: body.slot,
        status: 'In' as const
      };
      db.attendance = db.attendance || [];
      db.attendance.push(newAttendance);
      responseData = newAttendance;
      // Enrich body for sheets
      body.data = newAttendance;
    }

    else if (body.type === 'checkOut') {
      const now = new Date();
      const istTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
      
      const attendance = db.attendance?.find(a => a.id === body.id);
      if (attendance) {
        attendance.checkOut = istTime;
        attendance.status = 'Out' as const;
        responseData = attendance;
        // Enrich body for sheets
        body.data = attendance;
      }
    }

    else if (body.type === 'addMaintenance') {
      const newLog = { ...body.data, id: `maint${Date.now()}` };
      db.maintenanceLogs = db.maintenanceLogs || [];
      db.maintenanceLogs.push(newLog);
      responseData = newLog;
    }

    saveDb(db);

    // Send enriched body to Google Sheets
    await sendToSheets(body);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('POST /api/data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function calculateExpiry(type: string, joiningDateStr?: string) {
  const baseDate = joiningDateStr ? new Date(joiningDateStr) : new Date();
  if (type === '1Day') return addDays(baseDate, 1).toISOString().split('T')[0];
  if (type === '15Day') return addDays(baseDate, 15).toISOString().split('T')[0];
  if (type === '1Month') return addDays(baseDate, 30).toISOString().split('T')[0];
  if (type === '2Month') return addDays(baseDate, 60).toISOString().split('T')[0];
  if (type === '3Month') return addDays(baseDate, 90).toISOString().split('T')[0];
  if (type === '6Month') return addDays(baseDate, 180).toISOString().split('T')[0];
  return addDays(baseDate, 30).toISOString().split('T')[0];
}
