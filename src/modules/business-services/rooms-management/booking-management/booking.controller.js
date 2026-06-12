import { createBookingLogic } from './booking.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { logActivity } from '../../../../shared/utils/activity.helper.js';

export const createBooking = async (req, res) => {
    try {
        // req.body chứa text, req.files chứa file, req.user chứa token
        const result = await createBookingLogic(req.body, req.files, req.user);
        
        // Ghi log hoạt động
        logActivity(req.user, 'CREATE', 'Phiên thuê', result.booking_code);
        
        return sendSuccess(res, result, "Tạo phiên thuê thành công!", STATUS_CODES.CREATED);
    } catch (error) {
        console.error("Lỗi tạo Booking:", error);
        return sendError(res, error.message || "Không thể tạo phiên thuê", STATUS_CODES.INTERNAL_ERROR);
    }
};