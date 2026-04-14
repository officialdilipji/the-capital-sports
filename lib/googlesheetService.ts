/**
 * Google Sheets Service
 * This file contains the configuration and helper functions for interacting with Google Sheets
 * via a Google Apps Script Web App.
 */

// Replace this with your actual Google Apps Script Web App URL
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzOD6a57z6hASSV6J4YPh0aeRMWSxFXhqyj80yXF7Cq92r3TV7TsiIMbjqP9GKorV1alg/exec";

/**
 * Validates the Google Script URL
 */
export function validateScriptUrl(url: string): { isValid: boolean; error?: string } {
  if (!url) return { isValid: false, error: 'Google Script URL is missing.' };
  
  if (!url.startsWith('https://script.google.com/macros/s/')) {
    return { 
      isValid: false, 
      error: 'Invalid URL. It should start with https://script.google.com/macros/s/ and end with /exec' 
    };
  }
  
  if (url.includes('/edit')) {
    return { 
      isValid: false, 
      error: 'URL appears to be an Editor URL. Please use the Web App URL from the Deploy dialog.' 
    };
  }
  
  return { isValid: true };
}

/**
 * Fetches data from Google Sheets
 */
export async function fetchFromSheets() {
  const validation = validateScriptUrl(GOOGLE_SCRIPT_URL);
  if (!validation.isValid) {
    console.error(validation.error);
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 second timeout for GET

    const res = await fetch(GOOGLE_SCRIPT_URL, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.error(`HTTP error! status: ${res.status} for URL: ${GOOGLE_SCRIPT_URL}`);
      return null;
    }

    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      
      // If the response contains an error, return null to fall back to local DB
      if (data && data.error) {
        console.error('Google Script returned an error:', data.error);
        return null;
      }

      // Check if data is a valid Database structure
      if (!data || typeof data !== 'object' || (!data.members && !data.staff)) {
        console.error('Invalid data structure from Google Script. Received:', JSON.stringify(data).substring(0, 500) + '...');
        return null;
      }
      
      // Map Google Sheet keys to our Member interface keys if necessary
      if (data.members && Array.isArray(data.members)) {
        data.members = data.members.map((member: any) => {
          // Robust ID mapping - use contact as fallback to prevent random IDs on every fetch
          const id = member.id || member.ID || member.Id || member.memberId || member.MemberID || member.contact || `m-${Math.random().toString(36).substr(2, 9)}`;
          
          return {
            ...member,
            id,
            // Map 'type' to 'membershipType'
            membershipType: member.membershipType || member.type || member.MembershipType || '1Month',
            // Map 'slot' to 'timingSlot'
            timingSlot: member.timingSlot || member.slot || member.Slot || member.TimingSlot || '',
            // Map 'joiningDate' to 'dateOfJoining'
            dateOfJoining: member.dateOfJoining || member.joiningDate || member.JoiningDate || member.date_of_joining || '',
            // Map 'medical' to 'medicalCondition'
            medicalCondition: member.medicalCondition || member.medical || member.Medical || '',
            // Map 'expiry' to 'expiryDate'
            expiryDate: member.expiryDate || member.expiry || member.Expiry || member.expiry_date || member['Expiry Date'] || '',
            // Map 'photo' to 'photoUrl'
            photoUrl: member.photoUrl || member.photo || member.Photo || member.photo_url || member['Photo URL'] || member.photo_link || member.Image || member.image || member.photo_data || member.PhotoData || member['Member Photo'] || member['Profile Picture'] || member.Avatar || member.avatar || member.Picture || member.picture || member.Img || member.img || member['Member Image'] || member['MemberImg'] || member['Member_Img'] || member.PhotoURL || member.Photo_URL || member['Photo Link'] || member['Member Photo Link'] || member['photoLink'] || '',
          };
        });
      }

      // Map Google Sheet keys for staff
      if (data.staff && Array.isArray(data.staff)) {
        data.staff = data.staff.map((s: any) => {
          // Robust ID mapping - use name/contact as fallback to prevent random IDs
          const id = s.id || s.ID || s.Id || s.staffId || s.StaffID || s.name || s.contact || `s-${Math.random().toString(36).substr(2, 9)}`;
          
          // Normalize role to match UserRole type ('Admin', 'Receptionist', 'Instructor')
          const rawRole = s.role || s.Role || s.staffRole || s.StaffRole || s['Staff Role'] || 'Receptionist';
          let normalizedRole: 'Admin' | 'Receptionist' | 'Instructor' = 'Receptionist';
          
          const lowerRole = rawRole.toString().toLowerCase();
          if (lowerRole.includes('admin')) normalizedRole = 'Admin';
          else if (lowerRole.includes('reception')) normalizedRole = 'Receptionist';
          else if (lowerRole.includes('instruct')) normalizedRole = 'Instructor';

          return {
            ...s,
            id,
            name: s.name || s.Name || s.staffName || s.StaffName || s['Staff Name'] || '',
            role: normalizedRole,
            contact: s.contact || s.Contact || s.phone || s.Phone || s.mobile || s.Mobile || '',
            password: s.password || s.Password || s.pwd || s.Pwd || s.pass || s.Pass || '',
          };
        });
      }

      // Map Google Sheet keys for payments
      if (data && data.payments && Array.isArray(data.payments)) {
        data.payments = data.payments.map((payment: any) => {
          // If 'type' contains a status-like value, it's likely the status column in the sheet
          const isStatusInType = ['Completed', 'Pending', 'Failed'].includes(payment.type || payment.Type);
          
          // Robust ID mapping - use memberId+date+amount as fallback to prevent random IDs
          const id = payment.id || payment.ID || payment.paymentId || payment.PaymentID || `${payment.memberId || 'm'}-${payment.date || 'd'}-${payment.amount || 'a'}-${payment.transactionId || ''}`;

          return {
            ...payment,
            id,
            memberId: payment.memberId || payment.memberID || payment.MemberID || '',
            memberName: payment.memberName || payment.MemberName || payment['Member Name'] || '',
            amount: Number(payment.amount || payment.Amount || 0),
            method: String(payment.method || payment.Method || payment['Payment Method'] || payment['payment_method'] || (payment['Method/Received by'] ? String(payment['Method/Received by']).split('/')[0].trim() : (payment['Method / Received By'] ? String(payment['Method / Received By']).split('/')[0].trim() : 'Cash'))),
            date: payment.date || payment.Date || payment.paymentDate || payment.PaymentDate || payment.timestamp || payment.Timestamp || payment.payment_date || payment['Payment Date'] || payment.DateTime || payment.datetime || payment['Date & Time'] || payment['Date and Time'] || payment['date_time'] || payment['Date/Time'] || payment['Date / Time'] || payment.Time || payment.time || payment.Day || payment.day || payment.createdAt || payment.CreatedAt || payment.created_at || payment['Created At'] || payment.payment_time || payment['Payment Time'] || payment.txnDate || payment.txn_date || '',
            // If type looks like a status, use 'Membership' as default type and move value to status
            type: isStatusInType ? 'Membership' : (payment.type || payment.Type || 'Membership'),
            status: isStatusInType ? (payment.type || payment.Type) : (payment.status || payment.Status || 'Pending'),
            transactionId: payment.transactionId || payment.TransactionID || payment.transactionID || '',
            cashStaffName: payment.cashStaffName || payment.CashStaffName || payment.receivedBy || payment.ReceivedBy || payment.received_by || payment['Received By'] || payment.staff_name || payment['Staff Name'] || payment.Received_By || payment.receivedByStaff || payment.StaffName || payment.received_by_staff || payment.ReceivedByStaff || payment.staffName || payment.Staff || payment.staff || payment['Collected By'] || payment['By'] || payment.Receiver || payment.receiver || payment.HandledBy || payment.handled_by || payment['Staff_Name'] || payment['Staff_name'] || (payment['Method/Received by'] && String(payment['Method/Received by']).includes('/') ? String(payment['Method/Received by']).split('/')[1].trim() : (payment['Method / Received By'] && String(payment['Method / Received By']).includes('/') ? String(payment['Method / Received By']).split('/')[1].trim() : (payment['Method/Received by'] || payment['Method / Received By'] || ''))),
            receivedAmount: Number(payment.receivedAmount || payment.ReceivedAmount || payment.amountReceived || payment.AmountReceived || payment.amount_received || payment['Amount Received'] || 0),
          };
        });
      }
      
      return data;
    } else {
      const text = await res.text();
      console.error(`Google Script GET Error (Status ${res.status}):`, text.substring(0, 500));
      return null;
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Google Script Fetch Error: Request timed out after 30 seconds.');
    } else {
      console.error('Google Script Fetch Error:', err);
    }
    return null;
  }
}

/**
 * Sends data to Google Sheets
 */
export async function sendToSheets(body: any) {
  const validation = validateScriptUrl(GOOGLE_SCRIPT_URL);
  if (!validation.isValid) {
    console.error(validation.error);
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 second timeout for POST

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      console.error(`Google Script POST Error (Status ${res.status}):`, text.substring(0, 500));
      return null;
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Google Script Post Error: Request timed out after 30 seconds.');
    } else {
      console.error('Google Script Post Error:', err);
    }
    return null;
  }
}
