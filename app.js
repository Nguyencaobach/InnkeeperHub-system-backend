import express from 'express';
import cors from 'cors'; // 1. Bắt buộc phải import cors
import path from 'path';

// Kéo Router của chức năng Đăng nhập vào
import authRouter from './src/modules/business-services/auth/auth.route.js'; // Router quản lý xác thực (đăng nhập, đăng xuất)
import roomTypeRouter from './src/modules/business-services/rooms-management/room-types/room_type.route.js'; // Router quản lý loại phòng
import roomDetailRouter from './src/modules/business-services/rooms-management/room-details/room_detail.route.js'; // Router quản lý chi tiết phòng

const app = express();

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

// 🔥 QUAN TRỌNG: Chỉ xuất app ra chứ KHÔNG gọi app.listen() ở đây
export default app;