import { create } from 'zustand';
import { timesheetService } from '../services/timesheet.service';
import type {
  Timesheet,
  ClockInResponse,
  ClockOutResponse,
} from '../types';
import type { TimesheetStatus } from '../constants/enums';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface TimesheetState {
  // ── Doctor: own timesheets ────────────────────────────────────────────────
  doctorTimesheets: Timesheet[];
  doctorTimesheetsLoading: boolean;

  // ── Hospital: timesheets for hospital's shifts ────────────────────────────
  hospitalTimesheets: Timesheet[];
  hospitalTimesheetsLoading: boolean;

  // ── Single timesheet for a shift ──────────────────────────────────────────
  currentTimesheet: Timesheet | null;
  currentTimesheetLoading: boolean;

  /** True while a mutating operation (clock-in/out, approve, dispute) runs. */
  mutating: boolean;

  // ── Doctor Actions ────────────────────────────────────────────────────────
  loadDoctorTimesheets: (status?: TimesheetStatus) => Promise<void>;
  clockIn: (shiftId: string, latitude: number, longitude: number) => Promise<ClockInResponse>;
  clockOut: (shiftId: string, latitude: number, longitude: number) => Promise<ClockOutResponse>;

  // ── Hospital Actions ──────────────────────────────────────────────────────
  loadHospitalTimesheets: (status?: TimesheetStatus) => Promise<void>;
  approveTimesheet: (timesheetId: string) => Promise<void>;
  disputeTimesheet: (timesheetId: string, note?: string) => Promise<void>;

  // ── Shared Actions ────────────────────────────────────────────────────────
  loadTimesheetByShift: (shiftId: string) => Promise<void>;
  clearCurrentTimesheet: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useTimesheetStore = create<TimesheetState>((set, get) => ({
  doctorTimesheets: [],
  doctorTimesheetsLoading: false,

  hospitalTimesheets: [],
  hospitalTimesheetsLoading: false,

  currentTimesheet: null,
  currentTimesheetLoading: false,

  mutating: false,

  // ── Doctor: Load My Timesheets ────────────────────────────────────────────
  loadDoctorTimesheets: async (status) => {
    set({ doctorTimesheetsLoading: true });
    try {
      const timesheets = await timesheetService.getDoctorTimesheets(status);
      set({ doctorTimesheets: timesheets, doctorTimesheetsLoading: false });
    } catch {
      set({ doctorTimesheetsLoading: false });
    }
  },

  // ── Doctor: Clock In ──────────────────────────────────────────────────────
  clockIn: async (shiftId, latitude, longitude) => {
    set({ mutating: true });
    try {
      const result = await timesheetService.clockIn(shiftId, { latitude, longitude });
      // Update current timesheet if viewing
      set((s) => ({
        currentTimesheet: result.timesheet,
        // Also update in doctor timesheets list if present
        doctorTimesheets: s.doctorTimesheets.map((t) =>
          t.shiftId === shiftId ? result.timesheet : t,
        ),
        mutating: false,
      }));
      return result;
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Doctor: Clock Out ─────────────────────────────────────────────────────
  clockOut: async (shiftId, latitude, longitude) => {
    set({ mutating: true });
    try {
      const result = await timesheetService.clockOut(shiftId, { latitude, longitude });
      set((s) => ({
        currentTimesheet: result.timesheet,
        doctorTimesheets: s.doctorTimesheets.map((t) =>
          t.shiftId === shiftId ? result.timesheet : t,
        ),
        mutating: false,
      }));
      return result;
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Hospital: Load Timesheets ─────────────────────────────────────────────
  loadHospitalTimesheets: async (status) => {
    set({ hospitalTimesheetsLoading: true });
    try {
      const timesheets = await timesheetService.getHospitalTimesheets(status);
      set({ hospitalTimesheets: timesheets, hospitalTimesheetsLoading: false });
    } catch {
      set({ hospitalTimesheetsLoading: false });
    }
  },

  // ── Hospital: Approve ─────────────────────────────────────────────────────
  approveTimesheet: async (timesheetId) => {
    set({ mutating: true });
    try {
      const result = await timesheetService.approve(timesheetId);
      set((s) => ({
        currentTimesheet: s.currentTimesheet?.id === timesheetId
          ? result.timesheet
          : s.currentTimesheet,
        hospitalTimesheets: s.hospitalTimesheets.map((t) =>
          t.id === timesheetId ? result.timesheet : t,
        ),
        mutating: false,
      }));
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Hospital: Dispute ─────────────────────────────────────────────────────
  disputeTimesheet: async (timesheetId, note) => {
    set({ mutating: true });
    try {
      const result = await timesheetService.dispute(timesheetId, note ? { note } : undefined);
      set((s) => ({
        currentTimesheet: s.currentTimesheet?.id === timesheetId
          ? result.timesheet
          : s.currentTimesheet,
        hospitalTimesheets: s.hospitalTimesheets.map((t) =>
          t.id === timesheetId ? result.timesheet : t,
        ),
        mutating: false,
      }));
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Shared: Load by Shift ─────────────────────────────────────────────────
  loadTimesheetByShift: async (shiftId) => {
    set({ currentTimesheetLoading: true, currentTimesheet: null });
    try {
      const timesheet = await timesheetService.getByShift(shiftId);
      set({ currentTimesheet: timesheet, currentTimesheetLoading: false });
    } catch {
      set({ currentTimesheetLoading: false });
    }
  },

  clearCurrentTimesheet: () => set({ currentTimesheet: null }),
}));
