import { create } from 'zustand';
import { billingService } from '../services/earnings.service';
import type { HospitalBilling, LedgerEntry } from '../types';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface BillingState {
  hospitalName: string;
  billing: HospitalBilling | null;
  recentTransactions: LedgerEntry[];
  isLoading: boolean;

  loadHospitalBilling: () => Promise<void>;
  clear: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useBillingStore = create<BillingState>((set) => ({
  hospitalName: '',
  billing: null,
  recentTransactions: [],
  isLoading: false,

  loadHospitalBilling: async () => {
    set({ isLoading: true });
    try {
      const result = await billingService.getHospitalBilling();
      set({
        hospitalName: result.hospitalName,
        billing: result.billing,
        recentTransactions: result.recentTransactions,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  clear: () =>
    set({ hospitalName: '', billing: null, recentTransactions: [], isLoading: false }),
}));
