import api from './api';
import type { CreateHospitalProfileRequest, UpdateHospitalProfileRequest, HospitalProfile } from '../types';

const HOSPITAL = '/hospital';

export const hospitalService = {
  createProfile: async (body: CreateHospitalProfileRequest): Promise<HospitalProfile> => {
    const { data } = await api.post(`${HOSPITAL}/profile`, body);
    return data.data;
  },

  getProfile: async (): Promise<HospitalProfile> => {
    const { data } = await api.get(`${HOSPITAL}/profile`);
    return data.data;
  },

  updateProfile: async (body: UpdateHospitalProfileRequest): Promise<HospitalProfile> => {
    const { data } = await api.patch(`${HOSPITAL}/profile`, body);
    return data.data;
  },
};
