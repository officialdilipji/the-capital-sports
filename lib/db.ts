import fs from 'fs';
import path from 'path';
import { Database } from './types';

const DB_PATH = path.join(process.cwd(), 'database.json');

const initialData: Database = {
  members: [],
  staff: [
    { id: 's1', name: 'Admin User', role: 'Admin', contact: '0000000000', password: 'admin', availability: [] },
    { id: 's2', name: 'John Coach', role: 'Instructor', contact: '1111111111', password: 'staff', availability: ['Morning'] }
  ],
  bookings: [],
  payments: [],
  maintenanceLogs: [],
  adminConfig: {
    upiId: 'capitalsports@upi',
    amounts: {
      '15Day': 2000,
      '1Month': 3500,
      '2Month': 6000,
      '3Month': 8000,
      '6Month': 15000
    }
  },
  guests: [],
  attendance: []
};

export function getDb(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    if (!data.trim()) {
      return initialData;
    }
    const parsed = JSON.parse(data);
    
    // Ensure all required keys exist by merging with initialData
    // CRITICAL: If staff is empty in the parsed data, use initialData.staff to prevent lockout
    return {
      ...initialData,
      ...parsed,
      members: Array.isArray(parsed.members) ? parsed.members : initialData.members,
      staff: (Array.isArray(parsed.staff) && parsed.staff.length > 0) ? parsed.staff : initialData.staff,
      payments: Array.isArray(parsed.payments) ? parsed.payments : initialData.payments,
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : initialData.attendance,
      guests: Array.isArray(parsed.guests) ? parsed.guests : initialData.guests,
      maintenanceLogs: Array.isArray(parsed.maintenanceLogs) ? parsed.maintenanceLogs : initialData.maintenanceLogs,
      adminConfig: parsed.adminConfig || initialData.adminConfig,
    };
  } catch (error) {
    console.error('getDb error:', error);
    return initialData;
  }
}

export function saveDb(data: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
