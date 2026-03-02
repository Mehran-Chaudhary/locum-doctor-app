import api from './api';
import type {
  Review,
  SubmitReviewRequest,
  SubmitReviewResponse,
  ReviewListResponse,
} from '../types';

const REVIEW = '/review';

export const reviewService = {
  // ── Hospital Reviews Doctor ─────────────────────────────────────────────────
  hospitalReviewsDoctor: async (
    timesheetId: string,
    body: SubmitReviewRequest,
  ): Promise<SubmitReviewResponse> => {
    const { data } = await api.post(
      `${REVIEW}/timesheet/${timesheetId}/hospital-reviews-doctor`,
      body,
    );
    return data.data;
  },

  // ── Doctor Reviews Hospital ─────────────────────────────────────────────────
  doctorReviewsHospital: async (
    timesheetId: string,
    body: SubmitReviewRequest,
  ): Promise<SubmitReviewResponse> => {
    const { data } = await api.post(
      `${REVIEW}/timesheet/${timesheetId}/doctor-reviews-hospital`,
      body,
    );
    return data.data;
  },

  // ── Get Doctor Reviews (Paginated) ──────────────────────────────────────────
  getDoctorReviews: async (
    doctorProfileId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ReviewListResponse> => {
    const { data } = await api.get(`${REVIEW}/doctor/${doctorProfileId}`, {
      params: { page, limit },
    });
    return data.data;
  },

  // ── Get Hospital Reviews (Paginated) ────────────────────────────────────────
  getHospitalReviews: async (
    hospitalProfileId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ReviewListResponse> => {
    const { data } = await api.get(`${REVIEW}/hospital/${hospitalProfileId}`, {
      params: { page, limit },
    });
    return data.data;
  },

  // ── Check If I Already Reviewed ─────────────────────────────────────────────
  getMyReview: async (timesheetId: string): Promise<Review | null> => {
    const { data } = await api.get(`${REVIEW}/timesheet/${timesheetId}/mine`);
    return data.data;
  },
};
