import db from '../../../../shared/database/db.js';

// ──────────────────────────────────────────────────────────────────────────────
// LẤY SẢN PHẨM THEO DANH MỤC (kèm tổng tồn kho hợp lệ — chưa hết hạn)
// ──────────────────────────────────────────────────────────────────────────────
export const fetchProductsByCategoryWithStock = async (categoryId) => {
    const query = `
        SELECT
            p.product_id,
            p.name,
            p.sku,
            p.unit,
            p.retail_price,
            p.image_url,
            p.is_active,
            COALESCE(SUM(
                CASE
                    WHEN pb.status = 'ACTIVE'
                     AND (pb.exp_date IS NULL OR pb.exp_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE)
                    THEN pb.remain_quantity
                    ELSE 0
                END
            ), 0) AS total_stock
        FROM products p
        LEFT JOIN product_batches pb ON pb.product_id = p.product_id
        WHERE p.category_id = $1
          AND p.is_active = TRUE
        GROUP BY p.product_id
        ORDER BY p.name;
    `;
    const result = await db.query(query, [categoryId]);
    return result.rows;
};

// ──────────────────────────────────────────────────────────────────────────────
// LẤY DANH SÁCH DỊCH VỤ ĐÃ GỌI CỦA 1 PHIÊN THUÊ
// ──────────────────────────────────────────────────────────────────────────────
export const fetchServiceItemsByBookingId = async (bookingId) => {
    const query = `
        SELECT * FROM booking_services
        WHERE booking_id = $1
        ORDER BY created_at ASC;
    `;
    const result = await db.query(query, [bookingId]);
    return result.rows;
};

// ──────────────────────────────────────────────────────────────────────────────
// THÊM SẢN PHẨM KHO VÀO PHIÊN THUÊ (FEFO — ưu tiên lô gần hết hạn nhất)
// Dùng Transaction để đảm bảo dữ liệu nhất quán
// ──────────────────────────────────────────────────────────────────────────────
export const addInventoryItemToBooking = async ({ bookingId, productId, quantity }) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy thông tin sản phẩm (tên + giá bán lẻ)
        const productRes = await client.query(
            `SELECT name, retail_price, unit FROM products WHERE product_id = $1`,
            [productId]
        );
        if (productRes.rowCount === 0) throw new Error('Sản phẩm không tồn tại.');
        const product = productRes.rows[0];

        // 2. Kiểm tra tổng tồn kho hợp lệ
        const stockRes = await client.query(
            `SELECT COALESCE(SUM(remain_quantity), 0) AS total_stock
             FROM product_batches
             WHERE product_id = $1
               AND status = 'ACTIVE'
               AND (exp_date IS NULL OR exp_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE)`,
            [productId]
        );
        const totalStock = parseInt(stockRes.rows[0].total_stock, 10);
        if (totalStock < quantity) {
            throw new Error(`Không đủ tồn kho. Hiện còn ${totalStock} ${product.unit}.`);
        }

        // 3. Trừ tồn kho theo FEFO: lô gần hết hạn nhất trước
        //    Lô không có exp_date (null) xếp sau cùng
        const batchesRes = await client.query(
            `SELECT batch_id, remain_quantity
             FROM product_batches
             WHERE product_id = $1
               AND status = 'ACTIVE'
               AND remain_quantity > 0
               AND (exp_date IS NULL OR exp_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE)
             ORDER BY exp_date ASC NULLS LAST, created_at ASC`,
            [productId]
        );

        let remaining = quantity;
        for (const batch of batchesRes.rows) {
            if (remaining <= 0) break;
            const deduct = Math.min(remaining, batch.remain_quantity);
            await client.query(
                `UPDATE product_batches
                 SET remain_quantity = remain_quantity - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE batch_id = $2`,
                [deduct, batch.batch_id]
            );
            remaining -= deduct;
        }

        // 4. Kiểm tra sản phẩm đã có trong phiên thuê chưa (để cộng dồn)
        const existingRes = await client.query(
            `SELECT id, quantity FROM booking_services
             WHERE booking_id = $1 AND item_id = $2 AND service_type = 'INVENTORY'`,
            [bookingId, productId]
        );

        let resultRow;
        if (existingRes.rowCount > 0) {
            // ── ĐÃ CÓ → cộng dồn số lượng ──
            const newQty = existingRes.rows[0].quantity + quantity;
            const updateRes = await client.query(
                `UPDATE booking_services
                 SET quantity = $1
                 WHERE id = $2
                 RETURNING *`,
                [newQty, existingRes.rows[0].id]
            );
            resultRow = updateRes.rows[0];
        } else {
            // ── CHƯA CÓ → thêm mới ──
            const insertRes = await client.query(
                `INSERT INTO booking_services
                    (booking_id, service_type, item_id, item_name, quantity, unit_price)
                 VALUES ($1, 'INVENTORY', $2, $3, $4, $5)
                 RETURNING *`,
                [bookingId, productId, product.name, quantity, product.retail_price]
            );
            resultRow = insertRes.rows[0];
        }

        await client.query('COMMIT');
        return resultRow;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ──────────────────────────────────────────────────────────────────────────────
