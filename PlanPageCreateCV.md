# KẾ HOẠCH TRIỂN KHAI FRONTEND: MODULE TẠO CV TÍCH HỢP AI

---

## BƯỚC 1: KHỞI TẠO KIẾN TRÚC, THƯ VIỆN & GLOBAL STATE
- **Công việc cụ thể:** Cài đặt các package cần thiết, tổ chức thư mục components và khởi tạo Global Store quản lý dữ liệu CV toàn cục của màn hình Editor.
- **Tích hợp/Thư viện:** Dùng `zustand` (hoặc Redux Toolkit) quản lý state.
- **Input:** Cấu trúc JSON dự kiến và các biến số từ bản thiết kế BE (`cvData`, `themeConfig`).
- **Handle Solution:**
  - Mở terminal chạy cài đặt các tool lõi.
  - Định nghĩa kiến trúc file: `src/store/cvStore.ts`, `src/services/cv.service.ts`, `src/pages/CreateCVPage.tsx`.
  - Khởi tạo `cvStore` quản lý các trạng thái tĩnh: `cvData`, `templateId`, `themeConfig`, `atsScore`.
  - Các Action cần viết trong store: `setCvData`, `updateSection`, `updateTheme`, `reorderBlocks`.
- **Output:** Sinh ra được Store toàn cục. Khi inject dữ liệu tĩnh vào code thì Store tự hoạt động log ra console.

---

## BƯỚC 2: BUILD BỘ KHUNG LAYOUT & MODULE GLOBAL STYLING
- **Công việc cụ thể:** Vẽ giao diện Màn hình tạo CV, phân tách Component Editor và Canvas rõ rệt. Cài đặt hệ thống cài đặt màu sắc, theme theo layer.
- **Tích hợp/Thư viện:** Tailwinds CSS, CSS Variables.
- **Input:** Object `themeConfig` (primaryColor, fontFamily) lấy từ cvStore. Các trigger button Color picker.
- **Handle Solution:**
  - Xây dựng Layout chia 3 phần: **Left Sidebar** (Toolbar: Đổi màu, Font, Theme, List Block Drag), **Main Area** (Bản Preview Document ảo), **Right Sidebar** (Chứa công cụ AI & điểm ATS).
  - Tại file bọc ngoài Main Area, gắn Custom properties (Inline-style dynamic): `style={{ '--cv-primary': themeConfig.primaryColor, '--cv-font': themeConfig.fontFamily }}`. Các phần tử CV bên trong chỉ dùng `var(--cv-primary)`.
- **Output:** Khi click đổi màu trên Editor Sidebar (trái), màn hình Layout Main đổi màu sắc, font chữ ngay lập tức KHÔNG lag (ưu điểm của var css).

---

## BƯỚC 3: TÍCH HỢP API LẤY BẢN NHÁP & CƠ CHẾ AUTO-SAVE
- **Công việc cụ thể:** Khởi động dữ liệu thực từ Backend khi bật Layout, thiết lập đồng bộ luồng đẩy dữ liệu hai chiều âm thầm (debounce auto-save).
- **Tích hợp/Thư viện:** `axios`, hàm tiện ích lodash `debounce` hoặc tạo custom hook `useDebounce`. Endpoints: `GET /api/cv-builder`, `PUT /api/cv-builder`.
- **Input:** JWT Token xác thực đăng nhập. Sự kiện biến thiên dữ liệu trên Global Store.
- **Handle Solution:**
  - Component `CreateCVPage` khi Mount (`useEffect` rỗng): Gọi tự động Endpoint GET bản nháp. Nhận payload về -> Bắn hành động nạp state vào `cvStore`.
  - Hàm **Auto-save**: Lắng nghe mọi biến thiên của Store. Cứ sau `1000 - 1500ms` kể từ lần cuối Store ngừng update (user nghỉ tay gõ), tiến hành gói payload gọi Endpoint PUT cập nhật DB.
- **Output:** Giao diện hiển thị đúng nội dung CV đang làm trên máy chủ. Thanh trạng thái chạy text mượt mà *"Đang lưu..."* đổi thành *"Đã lưu tự động lúc 14:05"*.

---

## BƯỚC 4: XÂY DỰNG EDITOR KÉO THẢ (DRAG & DROP) & CÔNG CỤ NHẬP LIỆU (RICH TEXT)
- **Công việc cụ thể:** Render trực tiếp các Block của CV (Kinh nghiệm, Học vấn) dưới dạng Drag-able Component. Hỗ trợ Format HTML (Rich-text) trong Editor.
- **Tích hợp/Thư viện:** Thư viện `@dnd-kit/core`, `@dnd-kit/sortable` (cho việc kéo thả), `react-quill` hoặc `tiptap` (soạn thảo văn bản).
- **Input:** Hành động nắm chuột kéo dọc của người dùng, Cú pháp nhập Text Bold/Italic từ phím.
- **Handle Solution:**
  - Lấy mảng `cvData` từ Store đúc thành Component, bọc vùng chứa bằng Wrapper `<DndContext>` và danh sách bằng `<SortableContext>`.
  - Khai báo logic hàm `onDragEnd`: Tìm id điểm rơi -> Tính lại index mảng mới -> Bắn Redux/Zustand Dispatch thay đổi vị trí. Giao diện tự động re-render đảo chỗ, trigger tiếp Auto-save (bước 3).
  - Tích hợp `react-quill` vào description của section, binding thẳng object value vào data.
