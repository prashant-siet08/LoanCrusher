import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface Loan {
  id: number;
  name: string;
  amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
  emi: number;
  interest_type: string;
  created_at: string;
}

export interface ScheduleItem {
  month: number;
  emi: number;
  interest: number;
  principal: number;
  prepayment: number;
  outstanding: number;
  status: string;
}

export interface LoanDetail extends Loan {
  schedule: ScheduleItem[];
  payments: any[];
  prepayments: any[];
}
