import { cacheGet, cacheSet, cacheDelPattern } from '../services/cache.service.js';

// ============================================================
// withCache — Middleware bọc quanh GET endpoint để auto-cache
//
// Cách dùng trong route:
//   router.get('/', withCache('room-types:all', TTL.VERY_LONG), getAllRoomTypes);
//
// Cách hoạt động:
//   1. Kiểm tra key trong Redis
//   2. Nếu có (HIT) → trả về ngay, không đụng vào DB
//   3. Nếu không có (MISS) → gọi Controller, intercept response, lưu vào Redis
// ============================================================
export const withCache = (key, ttlSeconds) => {
    return async (req, res, next) => {
        try {
            // 1. Thử lấy từ cache
            const cached = await cacheGet(key);
            if (cached !== null) {
                // Cache HIT — trả về ngay
                return res.status(200).json({
                    success: true,
                    message: 'Thành công',
                    data: cached,
                    _cached: true, // Optional: để debug biết data từ cache
                });
            }

            // 2. Cache MISS — cho request đi tiếp vào Controller
            // Intercept res.json để bắt kết quả Controller trả về
            const originalJson = res.json.bind(res);
            res.json = async (body) => {
                // Chỉ cache khi Controller trả về thành công (success: true)
                if (body?.success === true && body?.data !== undefined) {
                    await cacheSet(key, body.data, ttlSeconds);
                }
                return originalJson(body);
            };

            next();
        } catch (err) {
            // Nếu có lỗi gì đó trong cache logic → bỏ qua, đi tiếp vào Controller
            console.warn('[CACHE MIDDLEWARE] Lỗi:', err.message);
            next();
        }
    };
};

// ============================================================
// invalidateCache — Xóa cache sau khi POST/PUT/DELETE
//
// Cách dùng trong Controller (sau khi ghi DB thành công):
//   await invalidateCache('room-types:*');
//
// Hoặc dùng nhiều pattern cùng lúc:
//   await invalidateCache('room-types:*', 'room-details:*');
// ============================================================
export const invalidateCache = async (...patterns) => {
    for (const pattern of patterns) {
        await cacheDelPattern(pattern);
    }
};

// ============================================================
// withUserCache — Giống withCache nhưng cache key chứa user ID
//
// Dùng cho các endpoint yêu cầu đăng nhập, dữ liệu khác nhau
// theo từng người dùng (VD: lịch sử đặt phòng, phòng đã lưu...)
//
// Cache key sẽ có dạng: `prefix:customer_id`
// VD: 'customer:activity:bookings:abc-uuid-123'
//
// LƯU Ý: Middleware này phải đặt SAU verifyToken vì cần req.user
// ============================================================
export const withUserCache = (keyPrefix, ttlSeconds) => {
    return async (req, res, next) => {
        try {
            const customerId = req.user?.customer_id;
            if (!customerId) return next(); // Không có user → bỏ qua cache

            const key = `${keyPrefix}:${customerId}`;

            // 1. Thử lấy từ cache
            const cached = await cacheGet(key);
            if (cached !== null) {
                return res.status(200).json({
                    success: true,
                    message: 'Thành công',
                    data: cached,
                    _cached: true,
                });
            }

            // 2. Cache MISS — intercept response để lưu vào Redis
            const originalJson = res.json.bind(res);
            res.json = async (body) => {
                if (body?.success === true && body?.data !== undefined) {
                    await cacheSet(key, body.data, ttlSeconds);
                }
                return originalJson(body);
            };

            next();
        } catch (err) {
            console.warn('[USER CACHE MIDDLEWARE] Lỗi:', err.message);
            next();
        }
    };
};

// ============================================================
// invalidateUserCache — Xóa cache của một user cụ thể
//
// Dùng sau khi dữ liệu của user thay đổi (tạo/hủy booking...)
// VD: await invalidateUserCache('customer:activity:bookings', customerId);
// ============================================================
export const invalidateUserCache = async (keyPrefix, customerId) => {
    await cacheDelPattern(`${keyPrefix}:${customerId}`);
};