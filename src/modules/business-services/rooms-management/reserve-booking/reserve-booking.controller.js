import {
    getReservedBookingsByRoomLogic,
    updateReservedBookingTimeLogic,
    deleteReservedBookingLogic,
    convertReservedToRentedLogic,
} from './reserve-booking.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';

// ── [GET] Lấy danh sách lịch đặt trước (RESERVED) theo room_detail_id ─────────
export const getReservedBookingsByRoom = async (req, res) => {
    try {
        const { roomDetailId } = req.params;
        const result = await getReservedBookingsByRoomLogic(roomDetailId);
        return sendSuccess(res, result, 'Lấy danh sách lịch đặt trước thành công!', STATUS_CODES.OK);
    } catch (error) {
        console.error('Lỗi lấy lịch đặt trước:', error);
        return sendError(res, error.message || 'Không thể lấy lịch đặt trước', STATUS_CODES.INTERNAL_ERROR);
    }
};

// ── [PUT] Cập nhật giờ nhận/trả phòng dự kiến ─────────────────────────────────
export const updateReservedBookingTime = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { expected_checkin, expected_checkout } = req.body;

        if (!expected_checkin) {
            return sendError(res, 'Vui lòng nhập giờ nhận phòng dự kiến.', STATUS_CODES.BAD_REQUEST);
        }
        // Đã xóa kiểm tra ngày quá khứ khi cập nhật để Admin có thể sửa lịch tự do


        const result = await updateReservedBookingTimeLogic(bookingId, expected_checkin, expected_checkout || null);
        await invalidateCache('bookings:*', 'customer:*bookings:*', 'reserve-bookings:by-room:*');
        return sendSuccess(res, result, 'Cập nhật lịch đặt trước thành công!', STATUS_CODES.OK);
    } catch (error) {
        console.error('Lỗi cập nhật lịch đặt trước:', error);
        const isConflict = error.message?.includes('Trùng lịch');
        return sendError(
            res,
            error.message || 'Không thể cập nhật lịch đặt trước',
            isConflict ? STATUS_CODES.CONFLICT : STATUS_CODES.INTERNAL_ERROR
        );
    }
};

// ── [DELETE] Xóa lịch đặt trước ───────────────────────────────────────────────
export const deleteReservedBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        await deleteReservedBookingLogic(bookingId);
        await invalidateCache('bookings:*', 'customer:*bookings:*', 'room-details:*', 'customer:*room-details:*', 'reserve-bookings:by-room:*');
        return sendSuccess(res, null, 'Đã xóa lịch đặt trước thành công!', STATUS_CODES.OK);
    } catch (error) {
        console.error('Lỗi xóa lịch đặt trước:', error);
        return sendError(res, error.message || 'Không thể xóa lịch đặt trước', STATUS_CODES.INTERNAL_ERROR);
    }
};

// ── [POST] Chuyển RESERVED → RENTED (Nhận phòng) ──────────────────────────────
export const convertReservedToRented = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const result = await convertReservedToRentedLogic(bookingId);
        await invalidateCache('bookings:*', 'customer:*bookings:*', 'room-details:*', 'customer:*room-details:*', 'reserve-bookings:by-room:*');
        return sendSuccess(res, result, 'Nhận phòng thành công! Đã chuyển sang phiên thuê.', STATUS_CODES.OK);
    } catch (error) {
        console.error('Lỗi chuyển phiên thuê:', error);
        const isBadRequest = error.message?.includes('Chưa tới') || error.message?.includes('quá giờ');
        return sendError(
            res,
            error.message || 'Không thể chuyển sang phiên thuê',
            isBadRequest ? STATUS_CODES.BAD_REQUEST : STATUS_CODES.INTERNAL_ERROR
        );
    }
};
