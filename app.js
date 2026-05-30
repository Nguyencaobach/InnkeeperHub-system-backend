import express from 'express';
import cors from 'cors'; // 1. Bắt buộc phải import cors

// Kéo Router của chức năng Đăng nhập vào
import authRouter from './src/modules/business-services/auth/auth.route.js';

const app = express();

// ==========================================
// CÁC MIDDLEWARE QUAN TRỌNG
// ==========================================
app.use(cors()); // 2. Bật CORS lên trước tiên để cho phép Web/App gọi qua
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ==========================================
// GẮN CÁC ROUTER (ĐỊNH TUYẾN)
// ==========================================
app.use('/api/auth', authRouter);

// 🔥 QUAN TRỌNG: Chỉ xuất app ra chứ KHÔNG gọi app.listen() ở đây
export default app;