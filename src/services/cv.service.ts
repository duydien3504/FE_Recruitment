import axios from 'axios';
import { getAccessToken } from '../utils/auth';
import type { GetTemplatesResponse, CvTemplate } from '../types/cv.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
      config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const CvService = {
  // Lấy bản draft CV (GET /api/v1/cv-builder)
  getDraft: async () => {
    const response = await apiClient.get('/cv-builder');
    return response.data;
  },
  
  // Cập nhật/Auto-save CV (PUT /api/cv-builder)
  updateDraft: async (payload: any) => {
    const response = await apiClient.put('/cv-builder', payload);
    return response.data;
  },
  
  // Trích xuất & Đồng bộ Profile (GET /api/cv-builder/auto-fill)
  autoFillProfile: async () => {
    const response = await apiClient.get('/cv-builder/auto-fill');
    return response.data;
  },
  
  // Lấy danh sách template CV (GET /api/v1/cv-builder/templates)
  // Public endpoint — không cần token
  getTemplates: async (category?: string): Promise<GetTemplatesResponse> => {
    const params = category ? { category } : {};
    // Public endpoint nên không cần header Authorization
    const response = await axios.get(`${API_URL}/api/v1/cv-builder/templates`, { params });
    return response.data;
  },

  // Lấy thông tin 1 template theo id
  getTemplateById: async (id: string): Promise<{ success: boolean; data: CvTemplate }> => {
    const response = await axios.get(`${API_URL}/api/v1/cv-builder/templates/${id}`);
    return response.data;
  },
  
  // Trợ lý AI Suggestion (POST /api/cv-builder/ai-suggest)
  aiSuggest: async (payload: { industry: string; section: string; currentText?: string }) => {
    const response = await apiClient.post('/cv-builder/ai-suggest', payload);
    return response.data;
  },
  
  // Quét chấm điểm ATS (POST /api/cv-builder/ats-check)
  checkAts: async (payload: { cvText: string; jdText: string }) => {
    const response = await apiClient.post('/cv-builder/ats-check', payload);
    return response.data;
  },
  
  // Kết xuất export PDF (POST /api/cv-builder/export)
  exportCv: async (payload?: any) => {
    const response = await apiClient.post('/cv-builder/export', payload, {
      responseType: 'blob' // Cực kỳ quan trọng để bắt file stream download
    });
    return response.data;
  },

  // Lấy HTML xem trước (POST /api/v1/cv-builder/preview)
  getPreviewHtml: async (payload: any): Promise<string> => {
    const response = await apiClient.post('/cv-builder/preview', payload);
    return response.data;
  }
};
