import Redis from 'ioredis';

// ============================================================
// Tạo kết nối tới Redis (đang chạy trong Docker container)
// Port 6379 được expose ra máy host qua docker-compose.yml
// ============================================================
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    // Nếu Redis có password thì thêm: password: process.env.REDIS_PASSWORD
    // lazyConnect BỎ ĐI — cần kết nối ngay khi app khởi động
    // để redis.status === 'ready' trước khi request đầu tiên đến
    // (lazyConnect khiến blacklist token không hoạt động)
    maxRetriesPerRequest: 1,   // Chỉ thử lại 1 lần nếu lỗi → không treo request
    enableOfflineQueue: false,  // Nếu Redis down → fail nhanh, không xếp hàng chờ
});

// ============================================================
// Xử lý sự kiện kết nối / lỗi
// ============================================================
redis.on('connect', () => {
    console.log('✅ [REDIS] Kết nối Redis thành công!');
});

redis.on('error', (err) => {
    // Chỉ log lỗi, KHÔNG crash server — app vẫn chạy bình thường nếu Redis down
    // Các middleware cache sẽ tự bỏ qua nếu Redis không available
    console.warn('⚠️  [REDIS] Redis không kết nối được:', err.message);
});

export default redis;