- **Output:** Mảnh ghép Experience xếp hạng lại cực nhanh trên UI, Editor viết được chữ đậm gạch chân và được nhúng chuẩn HTML (không lỗi bảo mật XSS).

---

## BƯỚC 5: MODULE TRÍCH XUẤT & ĐỒNG BỘ PROFILE
- **Công việc cụ thể:** Kéo thông tin cá nhân hiện có đắp vào bảng CV mà không phải gõ lại.
- **Tích hợp/Thư viện:** Axios Endpoint: `GET /api/cv-builder/auto-fill`. UI Modal/Popover xác nhận.
- **Input:** Sự kiện user Click vào nút Đồng Bộ (Sync Profile).
- **Handle Solution:**
  - Hiển thị pop-up Confirm: "Tiến hành lấy dữ liệu sẽ ghi đè lên nội dung hiển thị hiện tại, bạn đồng ý?".
  - Fetch API -> Nhận data (Avatar, Tên, SĐT, Kỹ năng...) -> Dùng code JS (Object.assign hoặc Lodash merge) **Deep Merge** đè vào nhóm "Section cá nhân" trên `cvStore`.
- **Output:** Giao diện Canvas nháy Re-render một lần -> Data mới trích xuất từ tài khoản hiện đủ trên CV Canvas.

---

## BƯỚC 6: MODULE TRỢ LÝ AI GỢI Ý NỘI DUNG (AI SUGGESTION & FILLING)
- **Công việc cụ thể:** Giao tiếp mô hình GenAI để "mớm" chữ, sinh câu chữ chuyên nghiệp ngành nghề lúc người dùng đang bí văn.
- **Tích hợp/Thư viện:** API Endpoint: `POST /api/cv-builder/ai-suggest`. Drawers (Antd/MUI) hoặc Popover.
- **Input:** Ngành nghề (Industry), Phân mục (Ví dụ: Kinh nghiệm), Text User đang gõ dở.
- **Handle Solution:**
  - Ở kế bên khung soạn thảo (Rich Text), gắn 1 Icon nổi bật **"✨ AI Viết"**.
  - Nhấn vào mở Form nhỏ nhắn: Điền JD (tuỳ chọn) hoặc hệ thống tự bóc text trong ô gõ dở truyền xuống, fetch API POST.
  - Hiển thị phản hồi từ Server (List text strings) ra Component Card gợi ý.
  - Xử lý Nút **"Chèn vào":** Cộng dồn chuỗi (Append text) hoặc ghi đè chuỗi vào đúng Model Text Editor mà User đang thao tác.
- **Output:** Câu viết chuẩn form ATS ngạch IT (ví dụ) đính vào cv, và Auto-save hoạt dộng.

---

## BƯỚC 7: MODULE HỆ THỐNG CHẤM ĐIỂM TỐI ƯU ATS (ATS CHECKER)
- **Công việc cụ thể:** Giả lập hành vi của Tool quét CV để báo thiếu hụt từ khoá kỹ năng cho Candidate (Người ứng tuyển).
- **Tích hợp/Thư viện:** API Endpoint: `POST /api/cv-builder/ats-check`. Vòng tròn % Rating và Label Tags Component.
- **Input:** Khối Text toàn bộ nội dung CV rút trích bằng hàm nối chuỗi + Mô tả JD copy từ hãng.
- **Handle Solution:**
  - Tại Panel Tool 3 (Bên phải): Làm khu vực "Kiểm tra ATS". Cho TextArea dán JD.
  - Action Click: Compile Data dạng chữ cái thuần ném kèm JD gửi qua API POST `ats-check`.
  - Khớp payload nhận về: Update `atsStore` vào Global Store (Làm xoay vòng animation cho đẹp). Map mảng `missingKeywords` thành các khối Chips báo Đỏ (Cảnh báo).
- **Output:** Khi user gõ keyword đó vào lại CV -> bấm Check Lại -> Số điểm tăng lên và Chip đỏ tàng hình sang Khung Xanh hoàn thành. Tương tác Gamification rất tốt.

---

## BƯỚC 8: EXPORT ENGINE (KẾT XUẤT XUỐNG PDF)
- **Công việc cụ thể:** Từ bản Xem nháp Web kết xuất đúng khổ ảnh/tỷ lệ A4 sang PDF tải về máy.
- **Tích hợp/Thư viện:** File Blob stream Handler của Javascript. (Theo plan BE đang dùng Puppetter). API `POST /api/cv-builder/export`.
- **Input:** 1 Sự kiện click nút Download lớn. Phải render nút Export Loading Disable để block user ấn liên tục do PDF ngốn ram BE.
- **Handle Solution:**
  - Dùng Axios Fetch (Cực kỳ lưu ý: Cần thêm Config `{ responseType: 'blob' }` ở Client).
  - Lấy `response.data` gói thành thẻ File đối tượng `const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));`.
  - Dùng DOM Script (Virtual DOM) thiết kế thẻ `<a href={downloadUrl} download="YourCV.pdf" />`, ép click `a.click()`, sau đó dọn dẹp bộ nhớ URL để khỏi rách Memory trình duyệt.
- **Output:** Tệp tin PDF nằm thành công trong Window Downloads với chất lượng hiển thị in ấn không sai tỉ lệ cột bảng. Toàn bộ chu trình hoàn thành.
