import pool from '../../../../shared/database/db.js';

class CustomerBookingModel {
    /**
     * Lấy toàn bộ lịch sử đặt phòng của một khách hàng
     */
    async getMyBookings(customerId) {
        const query = `
            SELECT 
                b.booking_id,
                b.booking_code,
                b.rent_type,
                b.booking_status,
                b.payment_status,
                b.is_currently_rented,

                -- Thời gian (Bỏ Z để giữ nguyên giờ địa phương lưu trong DB)
                TO_CHAR(b.expected_checkin, 'YYYY-MM-DD"T"HH24:MI:SS') AS expected_checkin,
                TO_CHAR(b.expected_checkout, 'YYYY-MM-DD"T"HH24:MI:SS') AS expected_checkout,
                TO_CHAR(b.actual_checkin, 'YYYY-MM-DD"T"HH24:MI:SS') AS actual_checkin,
                TO_CHAR(b.actual_checkout, 'YYYY-MM-DD"T"HH24:MI:SS') AS actual_checkout,
                b.actual_duration_minutes,

                -- Tài chính
                b.total_amount,
                b.deposit_amount,

                -- Thông tin loại phòng
                rt.id         AS room_type_id,
                rt.name       AS room_type_name,
                rt.room_img_url,
                rt.floor,
                rt.bed_type,
                rt.capacity,

                -- Thông tin phòng chi tiết
                rd.id         AS room_detail_id,
                rd.room_number,

                TO_CHAR(COALESCE(pt.created_at, b.created_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at

            FROM bookings b
            LEFT JOIN room_types   rt ON b.room_type_id   = rt.id
            LEFT JOIN room_details rd ON b.room_detail_id = rd.id
            LEFT JOIN (
                SELECT booking_id, MAX(created_at) as created_at
                FROM payment_transactions
                GROUP BY booking_id
            ) pt ON b.booking_id = pt.booking_id
            WHERE b.customer_id = $1
              AND b.booking_status IN ('RESERVED', 'RENTED')
              AND b.payment_status != 'UNPAID'
            ORDER BY COALESCE(pt.created_at, b.created_at) DESC;
        `;
        const result = await pool.query(query, [customerId]);
        return result.rows;
    }

    /**
     * Lấy chi tiết một đặt phòng theo booking_id (kiểm tra quyền sở hữu)
     */
    async getBookingDetail(bookingId, customerId) {
        const query = `
            SELECT 
                b.booking_id,
                b.booking_code,
                b.rent_type,
                b.booking_status,
                b.payment_status,
                b.is_currently_rented,

                TO_CHAR(b.expected_checkin, 'YYYY-MM-DD"T"HH24:MI:SS') AS expected_checkin,
                TO_CHAR(b.expected_checkout, 'YYYY-MM-DD"T"HH24:MI:SS') AS expected_checkout,
                TO_CHAR(b.actual_checkin, 'YYYY-MM-DD"T"HH24:MI:SS') AS actual_checkin,
                TO_CHAR(b.actual_checkout, 'YYYY-MM-DD"T"HH24:MI:SS') AS actual_checkout,
                b.actual_duration_minutes,

                b.total_amount,
                b.deposit_amount,

                rt.id         AS room_type_id,
                rt.name       AS room_type_name,
                rt.room_img_url,
                rt.floor,
                rt.bed_type,
                rt.capacity,
                rt.hourly_price,
                rt.daily_price,

                rd.id         AS room_detail_id,
                rd.room_number,

                TO_CHAR(COALESCE(pt.created_at, b.created_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM bookings b
            LEFT JOIN room_types   rt ON b.room_type_id   = rt.id
            LEFT JOIN room_details rd ON b.room_detail_id = rd.id
            LEFT JOIN (
                SELECT booking_id, MAX(created_at) as created_at
                FROM payment_transactions
                GROUP BY booking_id
            ) pt ON b.booking_id = pt.booking_id
            WHERE b.booking_id = $1 AND b.customer_id = $2;
        `;
        const result = await pool.query(query, [bookingId, customerId]);
        return result.rows[0] || null;
    }
}

export default new CustomerBookingModel();
