import express from 'express';
import { createDiscount, getAllDiscounts, updateDiscount, deleteDiscount } from './discount.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { discountSchema } from './discount.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withCache, invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

// Bắt buộc phải có token đăng nhập mới được thao tác
router.use(verifyToken);

// [GET] Danh sách mã giảm giá — Cache 5 phút (mã có thể hết hạn liên tục)
router.get('/', withCache('discounts:all', TTL.SHORT), getAllDiscounts);

// [POST/PUT/DELETE] Ghi DB → Xóa cache
router.post('/', validateData(discountSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('discounts:*', 'customer:*discounts:*'); });
    next();
}, createDiscount);

router.put('/:id', validateData(discountSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('discounts:*', 'customer:*discounts:*'); });
    next();
}, updateDiscount);

router.delete('/:id', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('discounts:*', 'customer:*discounts:*'); });
    next();
}, deleteDiscount);

export default router;