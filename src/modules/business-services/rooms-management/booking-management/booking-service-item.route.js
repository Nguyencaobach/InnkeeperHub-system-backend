import express from 'express';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import {
    getProductsByCategory,
    getServiceItems,
    addInventoryItem,
    deleteServiceItem,
    getServiceCategories,
    getServicesByCategory,
    addGeneralService,
    updateItemQuantity,
} from './booking-service-item.controller.js';
import { withCache, invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

router.use(verifyToken);

// ── Static routes (phải đứng TRƯỚC dynamic :bookingId) ────────────────────────

// Lấy sản phẩm theo danh mục kho (kèm tồn kho) — Cache 10 phút
router.get('/products', withCache('bsi:products', TTL.NORMAL), getProductsByCategory);

// Lấy danh mục dịch vụ đi kèm (DISTINCT category) — Cache 6 giờ
router.get('/service-categories', withCache('bsi:service-categories', TTL.VERY_LONG), getServiceCategories);

// Lấy dịch vụ theo category — Cache 6 giờ
router.get('/services', withCache('bsi:services', TTL.VERY_LONG), getServicesByCategory);

// Xóa 1 item (hoàn tồn kho nếu là hàng kho)
router.delete('/item/:serviceItemId', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('bsi:*', 'products:*'); });
    next();
}, deleteServiceItem);

// Cập nhật số lượng item
router.patch('/item/:serviceItemId/quantity', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('bsi:*'); });
    next();
}, updateItemQuantity);

// ── Dynamic routes ────────────────────────────────────────────────────────────

// Lấy danh sách items đã chọn của 1 phiên thuê — Cache 2 phút
router.get('/:bookingId', withCache('bsi:items', TTL.SHORT), getServiceItems);

// Thêm hàng kho vào phiên thuê (trừ tồn kho FEFO)
router.post('/:bookingId/inventory', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('bsi:*', 'products:*'); });
    next();
}, addInventoryItem);

// Thêm dịch vụ đi kèm vào phiên thuê
router.post('/:bookingId/general', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('bsi:*'); });
    next();
}, addGeneralService);

export default router;
