import { 
    checkRoomTypeExists, checkRoomNumberExists, insertRoomDetail, 
    fetchAllRoomDetails, fetchRoomDetailById, updateRoomDetailById, deleteRoomDetailById 
} from './room_detail.model.js';

export const createLogic = async (data) => {
    // 1. Kiểm tra xem Loại phòng có tồn tại không
    const isRoomTypeExist = await checkRoomTypeExists(data.room_type_id);
    if (!isRoomTypeExist) {
        throw new Error("Loại phòng này không tồn tại trong hệ thống.");
    }

    // 2. Kiểm tra xem Số phòng đã bị trùng chưa
    const isRoomNumberExist = await checkRoomNumberExists(data.room_number);
    if (isRoomNumberExist) {
        throw new Error(`Phòng số ${data.room_number} đã tồn tại. Vui lòng chọn số phòng khác.`);
    }

    return await insertRoomDetail(data);
};

export const getListLogic = async () => {
    return await fetchAllRoomDetails();
};

export const updateLogic = async (id, data) => {
    // 1. Kiểm tra phòng chi tiết này có tồn tại không
    const currentRoom = await fetchRoomDetailById(id);
    if (!currentRoom) {
        throw new Error("Không tìm thấy thông tin phòng này.");
    }

    // 2. Kiểm tra Loại phòng mới có tồn tại không
    const isRoomTypeExist = await checkRoomTypeExists(data.room_type_id);
    if (!isRoomTypeExist) {
        throw new Error("Loại phòng bạn chọn không tồn tại.");
    }

    // 3. Kiểm tra xem Số phòng có bị trùng với phòng KHÁC không (Loại trừ chính nó)
    const isRoomNumberExist = await checkRoomNumberExists(data.room_number, id);
    if (isRoomNumberExist) {
        throw new Error(`Phòng số ${data.room_number} đã bị trùng với một phòng khác.`);
    }

    return await updateRoomDetailById(id, data);
};

export const deleteLogic = async (id) => {
    const currentRoom = await fetchRoomDetailById(id);
    if (!currentRoom) {
        throw new Error("Không tìm thấy thông tin phòng này.");
    }

    // Vì phòng này không chứa file ảnh (ảnh nằm ở loại phòng), nên chỉ cần xóa DB là xong
    return await deleteRoomDetailById(id);
};