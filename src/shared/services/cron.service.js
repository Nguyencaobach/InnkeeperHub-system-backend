import cron from 'node-cron';
import { autoLockExpiredBatches } from '../../modules/business-services/warehouse-management/product-batches/product-batch.model.js';
import { autoLockExpiredDiscounts } from '../../modules/business-services/service-management/discount/discount.model.js';

export const initCronJobs = () => {
    // 1. Đồng hồ cho MÃ GIẢM GIÁ: Chạy lúc 00:00 MỖI NGÀY theo giờ Việt Nam
    // Khóa mã khi hết ngày end_date — giống logic lô hàng
    cron.schedule('0 0 * * *', async () => {
        try {
            const discountResult = await autoLockExpiredDiscounts();
            if (discountResult > 0) {
                console.log(`🎟️ [CRON 00:00 VN] Đã khóa ${discountResult} mã giảm giá hết hạn.`);
            }
        } catch (error) {
            console.error('Lỗi cron mã giảm giá:', error.message);
        }
    }, { timezone: 'Asia/Ho_Chi_Minh' }); // Chạy đúng 00:00 giờ Việt Nam

    // 2. Đồng hồ cho KHO HÀNG: Chạy lúc 00:00 ĐÚNG NỬA ĐÊM giờ Việt Nam
    // Không có timezone này, cron chạy lúc 00:00 UTC = 07:00 sáng VN (sai!)
    cron.schedule('0 0 * * *', async () => {
        try {
            // SQL đã dùng (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE
            const batchResult = await autoLockExpiredBatches();
            console.log(`📦 [CRON 00:00 VN] Đã kiểm tra và khóa ${batchResult} lô hàng hết hạn.`);
        } catch (error) {
            console.error('Lỗi cron kho hàng:', error.message);
        }
    }, { timezone: 'Asia/Ho_Chi_Minh' }); // Quan trọng: Chạy đúng 00:00 giờ Việt Nam

    console.log('⏱️  [CRON] Hệ thống bảo vệ dữ liệu tự động đã kích hoạt!');
};