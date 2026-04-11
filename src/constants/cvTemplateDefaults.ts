/**
 * Khớp PostgreSQL: bảng `cv_templates.id` (varchar) — FK `cv_builders.template_id` → `cv_templates.id`.
 * Bốn giá trị seed Neon/public thường là các id dưới đây.
 * Ghi đè mặc định: `VITE_DEFAULT_CV_TEMPLATE_ID` trong `.env`
 */
export const DEFAULT_CV_TEMPLATE_ID =
  (import.meta.env.VITE_DEFAULT_CV_TEMPLATE_ID as string | undefined)?.trim() || 'modern_it_01';

/** Đồng bộ với seed `cv_templates` (Neon): cùng bộ 4 id trong ảnh schema */
export const FALLBACK_CV_TEMPLATE_IDS: readonly string[] = [
  'creative_marketing_01',
  'elegant_business_01',
  'minimal_it_02',
  'modern_it_01'
];

/** Placeholder cũ trên FE, không có trong `cv_templates` */
export const LEGACY_CV_TEMPLATE_IDS = new Set<string>(['default_template', '2-column-dark']);
