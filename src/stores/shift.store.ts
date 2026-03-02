import { create } from 'zustand';
import { shiftService } from '../services/shift.service';
import type { Shift, CreateShiftRequest, ShiftFeedParams, PaginatedResponse } from '../types';
import type { ShiftStatus } from '../constants/enums';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface ShiftState {
  // ── Doctor feed ───────────────────────────────────────────────────────────
  feed: Shift[];
  feedMeta: { total: number; page: number; limit: number; totalPages: number } | null;
  feedLoading: boolean;
  feedRefreshing: boolean;
  feedParams: ShiftFeedParams;

  // ── Hospital's own shifts ─────────────────────────────────────────────────
  hospitalShifts: Shift[];
  hospitalShiftsLoading: boolean;

  // ── Single shift detail ───────────────────────────────────────────────────
  currentShift: Shift | null;
  detailLoading: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Doctor: load first page of feed (replaces existing). */
  loadFeed: (params?: ShiftFeedParams) => Promise<void>;
  /** Doctor: load next page of feed (appends). */
  loadMoreFeed: () => Promise<void>;
  /** Doctor: refresh feed (pull-to-refresh). */
  refreshFeed: () => Promise<void>;
  /** Update feed filter params. */
  setFeedParams: (params: ShiftFeedParams) => void;

  /** Hospital: load own shifts. */
  loadHospitalShifts: (status?: ShiftStatus) => Promise<void>;

  /** Any: load single shift detail. */
  loadShiftDetail: (id: string) => Promise<void>;
  clearShiftDetail: () => void;

  /** Hospital: create a shift. */
  createShift: (body: CreateShiftRequest) => Promise<Shift>;
  /** Hospital: cancel a shift. */
  cancelShift: (id: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useShiftStore = create<ShiftState>((set, get) => ({
  feed: [],
  feedMeta: null,
  feedLoading: false,
  feedRefreshing: false,
  feedParams: { sortBy: 'starting_soonest', page: 1, limit: 20 },

  hospitalShifts: [],
  hospitalShiftsLoading: false,

  currentShift: null,
  detailLoading: false,

  // ── Doctor Feed ───────────────────────────────────────────────────────────
  loadFeed: async (params) => {
    const merged = { ...get().feedParams, ...params, page: 1 };
    set({ feedLoading: true, feedParams: merged });
    try {
      const result = await shiftService.getFeed(merged);
      set({ feed: result.data, feedMeta: result.meta, feedLoading: false });
    } catch {
      set({ feedLoading: false });
    }
  },

  loadMoreFeed: async () => {
    const { feedMeta, feedParams, feedLoading } = get();
    if (feedLoading) return;
    if (feedMeta && feedMeta.page >= feedMeta.totalPages) return;

    const nextPage = (feedMeta?.page ?? 0) + 1;
    const merged = { ...feedParams, page: nextPage };
    set({ feedLoading: true, feedParams: merged });
    try {
      const result = await shiftService.getFeed(merged);
      set((s) => ({
        feed: [...s.feed, ...result.data],
        feedMeta: result.meta,
        feedLoading: false,
      }));
    } catch {
      set({ feedLoading: false });
    }
  },

  refreshFeed: async () => {
    const merged = { ...get().feedParams, page: 1 };
    set({ feedRefreshing: true, feedParams: merged });
    try {
      const result = await shiftService.getFeed(merged);
      set({ feed: result.data, feedMeta: result.meta, feedRefreshing: false });
    } catch {
      set({ feedRefreshing: false });
    }
  },

  setFeedParams: (params) => {
    set((s) => ({ feedParams: { ...s.feedParams, ...params } }));
  },

  // ── Hospital Shifts ───────────────────────────────────────────────────────
  loadHospitalShifts: async (status) => {
    set({ hospitalShiftsLoading: true });
    try {
      const shifts = await shiftService.getHospitalShifts(status);
      set({ hospitalShifts: shifts, hospitalShiftsLoading: false });
    } catch {
      set({ hospitalShiftsLoading: false });
    }
  },

  // ── Single Shift Detail ───────────────────────────────────────────────────
  loadShiftDetail: async (id) => {
    set({ detailLoading: true, currentShift: null });
    try {
      const shift = await shiftService.getById(id);
      set({ currentShift: shift, detailLoading: false });
    } catch {
      set({ detailLoading: false });
    }
  },

  clearShiftDetail: () => set({ currentShift: null }),

  // ── Create ────────────────────────────────────────────────────────────────
  createShift: async (body) => {
    const shift = await shiftService.create(body);
    // Prepend to hospital list so UI updates instantly
    set((s) => ({ hospitalShifts: [shift, ...s.hospitalShifts] }));
    return shift;
  },

  // ── Cancel ────────────────────────────────────────────────────────────────
  cancelShift: async (id) => {
    const updated = await shiftService.cancel(id);
    set((s) => ({
      hospitalShifts: s.hospitalShifts.map((sh) => (sh.id === id ? updated : sh)),
      currentShift: s.currentShift?.id === id ? updated : s.currentShift,
    }));
  },
}));
