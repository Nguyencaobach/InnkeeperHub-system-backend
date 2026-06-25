import { cacheIncr } from '../services/cache.service.js';
import { sendError, STATUS_CODES } from '../utils/response.util.js';

// ============================================================
// createRateLimit — Tạo middleware chống spam request
//
// Cách dùng trong route:
//   router.post('/login', createRateLimit(10, 60), loginController);
//   // → Tối đa 10 lần mỗi 60 giây per IP
//
// Tham số:
//   @param {number} maxRequests  - Số request tối đa trong cửa sổ thời gian
//   @param {number} windowSeconds - Cửa sổ thời gian (giây)
//   @param {string} [prefix]     - Prefix cho Redis key (mặc định 'rl')
// ============================================================
export const createRateLimit = (maxRequests, windowSeconds, prefix = 'rl') => {
    return async (req, res, next) => {
        try {
            // Lấy IP thực của client
            // Nginx đã gắn X-Real-IP vào header khi forward request
            const ip = req.headers['x-real-ip']
                || req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.ip
                || 'unknown';

            // Key dạng: "rl:login:/api/auth/login:192.168.1.1"
            const key = `${prefix}:${req.path}:${ip}`;

            // Tăng counter và lấy số hiện tại
            const currentCount = await cacheIncr(key, windowSeconds);

            // Gắn thông tin vào header để client biết còn bao nhiêu lần
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));

            if (currentCount > maxRequests) {
                return sendError(
                    res,
                    `Quá nhiều yêu cầu. Vui lòng thử lại sau ${windowSeconds} giây.`,
                    429 // Too Many Requests
                );
            }

            next();
        } catch (err) {
            // Nếu Redis lỗi → cho qua, không chặn user
            console.warn('[RATE LIMIT] Lỗi:', err.message);
            next();
        }
    };
};

// ============================================================
// PRESET CONFIGS — Cấu hình sẵn cho các trường hợp phổ biến
//
// Cách dùng:
//   import { rateLimitAuth, rateLimitAPI } from './rateLimit.middleware.js';
//   router.post('/login', rateLimitAuth, loginController);
// ============================================================

// Cho các route Auth (login, register, forgot-password) — chặn chặt
export const rateLimitAuth = createRateLimit(10, 60, 'rl:auth');
// → Tối đa 10 lần / 60 giây / IP

// Cho API thông thường — thoải mái hơn
export const rateLimitAPI = createRateLimit(60, 60, 'rl:api');
// → Tối đa 60 lần / 60 giây / IP

// Cho forgot-password — chặt nhất vì có thể gửi email spam
export const rateLimitForgot = createRateLimit(3, 300, 'rl:forgot');
// → Tối đa 3 lần / 5 phút / IP