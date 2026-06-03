import { 
    checkNameExists, fetchAllCategories, fetchCategoryById, 
    insertCategory, updateCategoryById, deleteCategoryById 
} from './category.model.js';

export const createLogic = async (data) => {
    // Kiểm tra trùng tên danh mục
    const isExist = await checkNameExists(data.name);
    if (isExist) throw new Error("Tên danh mục này đã tồn tại trong hệ thống.");

    return await insertCategory(data);
};

export const getListLogic = async () => {
    return await fetchAllCategories();
};

export const updateLogic = async (id, data) => {
    // 1. Kiểm tra danh mục có tồn tại không
    const currentCategory = await fetchCategoryById(id);
    if (!currentCategory) throw new Error("Không tìm thấy danh mục sản phẩm này.");

    // 2. Kiểm tra trùng tên (Loại trừ chính ID của nó)
    const isExist = await checkNameExists(data.name, id);
    if (isExist) throw new Error("Tên danh mục này đã bị trùng với một danh mục khác.");

    return await updateCategoryById(id, data);
};

export const deleteLogic = async (id) => {
    // 1. Kiểm tra danh mục có tồn tại không
    const currentCategory = await fetchCategoryById(id);
    if (!currentCategory) throw new Error("Không tìm thấy danh mục sản phẩm này.");

    try {
        // 2. Thực hiện xóa cứng (Lưu ý: Nếu danh mục này đã có sản phẩm con trong kho, DB sẽ văng lỗi)
        return await deleteCategoryById(id);
    } catch (error) {
        // Bắt lỗi rào cản khóa ngoại (Foreign Key) của PostgreSQL
        if (error.code === '23503') { 
            throw new Error("Không thể xóa! Danh mục này đang chứa các sản phẩm trong kho.");
        }
        throw error;
    }
};