import pool from '../../../../shared/database/db.js';

// ── Cập nhật reservation_validity: PENDING → OVERDUE khi đã quá giờ nhận phòng ─
// Chạy định kỳ bởi cron trong cron.service.js
export const autoMarkOverdueReservations = async () => {
    const query = `
        UPDATE bookings
        SET reservation_validity = 'OVERDUE'
        WHERE booking_status = 'RESERVED'
          AND (reservation_validity = 'PENDING' OR reservation_validity IS NULL)
          AND expected_checkin <= NOW()
        RETURNING booking_id;
    `;
    const { rowCount } = await pool.query(query);
    return rowCount; // Trả về số booking vừa bị đánh dấu OVERDUE
};
