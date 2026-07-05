import 'dotenv/config'; // Tự động nạp các biến môi trường từ file .env
import app from './app.js'; // Kéo file app đã được cấu hình sẵn (CORS, Router) sang
import { checkDatabaseConnection } from './src/shared/database/db.js'; 

const PORT = process.env.PORT || 3000;

// Hàm khởi động tổng của toàn bộ hệ thống
const startServer = async () => {
    console.log('⏳ Đang kiểm tra hệ thống...');

    try {
        // 1. Kiểm tra kết nối Database trước tiên
        await checkDatabaseConnection();
        console.log('✅ Kết nối Database thành công!');

        // 2. Nếu DB OK, mới bắt đầu mở cổng (Listen Port) để đón khách
        app.listen(PORT, () => {
            console.log(`🚀 SERVER ĐANG CHẠY TẠI: http://localhost:${PORT}`);
        });
    } catch (error) {
        // 3. Nếu Database sập hoặc lỗi, báo lỗi và dừng server ngay lập tức
        console.error('❌ Khởi động server thất bại do lỗi Database:', error.message);
        process.exit(1); // Ép Node.js dừng tiến trình
    }
};

// Kích hoạt chạy server
startServer();

