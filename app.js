import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan'; // Middleware ghi log các request vào console
import 'dotenv/config';

// ====================================================================================================================================================================================
// Router dành cho doanh nghiệp (business-services)
import authRouter from './src/modules/business-services/auth/auth.route.js'; // Router quản lý xác thực (đăng nhập, đăng xuất)
import roomTypeRouter from './src/modules/business-services/rooms-management/room-types/room_type.route.js'; // Router quản lý loại phòng
import roomDetailRouter from './src/modules/business-services/rooms-management/room-details/room_detail.route.js'; // Router quản lý chi tiết phòng
import staffRoutes from './src/modules/business-services/staff-management/staff.route.js'; // Router quản lý nhân viên
import customerRoutes from './src/modules/business-services/customer-management/customer.route.js'; // Router quản lý khách hàng
import categoryRoutes from './src/modules/business-services/warehouse-management/product-categories/category.route.js'; // Router quản lý danh mục sản phẩm kho
import productRoutes from './src/modules/business-services/warehouse-management/products/product.route.js'; // Router quản lý sản phẩm kho
import productBatchRoutes from './src/modules/business-services/warehouse-management/product-batches/product-batch.route.js'; // Router quản lý lô nhập kho hàng
import discountRoutes from './src/modules/business-services/service-management/discount/discount.route.js'; // Roter quản lý mã giảm giá
import additionalServiceRoutes from './src/modules/business-services/service-management/additional-services/service.route.js'; // Router dịch vụ đi kèm
import activityLogRoutes from './src/modules/business-services/account-activity/account_activity.route.js'; // Router ghi log hoạt động
import warehouseStatusRoutes from './src/modules/business-services/dashboard/warehouse-status/warehouse_status.route.js'; // Router dashboard tình trạng kho hàng
import bookingRoutes from './src/modules/business-services/rooms-management/booking-management/booking.route.js'; // Router quản lý phiên thuê phòng
import bookingServiceItemRoutes from './src/modules/business-services/rooms-management/booking-management/booking-service-item.route.js'; // Router dịch vụ thêm trong phiên thuê
import profileRoutes from './src/modules/business-services/profile-management/profile.route.js'; // Router hồ sơ cá nhân & thông tin doanh nghiệp
import billPaymentsRoutes from './src/modules/business-services/account-activity/bill_payments.route.js'; // Router nhật ký hóa đơn
import reserveBookingRoutes from './src/modules/business-services/rooms-management/reserve-booking/reserve-booking.route.js'; // Router lịch đặt trước (RESERVED)

// ====================================================================================================================================================================================
// Router dành cho khách hàng (customer-services)
import customerAuthRouter from './src/modules/customer-services/auth/auth.route.js'; // Router xác thực khách hàng (đăng ký, đăng nhập, quên mật khẩu)
import discoverRoomRouter from './src/modules/customer-services/discover/rooms/room.route.js'; // Router discover phòng cho khách hàng
import customerProfileRouter from './src/modules/customer-services/profile/profile.route.js'; // Router hồ sơ cá nhân của khách hàng
import discoverBookingRouter from './src/modules/customer-services/discover/booking/booking.route.js'; // Router đặt phòng cho khách hàng
import payosWebhookRouter from './src/modules/payment-services/payos/payos.route.js'; // Router webhook từ PayOS
import activityBookingRouter from './src/modules/customer-services/activity/bookings/booking.route.js'; // Router lịch sử đặt phòng của khách hàng
import serviceOrderRouter from './src/modules/customer-services/activity/service-orders/service-order.route.js'; // Router đơn đặt dịch vụ của khách hàng
import voucherRouter from './src/modules/customer-services/voucher/voucher.route.js'; // Router voucher & tích điểm


import { initCronJobs } from './src/shared/services/cron.service.js';
import { initPaymentCronJobs } from './src/modules/payment-services/cron/payment.cron.js';

const app = express();
app.use(morgan('dev'));

// ==========================================
// CÁC MIDDLEWARE QUAN TRỌNG
// ==========================================
app.use(cors()); // 2. Bật CORS lên trước tiên để cho phép Web/App gọi qua
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), 'public'))); // Cho phép truy cập vào thư mục public để lấy ảnh đã upload

