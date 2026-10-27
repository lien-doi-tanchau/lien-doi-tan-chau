# WEBSITE LIÊN ĐỘI TRƯỜNG TIỂU HỌC TÂN CHÂU – AN GIANG

## Các file (đặt cùng thư mục gốc GitHub)
- `index.html`: trang chủ hiển thị đúng ảnh gốc 1536 × 1024, không cần chỉnh đường dẫn.
- `giao-dien-goc.png`: hình mẫu do bạn cung cấp, giữ nguyên.
- `site-data.json`: dữ liệu lớp phủ chỉnh sửa, ban đầu trống.
- `admin.html`: công cụ chỉnh sửa lớp phủ (không phải hệ thống đăng nhập bảo mật).

## Cách đăng website
1. Upload `index.html`, `giao-dien-goc.png`, `site-data.json` lên nhánh `main` tại thư mục gốc.
2. GitHub Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.
3. Mở `https://lien-doi-tanchau.github.io/lien-doi-tanchau/`.

## Cách chỉnh sửa
1. Mở `admin.html` trên máy tính hoặc dùng địa chỉ `/admin.html` nếu đã upload lên GitHub.
2. Thêm lớp chữ, nền che, hình ảnh, vùng liên kết; kéo để di chuyển; thay đổi kích thước bằng ô rộng/cao.
3. Bấm **Xuất site-data.json** và upload thay thế file cùng tên trên GitHub.
4. Chờ Pages cập nhật và tải lại website.

## Giới hạn quan trọng
- Ảnh gốc là PNG nên chữ/nút trong ảnh không phải các thành phần HTML thực; không thể sửa độc lập hoặc bấm vào menu gốc. Có thể thêm lớp phủ/vùng liên kết.
- Bản nháp chỉnh sửa chỉ nằm trong trình duyệt đang sử dụng; cần xuất JSON để công khai thay đổi.
- GitHub Pages không có hệ thống đăng nhập/ phân quyền máy chủ. Không đăng `admin.html` nếu cần giữ riêng công cụ. Quyền sửa file công khai vẫn do GitHub quản lý.
- Trang chủ luôn hiển thị hình PNG ngay cả khi file JSON không tải được.
