# Hướng dẫn Triển khai Game Trắc Nghiệm Trực Tuyến Lên Cloud Miễn Phí

Dự án này sử dụng **Node.js, Express và Socket.IO** để chạy trò chơi loại dần thời gian thực. Làm theo các bước sau để đưa ứng dụng lên web:

---

## Bước 1: Chuẩn bị trên máy tính cục bộ (Local)
1. Cài đặt **Node.js** phiên bản mới nhất trên máy tính.
2. Giải nén file ZIP dự án vào một thư mục.
3. Mở terminal tại thư mục dự án và chạy lệnh cài đặt thư viện:
   ```bash
   npm install
   ```
4. Chạy thử nghiệm cục bộ:
   ```bash
   npm start
   ```
   * Truy cập người chơi: `http://localhost:3000`
   * Truy cập quản trò: `http://localhost:3000/admin.html`

---

## Bước 2: Đưa mã nguồn lên GitHub
1. Tạo một Repository mới trên [GitHub](https://github.com) (chọn Public).
2. Tại thư mục dự án trên máy, chạy các lệnh Git sau:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Quiz game"
   git branch -M main
   git remote add origin <URL-Repository-Của-Bạn>
   git push -u origin main
   ```

---

## Bước 3: Deploy lên Render (Miễn phí & Dễ nhất)
1. Truy cập [Render.com](https://render.com) và đăng nhập bằng tài khoản GitHub của bạn.
2. Bấm nút **New +** ở góc trên bên phải $ightarrow$ Chọn **Web Service**.
3. Kết nối với kho chứa (Repository) GitHub của dự án trắc nghiệm vừa tạo.
4. Cấu hình thông số triển khai:
   * **Name:** `quiz-biol10` (hoặc tên tùy ý)
   * **Region:** Chọn khu vực gần nhất (ví dụ: *Singapore*).
   * **Branch:** `main`
   * **Root Directory:** *(để trống)*
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** Chọn gói **Free** (Miễn phí).
5. Bấm **Create Web Service**.