// ==========================================
// GẮN CÁC ROUTER (ĐỊNH TUYẾN)
// ==========================================

// ====================================================================================================================================================================================
// Router dành cho doanh nghiệp (business-services)
app.use('/api/auth', authRouter); // Router quản lý xác thực vào đường dẫn /api/auth (VD: /api/auth/login, /api/auth/logout)
app.use('/api/room-types', roomTypeRouter); // Router quản lý loại phòng vào đường dẫn /api/room-types
app.use('/api/room-details', roomDetailRouter); // Router quản lý chi tiết phòng vào đường dẫn /api/room-details    
app.use('/api/staff', staffRoutes); // Router quản lý nhân viên vào đường dẫn /api/staff
app.use('/api/customers', customerRoutes); // Router quản lý khách hàng vào đường dẫn /api/customers
app.use('/api/product-categories', categoryRoutes); // Router quản lý danh mục sản phẩm kho vào đường dẫn /api/product-categories
app.use('/api/products', productRoutes); // Router quản lý sản phẩm kho vào đường dẫn /api/products
app.use('/api/product-batches', productBatchRoutes); // Router quản lý lô hàng nhập vào đường dẫn /api/product-batches
app.use('/api/discounts', discountRoutes); // Router quản lý mã giảm giá, đường dẫn /api/discounts
app.use('/api/services', additionalServiceRoutes); // Router quản lý dịch vụ đi kèm đường dẫn /api/services
app.use('/api/account-activity', activityLogRoutes); // Router quản lý hoạt động tài khoản đường dẫn /api/account-activity
app.use('/api/warehouse-status', warehouseStatusRoutes); // Router quản lý dashboard tình trạng kho hàng
app.use('/api/bookings', bookingRoutes); // Router quản lý phiên thuê (Booking)
app.use('/api/booking-service-items', bookingServiceItemRoutes); // Router dịch vụ thêm trong phiên thuê
app.use('/api/profile', profileRoutes); // Router hồ sơ cá nhân & thông tin doanh nghiệp
app.use('/api/bill-payments', billPaymentsRoutes); // Router nhật ký hóa đơn thanh toán
app.use('/api/reserve-bookings', reserveBookingRoutes); // Router lịch đặt trước của mobile user (RESERVED)

// ====================================================================================================================================================================================
// Router dành cho khách hàng (customer-services)
app.use('/api/customer-auth', customerAuthRouter); // Router xác thực khách hàng (đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu)
app.use('/api/discover/rooms', discoverRoomRouter); // Router discover phòng cho khách hàng
app.use('/api/discover/booking', discoverBookingRouter); // Router đặt phòng cho khách hàng
app.use('/api/customer', customerProfileRouter); // Router hồ sơ cá nhân của khách hàng (api/customer/profile, api/customer/avatar)
app.use('/api/payment/payos', payosWebhookRouter); // Router nhận Webhook PayOS
app.use('/api/activity/bookings', activityBookingRouter); // Router lịch sử đặt phòng của khách hàng
app.use('/api/activity/service-orders', serviceOrderRouter); // Router đơn đặt dịch vụ của khách hàng
app.use('/api/voucher', voucherRouter); // Router voucher & tích điểm

// ==========================================
// TRANG CHỦ API — Hiện khi user vào ngrok URL
// ==========================================
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>InnkeeperHub — API Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #f1f5f9;
    }
    .card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    }
    .icon { font-size: 56px; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 10px; color: #f1f5f9; }
    p  { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(34,197,94,0.15);
      border: 1px solid rgba(34,197,94,0.3);
      color: #4ade80;
      padding: 8px 18px; border-radius: 999px;
      font-size: 14px; font-weight: 600;
    }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4ade80;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:0.5; transform:scale(1.3); }
    }
    .note { margin-top: 24px; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🏨</div>
    <h1>InnkeeperHub API</h1>
    <p>Máy chủ đang hoạt động bình thường.<br/>Bạn có thể đóng tab này và quay lại hệ thống.</p>
    <div class="badge">
      <div class="dot"></div>
      Server đang chạy
    </div>
    <p class="note">* Trang này xác nhận kết nối thành công với máy chủ ảnh.</p>
  </div>
</body>
</html>`);
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ!'
  });
});

initCronJobs();
initPaymentCronJobs();

export default app;
