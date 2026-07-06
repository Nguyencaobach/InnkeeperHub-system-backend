import pool from '../../../../shared/database/db.js';

// ── Lấy danh sách tất cả lịch đặt trước (RESERVED) của 1 phòng ────────────────
export const getReservedBookingsByRoomId = async (roomDetailId) => {
    const query = `
        SELECT
            b.booking_id,
            b.booking_code,
            b.guest_name,
            b.guest_phone,
            b.guest_email,
            b.rent_type,
            b.expected_checkin,
            b.expected_checkout,
            b.total_amount,
            b.deposit_amount,
            b.payment_status,
            b.booking_status,
            b.reservation_validity,
            b.created_at,
            rd.room_number
        FROM bookings b
        LEFT JOIN room_details rd ON rd.id = b.room_detail_id
        WHERE b.room_detail_id = $1
          AND b.booking_status = 'RESERVED'
        ORDER BY b.expected_checkin ASC;
    `;

    const { rows } = await pool.query(query, [roomDetailId]);
    return rows;
};

// ── Cập nhật giờ nhận/trả phòng dự kiến ────────────────────────────────────────
// Kèm kiểm tra xung đột với các booking RESERVED khác (trừ booking hiện tại)
export const updateReservedBookingTime = async (bookingId, expectedCheckin, expectedCheckout) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lấy thông tin booking hiện tại
        const getQuery = `
            SELECT room_detail_id FROM bookings
            WHERE booking_id = $1 AND booking_status = 'RESERVED'
        `;
        const { rows } = await client.query(getQuery, [bookingId]);
        if (!rows[0]) throw new Error('Không tìm thấy lịch đặt trước hoặc đã được xử lý.');

        const { room_detail_id } = rows[0];
        const checkin = new Date(expectedCheckin);
        const checkout = expectedCheckout
            ? new Date(expectedCheckout)
            : new Date(checkin.getTime() + 24 * 60 * 60 * 1000);

        // Kiểm tra xung đột với các booking KHÁC (trừ booking hiện tại)
        const conflictQuery = `
            SELECT booking_id, booking_code, guest_name, expected_checkin, expected_checkout
            FROM bookings
            WHERE room_detail_id = $1
              AND booking_status = 'RESERVED'
              AND booking_id != $2
              AND expected_checkin <= $4
              AND expected_checkout >= $3
            LIMIT 1;
        `;
        const conflict = await client.query(conflictQuery, [room_detail_id, bookingId, checkin, checkout]);
        if (conflict.rows[0]) {
            const c = conflict.rows[0];
            const fmtDT = (d) => new Date(d).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            throw new Error(
                `Trùng lịch với booking ${c.booking_code} (${c.guest_name}) ` +
                `từ ${fmtDT(c.expected_checkin)} đến ${fmtDT(c.expected_checkout)}`
            );
        }

        // Tính lại validity
        const newValidity = checkin > new Date() ? 'PENDING' : 'OVERDUE';

        // Cập nhật
        const updateQuery = `
            UPDATE bookings
            SET expected_checkin = $1,
                expected_checkout = $2,
                reservation_validity = $3,
                updated_at = NOW()
            WHERE booking_id = $4
            RETURNING *;
        `;
        const result = await client.query(updateQuery, [
            checkin,
            expectedCheckout ? new Date(expectedCheckout) : null,
            newValidity,
            bookingId
        ]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ── Xóa lịch đặt trước — trả phòng về AVAILABLE nếu không còn RESERVED nào ──
export const deleteReservedBooking = async (bookingId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const getQuery = `SELECT room_detail_id FROM bookings WHERE booking_id = $1 AND booking_status = 'RESERVED'`;
        const { rows } = await client.query(getQuery, [bookingId]);
        if (!rows[0]) throw new Error('Không tìm thấy lịch đặt trước.');

        const { room_detail_id } = rows[0];

        // Xóa booking
        await client.query(`DELETE FROM bookings WHERE booking_id = $1`, [bookingId]);

        // Nếu phòng không còn RESERVED nào khác → trả về AVAILABLE
        const remaining = await client.query(
            `SELECT COUNT(*) FROM bookings WHERE room_detail_id = $1 AND booking_status = 'RESERVED'`,
            [room_detail_id]
        );
        if (parseInt(remaining.rows[0].count) === 0) {
            await client.query(`UPDATE room_details SET status = 'AVAILABLE' WHERE id = $1`, [room_detail_id]);
        }

        await client.query('COMMIT');
        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ── Chuyển RESERVED → RENTED (Admin nhận phòng) ───────────────────────────────
// Điều kiện: NOW >= expected_checkin VÀ NOW < expected_checkout
export const convertReservedToRented = async (bookingId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const getQuery = `
            SELECT b.*, rd.room_number, rd.status AS room_status
            FROM bookings b
            LEFT JOIN room_details rd ON rd.id = b.room_detail_id
            WHERE b.booking_id = $1 AND b.booking_status = 'RESERVED'
        `;
        const { rows } = await client.query(getQuery, [bookingId]);
        if (!rows[0]) throw new Error('Không tìm thấy lịch đặt trước hoặc đã được xử lý.');

        const booking = rows[0];
        
        if (booking.room_status === 'CLEANING') {
            throw new Error(`Phòng ${booking.room_number} đang được dọn dẹp. Vui lòng hoàn tất dọn dẹp trước khi nhận phòng.`);
        }
        if (booking.room_status === 'MAINTENANCE') {
            throw new Error(`Phòng ${booking.room_number} đang bảo trì. Không thể nhận phòng lúc này.`);
        }
        if (booking.room_status === 'OCCUPIED') {
            throw new Error(`Phòng ${booking.room_number} đang có khách ở. Không thể nhận phòng.`);
        }

        const now = new Date();

        // Chưa tới giờ nhận phòng
        if (now < new Date(booking.expected_checkin)) {
            throw new Error('Chưa tới giờ nhận phòng dự kiến. Vui lòng chờ đến đúng giờ.');
        }

        // Đã quá giờ checkout
        if (booking.expected_checkout && now >= new Date(booking.expected_checkout)) {
            throw new Error('Đã quá giờ check-out dự kiến. Vui lòng cập nhật lại lịch trước khi nhận phòng.');
        }

        // RESERVED → RENTED
        const updateQuery = `
            UPDATE bookings
            SET booking_status = 'RENTED',
                actual_checkin = $1,
                is_currently_rented = true,
                reservation_validity = NULL,
                updated_at = NOW()
            WHERE booking_id = $2
            RETURNING *;
        `;
        const updated = await client.query(updateQuery, [now, bookingId]);

        // Phòng → OCCUPIED
        await client.query(
            `UPDATE room_details SET status = 'OCCUPIED' WHERE id = $1`,
            [booking.room_detail_id]
        );

        await client.query('COMMIT');
        return updated.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
