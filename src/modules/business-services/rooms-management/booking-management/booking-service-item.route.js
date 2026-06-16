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

const router = express.Router();

router.use(verifyToken);

// ── Static routes (phải đứng TRƯỚC dynamic :bookingId) ────────────────────────

// Lấy sản phẩm theo danh mục kho (kèm tồn kho)
router.get('/products', getProductsByCategory);

// Lấy danh mục dịch vụ đi kèm (DISTINCT category)
router.get('/service-categories', getServiceCategories);

// Lấy dịch vụ theo category
router.get('/services', getServicesByCategory);

// Xóa 1 item (hoàn tồn kho nếu là hàng kho)
router.delete('/item/:serviceItemId', deleteServiceItem);

// Cập nhật số lượng item
router.patch('/item/:serviceItemId/quantity', updateItemQuantity);

// ── Dynamic routes ────────────────────────────────────────────────────────────

// Lấy danh sách items đã chọn của 1 phiên thuê
router.get('/:bookingId', getServiceItems);

// Thêm hàng kho vào phiên thuê (trừ tồn kho FEFO)
router.post('/:bookingId/inventory', addInventoryItem);

// Thêm dịch vụ đi kèm vào phiên thuê
router.post('/:bookingId/general', addGeneralService);

export default router;
