import api from './api';
import type {
  Shift,
  CreateShiftRequest,
  ShiftFeedParams,
  PaginatedResponse,
} from '../types';
import type { ShiftStatus } from '../constants/enums';

const SHIFT = '/shift';

export const shiftService = {
  /** Hospital: create a new shift. */
  create: async (body: CreateShiftRequest): Promise<Shift> => {
    const { data } = await api.post(SHIFT, body);
    return data.data;
  },

  /** Hospital: get own shifts, optionally filtered by status. */
  getHospitalShifts: async (status?: ShiftStatus): Promise<Shift[]> => {
    const params = status ? { status } : undefined;
    const { data } = await api.get(`${SHIFT}/hospital`, { params });
    return data.data;
  },

  /** Doctor: paginated geo-spatial shift feed (requires auth). */
  getFeed: async (params?: ShiftFeedParams): Promise<PaginatedResponse<Shift>> => {
    const { data } = await api.get(`${SHIFT}/feed`, { params });
    return data.data;
  },

  /** Public: paginated shift feed (no auth required). */
  getPublicFeed: async (params?: ShiftFeedParams): Promise<PaginatedResponse<Shift>> => {
    const { data } = await api.get(`${SHIFT}/public-feed`, { params });
    return data.data;
  },

  /** Authenticated user: get single shift details. */
  getById: async (id: string): Promise<Shift> => {
    const { data } = await api.get(`${SHIFT}/${id}`);
    return data.data;
  },

  /** Public: get single shift details (no auth required). */
  getPublicById: async (id: string): Promise<Shift> => {
    const { data } = await api.get(`${SHIFT}/public/${id}`);
    return data.data;
  },

  /** Hospital: cancel an OPEN shift. */
  cancel: async (id: string): Promise<Shift> => {
    const { data } = await api.patch(`${SHIFT}/${id}/cancel`);
    return data.data;
  },
};
