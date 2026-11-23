# 🐷 FamilyFinance — Sổ Chi Tiêu Tổ Ấm (Đa Gia Đình)

Ứng dụng web quản lý tài chính cá nhân đa gia đình, thiết kế tối ưu cho **2 vợ chồng** theo phong cách **Cozy Toybox & Playful Sticker Book** (Soft Neo-Brutalism), kết nối trực tiếp **Supabase PostgreSQL + Realtime** và deploy hoàn toàn miễn phí trên **GitHub Pages**.

- **Live Demo:** `https://vuonggnouv.github.io/FamilyFinance`

---

## ✨ Tính năng nổi bật

1. **Đa gia đình & Đồng bộ Realtime 2 vợ chồng:**
   - Tạo gia đình mới (`create_family` tự động khởi tạo 3 ví + 5 danh mục) hoặc nhập Mã Tổ Ấm (`join_family_by_code`).
   - Đồng bộ tức thì qua `postgres_changes` trên 4 bảng `transactions`, `wallets`, `debts_loans`, `repayments`.
2. **Sổ Thu / Chi / Chuyển ví & Hoàn tiền Trả hàng (Refund):**
   - Nhập số tiền VND tự động phân cách hàng nghìn (`1.500.000`).
   - Popup **Trả hàng 3 Component** (`Ô nhập tiền hoàn` + `Xác nhận hoàn` + `Hoàn toàn bộ 100%`) kèm **Toast Hoàn tác 10 giây** (`undo_refund_transaction`).
3. **Sổ Cho Mượn (`LEND`) & Khoản Nợ (`DEBT`):**
   - Thanh tiến độ trả góp từng đợt (`record_repayment`), nút gạt `affects_balance` cho khoản Nợ, tự động khóa sổ khi tất toán 100% kèm Hoàn tác 10 giây.
4. **Dashboard Linh vật Heo Đất & Biểu đồ trực quan:**
   - Linh vật Heo Đất SVG tự đổi 4 biểu cảm theo tỉ lệ tiết kiệm tháng.
   - Biểu đồ cột đôi Thu - Chi + đường % tiết kiệm và biểu đồ Donut cơ cấu chi tiêu.
5. **Bảo vệ dữ liệu & PWA:**
   - Bắt lỗi khóa ngoại (`23503`) khi xóa Ví/Danh mục đã có giao dịch và gợi ý Ẩn (Lưu trữ).
   - Hỗ trợ cài đặt **Add to Home Screen (PWA)** trên cả iOS và Android.

---

## 🚀 Hướng dẫn chạy Local

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy server development (http://localhost:4200/#/dashboard)
npm start

# 3. Build bản Production
npm run build
```
