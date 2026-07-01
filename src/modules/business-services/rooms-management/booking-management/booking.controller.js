import {
    createBookingLogic,
    getActiveBookingByRoomLogic,
    updateBookingLogic,
    checkoutBookingLogic
} from './booking.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { logActivity } from '../../../../shared/utils/activity.helper.js';
import { invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';

// ── Tạo phiên thuê ────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
    try {
        // req.body chứa text, req.files chứa file, req.user chứa token
        const result = await createBookingLogic(req.body, req.files, req.user);
        
        // Ghi log hoạt động
        logActivity(req.user, 'CREATE', 'Phiên thuê', result.booking_code);
        
        await invalidateCache('bookings:*', 'customer:*bookings:*', 'room-details:*', 'customer:*room-details:*');
        return sendSuccess(res, result, "Tạo phiên thuê thành công!", STATUS_CODES.CREATED);
    } catch (error) {
        console.error("Lỗi tạo Booking:", error);
        return sendError(res, error.message || "Không thể tạo phiên thuê", STATUS_CODES.INTERNAL_ERROR);
    }
};

// ── Lấy phiên thuê đang active theo room_detail_id ──────────────────────────
export const getActiveBookingByRoom = async (req, res) => {
    try {
        const { roomDetailId } = req.params;
        const result = await getActiveBookingByRoomLogic(roomDetailId);
        return sendSuccess(res, result, "Lấy thông tin phiên thuê thành công!", STATUS_CODES.OK);
    } catch (error) {
        console.error("Lỗi lấy Booking theo phòng:", error);
        return sendError(res, error.message || "Không thể lấy phiên thuê", STATUS_CODES.NOT_FOUND);
    }
};

// ── Cập nhật thông tin phiên thuê ────────────────────────────────────────────
export const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateBookingLogic(id, req.body);
        logActivity(req.user, 'UPDATE', 'Phiên thuê', result.booking_code);
        await invalidateCache('bookings:*', 'customer:*bookings:*', 'room-details:*', 'customer:*room-details:*');
        return sendSuccess(res, result, "Cập nhật phiên thuê thành công!", STATUS_CODES.OK);
    } catch (error) {
        console.error("Lỗi cập nhật Booking:", error);
        return sendError(res, error.message || "Không thể cập nhật phiên thuê", STATUS_CODES.BAD_REQUEST);
    }
};

// ── Thanh toán & Trả phòng ────────────────────────────────────────────────────
export const checkoutBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const cashier_id = req.user?.id || req.user?.user_id || null;
        const paymentData = { ...req.body, cashier_id };
        const result = await checkoutBookingLogic(id, paymentData);
        logActivity(req.user, 'CHECKOUT', 'Phiên thuê', result.booking_code);
        await invalidateCache('bookings:*', 'customer:*bookings:*', 'room-details:*', 'customer:*room-details:*');
        return sendSuccess(res, result, "Thanh toán & Trả phòng thành công!", STATUS_CODES.OK);
    } catch (error) {
        console.error("Lỗi checkout Booking:", error);
        return sendError(res, error.message || "Không thể thực hiện trả phòng", STATUS_CODES.INTERNAL_ERROR);
    }
};