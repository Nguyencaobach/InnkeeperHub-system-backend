import serviceOrderService from './service-order.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';

class ServiceOrderController {
    /**
     * [POST] /api/activity/service-orders
     * Khách tạo đơn đặt dịch vụ
     */
    async createOrder(req, res) {
        try {
            const customerId = req.user.customer_id;
            const { booking_id, items } = req.body;
            const order = await serviceOrderService.createOrder(booking_id, customerId, items);
            // Invalidate cache admin pending orders
            await invalidateCache('service-orders:pending:*');
            return sendSuccess(res, order, 'Đặt dịch vụ thành công, đang chờ xác nhận.', STATUS_CODES.CREATED);
        } catch (error) {
            console.error('[ServiceOrderController] createOrder Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    /**
     * [GET] /api/activity/service-orders/:bookingId
     * Khách xem đơn đặt dịch vụ của mình theo booking
     */
    async getMyOrders(req, res) {
        try {
            const customerId = req.user.customer_id;
            const { bookingId } = req.params;
            const orders = await serviceOrderService.getMyOrders(bookingId, customerId);
            return sendSuccess(res, orders, 'Lấy danh sách đơn dịch vụ thành công');
        } catch (error) {
            console.error('[ServiceOrderController] getMyOrders Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    /**
     * [GET] /api/activity/service-orders/pending
     * Admin lấy tất cả đơn chờ duyệt
     */
    async getAllPendingOrders(req, res) {
        try {
            const orders = await serviceOrderService.getAllPendingOrders();
            return sendSuccess(res, orders, 'Lấy danh sách đơn chờ duyệt thành công');
        } catch (error) {
            console.error('[ServiceOrderController] getAllPendingOrders Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    /**
     * [PATCH] /api/activity/service-orders/:id/confirm
     * Admin xác nhận đơn
     */
    async confirmOrder(req, res) {
        try {
            const { id } = req.params;
            const result = await serviceOrderService.confirmOrder(id);
            // Invalidate caches liên quan
            await invalidateCache('service-orders:pending:*');
            await invalidateCache('bsi:items:*');
            return sendSuccess(res, result, 'Xác nhận đơn thành công');
        } catch (error) {
            console.error('[ServiceOrderController] confirmOrder Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    /**
     * [DELETE] /api/activity/service-orders/:id
     * Admin hủy đơn
     */
    async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const result = await serviceOrderService.cancelOrder(id);
            await invalidateCache('service-orders:pending:*');
            return sendSuccess(res, result, 'Hủy đơn thành công');
        } catch (error) {
            console.error('[ServiceOrderController] cancelOrder Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }
}

export default new ServiceOrderController();
