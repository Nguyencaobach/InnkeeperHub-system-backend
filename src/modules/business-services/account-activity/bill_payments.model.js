import db from '../../../shared/database/db.js';

// ── 1. Lấy danh sách hóa đơn (có lọc) ─────────────────────────────
export const fetchAllBills = async ({ search, dateFrom, dateTo, limit, offset }) => {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (search) {
        conditions.push(`(
            LOWER(id) LIKE $${idx} OR
            LOWER(booking_code) LIKE $${idx} OR
            LOWER(guest_name) LIKE $${idx}
        )`);
        values.push(`%${search.toLowerCase()}%`);
        idx++;
    }

    if (dateFrom) {
        conditions.push(`created_at >= $${idx}::date`);
        values.push(dateFrom);
        idx++;
    }

    if (dateTo) {
        conditions.push(`created_at < ($${idx}::date + INTERVAL '1 day')`);
        values.push(dateTo);
        idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM bill_payments ${where}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
        SELECT 
            id, booking_code, room_number, guest_name, guest_phone,
            guest_email, rent_type, actual_checkin, actual_checkout,
            room_price, service_price, deposit_amount, deposit_applied,
            final_amount, payment_method, created_at, cashier_id
        FROM bill_payments
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(limit ?? 50);
    values.push(offset ?? 0);

    const result = await db.query(dataQuery, values);
    return { total, rows: result.rows };
};

// ── 2. Lấy chi tiết 1 hóa đơn (bao gồm services_detail) ──────────
export const fetchBillById = async (id) => {
    const query = `SELECT * FROM bill_payments WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// ── 3. Xóa hóa đơn theo id ────────────────────────────────────────
export const deleteBillById = async (id) => {
    const query = `DELETE FROM bill_payments WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};
