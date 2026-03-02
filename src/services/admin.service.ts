import api from './api';
import type {
  AdminVerificationsResponse,
  AdminVerifyRequest,
  AdminVerifyResponse,
  AdminUsersResponse,
  AdminUsersParams,
  AdminUserDetail,
  AdminSuspendResponse,
  AdminStats,
  AdminShiftsResponse,
  AdminShiftsParams,
  AdminDispute,
  AdminResolveDisputeRequest,
  AdminResolveDisputeResponse,
  AdminRevenueResponse,
  AdminReviewsResponse,
  AdminReviewsParams,
} from '../types';
import type { Role } from '../constants/enums';

const ADMIN = '/admin';

export const adminService = {
  // ── 2.1 GET /admin/verifications ────────────────────────────────────────────
  /** Get all pending verification requests, optionally filtered by role. */
  getVerifications: async (role?: Role): Promise<AdminVerificationsResponse> => {
    const params = role ? { role } : undefined;
    const { data } = await api.get(`${ADMIN}/verifications`, { params });
    return data.data;
  },

  // ── 2.2 PATCH /admin/verify/:userId ─────────────────────────────────────────
  /** Verify or reject a user account. */
  verifyUser: async (userId: string, body: AdminVerifyRequest): Promise<AdminVerifyResponse> => {
    const { data } = await api.patch(`${ADMIN}/verify/${userId}`, body);
    return data.data;
  },

  // ── 2.3 GET /admin/users ────────────────────────────────────────────────────
  /** Get all users with pagination and optional filters. */
  getUsers: async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
    const { data } = await api.get(`${ADMIN}/users`, { params });
    return data.data;
  },

  // ── 2.4 GET /admin/users/:userId ────────────────────────────────────────────
  /** Get detailed user information. */
  getUserDetail: async (userId: string): Promise<AdminUserDetail> => {
    const { data } = await api.get(`${ADMIN}/users/${userId}`);
    return data.data;
  },

  // ── 2.5 PATCH /admin/suspend/:userId ────────────────────────────────────────
  /** Suspend a user account. */
  suspendUser: async (userId: string): Promise<AdminSuspendResponse> => {
    const { data } = await api.patch(`${ADMIN}/suspend/${userId}`);
    return data.data;
  },

  // ── 2.6 PATCH /admin/unsuspend/:userId ──────────────────────────────────────
  /** Unsuspend a user account. */
  unsuspendUser: async (userId: string): Promise<AdminSuspendResponse> => {
    const { data } = await api.patch(`${ADMIN}/unsuspend/${userId}`);
    return data.data;
  },

  // ── 2.7 GET /admin/stats ────────────────────────────────────────────────────
  /** Get platform statistics (dashboard). */
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get(`${ADMIN}/stats`);
    return data.data;
  },

  // ── 2.8 GET /admin/shifts ───────────────────────────────────────────────────
  /** Get all shifts with pagination (admin overview). */
  getShifts: async (params?: AdminShiftsParams): Promise<AdminShiftsResponse> => {
    const { data } = await api.get(`${ADMIN}/shifts`, { params });
    return data.data;
  },

  // ── 2.9 GET /admin/disputes ─────────────────────────────────────────────────
  /** Get all disputed timesheets for admin review. */
  getDisputes: async (): Promise<AdminDispute[]> => {
    const { data } = await api.get(`${ADMIN}/disputes`);
    return data.data;
  },

  // ── 2.10 PATCH /admin/disputes/:timesheetId/resolve ─────────────────────────
  /** Resolve a disputed timesheet (approve as-is or override clock times). */
  resolveDispute: async (
    timesheetId: string,
    body: AdminResolveDisputeRequest,
  ): Promise<AdminResolveDisputeResponse> => {
    const { data } = await api.patch(`${ADMIN}/disputes/${timesheetId}/resolve`, body);
    return data.data;
  },

  // ── 2.11 GET /admin/revenue ─────────────────────────────────────────────────
  /** Get monthly revenue analytics (last 12 months). */
  getRevenue: async (): Promise<AdminRevenueResponse> => {
    const { data } = await api.get(`${ADMIN}/revenue`);
    return data.data;
  },

  // ── 2.12 GET /admin/reviews ─────────────────────────────────────────────────
  /** Get all reviews with pagination (admin moderation view). */
  getReviews: async (params?: AdminReviewsParams): Promise<AdminReviewsResponse> => {
    const { data } = await api.get(`${ADMIN}/reviews`, { params });
    return data.data;
  },
};
