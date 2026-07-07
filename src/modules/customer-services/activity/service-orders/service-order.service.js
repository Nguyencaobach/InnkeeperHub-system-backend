import serviceOrderModel from './service-order.model.js';
import {
    addInventoryItemToBooking,
    addGeneralServiceToBooking,
} from '../../../business-services/rooms-management/booking-management/booking-service-item.model.js';

class ServiceOrderService {
    /**
     * Khách tạo đơn đặt dịch vụ
     */
    async createOrder(bookingId, customerId, items) {
        if (!bookingId) throw new Error('Thiếu mã phiên thuê.');
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Danh sách dịch vụ không được để trống.');
        }
        return await serviceOrderModel.createOrder(bookingId, customerId, items);
    }

    /**
     * Khách xem đơn của mình
     */
    async getMyOrders(bookingId, customerId) {
        if (!bookingId) throw new Error('Thiếu mã phiên thuê.');
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        return await serviceOrderModel.getOrdersByBookingAndCustomer(bookingId, customerId);
    }

    /**
     * Admin lấy tất cả đơn chờ duyệt
     */
    async getAllPendingOrders() {
        return await serviceOrderModel.getAllPendingOrders();
    }

    /**
     * Admin xác nhận đơn → chuyển items vào booking_services
     */
    async confirmOrder(orderId) {
        // 1. Lấy đơn
        const order = await serviceOrderModel.getOrderById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn đặt dịch vụ.');
        if (order.status !== 'PENDING') throw new Error('Đơn này đã được xử lý.');

        // 2. Duyệt từng item → thêm vào booking_services
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

        for (const item of items) {
            if (item.service_type === 'INVENTORY') {
                await addInventoryItemToBooking({
                    bookingId: order.booking_id,
                    productId: item.item_id,
                    quantity: item.quantity,
                });
            } else if (item.service_type === 'GENERAL') {
                await addGeneralServiceToBooking({
                    bookingId: order.booking_id,
                    serviceId: item.item_id,
                    serviceName: item.item_name,
                    price: item.unit_price,
                    quantity: item.quantity,
                    unit: item.unit || '',
                });
            }
        }

        // 3. Cập nhật trạng thái + xóa đơn
        await serviceOrderModel.confirmOrder(orderId);
        await serviceOrderModel.deleteOrder(orderId);

        return { message: 'Xác nhận đơn thành công. Đã thêm vào phiên thuê.' };
    }

    /**
     * Admin hủy đơn → xóa luôn
     */
    async cancelOrder(orderId) {
        const order = await serviceOrderModel.getOrderById(orderId);
        if (!order) throw new Error('Không tìm thấy đơn đặt dịch vụ.');
        await serviceOrderModel.deleteOrder(orderId);
        return { message: 'Đã hủy đơn đặt dịch vụ.' };
    }
}

export default new ServiceOrderService();
