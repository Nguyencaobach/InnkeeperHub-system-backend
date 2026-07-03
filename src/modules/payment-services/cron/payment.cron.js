import cron from 'node-cron';
import { cleanupExpiredUnpaidBookings } from './payment.model.js';

export const initPaymentCronJobs = () => {
    // Chạy tự động mỗi phút một lần
    cron.schedule('* * * * *', async () => {
        try {
            const deletedCount = await cleanupExpiredUnpaidBookings();
            if (deletedCount > 0) {
                console.log(`🧹 [CRON - 1 Min] Đã phát hiện và xóa ${deletedCount} đơn đặt phòng quá hạn 5 phút chưa thanh toán. Trả phòng về trạng thái AVAILABLE.`);
            }
        } catch (error) {
            console.error('❌ [CRON] Lỗi khi dọn dẹp đơn hàng chưa thanh toán:', error.message);
        }
    });

    console.log('⏱️  [CRON] Đã kích hoạt bộ đếm dọn dẹp đơn ảo (1 phút/lần).');
};
