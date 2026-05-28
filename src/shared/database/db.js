import pg from 'pg';

// Lấy class Pool từ thư viện pg
const { Pool } = pg;

// Khởi tạo Pool kết nối tới PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Lưu ý: sslmode=require trên Azure đôi khi cần thêm dòng dưới đây để không bị lỗi chứng chỉ
    ssl: {
        rejectUnauthorized: false
    }
});

// Hàm kiểm tra kết nối
export const checkDatabaseConnection = async () => {
    try {
        // Thử mở một kết nối
        const client = await pool.connect();
        console.log('✅ KẾT NỐI DATABASE THÀNH CÔNG: PostgreSQL trên Azure');
        
        // Trả kết nối lại cho Pool sau khi test xong
        client.release(); 
        return true;
    } catch (error) {
        console.error('❌ LỖI KẾT NỐI DATABASE:');
        console.error(error.message);
        
        // Báo lỗi và dừng toàn bộ server nếu không có DB
        process.exit(1); 
    }
};

// Export pool để các module sau này (Booking, Identity...) sử dụng để truy vấn
export default pool;