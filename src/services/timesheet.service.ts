import api from './api';
import type {
  Timesheet,
  ClockInRequest,
  ClockInResponse,
  ClockOutRequest,
  ClockOutResponse,
  ApproveTimesheetResponse,
  DisputeTimesheetRequest,
  DisputeTimesheetResponse,
} from '../types';
import type { TimesheetStatus } from '../constants/enums';

const TIMESHEET = '/timesheet';

export const timesheetService = {
  // ── Doctor: Clock In ────────────────────────────────────────────────────────
  clockIn: async (shiftId: string, body: ClockInRequest): Promise<ClockInResponse> => {
    const { data } = await api.post(`${TIMESHEET}/shift/${shiftId}/clock-in`, body);
    return data.data;
  },

  // ── Doctor: Clock Out ───────────────────────────────────────────────────────
  clockOut: async (shiftId: string, body: ClockOutRequest): Promise<ClockOutResponse> => {
    const { data } = await api.post(`${TIMESHEET}/shift/${shiftId}/clock-out`, body);
    return data.data;
  },

  // ── Doctor: Get My Timesheets ───────────────────────────────────────────────
  getDoctorTimesheets: async (status?: TimesheetStatus): Promise<Timesheet[]> => {
    const params = status ? { status } : undefined;
    const { data } = await api.get(`${TIMESHEET}/doctor`, { params });
    return data.data;
  },

  // ── Hospital: Get Hospital Timesheets ───────────────────────────────────────
  getHospitalTimesheets: async (status?: TimesheetStatus): Promise<Timesheet[]> => {
    const params = status ? { status } : undefined;
    const { data } = await api.get(`${TIMESHEET}/hospital`, { params });
    return data.data;
  },

  // ── Hospital: Approve Timesheet ─────────────────────────────────────────────
  approve: async (timesheetId: string): Promise<ApproveTimesheetResponse> => {
    const { data } = await api.patch(`${TIMESHEET}/${timesheetId}/approve`);
    return data.data;
  },

  // ── Hospital: Dispute Timesheet ─────────────────────────────────────────────
  dispute: async (timesheetId: string, body?: DisputeTimesheetRequest): Promise<DisputeTimesheetResponse> => {
    const { data } = await api.patch(`${TIMESHEET}/${timesheetId}/dispute`, body ?? {});
    return data.data;
  },

  // ── Any Verified User: Get Timesheet by Shift ──────────────────────────────
  getByShift: async (shiftId: string): Promise<Timesheet> => {
    const { data } = await api.get(`${TIMESHEET}/shift/${shiftId}`);
    return data.data;
  },
};
