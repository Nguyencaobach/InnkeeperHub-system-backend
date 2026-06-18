import fs from 'fs';
import path from 'path';
import { 
    checkCategoryExists, checkSkuExists, insertProduct, 
    fetchAllProducts, fetchProductById, updateProductById, deleteProductById 
} from './product.model.js';

// Hàm phụ trợ: Xóa ảnh vật lý trên ổ cứng
const deletePhysicalImage = (imageUrl) => {
    if (!imageUrl) return;
    const fileName = imageUrl.split('/').pop();
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'products', fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Hàm phụ trợ: Tạo mã SKU tự động (Ví dụ: SP849201)
const generateSKU = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // Tạo 6 số ngẫu nhiên
    return `SP${randomNum}`;
};

export const createLogic = async (data, file) => {
    // 1. Kiểm tra danh mục
    const isCategoryExist = await checkCategoryExists(data.category_id);
    if (!isCategoryExist) throw new Error("Danh mục sản phẩm không tồn tại.");

    // 2. Xử lý mã SKU (Nếu rỗng thì tự tạo)
    if (!data.sku || data.sku.trim() === '') {
        data.sku = generateSKU();
    }

    // 3. Kiểm tra trùng mã SKU
    const isSkuExist = await checkSkuExists(data.sku);
    if (isSkuExist) throw new Error(`Mã SKU (${data.sku}) đã tồn tại. Vui lòng nhập mã khác.`);

    // 4. Xử lý ảnh
    const image_url = file ? `/uploads/products/${file.filename}` : null;
    data.image_url = image_url;

    return await insertProduct(data);
};

export const getListLogic = async () => {
    return await fetchAllProducts();
};

export const updateLogic = async (id, data, file) => {
    const currentProduct = await fetchProductById(id);
    if (!currentProduct) throw new Error("Không tìm thấy sản phẩm này.");

    const isCategoryExist = await checkCategoryExists(data.category_id);
    if (!isCategoryExist) throw new Error("Danh mục sản phẩm không tồn tại.");

    // Nếu lúc cập nhật mà xóa trắng mã SKU thì lấy lại mã cũ
    if (!data.sku || data.sku.trim() === '') {
        data.sku = currentProduct.sku;
    }

    const isSkuExist = await checkSkuExists(data.sku, id);
    if (isSkuExist) throw new Error(`Mã SKU (${data.sku}) đã bị trùng với sản phẩm khác.`);

    // Xử lý ảnh: Nếu có upload ảnh mới -> dọn rác ảnh cũ
    let image_url = currentProduct.image_url;
    if (file) {
        deletePhysicalImage(currentProduct.image_url);
        image_url = `/uploads/products/${file.filename}`;
    }
    data.image_url = image_url;

    return await updateProductById(id, data);
};

export const deleteLogic = async (id) => {
    const currentProduct = await fetchProductById(id);
    if (!currentProduct) throw new Error("Không tìm thấy sản phẩm này.");

    // Xóa trong DB
    const deletedProduct = await deleteProductById(id);
    
    // Dọn rác ảnh trên ổ cứng
    deletePhysicalImage(deletedProduct.image_url);

    return deletedProduct;
};