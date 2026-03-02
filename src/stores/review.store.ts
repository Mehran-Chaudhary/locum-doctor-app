import { create } from 'zustand';
import { reviewService } from '../services/review.service';
import type { Review, ReviewListResponse, SubmitReviewRequest } from '../types';

// ─── State Shape ──────────────────────────────────────────────────────────────
interface ReviewState {
  // ── Doctor Reviews (reviews *about* a doctor) ─────────────────────────────
  doctorReviews: Review[];
  doctorReviewsMeta: ReviewListResponse['meta'] | null;
  doctorReviewsLoading: boolean;

  // ── Hospital Reviews (reviews *about* a hospital) ─────────────────────────
  hospitalReviews: Review[];
  hospitalReviewsMeta: ReviewListResponse['meta'] | null;
  hospitalReviewsLoading: boolean;

  // ── My Review for a specific timesheet ────────────────────────────────────
  myReview: Review | null;
  myReviewLoading: boolean;
  myReviewChecked: boolean;

  /** True while submitting a review. */
  submitting: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  loadDoctorReviews: (doctorProfileId: string, page?: number, limit?: number) => Promise<void>;
  loadMoreDoctorReviews: (doctorProfileId: string) => Promise<void>;

  loadHospitalReviews: (hospitalProfileId: string, page?: number, limit?: number) => Promise<void>;
  loadMoreHospitalReviews: (hospitalProfileId: string) => Promise<void>;

  checkMyReview: (timesheetId: string) => Promise<void>;

  hospitalReviewDoctor: (timesheetId: string, body: SubmitReviewRequest) => Promise<Review>;
  doctorReviewHospital: (timesheetId: string, body: SubmitReviewRequest) => Promise<Review>;

  clearDoctorReviews: () => void;
  clearHospitalReviews: () => void;
  clearMyReview: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useReviewStore = create<ReviewState>((set, get) => ({
  doctorReviews: [],
  doctorReviewsMeta: null,
  doctorReviewsLoading: false,

  hospitalReviews: [],
  hospitalReviewsMeta: null,
  hospitalReviewsLoading: false,

  myReview: null,
  myReviewLoading: false,
  myReviewChecked: false,

  submitting: false,

  // ── Load Doctor Reviews (page 1) ──────────────────────────────────────────
  loadDoctorReviews: async (doctorProfileId, page = 1, limit = 20) => {
    set({ doctorReviewsLoading: true });
    try {
      const result = await reviewService.getDoctorReviews(doctorProfileId, page, limit);
      set({
        doctorReviews: result.reviews,
        doctorReviewsMeta: result.meta,
        doctorReviewsLoading: false,
      });
    } catch {
      set({ doctorReviewsLoading: false });
    }
  },

  // ── Load More Doctor Reviews (next page) ──────────────────────────────────
  loadMoreDoctorReviews: async (doctorProfileId) => {
    const { doctorReviewsMeta, doctorReviewsLoading } = get();
    if (doctorReviewsLoading || !doctorReviewsMeta) return;
    if (doctorReviewsMeta.page >= doctorReviewsMeta.totalPages) return;

    set({ doctorReviewsLoading: true });
    try {
      const nextPage = doctorReviewsMeta.page + 1;
      const result = await reviewService.getDoctorReviews(
        doctorProfileId,
        nextPage,
        doctorReviewsMeta.limit,
      );
      set((s) => ({
        doctorReviews: [...s.doctorReviews, ...result.reviews],
        doctorReviewsMeta: result.meta,
        doctorReviewsLoading: false,
      }));
    } catch {
      set({ doctorReviewsLoading: false });
    }
  },

  // ── Load Hospital Reviews (page 1) ────────────────────────────────────────
  loadHospitalReviews: async (hospitalProfileId, page = 1, limit = 20) => {
    set({ hospitalReviewsLoading: true });
    try {
      const result = await reviewService.getHospitalReviews(hospitalProfileId, page, limit);
      set({
        hospitalReviews: result.reviews,
        hospitalReviewsMeta: result.meta,
        hospitalReviewsLoading: false,
      });
    } catch {
      set({ hospitalReviewsLoading: false });
    }
  },

  // ── Load More Hospital Reviews (next page) ────────────────────────────────
  loadMoreHospitalReviews: async (hospitalProfileId) => {
    const { hospitalReviewsMeta, hospitalReviewsLoading } = get();
    if (hospitalReviewsLoading || !hospitalReviewsMeta) return;
    if (hospitalReviewsMeta.page >= hospitalReviewsMeta.totalPages) return;

    set({ hospitalReviewsLoading: true });
    try {
      const nextPage = hospitalReviewsMeta.page + 1;
      const result = await reviewService.getHospitalReviews(
        hospitalProfileId,
        nextPage,
        hospitalReviewsMeta.limit,
      );
      set((s) => ({
        hospitalReviews: [...s.hospitalReviews, ...result.reviews],
        hospitalReviewsMeta: result.meta,
        hospitalReviewsLoading: false,
      }));
    } catch {
      set({ hospitalReviewsLoading: false });
    }
  },

  // ── Check My Review ───────────────────────────────────────────────────────
  checkMyReview: async (timesheetId) => {
    set({ myReviewLoading: true, myReviewChecked: false });
    try {
      const review = await reviewService.getMyReview(timesheetId);
      set({ myReview: review, myReviewLoading: false, myReviewChecked: true });
    } catch {
      set({ myReview: null, myReviewLoading: false, myReviewChecked: true });
    }
  },

  // ── Hospital Reviews Doctor ───────────────────────────────────────────────
  hospitalReviewDoctor: async (timesheetId, body) => {
    set({ submitting: true });
    try {
      const result = await reviewService.hospitalReviewsDoctor(timesheetId, body);
      set({ submitting: false, myReview: result.review, myReviewChecked: true });
      return result.review;
    } catch (error) {
      set({ submitting: false });
      throw error;
    }
  },

  // ── Doctor Reviews Hospital ───────────────────────────────────────────────
  doctorReviewHospital: async (timesheetId, body) => {
    set({ submitting: true });
    try {
      const result = await reviewService.doctorReviewsHospital(timesheetId, body);
      set({ submitting: false, myReview: result.review, myReviewChecked: true });
      return result.review;
    } catch (error) {
      set({ submitting: false });
      throw error;
    }
  },

  // ── Clear ─────────────────────────────────────────────────────────────────
  clearDoctorReviews: () => set({ doctorReviews: [], doctorReviewsMeta: null }),
  clearHospitalReviews: () => set({ hospitalReviews: [], hospitalReviewsMeta: null }),
  clearMyReview: () => set({ myReview: null, myReviewChecked: false }),
}));
