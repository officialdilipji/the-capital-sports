import fs from 'fs';
import path from 'path';
import { Database } from './types';

const DB_PATH = path.join(process.cwd(), 'database.json');

// In-memory cache for Vercel/Serverless environments where filesystem is read-only
let memoryDb: Database | null = null;

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
      '1Day': 200,
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
  // If we have it in memory, return it (useful for the duration of a single request/warm lambda)
  if (memoryDb) return memoryDb;

  try {
    let data: string;
    
    if (!fs.existsSync(DB_PATH)) {
      // Try to write initial data, but don't crash if it fails (e.g. on Vercel)
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      } catch (e) {
        console.warn('Could not write initial database.json (likely read-only filesystem). Using in-memory data.');
      }
      memoryDb = initialData;
      return initialData;
    }

    data = fs.readFileSync(DB_PATH, 'utf-8');
    if (!data.trim()) {
      memoryDb = initialData;
      return initialData;
    }
    
    const parsed = JSON.parse(data);
    
    // Ensure all required keys exist by merging with initialData
    const db = {
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

    memoryDb = db;
    return db;
  } catch (error) {
    console.error('getDb error:', error);
    memoryDb = initialData;
    return initialData;
  }
}

export function saveDb(data: Database) {
  // Always update memory cache
  memoryDb = data;

  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    // On Vercel, this will fail with EROFS. We log it but don't throw, 
    // so the rest of the request (like syncing to Google Sheets) can continue.
    console.warn('saveDb: Could not write to filesystem (EROFS). Data will only persist if Google Sheets is configured.');
  }
}
