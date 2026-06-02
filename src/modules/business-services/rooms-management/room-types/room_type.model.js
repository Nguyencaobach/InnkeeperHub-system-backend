import db from '../../../../shared/database/db.js';

export const checkNameExists = async (name, excludeId = null) => {
    let query = `SELECT id FROM room_types WHERE name = $1`;
    let params = [name];
    if (excludeId) {
        query += ` AND id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

export const insertRoomType = async (data) => {
    const query = `
        INSERT INTO room_types 
        (name, hourly_price, daily_price, floor, capacity, bed_type, room_size, view_type, amenities, room_img_url) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *;
    `;
    const values = [
        data.name, data.hourly_price, data.daily_price, data.floor, 
        data.capacity, data.bed_type, data.room_size, data.view_type, 
        data.amenities, data.room_img_url
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

export const fetchAllRoomTypes = async () => {
    const query = `SELECT * FROM room_types ORDER BY name ASC`;
    const result = await db.query(query);
    return result.rows;
};

export const fetchRoomTypeById = async (id) => {
    const query = `SELECT * FROM room_types WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

export const updateRoomTypeById = async (id, data) => {
    const query = `
        UPDATE room_types 
        SET name = $1, hourly_price = $2, daily_price = $3, floor = $4, 
            capacity = $5, bed_type = $6, room_size = $7, view_type = $8, 
            amenities = $9, room_img_url = $10 
        WHERE id = $11 
        RETURNING *;
    `;
    const values = [
        data.name, data.hourly_price, data.daily_price, data.floor, 
        data.capacity, data.bed_type, data.room_size, data.view_type, 
        data.amenities, data.room_img_url, id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

export const deleteRoomTypeById = async (id) => {
    const query = `DELETE FROM room_types WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};