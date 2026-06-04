import { useState, useEffect, useRef, useCallback } from 'react';

// A4 tại 96dpi: 297mm = 1122px (chiều cao có thể dùng content)
// Trừ padding top/bottom: p-8 = 32px * 2 = 64px
export const A4_HEIGHT_PX = 1122;
export const A4_CONTENT_HEIGHT = A4_HEIGHT_PX - 64;

/** Mỗi trang tối đa bao nhiêu "block" (kể cả sub-items) */
const MAX_BLOCKS_PER_PAGE = 5;

/** Các section có danh sách items có thể split qua nhiều trang */
const LIST_SECTIONS = ['education', 'experience', 'projects', 'awards'];

export interface CvPageSection {
  id: string;
  /** Index item bắt đầu render (chỉ dùng cho LIST_SECTIONS) */
  itemStart?: number;
  /** Index item kết thúc render (exclusive, chỉ dùng cho LIST_SECTIONS) */
  itemEnd?: number;
}

export interface CvPage {
  leftSections: CvPageSection[];
  rightSections: CvPageSection[];
}

/**
 * Hook tính toán phân trang CV dựa trên block count (mỗi section/item = 1 block).
 * Tối đa MAX_BLOCKS_PER_PAGE block mỗi cột mỗi trang. List sections được split theo item.
 */
export function useCvPagination(
  leftSections: string[],
  rightSections: string[],
  cvData?: any,
) {
  const [sectionHeights, setSectionHeights] = useState<Record<string, number>>({});
  const observersRef = useRef<Map<string, ResizeObserver>>(new Map());

  const measureRef = useCallback((sectionId: string) => (el: HTMLElement | null) => {
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

  const pages = computePages(leftSections, rightSections, cvData);

  return { pages, sectionHeights, measureRef };
}

function computePages(
  leftSections: string[],
  rightSections: string[],
  cvData?: any,
): CvPage[] {
  const leftPages = packColumn(leftSections, cvData);
  const rightPages = packColumn(rightSections, cvData);

  const totalPages = Math.max(leftPages.length, rightPages.length, 1);
  const pages: CvPage[] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push({
      leftSections: leftPages[i] || [],
      rightSections: rightPages[i] || [],
    });
  }
  return pages;
}

/**
 * Greedy bin-packing theo block count.
 * - Simple sections (profile/contact/about/skills): 1 block, không thể split.
 * - List sections (education/experience/projects/awards): 1 block/item, split khi cần.
 * - customSections: mỗi custom sub-section = 1 block (không split item con).
 */
function packColumn(sections: string[], cvData?: any): CvPageSection[][] {
  const pages: CvPageSection[][] = [];
  let currentPage: CvPageSection[] = [];
  let currentBlocks = 0;

  const flushPage = () => {
    if (currentPage.length > 0) pages.push(currentPage);
    currentPage = [];
    currentBlocks = 0;
  };

  const addSimple = (id: string) => {
    if (currentBlocks + 1 > MAX_BLOCKS_PER_PAGE && currentPage.length > 0) flushPage();
    currentPage.push({ id });
    currentBlocks += 1;
  };

  for (const id of sections) {
    if (!LIST_SECTIONS.includes(id)) {
      // Simple section (profile/contact/about/skills/customSections): 1 block
      addSimple(id);
      continue;
    }

    // List section: mỗi item = 1 block, split nếu cần
    const items: any[] = (cvData && Array.isArray(cvData[id])) ? cvData[id] : [];

    if (items.length === 0) {
      // Section trống: chỉ có header = 1 block
      addSimple(id);
      continue;
    }

    let itemStart = 0;
    while (itemStart < items.length) {
      // Kiểm tra có chỗ cho header không
      if (currentBlocks + 1 > MAX_BLOCKS_PER_PAGE && currentPage.length > 0) {
        flushPage();
      }

      // Số slot còn lại sau khi đặt header (= 1 block)
      const slotsForItems = MAX_BLOCKS_PER_PAGE - currentBlocks - 1;
      // Phải có ít nhất 1 item, kể cả khi vừa bắt đầu trang mới
      const take = Math.max(1, slotsForItems);
      const itemEnd = Math.min(itemStart + take, items.length);

      currentPage.push({ id, itemStart, itemEnd });
      // 1 block cho header + số items
      currentBlocks += 1 + (itemEnd - itemStart);

      itemStart = itemEnd;

      // Nếu còn items chưa đặt thì sang trang mới
      if (itemStart < items.length) {
        flushPage();
      }
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}
