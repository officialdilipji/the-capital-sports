export type MembershipType = '15Day' | '1Month' | '2Month' | '3Month' | '6Month';
export type UserRole = 'Admin' | 'Receptionist' | 'Instructor' | 'Member';
export type Gender = 'Male' | 'Female' | 'Other';
export type MembershipStatus = 'Pending' | 'Active' | 'Expired';

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  dob: string;
  contact: string;
  address: string;
  dateOfJoining: string;
  emergencyContact: string;
  medicalCondition: string;
  membershipType: MembershipType;
  timingSlot: string;
  status: MembershipStatus;
  expiryDate: string;
  photoUrl?: string;
  qrCode?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: UserRole;
  contact: string;
  password?: string;
  availability: string[]; // Days or slots
}

export interface Booking {
  id: string;
  memberId: string;
  type: 'Class' | 'Coaching' | 'General';
  date: string;
  slot: string;
  lane?: string;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  method: 'UPI' | 'Cash';
  date: string;
  type: 'Membership' | 'Guest' | 'Service';
  transactionId?: string;
  cashStaffName?: string;
  receivedAmount?: number;
  status: 'Pending' | 'Completed';
}

export interface MaintenanceLog {
  id: string;
  staffId: string;
  date: string;
  chemicalLevels: string;
  cleaningStatus: string;
  repairs: string;
}

export interface AdminConfig {
  upiId: string;
  amounts: Record<MembershipType, number>;
}

export interface Guest {
  id: string;
  name: string;
  timing: string;
  amount: number;
  status: 'Pending' | 'Approved';
  date: string;
}

export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  slot: string;
  status: 'In' | 'Out';
}

export interface Database {
  members: Member[];
  staff: Staff[];
  bookings: Booking[];
  payments: Payment[];
  maintenanceLogs: MaintenanceLog[];
  adminConfig: AdminConfig;
  guests: Guest[];
  attendance: Attendance[];
}
