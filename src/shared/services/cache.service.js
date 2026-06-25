import redis from '../database/redis.js';

// ============================================================
// TTL CONSTANTS — Thời gian sống của cache (đơn vị: giây)
// Dùng nhất quán ở toàn bộ hệ thống, không hardcode số lẻ
// ============================================================
export const TTL = {
    VERY_SHORT:  30,      // 30 giây  — Dashboard, warehouse-status (realtime)
    SHORT:       120,     // 2 phút   — Bookings, bill-payments (thay đổi liên tục)
    NORMAL:      600,     // 10 phút  — Rooms, staff, customers
    LONG:        900,     // 15 phút  — Products, profile
    VERY_LONG:   21600,   // 6 giờ    — Room-types, categories, services (ổn định)
    DAY:         86400,   // 1 ngày   — Config, business info
};

// ============================================================
// Hàm kiểm tra Redis có đang kết nối không
// Nếu không → bỏ qua cache, để request đi thẳng vào DB
// ============================================================
const isRedisReady = () => redis.status === 'ready';

// ============================================================
// GET — Lấy dữ liệu từ Redis
// Trả về object đã parse, hoặc null nếu không có / Redis down
// ============================================================
export const cacheGet = async (key) => {
    try {
        if (!isRedisReady()) return null;
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.warn(`[CACHE] Lỗi GET key "${key}":`, err.message);
        return null; // Fail gracefully — không crash app
    }
};

// ============================================================
// SET — Lưu dữ liệu vào Redis với thời gian hết hạn (TTL)
// ============================================================
export const cacheSet = async (key, data, ttlSeconds = TTL.NORMAL) => {
    try {
        if (!isRedisReady()) return;
        // EX = expire in seconds
        await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (err) {
        console.warn(`[CACHE] Lỗi SET key "${key}":`, err.message);
    }
};

// ============================================================
// DEL — Xóa 1 key cụ thể (dùng khi POST/PUT/DELETE thay đổi data)
// ============================================================
export const cacheDel = async (key) => {
    try {
        if (!isRedisReady()) return;
        await redis.del(key);
    } catch (err) {
        console.warn(`[CACHE] Lỗi DEL key "${key}":`, err.message);
    }
};

// ============================================================
// DEL PATTERN — Xóa nhiều key theo pattern (dùng wildcard *)
// VD: xóa tất cả cache liên quan đến "room-types"
// ============================================================
export const cacheDelPattern = async (pattern) => {
    try {
        if (!isRedisReady()) return;
        // SCAN thay vì KEYS để không block Redis khi data lớn
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== '0');
    } catch (err) {
        console.warn(`[CACHE] Lỗi DEL pattern "${pattern}":`, err.message);
    }
};

// ============================================================
// EXISTS — Kiểm tra key có tồn tại không (dùng cho token blacklist)
// ============================================================
export const cacheExists = async (key) => {
    try {
        if (!isRedisReady()) return false;
        const result = await redis.exists(key);
        return result === 1;
    } catch (err) {
        console.warn(`[CACHE] Lỗi EXISTS key "${key}":`, err.message);
        return false;
    }
};

// ============================================================
// SET NX — Chỉ set nếu key CHƯA tồn tại + TTL (dùng cho rate limit)
// Trả về true nếu set thành công (key mới), false nếu đã tồn tại
// ============================================================
export const cacheSetNX = async (key, value, ttlSeconds) => {
    try {
        if (!isRedisReady()) return true; // Nếu Redis down → cho qua, không chặn
        const result = await redis.set(key, value, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    } catch (err) {
        console.warn(`[CACHE] Lỗi SETNX key "${key}":`, err.message);
        return true; // Fail gracefully → cho qua
    }
};

// ============================================================
// INCR — Tăng counter + TTL (dùng cho rate limit đếm request)
// ============================================================
export const cacheIncr = async (key, ttlSeconds) => {
    try {
        if (!isRedisReady()) return 0;
        const count = await redis.incr(key);
        // Chỉ set TTL lần đầu (khi count = 1) để không reset mỗi request
        if (count === 1) {
            await redis.expire(key, ttlSeconds);
        }
        return count;
    } catch (err) {
        console.warn(`[CACHE] Lỗi INCR key "${key}":`, err.message);
        return 0; // Fail gracefully → không chặn request
    }
};