import express from 'express';
import cors from 'cors'; 
import path from 'path';
import morgan from 'morgan'; // Middleware ghi log các request vào console
import 'dotenv/config';

// Kéo Router của chức năng Đăng nhập vào
import authRouter from './src/modules/business-services/auth/auth.route.js'; // Router quản lý xác thực (đăng nhập, đăng xuất)
import roomTypeRouter from './src/modules/business-services/rooms-management/room-types/room_type.route.js'; // Router quản lý loại phòng
import roomDetailRouter from './src/modules/business-services/rooms-management/room-details/room_detail.route.js'; // Router quản lý chi tiết phòng
import staffRoutes from './src/modules/business-services/staff-management/staff.route.js'; // Router quản lý nhân viên
import customerRoutes from './src/modules/business-services/customer-management/customer.route.js'; // Router quản lý khách hàng
import categoryRoutes from './src/modules/business-services/warehouse-management/product-categories/category.route.js'; // Router quản lý danh mục sản phẩm kho
import productRoutes from './src/modules/business-services/warehouse-management/products/product.route.js'; // Router quản lý sản phẩm kho
import productBatchRoutes from './src/modules/business-services/warehouse-management/product-batches/product-batch.route.js'; // Router quản lý lô nhập kho hàng
import discountRoutes from './src/modules/business-services/service-management/discount/discount.route.js'; // Roter quản lý mã giảm giá

import { initCronJobs } from './src/shared/services/cron.service.js';

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
app.use('/api/auth', authRouter); // Router quản lý xác thực vào đường dẫn /api/auth (VD: /api/auth/login, /api/auth/logout)
app.use('/api/room-types', roomTypeRouter); // Router quản lý loại phòng vào đường dẫn /api/room-types
app.use('/api/room-details', roomDetailRouter); // Router quản lý chi tiết phòng vào đường dẫn /api/room-details    
app.use('/api/staff', staffRoutes); // Router quản lý nhân viên vào đường dẫn /api/staff
app.use('/api/customers', customerRoutes); // Router quản lý khách hàng vào đường dẫn /api/customers
app.use('/api/product-categories', categoryRoutes); // Router quản lý danh mục sản phẩm kho vào đường dẫn /api/product-categories
app.use('/api/products', productRoutes); // Router quản lý sản phẩm kho vào đường dẫn /api/products
app.use('/api/product-batches', productBatchRoutes); // Router quản lý lô hàng nhập vào đường dẫn /api/product-batches
app.use('/api/discounts', discountRoutes); // Router quản lý mã giảm giá, đường dẫn /api/discounts

initCronJobs();

export default app;


