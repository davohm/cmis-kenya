import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COUNTY_ADMIN'
  | 'COUNTY_OFFICER'
  | 'COOPERATIVE_ADMIN'
  | 'AUDITOR'
  | 'TRAINER'
  | 'CITIZEN';

export type CooperativeStatus =
  | 'PENDING_REGISTRATION'
  | 'REGISTERED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'UNDER_LIQUIDATION'
  | 'DISSOLVED'
  | 'INACTIVE';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';
