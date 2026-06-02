import db from '../../../../shared/database/db.js';

// Kiểm tra xem Loại phòng (room_type_id) có tồn tại thật không
export const checkRoomTypeExists = async (roomTypeId) => {
    const query = `SELECT id FROM room_types WHERE id = $1`;
    const result = await db.query(query, [roomTypeId]);
    return result.rows.length > 0;
};

// Kiểm tra xem Số phòng (VD: P101) đã có ai tạo chưa (để chống trùng lặp)
export const checkRoomNumberExists = async (roomNumber, excludeId = null) => {
    let query = `SELECT id FROM room_details WHERE room_number = $1`;
    let params = [roomNumber];
    if (excludeId) {
        query += ` AND id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// Thêm mới phòng
export const insertRoomDetail = async (data) => {
    const query = `
        INSERT INTO room_details (room_type_id, room_number, status) 
        VALUES ($1, $2, $3) 
        RETURNING *;
    `;
    // Mặc định trạng thái là AVAILABLE nếu Frontend không truyền
    const status = data.status || 'AVAILABLE';
    const values = [data.room_type_id, data.room_number, status];
    const result = await db.query(query, values);
    return result.rows[0];
};

// Lấy danh sách phòng, JOIN với bảng room_types để lấy luôn Tên loại phòng
export const fetchAllRoomDetails = async () => {
    const query = `
        SELECT rd.*, rt.name as room_type_name, rt.hourly_price, rt.daily_price 
        FROM room_details rd
        JOIN room_types rt ON rd.room_type_id = rt.id
        ORDER BY rd.room_number ASC
    `;
    const result = await db.query(query);
    return result.rows;
};

// Lấy 1 phòng cụ thể
export const fetchRoomDetailById = async (id) => {
    const query = `SELECT * FROM room_details WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// Cập nhật thông tin phòng
export const updateRoomDetailById = async (id, data) => {
    const query = `
        UPDATE room_details 
        SET room_type_id = $1, room_number = $2, status = $3
        WHERE id = $4 
        RETURNING *;
    `;
    const values = [data.room_type_id, data.room_number, data.status, id];
    const result = await db.query(query, values);
    return result.rows[0];
};

// Xóa phòng
export const deleteRoomDetailById = async (id) => {
    const query = `DELETE FROM room_details WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};