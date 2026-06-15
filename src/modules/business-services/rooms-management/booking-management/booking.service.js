import {
    createBookingTransaction,
    getActiveBookingByRoomId,
    updateBookingById,
    checkoutBookingById
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

    // 3. Đóng gói dữ liệu gửi xuống Model
    const actual_checkin = new Date(); // Bấm tạo phiên thuê là check-in thực tế luôn
    
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
    return await updateBookingById(id, data);
};

// ── Thanh toán & Trả phòng ───────────────────────────────────────────────────
export const checkoutBookingLogic = async (id) => {
    return await checkoutBookingById(id);
};