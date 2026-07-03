import { createBookingAndPayment, getRoomAvailabilityService } from './booking.service.js';
import { getBookingPaymentStatus, cancelBookingTransaction } from './booking.model.js';
import { sendSuccess, sendError } from '../../../../shared/utils/response.util.js';

export const createBooking = async (req, res) => {
    try {
        // Lấy customer_id từ token JWT (đã qua middleware verifyToken)
        const customerId = req.user?.id;
        
        if (!customerId) {
            return sendError(res, 'Bạn phải đăng nhập để đặt phòng.', 401);
        }

        const bookingData = {
            ...req.body,
            customer_id: customerId
        };

        const result = await createBookingAndPayment(bookingData);
        
        return sendSuccess(res, result, 'Tạo đơn đặt phòng và mã thanh toán thành công', 201);
    } catch (error) {
        console.error('Create Customer Booking Error:', error);
        return sendError(res, 'Server Error', 500, error.message);
    }
};

export const checkPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.id;

        if (!customerId) {
            return sendError(res, 'Bạn phải đăng nhập.', 401);
        }

        const status = await getBookingPaymentStatus(id, customerId);

        if (!status) {
            return sendError(res, 'Không tìm thấy đơn đặt phòng', 404);
        }

        return sendSuccess(res, status, 'Lấy trạng thái thành công', 200);
    } catch (error) {
        console.error('Check Payment Status Error:', error);
        return sendError(res, 'Server Error', 500, error.message);
    }
};

export const getRoomAvailability = async (req, res) => {
    try {
        const { room_detail_id } = req.params;
        const availability = await getRoomAvailabilityService(room_detail_id);
        
        return sendSuccess(res, availability, 'Lấy danh sách bận của phòng thành công', 200);
    } catch (error) {
        console.error('Get Room Availability Error:', error);
        return sendError(res, 'Server Error', 500, error.message);
    }
};

export const uploadCCCDForBooking = async (req, res) => {
    try {
        const files = req.files;

        if (!files || (!files['cccd_front'] && !files['cccd_back'])) {
            return sendError(res, 'Vui lòng chọn ảnh mặt trước hoặc mặt sau CCCD.', 400);
        }

        let frontUrl = null;
        let backUrl = null;

        if (files['cccd_front'] && files['cccd_front'].length > 0) {
            frontUrl = `/uploads/cccd_for_reserved/${files['cccd_front'][0].filename}`;
        }
        
        if (files['cccd_back'] && files['cccd_back'].length > 0) {
            backUrl = `/uploads/cccd_for_reserved/${files['cccd_back'][0].filename}`;
        }

        return sendSuccess(res, { cccd_front_url: frontUrl, cccd_back_url: backUrl }, 'Upload thành công', 200);
    } catch (error) {
        console.error('Upload CCCD For Booking Error:', error);
        return sendError(res, 'Server Error', 500, error.message);
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.id;

        if (!customerId) {
            return sendError(res, 'Bạn phải đăng nhập.', 401);
        }

        await cancelBookingTransaction(id, customerId);

        return sendSuccess(res, null, 'Hủy đơn đặt phòng thành công', 200);
    } catch (error) {
        console.error('Cancel Booking Error:', error);
        return sendError(res, error.message || 'Lỗi hệ thống', 400);
    }
};
