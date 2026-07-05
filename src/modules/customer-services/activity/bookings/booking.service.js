import bookingModel from './booking.model.js';

class CustomerBookingService {
    async getMyBookings(customerId) {
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        return await bookingModel.getMyBookings(customerId);
    }

    async getBookingDetail(bookingId, customerId) {
        if (!bookingId) throw new Error('Thiếu mã đặt phòng.');
        if (!customerId) throw new Error('Thiếu thông tin khách hàng.');
        const booking = await bookingModel.getBookingDetail(bookingId, customerId);
        if (!booking) throw new Error('Không tìm thấy đặt phòng hoặc bạn không có quyền xem.');
        return booking;
    }
}

export default new CustomerBookingService();
