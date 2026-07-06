import cron from 'node-cron';
import { autoLockExpiredBatches } from '../../modules/business-services/warehouse-management/product-batches/product-batch.model.js';
import { autoLockExpiredDiscounts } from '../../modules/business-services/service-management/discount/discount.model.js';
import { autoMarkOverdueReservations } from '../../modules/business-services/rooms-management/reserve-booking/reserve-booking-validity.model.js';

export const initCronJobs = () => {

    // ========================================================
    // 1. QUÉT NGAY 1 LẦN KHI VỪA BẬT SERVER (Tránh lọt lưới do tắt máy)
    // ========================================================
    console.log('🔄 [CRON] Khởi động: Đang kiểm tra và dọn dẹp dữ liệu quá hạn (nếu có)...');
    
    // Quét Lô hàng ngay lập tức
    autoLockExpiredBatches()
        .then(res => { if(res > 0) console.log(`📦 Đã dọn dẹp bù ${res} lô hàng quá hạn.`); })
        .catch(err => console.error('Lỗi quét bù kho hàng:', err.message));

    // Quét Mã giảm giá ngay lập tức
    autoLockExpiredDiscounts()
        .then(res => { if(res > 0) console.log(`🎟️ Đã dọn dẹp bù ${res} mã giảm giá quá hạn.`); })
        .catch(err => console.error('Lỗi quét bù mã giảm giá:', err.message));


    // ========================================================
    // 2. SAU ĐÓ BẮT ĐẦU LÊN LỊCH CHẠY ĐỊNH KỲ
    // ========================================================

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
            if (batchResult > 0) {
                 console.log(`📦 [CRON 00:00 VN] Đã kiểm tra và khóa ${batchResult} lô hàng hết hạn.`);
            } else {
                 console.log(`📦 [CRON 00:00 VN] Đã kiểm tra kho hàng, không có lô nào hết hạn hôm nay.`);
            }
        } catch (error) {
            console.error('Lỗi cron kho hàng:', error.message);
        }
    }, { timezone: 'Asia/Ho_Chi_Minh' }); // Quan trọng: Chạy đúng 00:00 giờ Việt Nam

    // 3. Đồng hồ cho LỊCH ĐẶT TRƯỚC: Chạy mỗi 20 phút
    // Đánh dấu OVERDUE các booking RESERVED đã quá giờ nhận phòng mà khách chưa đến
    cron.schedule('*/20 * * * *', async () => {
        try {
            const overdueCount = await autoMarkOverdueReservations();
            if (overdueCount > 0) {
                console.log(`📅 [CRON - 1 Min] Đã đánh dấu ${overdueCount} lịch đặt trước quá hạn nhận phòng (PENDING → OVERDUE).`);
            }
        } catch (error) {
            console.error('Lỗi cron lịch đặt trước:', error.message);
        }
    });

    console.log('⏱️  [CRON] Hệ thống bảo vệ dữ liệu tự động đã kích hoạt!');
};