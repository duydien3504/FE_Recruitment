import axios, { type AxiosError } from 'axios';
import {
  DEFAULT_CV_TEMPLATE_ID,
  FALLBACK_CV_TEMPLATE_IDS,
  LEGACY_CV_TEMPLATE_IDS
} from '../constants/cvTemplateDefaults';
import { getAccessToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/** Ảnh data:URL/base64 quá lớn có thể làm vỡ giới hạn JSON/DB phía server → 500 */
const MAX_INLINE_AVATAR_CHARS = 120_000;

function sanitizeDraftPayload<T extends Record<string, unknown>>(payload: T): T {
  const clone = JSON.parse(JSON.stringify(payload)) as T;
  const personal = (clone as { cvData?: { personal?: { avatarUrl?: string } } }).cvData?.personal;
  const url = personal?.avatarUrl;
  if (
    personal &&
    typeof url === 'string' &&
    url.startsWith('data:') &&
    url.length > MAX_INLINE_AVATAR_CHARS
  ) {
    personal.avatarUrl = '';
  }
  return clone;
}

function normalizeTemplateId(raw: unknown): string | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

/** Gom mọi template id có trong payload (để đối chiếu với DB, tránh id “cũ” trong store) */
export function collectTemplateIdsFromApi(apiPayload: unknown): string[] {
  const ids: string[] = [];
  const add = (raw: unknown) => {
    const id = normalizeTemplateId(raw);
    if (id && !ids.includes(id)) ids.push(id);
  };

  const fromItem = (item: unknown) => {
    if (!item || typeof item !== 'object') return;
    const o = item as Record<string, unknown>;
    // cv_templates.id (varchar, vd modern_it_01); một số API dùng code/slug
    add(o.id ?? o.templateId ?? o.template_id ?? o.code ?? o.slug ?? o.uuid ?? o.pk);
  };

  const walkArray = (arr: unknown[]) => {
    for (const it of arr) fromItem(it);
  };

  const walkPageLike = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    const inner =
      o.content ?? o.records ?? o.list ?? o.rows ?? o.elements ?? o.templates ?? o.items ?? o.results;
    if (Array.isArray(inner)) walkArray(inner);
  };

  if (Array.isArray(apiPayload)) {
    walkArray(apiPayload);
    return ids;
  }

  if (apiPayload && typeof apiPayload === 'object') {
    const root = apiPayload as Record<string, unknown>;
    const data = root.data ?? root.templates ?? root.items ?? root.results;
    if (Array.isArray(data)) walkArray(data);
    else if (data && typeof data === 'object' && !Array.isArray(data)) {
      fromItem(data);
      const dObj = data as Record<string, unknown>;
      const innerList = dObj.templates ?? dObj.items ?? dObj.results ?? dObj.content ?? dObj.records;
      if (Array.isArray(innerList)) walkArray(innerList);
      else walkPageLike(data);
    }

    // { success, data: { content: [...] } } — Spring Page
    if (root.data && typeof root.data === 'object') walkPageLike(root.data);

    // Trường hợp id nằm trực tiếp ở root (một template đơn)
    if (!ids.length) {
      add(root.templateId ?? root.template_id ?? root.id);
    }
  }
  return ids;
}

/**
 * Ưu tiên preferred nếu còn trong danh sách API; không thì lấy phần tử đầu.
 * Bỏ qua preferred nếu là placeholder legacy (không có trong DB).
 */
export function matchOrFirstTemplateId(preferred: string | undefined, apiPayload: unknown): string | null {
  const ids = collectTemplateIdsFromApi(apiPayload);
  if (!ids.length) return null;
  const pref = preferred?.trim();
  if (pref && !LEGACY_CV_TEMPLATE_IDS.has(pref) && ids.includes(pref)) return pref;
  return ids[0];
}

/** Lấy id mẫu CV đầu tiên từ nhiều dạng JSON backend có thể trả về */
export function extractFirstTemplateId(apiPayload: unknown): string | null {
  return matchOrFirstTemplateId(undefined, apiPayload);
}

/** templateId từ GET draft (camelCase hoặc snake_case) */
export function pickTemplateIdFromDraftData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const raw = d.templateId ?? d.template_id;
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

