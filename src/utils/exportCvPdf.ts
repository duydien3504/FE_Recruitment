import { domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';

const EXPORT_STYLE_ID = 'cv-pdf-export-styles';

function injectExportStyles() {
  if (document.getElementById(EXPORT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = EXPORT_STYLE_ID;
  style.textContent = `
    .cv-pdf-exporting .group\\/block > .absolute,
    .cv-pdf-exporting .group\\/item > .absolute,
    .cv-pdf-exporting .group\\/ci > .absolute,
    .cv-pdf-exporting .group\\/cs .opacity-0 {
      display: none !important;
    }
    .cv-pdf-exporting .ProseMirror-focused {
      outline: none !important;
      box-shadow: none !important;
    }
    .cv-pdf-exporting img {
      object-fit: cover !important;
    }
  `;
  document.head.appendChild(style);
}

function removeExportStyles() {
  document.getElementById(EXPORT_STYLE_ID)?.remove();
}

/** Lấy các trang CV theo thứ tự (cv-paper, cv-paper-2, ...) */
function getCvPageElements(): HTMLElement[] {
  const byId: HTMLElement[] = [];
  const first = document.getElementById('cv-paper');
  if (first) byId.push(first);

  let i = 2;
  while (true) {
    const el = document.getElementById(`cv-paper-${i}`);
    if (!el) break;
    byId.push(el);
    i += 1;
  }

  if (byId.length > 0) return byId;
  return Array.from(document.querySelectorAll<HTMLElement>('.html-to-pdf-target'));
}

/** Fit ảnh vào A4 giữ nguyên tỉ lệ, căn góc trên-trái (không méo) */
function fitToA4Page(imgW: number, imgH: number, pdfW: number, pdfH: number) {
  const ratio = imgW / imgH;
  let w = pdfW;
  let h = pdfW / ratio;
  if (h > pdfH) {
    h = pdfH;
    w = pdfH * ratio;
  }
  return { x: 0, y: 0, w, h };
}

/**
 * Xuất PDF từ canvas đang hiển thị — giữ đúng layout, theme và phân trang trên màn hình.
 * Dùng modern-screenshot (hỗ trợ oklch/lab của Tailwind v4), không dùng html2canvas.
 */
export async function exportCanvasToPdf(filename = 'StitchRecruit_CV_Export.pdf'): Promise<void> {
  const pageEls = getCvPageElements();
  if (pageEls.length === 0) {
    throw new Error('Không tìm thấy trang CV. Hãy mở trình tạo CV và thử lại.');
  }

  injectExportStyles();
  document.body.classList.add('cv-pdf-exporting');

  const savedStyles = pageEls.map(el => ({
    transform: el.style.transform,
    marginBottom: el.style.marginBottom,
    boxShadow: el.style.boxShadow,
  }));

  pageEls.forEach(el => {
    el.style.transform = 'none';
    el.style.marginBottom = '0';
    el.style.boxShadow = 'none';
  });

  try {
    await document.fonts.ready;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageEls.length; i++) {
      const el = pageEls[i];
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
      await new Promise(r => setTimeout(r, 200));

      const canvas = await domToCanvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        fetch: {
          requestInit: { mode: 'cors' },
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const { x, y, w, h } = fitToA4Page(canvas.width, canvas.height, pdfW, pdfH);

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', x, y, w, h);
    }

    pdf.save(filename);
  } finally {
    pageEls.forEach((el, idx) => {
      el.style.transform = savedStyles[idx].transform;
      el.style.marginBottom = savedStyles[idx].marginBottom;
      el.style.boxShadow = savedStyles[idx].boxShadow;
    });
    document.body.classList.remove('cv-pdf-exporting');
    removeExportStyles();
  }
}
