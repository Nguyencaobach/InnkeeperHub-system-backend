import {
    getReservedBookingsByRoomId,
    updateReservedBookingTime,
    deleteReservedBooking,
    convertReservedToRented,
} from './reserve-booking.model.js';

// ── Lấy danh sách lịch đặt trước theo phòng ───────────────────────────────────
export const getReservedBookingsByRoomLogic = async (roomDetailId) => {
    return await getReservedBookingsByRoomId(roomDetailId);
};

// ── Cập nhật giờ nhận/trả phòng dự kiến ───────────────────────────────────────
export const updateReservedBookingTimeLogic = async (bookingId, expectedCheckin, expectedCheckout) => {
    return await updateReservedBookingTime(bookingId, expectedCheckin, expectedCheckout);
};

// ── Xóa lịch đặt trước ───────────────────────────────────────────────────────
export const deleteReservedBookingLogic = async (bookingId) => {
    return await deleteReservedBooking(bookingId);
};

// ── Chuyển RESERVED → RENTED ─────────────────────────────────────────────────
export const convertReservedToRentedLogic = async (bookingId) => {
    return await convertReservedToRented(bookingId);
};
