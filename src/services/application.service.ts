import api from './api';
import type {
  ShiftApplication,
  ApplyForShiftRequest,
  ShiftApplicantsResponse,
  AcceptApplicationResponse,
} from '../types';
import type { ApplicationStatus } from '../constants/enums';

const APPLICATION = '/application';

export const applicationService = {
  /** Doctor: apply for a shift. */
  apply: async (body: ApplyForShiftRequest): Promise<ShiftApplication> => {
    const { data } = await api.post(`${APPLICATION}/apply`, body);
    return data.data;
  },

  /** Doctor: list own applications, optionally filtered by status. */
  getMyApplications: async (status?: ApplicationStatus): Promise<ShiftApplication[]> => {
    const params = status ? { status } : undefined;
    const { data } = await api.get(`${APPLICATION}/my`, { params });
    return data.data;
  },

  /** Doctor: withdraw a pending application. */
  withdraw: async (id: string): Promise<ShiftApplication> => {
    const { data } = await api.patch(`${APPLICATION}/${id}/withdraw`);
    return data.data;
  },

  /** Hospital: list applicants for a specific shift. */
  getApplicants: async (shiftId: string): Promise<ShiftApplicantsResponse> => {
    const { data } = await api.get(`${APPLICATION}/shift/${shiftId}/applicants`);
    return data.data;
  },

  /** Hospital: accept one applicant. */
  accept: async (applicationId: string): Promise<AcceptApplicationResponse> => {
    const { data } = await api.patch(`${APPLICATION}/${applicationId}/accept`);
    return data.data;
  },
};
