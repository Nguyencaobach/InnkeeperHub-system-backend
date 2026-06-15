import pool from '../../../../shared/database/db.js';

export const createBookingTransaction = async (bookingData) => {
    // Rút 1 kết nối (client) từ pool để thực hiện Transaction
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Bắt đầu giao dịch

        // 1. Tạo Phiên thuê (Booking)
        const insertBookingQuery = `
            INSERT INTO bookings (
                booking_code, room_type_id, room_detail_id, created_by,
                guest_name, guest_phone, guest_email, cccd_front_url, cccd_back_url,
                rent_type, booking_status, is_currently_rented,
                expected_checkin, expected_checkout, actual_checkin, total_amount, payment_status
            ) VALUES (
                $1, $2, $3, $4, 
                $5, $6, $7, $8, $9, 
                $10, 'RENTED', true, 
                $11, $12, $13, $14, 'UNPAID'
            ) RETURNING *;
        `;
        
        const bookingValues = [
            bookingData.booking_code, bookingData.room_type_id, bookingData.room_detail_id, bookingData.created_by,
            bookingData.guest_name, bookingData.guest_phone, bookingData.guest_email, 
            bookingData.cccd_front_url, bookingData.cccd_back_url,
            bookingData.rent_type, bookingData.expected_checkin, bookingData.expected_checkout, 
            bookingData.actual_checkin, bookingData.total_amount
        ];
        
        const resBooking = await client.query(insertBookingQuery, bookingValues);
        const newBooking = resBooking.rows[0];

        // 2. Cập nhật trạng thái phòng thành 'OCCUPIED'
        const updateRoomQuery = `
            UPDATE room_details 
            SET status = 'OCCUPIED' 
            WHERE id = $1 
            RETURNING room_number;
        `;
        await client.query(updateRoomQuery, [bookingData.room_detail_id]);

        await client.query('COMMIT'); // Lưu thay đổi vào Database
        return newBooking;

    } catch (error) {
        await client.query('ROLLBACK'); // Hủy toàn bộ nếu có lỗi
        throw error;
    } finally {
        client.release(); // Trả kết nối lại cho pool
    }
};

// ── Lấy phiên thuê đang active theo room_detail_id ──────────────────────────
export const getActiveBookingByRoomId = async (roomDetailId) => {
    const query = `
        SELECT * FROM bookings
        WHERE room_detail_id = $1
          AND is_currently_rented = true
          AND booking_status = 'RENTED'
        ORDER BY created_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(query, [roomDetailId]);
    return result.rows[0] || null;
};

// ── Cập nhật thông tin phiên thuê ────────────────────────────────────────────
export const updateBookingById = async (id, data) => {
    const {
        guest_name, guest_phone, guest_email,
        rent_type, expected_checkin, expected_checkout
    } = data;

    const query = `
        UPDATE bookings
        SET
            guest_name        = $1,
            guest_phone       = $2,
            guest_email       = $3,
            rent_type         = $4,
            expected_checkin  = $5,
            expected_checkout = $6,
            updated_at        = NOW()
        WHERE booking_id = $7
        RETURNING *;
    `;
    const values = [
        guest_name, guest_phone, guest_email ?? null,
        rent_type, expected_checkin, expected_checkout ?? null,
        id
    ];
    const result = await pool.query(query, values);
    if (result.rowCount === 0) throw new Error('Không tìm thấy phiên thuê.');
    return result.rows[0];
};

// ── Thanh toán & Trả phòng ────────────────────────────────────────────────────
export const checkoutBookingById = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Cập nhật phiên thuê → PAID, kết thúc
        const updateBookingQuery = `
            UPDATE bookings
            SET
                booking_status      = 'COMPLETED',
                is_currently_rented = false,
                actual_checkout     = NOW(),
                payment_status      = 'PAID',
                updated_at          = NOW()
            WHERE booking_id = $1
            RETURNING room_detail_id, booking_code;
        `;
        const resBooking = await client.query(updateBookingQuery, [id]);
        if (resBooking.rowCount === 0) throw new Error('Không tìm thấy phiên thuê.');
        const { room_detail_id, booking_code } = resBooking.rows[0];

        // 2. Cập nhật trạng thái phòng → AVAILABLE
        const updateRoomQuery = `
            UPDATE room_details
            SET status = 'AVAILABLE'
            WHERE id = $1;
        `;
        await client.query(updateRoomQuery, [room_detail_id]);

        await client.query('COMMIT');
        return { booking_code };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};