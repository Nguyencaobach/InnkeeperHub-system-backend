import db from '../../../../shared/database/db.js';

// ============================================================================
// 1. LẤY DANH SÁCH SẮP CẠN KHO (LOW STOCK ALERT)
// Tính tổng tồn kho của từng sản phẩm, chỉ lấy những sản phẩm dưới mức threshold
// ============================================================================
export const fetchLowStockProducts = async (threshold = 10) => {
    const query = `
        SELECT 
            p.product_id, 
            p.sku, 
            p.name AS product_name, 
            p.image_url, 
            p.unit, 
            SUM(b.remain_quantity) AS total_remain
        FROM products p
        LEFT JOIN product_batches b ON p.product_id = b.product_id AND b.status = 'ACTIVE'
        WHERE p.is_active = TRUE
        GROUP BY p.product_id, p.sku, p.name, p.image_url, p.unit
        HAVING SUM(b.remain_quantity) <= $1 OR SUM(b.remain_quantity) IS NULL
        ORDER BY total_remain ASC NULLS FIRST;
    `;
    const result = await db.query(query, [threshold]);
    return result.rows;
};

// ============================================================================
// 2. LẤY DANH SÁCH LÔ HÀNG CẬN DATE (EXPIRING ALERT)
// Lấy hàng còn HSD nhưng sắp hết (Ví dụ <= 30 ngày) để chạy khuyến mãi
// ============================================================================
export const fetchExpiringBatches = async (daysLimit = 30) => {
    const query = `
        SELECT 
            b.batch_id, 
            b.batch_code, 
            p.name AS product_name, 
            p.unit,
            b.remain_quantity, 
            b.exp_date, 
            b.supplier
        FROM product_batches b
        JOIN products p ON b.product_id = p.product_id
        WHERE b.status = 'ACTIVE' 
          AND b.remain_quantity > 0 
          AND b.exp_date IS NOT NULL 
          AND b.exp_date <= CURRENT_DATE + $1::INTEGER 
          AND b.exp_date >= CURRENT_DATE
        ORDER BY b.exp_date ASC;
    `;
    const result = await db.query(query, [daysLimit]);
    return result.rows;
};

// ============================================================================
// 3. LẤY DANH SÁCH HÀNG TỒN ĐỌNG / BỊ KHÓA (LOCKED BATCHES)
// Lấy các lô hàng không thể bán được nữa (Bao gồm hàng quá hạn)
// ============================================================================
export const fetchLockedBatches = async () => {
    const query = `
        SELECT 
            b.batch_id, 
            b.batch_code, 
            p.name AS product_name, 
            p.unit,
            b.remain_quantity, 
            b.exp_date, 
            b.supplier,
            b.import_date
        FROM product_batches b
        JOIN products p ON b.product_id = p.product_id
        WHERE b.status = 'LOCKED' 
          AND b.remain_quantity > 0
        ORDER BY b.exp_date ASC NULLS LAST;
    `;
    const result = await db.query(query);
    return result.rows;
};

// ============================================================================
// 4. TIÊU HỦY LÔ HÀNG BỊ KHÓA (Cập nhật tồn kho = 0)
// ============================================================================
export const updateBatchToZero = async (batchId) => {
    const query = `
        UPDATE product_batches 
        SET remain_quantity = 0, updated_at = CURRENT_TIMESTAMP 
        WHERE batch_id = $1 AND status = 'LOCKED'
        RETURNING *;
    `;
    const result = await db.query(query, [batchId]);
    return result.rows[0]; // Trả về thông tin lô hàng vừa bị set về 0
};