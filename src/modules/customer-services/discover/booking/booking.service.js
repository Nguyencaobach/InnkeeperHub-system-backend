import { createCustomerBookingTransaction, getRoomAvailabilityModel } from './booking.model.js';
import { createPaymentLink } from '../../../payment-services/payos/payos.service.js';

export const createBookingAndPayment = async (bookingData) => {
    // 1. Tạo mã Booking SKU
    const bookingCode = `BKG-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // 2. Tính tiền cọc (10% tổng số tiền)
    const depositAmount = Math.floor(bookingData.total_amount * 0.1);
    
    // 3. Tạo order code cho PayOS (Phải là số < 9007199254740991)
    // Dùng timestamp kết hợp ngẫu nhiên để đảm bảo unique
    const orderCode = parseInt(`${Date.now()}${Math.floor(100 + Math.random() * 900)}`.substring(0, 15));

    // 4. Chuẩn bị dữ liệu lưu DB
    const bookingToSave = {
        ...bookingData,
        booking_code: bookingCode,
        deposit_amount: depositAmount,
        payos_order_code: orderCode,
        rent_type: bookingData.rent_type || 'DAILY'
    };

    // 5. Lưu vào Database (Trạng thái RESERVED, UNPAID)
    const newBooking = await createCustomerBookingTransaction(bookingToSave);

    // 6. Gọi PayOS tạo Payment Link
    const paymentInfo = {
        orderCode: orderCode,
        amount: depositAmount,
        description: `Coc phong ${bookingCode}`,
        cancelUrl: bookingData.cancelUrl, 
        returnUrl: bookingData.returnUrl
    };

    try {
        const payosData = await createPaymentLink(paymentInfo);
        
        return {
            booking: newBooking,
            payment: payosData // Chứa checkoutUrl, qrCode...
        };
    } catch (error) {
        // Nếu tạo link PayOS lỗi, có thể cân nhắc Rollback DB (nhưng transaction đã commit)
        // Nên trả về lỗi để FE xử lý thử lại thanh toán sau
        console.error("Lỗi khi tạo PayOS link:", error);
        throw new Error("Không thể tạo link thanh toán, vui lòng thử lại!");
    }
};

export const getRoomAvailabilityService = async (roomDetailId) => {
    try {
        const availability = await getRoomAvailabilityModel(roomDetailId);
        return availability;
    } catch (error) {
        throw error;
    }
};
