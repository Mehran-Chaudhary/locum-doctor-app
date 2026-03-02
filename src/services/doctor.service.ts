import api from './api';
import type { CreateDoctorProfileRequest, UpdateDoctorProfileRequest, DoctorProfile } from '../types';

const DOCTOR = '/doctor';

export const doctorService = {
  createProfile: async (body: CreateDoctorProfileRequest): Promise<DoctorProfile> => {
    const { data } = await api.post(`${DOCTOR}/profile`, body);
    return data.data;
  },

  getProfile: async (): Promise<DoctorProfile> => {
    const { data } = await api.get(`${DOCTOR}/profile`);
    return data.data;
  },

  updateProfile: async (body: UpdateDoctorProfileRequest): Promise<DoctorProfile> => {
    const { data } = await api.patch(`${DOCTOR}/profile`, body);
    return data.data;
  },
};
