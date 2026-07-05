import customerBookingService from './booking.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

class CustomerBookingController {
    /**
     * [GET] /api/activity/bookings
     * Lấy toàn bộ lịch sử đặt phòng của người dùng đang đăng nhập
     */
    async getMyBookings(req, res) {
        try {
            const customerId = req.user.customer_id;
            const bookings = await customerBookingService.getMyBookings(customerId);
            return sendSuccess(res, bookings, 'Lấy lịch sử đặt phòng thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[CustomerBookingController] getMyBookings Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    /**
     * [GET] /api/activity/bookings/:bookingId
     * Lấy chi tiết một đặt phòng cụ thể
     */
    async getBookingDetail(req, res) {
        try {
            const customerId = req.user.customer_id;
            const { bookingId } = req.params;
            const booking = await customerBookingService.getBookingDetail(bookingId, customerId);
            return sendSuccess(res, booking, 'Lấy chi tiết đặt phòng thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[CustomerBookingController] getBookingDetail Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.NOT_FOUND);
        }
    }
}

export default new CustomerBookingController();
