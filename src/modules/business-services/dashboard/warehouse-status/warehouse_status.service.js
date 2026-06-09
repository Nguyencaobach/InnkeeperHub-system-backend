import { 
    fetchLowStockProducts, 
    fetchExpiringBatches, 
    fetchLockedBatches, 
    updateBatchToZero 
} from './warehouse_status.model.js';

export const getDashboardLogic = async () => {
    // Chạy song song 3 truy vấn để API trả về cực nhanh
    const [lowStock, expiring, locked] = await Promise.all([
        fetchLowStockProducts(10), // Lấy hàng có tồn kho <= 10
        fetchExpiringBatches(30),  // Lấy lô hàng còn <= 30 ngày sử dụng
        fetchLockedBatches()       // Lấy lô hàng bị khóa/hàng chết
    ]);

    return {
        lowStockAlert: lowStock,
        expiringAlert: expiring,
        lockedBatches: locked
    };
};

export const discardBatchLogic = async (batchId) => {
    // Chỉ cho phép set số lượng về 0 nếu lô hàng đó có status = 'LOCKED'
    const discardedBatch = await updateBatchToZero(batchId);
    if (!discardedBatch) {
        throw new Error("Lô hàng không tồn tại hoặc chưa bị khóa. Vui lòng khóa lô hàng trước khi tiêu hủy.");
    }
    return discardedBatch;
};