function flattenNestedMessage(m: string): string {
  const t = m.trim();
  if (t.startsWith('{') && t.includes('"message"')) {
    try {
      const inner = JSON.parse(t) as { message?: string };
      if (typeof inner.message === 'string' && inner.message.trim()) return inner.message.trim();
    } catch {
      /* ignore */
    }
  }
  return m;
}

/** Thông báo lỗi đọc được từ body phản hồi (Spring thường trả message / error) */
export function formatCvApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : 'Lỗi không xác định';
  }
  const ax = err as AxiosError<{ message?: string; error?: string; code?: number }>;
  const data = ax.response?.data as unknown;
  if (typeof data === 'string' && data.trim()) return flattenNestedMessage(data);
  if (data && typeof data === 'object') {
    const o = data as { message?: string; error?: string };
    const m = o.message ?? o.error;
    if (m != null) {
      if (typeof m === 'string') {
        const text = flattenNestedMessage(m);
        if (text.includes('fk_cv_builders_template_id')) {
          return 'templateId không tồn tại trong bảng mẫu CV (foreign key). Hãy seed bảng template trên DB; body JSON chỉ dùng templateId (camelCase).';
        }
        return text;
      }
      return JSON.stringify(m);
    }
  }
  const status = ax.response?.status;
  if (status === 500) {
    return 'Máy chủ trả lỗi 500 (Internal Server Error). Cần xem log backend — thường do bug hoặc cấu hình DB tại endpoint lưu CV.';
  }
  return ax.message;
}

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' }
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

  // Cập nhật/Auto-save CV (PUT /api/v1/cv-builder) — schema BE chỉ cho phép camelCase templateId
  updateDraft: async (payload: Record<string, unknown>) => {
    const rawTid = payload.templateId ?? payload.template_id;
    let tidStr =
      rawTid === undefined || rawTid === null ? '' : typeof rawTid === 'string' ? rawTid : String(rawTid);
    tidStr = tidStr.trim() || DEFAULT_CV_TEMPLATE_ID;
    const { template_id: _dropSnake, ...rest } = payload;
    const body = sanitizeDraftPayload({
      ...rest,
      templateId: tidStr
    });
    const response = await apiClient.put('/cv-builder', body);
    return response.data;
  },

  // Trích xuất & Đồng bộ Profile (GET /api/cv-builder/auto-fill)
  autoFillProfile: async () => {
    const response = await apiClient.get('/cv-builder/auto-fill');
    return response.data;
  },

  // Lấy template CV đa ngành (GET /api/cv-builder/templates)
  getTemplates: async (industry?: string) => {
    const params = industry ? { industry } : {};
    const response = await apiClient.get('/cv-builder/templates', { params });
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

  // Kết xuất export PDF (POST /api/v1/cv-builder/export)
  exportCv: async (payload?: Record<string, unknown>) => {
    const p = payload && typeof payload === 'object' ? { ...payload } : {};
    delete p.template_id;
    const rawTid = p.templateId;
    const s =
      rawTid !== undefined && rawTid !== null
        ? (typeof rawTid === 'string' ? rawTid : String(rawTid)).trim() || DEFAULT_CV_TEMPLATE_ID
        : DEFAULT_CV_TEMPLATE_ID;
    p.templateId = s;
    const response = await apiClient.post('/cv-builder/export', p, {
      responseType: 'blob'
    });
    return response.data;
  }
};

/**
 * Luôn trả về một template_id hợp lệ (varchar khớp cv_template.id).
 * Ưu tiên danh sách GET /templates; sau đó id đã biết trong seed; cuối cùng DEFAULT_CV_TEMPLATE_ID.
 */
export async function resolveCvTemplateIdForSave(current: string): Promise<string> {
  try {
    const tplRes = await CvService.getTemplates();
    const matched =
      matchOrFirstTemplateId(current, tplRes) ??
      matchOrFirstTemplateId(current, (tplRes as { data?: unknown })?.data);
    if (matched) return matched;
  } catch (e) {
    console.warn('[CV Builder] getTemplates không dùng được khi resolve template:', e);
  }

  const cur = (current ?? '').trim();
  if (cur && !LEGACY_CV_TEMPLATE_IDS.has(cur) && FALLBACK_CV_TEMPLATE_IDS.includes(cur)) {
    return cur;
  }
  return DEFAULT_CV_TEMPLATE_ID;
}
