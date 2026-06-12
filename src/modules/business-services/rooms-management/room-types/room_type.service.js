import fs from 'fs';
import path from 'path';
import { 
    checkNameExists, insertRoomType, fetchAllRoomTypes, 
    fetchRoomTypeById, updateRoomTypeById, deleteRoomTypeById 
} from './room_type.model.js';

// Hàm phụ trợ: Xóa ảnh vật lý trên ổ cứng
const deletePhysicalImage = (imageUrl) => {
    if (!imageUrl) return;
    const fileName = imageUrl.split('/').pop();
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'rooms', fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Hàm phụ trợ: Xử lý mảng amenities từ Form-data (Hỗ trợ chống double-stringify)
const parseAmenities = (amenitiesData) => {
    if (!amenitiesData) return [];
    if (typeof amenitiesData === 'string') {
        try {
            let parsed = JSON.parse(amenitiesData);
            // Nếu sau parse vẫn là string (double-stringified), parse thêm lần 2
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            // Fallback: cắt theo dấu phẩy nếu không parse được JSON
            return amenitiesData.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return Array.isArray(amenitiesData) ? amenitiesData : [];
};

export const createLogic = async (data, file) => {
    const isExist = await checkNameExists(data.name);
    if (isExist) throw new Error("Tên loại phòng đã tồn tại.");

    // Tạo URL ảnh nếu có upload
    const room_img_url = file ? `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/rooms/${file.filename}` : null;
    
    data.amenities = JSON.stringify(parseAmenities(data.amenities));
    data.room_img_url = room_img_url;

    return await insertRoomType(data);
};

export const getListLogic = async () => {
    return await fetchAllRoomTypes();
};

export const updateLogic = async (id, data, file) => {
    const currentRoom = await fetchRoomTypeById(id);
    if (!currentRoom) throw new Error("Không tìm thấy loại phòng này.");

    const isExist = await checkNameExists(data.name, id);
    if (isExist) throw new Error("Tên loại phòng đã bị trùng với loại khác.");

    // Xử lý ảnh: Nếu có ảnh mới up lên -> Xóa ảnh cũ, cập nhật URL mới
    let room_img_url = currentRoom.room_img_url;
    if (file) {
        deletePhysicalImage(currentRoom.room_img_url);
        room_img_url = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/rooms/${file.filename}`;
    }

    // Giữ lại giá trị cũ từ DB nếu Frontend không gửi lên (undefined)
    // tránh lỗi PostgreSQL không chấp nhận undefined trong query params
    data.floor     = data.floor     !== undefined ? data.floor     : currentRoom.floor;
    data.bed_type  = data.bed_type  !== undefined ? data.bed_type  : currentRoom.bed_type;
    data.room_size = data.room_size !== undefined ? data.room_size : currentRoom.room_size;
    data.view_type = data.view_type !== undefined ? data.view_type : currentRoom.view_type;
    data.capacity  = data.capacity  !== undefined ? data.capacity  : currentRoom.capacity;

    data.amenities    = JSON.stringify(parseAmenities(data.amenities));
    data.room_img_url = room_img_url;

    return await updateRoomTypeById(id, data);
};

export const deleteLogic = async (id) => {
    const currentRoom = await fetchRoomTypeById(id);
    if (!currentRoom) throw new Error("Không tìm thấy loại phòng này.");

    // Xóa loại phòng trong DB
    const deletedRoom = await deleteRoomTypeById(id);
    
    // Nếu xóa DB thành công, tiến hành xóa luôn file ảnh trên ổ cứng
    deletePhysicalImage(deletedRoom.room_img_url); 

    return deletedRoom;
};