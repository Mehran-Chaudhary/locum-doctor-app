import { create } from 'zustand';
import { adminService } from '../services/admin.service';
import type {
  AdminVerificationUser,
  AdminUserListItem,
  AdminUserDetail,
  AdminStats,
  AdminShiftListItem,
  AdminDispute,
  AdminRevenueMonth,
  AdminReviewListItem,
  AdminUsersParams,
  AdminShiftsParams,
  AdminReviewsParams,
  AdminVerifyRequest,
  AdminResolveDisputeRequest,
  PaginatedMeta,
} from '../types';
import type { Role } from '../constants/enums';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface AdminState {
  // ── Verifications ─────────────────────────────────────────────────────────
  verifications: AdminVerificationUser[];
  verificationsTotal: number;
  verificationsLoading: boolean;
  verificationsRoleFilter: Role | undefined;

  // ── Users ─────────────────────────────────────────────────────────────────
  users: AdminUserListItem[];
  usersMeta: PaginatedMeta | null;
  usersLoading: boolean;
  usersParams: AdminUsersParams;

  // ── User Detail ───────────────────────────────────────────────────────────
  userDetail: AdminUserDetail | null;
  userDetailLoading: boolean;

  // ── Stats (Dashboard) ────────────────────────────────────────────────────
  stats: AdminStats | null;
  statsLoading: boolean;

  // ── Shifts ────────────────────────────────────────────────────────────────
  shifts: AdminShiftListItem[];
  shiftsMeta: PaginatedMeta | null;
  shiftsLoading: boolean;
  shiftsParams: AdminShiftsParams;

  // ── Disputes ──────────────────────────────────────────────────────────────
  disputes: AdminDispute[];
  disputesLoading: boolean;

  // ── Revenue ───────────────────────────────────────────────────────────────
  revenueByMonth: AdminRevenueMonth[];
  revenueLoading: boolean;

  // ── Reviews ───────────────────────────────────────────────────────────────
  reviews: AdminReviewListItem[];
  reviewsMeta: PaginatedMeta | null;
  reviewsLoading: boolean;
  reviewsParams: AdminReviewsParams;

  // ── Mutating flag (verify, suspend, resolve, etc.) ────────────────────────
  mutating: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────

  // Verifications
  loadVerifications: (role?: Role) => Promise<void>;

  // Verify / Reject
  verifyUser: (userId: string, body: AdminVerifyRequest) => Promise<void>;

  // Users
  loadUsers: (params?: AdminUsersParams) => Promise<void>;
  loadMoreUsers: () => Promise<void>;

  // User Detail
  loadUserDetail: (userId: string) => Promise<void>;
  clearUserDetail: () => void;

  // Suspend / Unsuspend
  suspendUser: (userId: string) => Promise<void>;
  unsuspendUser: (userId: string) => Promise<void>;

  // Stats
  loadStats: () => Promise<void>;

  // Shifts
  loadShifts: (params?: AdminShiftsParams) => Promise<void>;
  loadMoreShifts: () => Promise<void>;

  // Disputes
  loadDisputes: () => Promise<void>;
  resolveDispute: (timesheetId: string, body: AdminResolveDisputeRequest) => Promise<void>;

  // Revenue
  loadRevenue: () => Promise<void>;

  // Reviews
  loadReviews: (params?: AdminReviewsParams) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAdminStore = create<AdminState>((set, get) => ({
  // ── Initial State ─────────────────────────────────────────────────────────
  verifications: [],
  verificationsTotal: 0,
  verificationsLoading: false,
  verificationsRoleFilter: undefined,

  users: [],
  usersMeta: null,
  usersLoading: false,
  usersParams: { page: 1, limit: 20 },

  userDetail: null,
  userDetailLoading: false,

  stats: null,
  statsLoading: false,

  shifts: [],
  shiftsMeta: null,
  shiftsLoading: false,
  shiftsParams: { page: 1, limit: 20 },

  disputes: [],
  disputesLoading: false,

  revenueByMonth: [],
  revenueLoading: false,

  reviews: [],
  reviewsMeta: null,
  reviewsLoading: false,
  reviewsParams: { page: 1, limit: 20 },

  mutating: false,

  // ── Verifications ─────────────────────────────────────────────────────────
  loadVerifications: async (role) => {
    set({ verificationsLoading: true, verificationsRoleFilter: role });
    try {
      const result = await adminService.getVerifications(role);
      set({
        verifications: result.users,
        verificationsTotal: result.total,
        verificationsLoading: false,
      });
    } catch {
      set({ verificationsLoading: false });
    }
  },

  // ── Verify / Reject ───────────────────────────────────────────────────────
  verifyUser: async (userId, body) => {
    set({ mutating: true });
    try {
      await adminService.verifyUser(userId, body);
      // Remove from verifications list
      set((s) => ({
        verifications: s.verifications.filter((u) => u.id !== userId),
        verificationsTotal: s.verificationsTotal - 1,
        mutating: false,
      }));
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  loadUsers: async (params) => {
    const merged = { ...get().usersParams, ...params, page: 1 };
    set({ usersLoading: true, usersParams: merged });
    try {
      const result = await adminService.getUsers(merged);
      set({ users: result.users, usersMeta: result.meta, usersLoading: false });
    } catch {
      set({ usersLoading: false });
    }
  },

  loadMoreUsers: async () => {
    const { usersMeta, usersParams, usersLoading } = get();
    if (usersLoading) return;
    if (usersMeta && usersMeta.page >= usersMeta.totalPages) return;

    const nextPage = (usersMeta?.page ?? 0) + 1;
    const merged = { ...usersParams, page: nextPage };
    set({ usersLoading: true, usersParams: merged });
    try {
      const result = await adminService.getUsers(merged);
      set((s) => ({
        users: [...s.users, ...result.users],
        usersMeta: result.meta,
        usersLoading: false,
      }));
    } catch {
      set({ usersLoading: false });
    }
  },

  // ── User Detail ───────────────────────────────────────────────────────────
  loadUserDetail: async (userId) => {
    set({ userDetailLoading: true, userDetail: null });
    try {
      const user = await adminService.getUserDetail(userId);
      set({ userDetail: user, userDetailLoading: false });
    } catch {
      set({ userDetailLoading: false });
    }
  },

  clearUserDetail: () => set({ userDetail: null }),

  // ── Suspend / Unsuspend ───────────────────────────────────────────────────
  suspendUser: async (userId) => {
    set({ mutating: true });
    try {
      const result = await adminService.suspendUser(userId);
      // Update user detail if viewing
      set((s) => ({
        mutating: false,
        userDetail: s.userDetail?.id === userId
          ? { ...s.userDetail, status: result.user.status }
          : s.userDetail,
        // Update in users list
        users: s.users.map((u) =>
          u.id === userId ? { ...u, status: result.user.status } : u,
        ),
      }));
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  unsuspendUser: async (userId) => {
    set({ mutating: true });
    try {
      const result = await adminService.unsuspendUser(userId);
      set((s) => ({
        mutating: false,
        userDetail: s.userDetail?.id === userId
          ? { ...s.userDetail, status: result.user.status }
          : s.userDetail,
        users: s.users.map((u) =>
          u.id === userId ? { ...u, status: result.user.status } : u,
        ),
      }));
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  loadStats: async () => {
    set({ statsLoading: true });
    try {
      const stats = await adminService.getStats();
      set({ stats, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  // ── Shifts ────────────────────────────────────────────────────────────────
  loadShifts: async (params) => {
    const merged = { ...get().shiftsParams, ...params, page: 1 };
    set({ shiftsLoading: true, shiftsParams: merged });
    try {
      const result = await adminService.getShifts(merged);
      set({ shifts: result.shifts, shiftsMeta: result.meta, shiftsLoading: false });
    } catch {
      set({ shiftsLoading: false });
    }
  },

  loadMoreShifts: async () => {
    const { shiftsMeta, shiftsParams, shiftsLoading } = get();
    if (shiftsLoading) return;
    if (shiftsMeta && shiftsMeta.page >= shiftsMeta.totalPages) return;

    const nextPage = (shiftsMeta?.page ?? 0) + 1;
    const merged = { ...shiftsParams, page: nextPage };
    set({ shiftsLoading: true, shiftsParams: merged });
    try {
      const result = await adminService.getShifts(merged);
      set((s) => ({
        shifts: [...s.shifts, ...result.shifts],
        shiftsMeta: result.meta,
        shiftsLoading: false,
      }));
    } catch {
      set({ shiftsLoading: false });
    }
  },

  // ── Disputes ──────────────────────────────────────────────────────────────
  loadDisputes: async () => {
    set({ disputesLoading: true });
    try {
      const disputes = await adminService.getDisputes();
      set({ disputes, disputesLoading: false });
    } catch {
      set({ disputesLoading: false });
    }
  },

  resolveDispute: async (timesheetId, body) => {
    set({ mutating: true });
    try {
      await adminService.resolveDispute(timesheetId, body);
      // Remove from disputes list after resolution
      set((s) => ({
        disputes: s.disputes.filter((d) => d.id !== timesheetId),
        mutating: false,
      }));
    } catch (error) {
      set({ mutating: false });
      throw error;
    }
  },

  // ── Revenue ───────────────────────────────────────────────────────────────
  loadRevenue: async () => {
    set({ revenueLoading: true });
    try {
      const result = await adminService.getRevenue();
      set({ revenueByMonth: result.revenueByMonth, revenueLoading: false });
    } catch {
      set({ revenueLoading: false });
    }
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  loadReviews: async (params) => {
    const merged = { ...get().reviewsParams, ...params, page: 1 };
    set({ reviewsLoading: true, reviewsParams: merged });
    try {
      const result = await adminService.getReviews(merged);
      set({ reviews: result.reviews, reviewsMeta: result.meta, reviewsLoading: false });
    } catch {
      set({ reviewsLoading: false });
    }
  },

  loadMoreReviews: async () => {
    const { reviewsMeta, reviewsParams, reviewsLoading } = get();
    if (reviewsLoading) return;
    if (reviewsMeta && reviewsMeta.page >= reviewsMeta.totalPages) return;

    const nextPage = (reviewsMeta?.page ?? 0) + 1;
    const merged = { ...reviewsParams, page: nextPage };
    set({ reviewsLoading: true, reviewsParams: merged });
    try {
      const result = await adminService.getReviews(merged);
      set((s) => ({
        reviews: [...s.reviews, ...result.reviews],
        reviewsMeta: result.meta,
        reviewsLoading: false,
      }));
    } catch {
      set({ reviewsLoading: false });
    }
  },
}));
