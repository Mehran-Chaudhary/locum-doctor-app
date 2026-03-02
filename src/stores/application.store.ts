import { create } from 'zustand';
import { applicationService } from '../services/application.service';
import type {
  ShiftApplication,
  ShiftApplicantsResponse,
} from '../types';
import type { ApplicationStatus } from '../constants/enums';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface ApplicationState {
  // ── Doctor: own applications ──────────────────────────────────────────────
  myApplications: ShiftApplication[];
  myApplicationsLoading: boolean;

  // ── Hospital: shift applicants ────────────────────────────────────────────
  applicantsData: ShiftApplicantsResponse | null;
  applicantsLoading: boolean;

  /** True while a mutating operation (apply / withdraw / accept) runs. */
  mutating: boolean;

  // ── Doctor actions ────────────────────────────────────────────────────────
  loadMyApplications: (status?: ApplicationStatus) => Promise<void>;
  applyForShift: (shiftId: string) => Promise<ShiftApplication>;
  withdrawApplication: (id: string) => Promise<void>;

  // ── Hospital actions ──────────────────────────────────────────────────────
  loadApplicants: (shiftId: string) => Promise<void>;
  acceptApplication: (applicationId: string) => Promise<void>;
  clearApplicants: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useApplicationStore = create<ApplicationState>((set, get) => ({
  myApplications: [],
  myApplicationsLoading: false,

  applicantsData: null,
  applicantsLoading: false,

  mutating: false,

  // ── Doctor: Load My Applications ──────────────────────────────────────────
  loadMyApplications: async (status) => {
    set({ myApplicationsLoading: true });
    try {
      const apps = await applicationService.getMyApplications(status);
      set({ myApplications: apps, myApplicationsLoading: false });
    } catch {
      set({ myApplicationsLoading: false });
    }
  },

  // ── Doctor: Apply ─────────────────────────────────────────────────────────
  applyForShift: async (shiftId) => {
    set({ mutating: true });
    try {
      const app = await applicationService.apply({ shiftId });
      // Prepend to local list
      set((s) => ({
        myApplications: [app, ...s.myApplications],
        mutating: false,
      }));
      return app;
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Doctor: Withdraw ──────────────────────────────────────────────────────
  withdrawApplication: async (id) => {
    set({ mutating: true });
    try {
      const updated = await applicationService.withdraw(id);
      set((s) => ({
        myApplications: s.myApplications.map((a) => (a.id === id ? updated : a)),
        mutating: false,
      }));
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Hospital: Load Applicants ─────────────────────────────────────────────
  loadApplicants: async (shiftId) => {
    set({ applicantsLoading: true, applicantsData: null });
    try {
      const data = await applicationService.getApplicants(shiftId);
      set({ applicantsData: data, applicantsLoading: false });
    } catch {
      set({ applicantsLoading: false });
    }
  },

  // ── Hospital: Accept ──────────────────────────────────────────────────────
  acceptApplication: async (applicationId) => {
    set({ mutating: true });
    try {
      await applicationService.accept(applicationId);
      // Refresh applicants list to show updated statuses
      const current = get().applicantsData;
      if (current) {
        const refreshed = await applicationService.getApplicants(current.shiftId);
        set({ applicantsData: refreshed, mutating: false });
      } else {
        set({ mutating: false });
      }
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  clearApplicants: () => set({ applicantsData: null }),
}));
