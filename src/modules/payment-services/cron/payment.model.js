import pool from '../../../shared/database/db.js';
import fs from 'fs';
import path from 'path';

/**
 * Xóa các đơn đặt phòng (RESERVED) chưa thanh toán (UNPAID) quá 5 phút
 * Đồng thời cập nhật trạng thái phòng trở về AVAILABLE
 * @returns {Promise<number>} Số lượng đơn hàng đã bị xóa
 */
export const cleanupExpiredUnpaidBookings = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy danh sách các booking quá hạn 5 phút (kèm theo URL ảnh CCCD)
        const selectExpiredQuery = `
            SELECT booking_id, room_detail_id, cccd_front_url, cccd_back_url 
            FROM bookings 
            WHERE payment_status = 'UNPAID' 
              AND booking_status = 'RESERVED' 
              AND created_at < NOW() - INTERVAL '5 minutes'
        `;
        const resSelect = await client.query(selectExpiredQuery);
        const expiredBookings = resSelect.rows;

        if (expiredBookings.length === 0) {
            await client.query('COMMIT');
            return 0; // Không có đơn nào bị quá hạn
        }

        const roomDetailIds = expiredBookings.map(b => b.room_detail_id).filter(id => id !== null);
        const bookingIds = expiredBookings.map(b => b.booking_id);

        // 2. Cập nhật phòng về trạng thái AVAILABLE (chỉ áp dụng nếu phòng đang hiển thị RESERVED và không còn lịch nào khác)
        if (roomDetailIds.length > 0) {
            const updateRoomsQuery = `
                UPDATE room_details 
                SET status = 'AVAILABLE' 
                WHERE id = ANY($1)
                  AND status = 'RESERVED'
                  AND id NOT IN (
                      SELECT room_detail_id FROM bookings
                      WHERE booking_status = 'RESERVED'
                        AND booking_id != ALL($2)
                        AND room_detail_id IS NOT NULL
                  )
            `;
            await client.query(updateRoomsQuery, [roomDetailIds, bookingIds]);
        }

        // 3. Xóa các booking ảo
        const deleteBookingsQuery = `
            DELETE FROM bookings 
            WHERE booking_id = ANY($1)
        `;
        await client.query(deleteBookingsQuery, [bookingIds]);

        // 4. Xóa ảnh CCCD trong thư mục cccd_for_reserved để tránh rác
        for (const booking of expiredBookings) {
            const urls = [booking.cccd_front_url, booking.cccd_back_url];
            for (const url of urls) {
                // Chỉ xóa những file nằm trong thư mục cccd_for_reserved
                if (url && url.includes('/uploads/cccd_for_reserved/')) {
                    const filePath = path.join(process.cwd(), 'public', url);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (err) {
                            console.error(`Không thể xóa file ảnh rác: ${filePath}`, err);
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        return expiredBookings.length;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('cleanupExpiredUnpaidBookings DB Error:', error);
        throw error;
    } finally {
        client.release();
    }
};
