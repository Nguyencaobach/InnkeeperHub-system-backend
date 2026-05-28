import 'dotenv/config'; // Tự động nạp biến từ file .env
import express from 'express';
import cors from 'cors';

// Import hàm test CSDL từ thư mục shared
import { checkDatabaseConnection } from './src/shared/database/db.js'; 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Hàm khởi động tổng
const startServer = async () => {
    console.log('Đang kiểm tra hệ thống...');

    // 1. Kiểm tra kết nối Database trước
    await checkDatabaseConnection();

    // 2. Nếu DB OK, mới bắt đầu mở cổng (Listen Port)
    app.listen(PORT, () => {
        console.log(`SERVER ĐANG CHẠY: http://localhost:${PORT}`);
    });
};

// Kích hoạt chạy server
startServer();