// XÓA 1 DỊCH VỤ KHỎI PHIÊN THUÊ (hoàn lại tồn kho nếu là INVENTORY)
// ──────────────────────────────────────────────────────────────────────────────
export const removeServiceItem = async (serviceItemId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Lấy thông tin item
        const itemRes = await client.query(
            `SELECT * FROM booking_services WHERE id = $1`,
            [serviceItemId]
        );
        if (itemRes.rowCount === 0) throw new Error('Không tìm thấy dịch vụ.');
        const item = itemRes.rows[0];

        // Nếu là hàng kho → hoàn lại tồn kho vào lô gần đây nhất còn ACTIVE
        if (item.service_type === 'INVENTORY' && item.item_id) {
            // Tìm lô gần nhất (exp_date gần nhất) để cộng lại
            const batchRes = await client.query(
                `SELECT batch_id FROM product_batches
                 WHERE product_id = $1 AND status = 'ACTIVE'
                 ORDER BY exp_date ASC NULLS LAST, created_at ASC
                 LIMIT 1`,
                [item.item_id]
            );
            if (batchRes.rowCount > 0) {
                await client.query(
                    `UPDATE product_batches
                     SET remain_quantity = remain_quantity + $1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE batch_id = $2`,
                    [item.quantity, batchRes.rows[0].batch_id]
                );
            }
        }

        // Xóa khỏi booking_services
        await client.query(`DELETE FROM booking_services WHERE id = $1`, [serviceItemId]);

        await client.query('COMMIT');
        return item;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
// ──────────────────────────────────────────────────────────────────────────────
// DỊCH VỤ ĐI KÈM (service_type = 'GENERAL')
// ──────────────────────────────────────────────────────────────────────────────

// Lấy danh sách categories không trùng từ bảng services
export const fetchServiceCategories = async () => {
    const query = `
        SELECT DISTINCT category
        FROM services
        WHERE is_active = TRUE
        ORDER BY category;
    `;
    const result = await db.query(query);
    return result.rows.map((r) => r.category);
};

// Lấy dịch vụ đang hoạt động theo category
export const fetchServicesByCategoryName = async (category) => {
    const query = `
        SELECT service_id, name, unit, price, image_url, description, category
        FROM services
        WHERE is_active = TRUE
          AND category = $1
        ORDER BY name;
    `;
    const result = await db.query(query, [category]);
    return result.rows;
};

// Thêm dịch vụ đi kèm vào phiên thuê (upsert — cùng dịch vụ thì cộng dồn)
export const addGeneralServiceToBooking = async ({ bookingId, serviceId, serviceName, price, quantity, unit }) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Kiểm tra đã có chưa
        const existingRes = await client.query(
            `SELECT id, quantity FROM booking_services
             WHERE booking_id = $1 AND item_id = $2 AND service_type = 'GENERAL'`,
            [bookingId, serviceId]
        );

        let resultRow;
        if (existingRes.rowCount > 0) {
            const newQty = existingRes.rows[0].quantity + quantity;
            const upd = await client.query(
                `UPDATE booking_services SET quantity = $1 WHERE id = $2 RETURNING *`,
                [newQty, existingRes.rows[0].id]
            );
            resultRow = upd.rows[0];
        } else {
            const ins = await client.query(
                `INSERT INTO booking_services
                    (booking_id, service_type, item_id, item_name, quantity, unit_price)
                 VALUES ($1, 'GENERAL', $2, $3, $4, $5)
                 RETURNING *`,
                [bookingId, serviceId, serviceName, quantity, price]
            );
            resultRow = ins.rows[0];
        }

        await client.query('COMMIT');
        return resultRow;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ──────────────────────────────────────────────────────────────────────────────
// CẬP NHẬT SỐ LƯỢNG ITEM (có xử lý đầy đủ tồn kho cho INVENTORY)
// ──────────────────────────────────────────────────────────────────────────────
export const updateServiceItemQuantity = async (serviceItemId, newQuantity) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Lấy thông tin item hiện tại
        const itemRes = await client.query(
            `SELECT * FROM booking_services WHERE id = $1`,
            [serviceItemId]
        );
        if (itemRes.rowCount === 0) throw new Error('Không tìm thấy dịch vụ.');
        const item = itemRes.rows[0];

        if (newQuantity < 1) throw new Error('Số lượng phải ít nhất là 1.');

        if (item.service_type === 'INVENTORY' && item.item_id) {
            const diff = newQuantity - item.quantity; // dương = tăng, âm = giảm

            if (diff > 0) {
                // Tăng: kiểm tra và trừ thêm tồn kho theo FEFO
                const stockRes = await client.query(
                    `SELECT COALESCE(SUM(remain_quantity), 0) AS total_stock
                     FROM product_batches
                     WHERE product_id = $1
                       AND status = 'ACTIVE'
                       AND (exp_date IS NULL OR exp_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE)`,
                    [item.item_id]
                );
                const totalStock = parseInt(stockRes.rows[0].total_stock, 10);
                if (totalStock < diff) throw new Error(`Không đủ tồn kho. Hiện còn ${totalStock}.`);

                const batchesRes = await client.query(
                    `SELECT batch_id, remain_quantity
                     FROM product_batches
                     WHERE product_id = $1
                       AND status = 'ACTIVE'
                       AND remain_quantity > 0
                       AND (exp_date IS NULL OR exp_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE)
                     ORDER BY exp_date ASC NULLS LAST, created_at ASC`,
                    [item.item_id]
                );
                let remaining = diff;
                for (const batch of batchesRes.rows) {
                    if (remaining <= 0) break;
                    const deduct = Math.min(remaining, batch.remain_quantity);
                    await client.query(
                        `UPDATE product_batches SET remain_quantity = remain_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE batch_id = $2`,
                        [deduct, batch.batch_id]
                    );
                    remaining -= deduct;
                }
            } else if (diff < 0) {
                // Giảm: hoàn lại tồn kho vào lô gần nhất
                const absDecrease = Math.abs(diff);
                const batchRes = await client.query(
                    `SELECT batch_id FROM product_batches
                     WHERE product_id = $1 AND status = 'ACTIVE'
                     ORDER BY exp_date ASC NULLS LAST, created_at ASC
                     LIMIT 1`,
                    [item.item_id]
                );
                if (batchRes.rowCount > 0) {
                    await client.query(
                        `UPDATE product_batches SET remain_quantity = remain_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE batch_id = $2`,
                        [absDecrease, batchRes.rows[0].batch_id]
                    );
                }
            }
        }

        // Cập nhật số lượng trong booking_services
        const updRes = await client.query(
            `UPDATE booking_services SET quantity = $1 WHERE id = $2 RETURNING *`,
            [newQuantity, serviceItemId]
        );

        await client.query('COMMIT');
        return updRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
