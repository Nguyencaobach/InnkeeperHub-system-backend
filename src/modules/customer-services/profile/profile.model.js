import db from '../../../shared/database/db.js';


// 1. Lấy thông tin hồ sơ khách hàng
export const fetchCustomerProfileById = async (customerId) => {
    const query = `
        SELECT 
            customer_id, username, full_name, email, 
            phone_number, avatar_url, cccd_front_url, cccd_back_url, is_active, 
            member_code, current_points, created_at, updated_at
        FROM customers
        WHERE customer_id = $1 AND is_active = TRUE
    `;
    const result = await db.query(query, [customerId]);
    return result.rows[0] || null;
};

// 2. Kiểm tra trùng lặp thông tin (Email, SĐT) khi cập nhật
export const checkProfileDuplicate = async (field, value, excludeId) => {
    if (!value) return false;
    const query = `SELECT customer_id FROM customers WHERE ${field} = $1 AND customer_id != $2`;
    const result = await db.query(query, [value, excludeId]);
    return result.rows.length > 0;
};

// 3. Cập nhật thông tin text của khách hàng
export const updateCustomerProfileById = async (customerId, data) => {
    let setClauses = [
        'full_name = $1',
        'email = $2',
        'phone_number = $3',
        'updated_at = CURRENT_TIMESTAMP'
    ];
    
    let values = [
        data.full_name,
        data.email || null,
        data.phone_number || null,
    ];

    if (data.password) {
        setClauses.push(`password = $${values.length + 1}`);
        values.push(data.password);
    }
    
    values.push(customerId);

    const query = `
        UPDATE customers
        SET ${setClauses.join(', ')}
        WHERE customer_id = $${values.length}
        RETURNING customer_id, username, full_name, email, phone_number, avatar_url, cccd_front_url, cccd_back_url, updated_at
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
};

// 4. Cập nhật link Avatar
export const updateCustomerAvatarById = async (customerId, avatarUrl) => {
    const query = `
        UPDATE customers
        SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $2
        RETURNING customer_id, username, full_name, email, phone_number, avatar_url, cccd_front_url, cccd_back_url, updated_at
    `;
    const result = await db.query(query, [avatarUrl, customerId]);
    return result.rows[0];
};

// 5. Cập nhật link CCCD
export const updateCustomerCCCDById = async (customerId, frontUrl, backUrl) => {
    let setClauses = ['updated_at = CURRENT_TIMESTAMP'];
    let values = [];
    let queryIdx = 1;

    if (frontUrl !== null) {
        setClauses.push(`cccd_front_url = $${queryIdx}`);
        values.push(frontUrl);
        queryIdx++;
    }

    if (backUrl !== null) {
        setClauses.push(`cccd_back_url = $${queryIdx}`);
        values.push(backUrl);
        queryIdx++;
    }

    values.push(customerId);

    const query = `
        UPDATE customers
        SET ${setClauses.join(', ')}
        WHERE customer_id = $${queryIdx}
        RETURNING customer_id, username, full_name, email, phone_number, avatar_url, cccd_front_url, cccd_back_url, updated_at
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
};

// 6. Lấy lịch sử thanh toán của khách hàng
export const fetchPaymentHistory = async (customerId) => {
    const query = `
        SELECT 
            pt.id              AS transaction_id,
            pt.order_code,
            pt.transaction_id  AS bank_transaction_id,
            pt.amount,
            pt.status,
            TO_CHAR(pt.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
            b.booking_id,
            b.booking_code,
            c.full_name        AS customer_name
        FROM payment_transactions pt
        INNER JOIN bookings b ON pt.booking_id = b.booking_id
        INNER JOIN customers c ON b.customer_id = c.customer_id
        WHERE b.customer_id = $1
        ORDER BY pt.created_at DESC
    `;
    const result = await db.query(query, [customerId]);
    return result.rows;
};
