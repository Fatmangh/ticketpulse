import { COMMISSION_RATE } from '../utils/constants.js';

export function calculateCommission(totalAmount: number, rate: number = COMMISSION_RATE): number {
  return Math.round(totalAmount * rate * 100) / 100;
}
