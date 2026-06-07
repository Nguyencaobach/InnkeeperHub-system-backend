import db from '../../../../shared/database/db.js';

// 1. Kiểm tra xem Sản phẩm mẹ có tồn tại không
export const checkProductExists = async (productId) => {
    const query = `SELECT product_id FROM products WHERE product_id = $1`;
    const result = await db.query(query, [productId]);
    return result.rows.length > 0;
};

// 2. Kiểm tra trùng Mã lô hàng
export const checkBatchCodeExists = async (batchCode, excludeId = null) => {
    let query = `SELECT batch_id FROM product_batches WHERE batch_code = $1`;
    let params = [batchCode];
    
    if (excludeId) {
        query += ` AND batch_id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// 3. Thêm mới lô hàng
export const insertBatch = async (data) => {
    const query = `
        INSERT INTO product_batches 
        (product_id, batch_code, original_quantity, remain_quantity, import_price, mfg_date, exp_date, supplier, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *;
    `;
    const values = [
        data.product_id, data.batch_code, data.original_quantity, data.remain_quantity, 
        data.import_price, data.mfg_date, data.exp_date, data.supplier, data.status
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 4. Lấy danh sách Lô hàng của 1 Sản phẩm cụ thể
export const fetchBatchesByProductId = async (productId) => {
    const query = `
        SELECT * FROM product_batches 
        WHERE product_id = $1 
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
};

// 5. Lấy chi tiết 1 Lô hàng
export const fetchBatchById = async (id) => {
    const query = `SELECT * FROM product_batches WHERE batch_id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// 6. Cập nhật Lô hàng
export const updateBatchById = async (id, data) => {
    const query = `
        UPDATE product_batches 
        SET batch_code = $1, original_quantity = $2, remain_quantity = $3, 
            import_price = $4, mfg_date = $5, exp_date = $6, 
            supplier = $7, status = $8, updated_at = CURRENT_TIMESTAMP
        WHERE batch_id = $9 
        RETURNING *;
    `;
    const values = [
        data.batch_code, data.original_quantity, data.remain_quantity, 
        data.import_price, data.mfg_date, data.exp_date, 
        data.supplier, data.status, id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 7. Xóa Lô hàng
export const deleteBatchById = async (id) => {
    const query = `DELETE FROM product_batches WHERE batch_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};