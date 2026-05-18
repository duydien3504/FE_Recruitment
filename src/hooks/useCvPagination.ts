import { useState, useEffect, useRef, useCallback } from 'react';

// A4 tại 96dpi: 297mm = 1122px (chiều cao có thể dùng content)
// Trừ padding top/bottom: p-8 = 32px * 2 = 64px
export const A4_HEIGHT_PX = 1122;
export const A4_CONTENT_HEIGHT = A4_HEIGHT_PX - 64; // trừ padding

export interface CvPage {
  leftSections: string[];
  rightSections: string[];
}

/**
 * Hook tính toán phân trang CV dựa trên chiều cao thực tế của từng section.
 * @param leftSections - danh sách section IDs ở cột trái
 * @param rightSections - danh sách section IDs ở cột phải
 * @returns pages, sectionHeights, measureRef
 */
export function useCvPagination(leftSections: string[], rightSections: string[]) {
  const [sectionHeights, setSectionHeights] = useState<Record<string, number>>({});
  const observersRef = useRef<Map<string, ResizeObserver>>(new Map());

  const measureRef = useCallback((sectionId: string) => (el: HTMLElement | null) => {
    // Dọn observer cũ
    if (observersRef.current.has(sectionId)) {
      observersRef.current.get(sectionId)!.disconnect();
      observersRef.current.delete(sectionId);
    }
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? el.getBoundingClientRect().height;
      setSectionHeights(prev => {
        if (prev[sectionId] === Math.ceil(h)) return prev;
        return { ...prev, [sectionId]: Math.ceil(h) };
      });
    });
    ro.observe(el);
    observersRef.current.set(sectionId, ro);
  }, []);

  useEffect(() => {
    return () => {
      observersRef.current.forEach(ro => ro.disconnect());
      observersRef.current.clear();
    };
  }, []);

  // Tính pages mỗi khi heights thay đổi
  const pages = computePages(leftSections, rightSections, sectionHeights);

  return { pages, sectionHeights, measureRef };
}

/**
 * Greedy bin-packing: chia sections vào các trang A4.
 * Cột nào (left/right) bị tràn trước thì tạo trang mới cho cả hai cột.
 */
function computePages(
  leftSections: string[],
  rightSections: string[],
  heights: Record<string, number>
): CvPage[] {
  const pages: CvPage[] = [];

  // Gom sections theo cột
  const leftPages = packColumn(leftSections, heights, A4_CONTENT_HEIGHT);
  const rightPages = packColumn(rightSections, heights, A4_CONTENT_HEIGHT);

  const totalPages = Math.max(leftPages.length, rightPages.length, 1);
  for (let i = 0; i < totalPages; i++) {
    pages.push({
      leftSections: leftPages[i] || [],
      rightSections: rightPages[i] || [],
    });
  }
  return pages;
}

function packColumn(sections: string[], heights: Record<string, number>, maxH: number): string[][] {
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentH = 0;

  for (const sectionId of sections) {
    const h = heights[sectionId] ?? 0;
    // Nếu section đầu tiên của trang mà vẫn vượt height → vẫn cho vào (không thể cắt)
    if (currentH + h > maxH && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [sectionId];
      currentH = h;
    } else {
      currentPage.push(sectionId);
      currentH += h;
    }
  }
  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}
