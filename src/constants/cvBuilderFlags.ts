/**
 * GET /cv-builder khi chưa có draft đang khiến một số bản backend trả 500 (FK / upsert sai).
 * Mặc định **không** gọi API này lúc mount — chỉ tải GET /cv-builder/templates + store.
 *
 * Khi backend đã xử lý đúng “chưa có bản nháp” (200/404, không insert sai), đặt trong `.env`:
 * `VITE_CV_BUILDER_FETCH_DRAFT_ON_MOUNT=true`
 */
export const CV_BUILDER_FETCH_DRAFT_ON_MOUNT =
  import.meta.env.VITE_CV_BUILDER_FETCH_DRAFT_ON_MOUNT === 'true';
