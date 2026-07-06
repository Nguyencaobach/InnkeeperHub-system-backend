import {
    createBookingTransaction,
    getActiveBookingByRoomId,
    updateBookingById,
    checkoutBookingById,
    checkReservedConflict,
    getBookingById
} from './booking.model.js';

// ── Tạo phiên thuê ────────────────────────────────────────────────────────────
export const createBookingLogic = async (data, files, user) => {
    // 1. Sinh mã đơn hàng ngẫu nhiên (VD: BKG-123456)
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const booking_code = `BKG-${randomCode}`;

    // 2. Xử lý đường dẫn file CCCD (Nếu có)
    let cccd_front_url = null;
    let cccd_back_url = null;

    if (files) {
        if (files['cccd_front'] && files['cccd_front'][0]) {
            cccd_front_url = `/uploads/cccd/${files['cccd_front'][0].filename}`;
        }
        if (files['cccd_back'] && files['cccd_back'][0]) {
            cccd_back_url = `/uploads/cccd/${files['cccd_back'][0].filename}`;
        }
    }

    // 3. Kiểm tra xung đột lịch RESERVED (mobile user đã đặt trước)
    // Dùng expected_checkin từ admin nếu có, nếu không thì lấy thời điểm hiện tại
    const actual_checkin = data.expected_checkin ? new Date(data.expected_checkin) : new Date(); 
    const conflictBookings = await checkReservedConflict(
        data.room_detail_id,
        actual_checkin,
        data.expected_checkout || null
    );

    if (conflictBookings && conflictBookings.length > 0) {
        const error = new Error('CONFLICT_BOOKING');
        error.status = 409;
        error.conflicts = conflictBookings;
        throw error;
    }

    // 4. Đóng gói dữ liệu gửi xuống Model
    const bookingData = {
        ...data,
        booking_code,
        created_by: user.id || user.user_id, // Lấy ID nhân viên từ token
        cccd_front_url,
        cccd_back_url,
        actual_checkin
    };

    return await createBookingTransaction(bookingData);
};

// ── Lấy phiên thuê đang active theo phòng ────────────────────────────────────
export const getActiveBookingByRoomLogic = async (roomDetailId) => {
    const booking = await getActiveBookingByRoomId(roomDetailId);
    if (!booking) throw new Error('Không có phiên thuê nào đang hoạt động cho phòng này.');
    return booking;
};

// ── Cập nhật thông tin phiên thuê ────────────────────────────────────────────
export const updateBookingLogic = async (id, data) => {
    // 1. Fetch current booking to get roomDetailId and current times
    const existing = await getBookingById(id);
    if (!existing) throw new Error('Không tìm thấy phiên thuê.');

    // 2. Determine the time range for conflict checking
    const proposedCheckin = data.expected_checkin || existing.expected_checkin;
    const proposedCheckout = data.expected_checkout !== undefined ? data.expected_checkout : existing.expected_checkout;

    // 3. Check for conflicts with reserved bookings
    const conflictBookings = await checkReservedConflict(
        existing.room_detail_id,
        proposedCheckin,
        proposedCheckout
    );

    if (conflictBookings && conflictBookings.length > 0) {
        const error = new Error('CONFLICT_BOOKING');
        error.status = 409;
        error.conflicts = conflictBookings;
        throw error;
    }

    return await updateBookingById(id, data);
};

// ── Thanh toán & Trả phòng ───────────────────────────────────────────────────
export const checkoutBookingLogic = async (id, paymentData) => {
    return await checkoutBookingById(id, paymentData);
};