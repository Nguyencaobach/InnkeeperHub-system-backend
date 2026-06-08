import fs from 'fs';
import path from 'path';
import { 
    checkServiceNameExists, insertService, 
    fetchAllServices, fetchServiceById, updateServiceById, deleteServiceById 
} from './service.model.js';

// Hàm phụ trợ: Xóa ảnh vật lý trên máy chủ
const deletePhysicalImage = (imageUrl) => {
    if (!imageUrl) return;
    // Lấy tên file từ URL (vd: service-1234.jpg)
    const fileName = imageUrl.split('/').pop(); 
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'additional-services', fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const createLogic = async (data, file) => {
    // 1. Kiểm tra trùng tên dịch vụ trong cùng 1 Category
    const isNameExist = await checkServiceNameExists(data.name, data.category);
    if (isNameExist) {
        throw new Error(`Dịch vụ '${data.name}' đã tồn tại trong nhóm ${data.category}.`);
    }

    // 2. Xử lý ảnh
    data.image_url = file ? `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/additional-services/${file.filename}` : null;

    return await insertService(data);
};

export const getListLogic = async (category) => {
    return await fetchAllServices(category);
};

export const updateLogic = async (id, data, file) => {
    const currentService = await fetchServiceById(id);
    if (!currentService) throw new Error("Không tìm thấy dịch vụ này.");

    // Kiểm tra trùng tên khi đổi tên
    const isNameExist = await checkServiceNameExists(data.name, data.category, id);
    if (isNameExist) {
        throw new Error(`Dịch vụ '${data.name}' đã tồn tại trong nhóm ${data.category}.`);
    }

    // Xử lý ảnh: Nếu có ảnh mới -> Dọn rác ảnh cũ -> Cập nhật link mới
    let image_url = currentService.image_url;
    if (file) {
        deletePhysicalImage(currentService.image_url);
        image_url = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/additional-services/${file.filename}`;
    }
    data.image_url = image_url;

    return await updateServiceById(id, data);
};

export const deleteLogic = async (id) => {
    const currentService = await fetchServiceById(id);
    if (!currentService) throw new Error("Không tìm thấy dịch vụ này.");

    // Xóa khỏi DB
    const deletedService = await deleteServiceById(id);
    
    // Dọn rác ảnh trên ổ cứng
    deletePhysicalImage(deletedService.image_url);

    return deletedService;
};