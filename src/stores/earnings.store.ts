import { create } from 'zustand';
import { earningsService } from '../services/earnings.service';
import type { DoctorWallet, LedgerEntry } from '../types';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface EarningsState {
  doctorName: string;
  wallet: DoctorWallet | null;
  recentTransactions: LedgerEntry[];
  isLoading: boolean;

  loadDoctorEarnings: () => Promise<void>;
  clear: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useEarningsStore = create<EarningsState>((set) => ({
  doctorName: '',
  wallet: null,
  recentTransactions: [],
  isLoading: false,

  loadDoctorEarnings: async () => {
    set({ isLoading: true });
    try {
      const result = await earningsService.getDoctorEarnings();
      set({
        doctorName: result.doctorName,
        wallet: result.wallet,
        recentTransactions: result.recentTransactions,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  clear: () =>
    set({ doctorName: '', wallet: null, recentTransactions: [], isLoading: false }),
}));
