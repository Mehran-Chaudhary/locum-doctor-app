import api from './api';
import type { DoctorEarningsResponse, HospitalBillingResponse } from '../types';

// ── Doctor Earnings ───────────────────────────────────────────────────────────
export const earningsService = {
  /** GET /earnings/doctor — Doctor's wallet dashboard. */
  getDoctorEarnings: async (): Promise<DoctorEarningsResponse> => {
    const { data } = await api.get('/earnings/doctor');
    return data.data;
  },
};

// ── Hospital Billing ──────────────────────────────────────────────────────────
export const billingService = {
  /** GET /billing/hospital — Hospital billing dashboard. */
  getHospitalBilling: async (): Promise<HospitalBillingResponse> => {
    const { data } = await api.get('/billing/hospital');
    return data.data;
  },
};
