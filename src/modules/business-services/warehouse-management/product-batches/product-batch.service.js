import { 
    checkProductExists, checkBatchCodeExists, insertBatch, 
    fetchBatchesByProductId, fetchBatchById, updateBatchById, deleteBatchById 
} from './product-batch.model.js';

// Hàm phụ trợ: Tự động tạo mã lô (Ví dụ: LO123456)
const generateBatchCode = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); 
    return `LO${randomNum}`;
};

export const createLogic = async (data) => {
    // 1. Kiểm tra sản phẩm có tồn tại không
    const isProductExist = await checkProductExists(data.product_id);
    if (!isProductExist) throw new Error("Sản phẩm không tồn tại trong hệ thống.");

    // 2. Xử lý Mã lô hàng
    if (!data.batch_code || data.batch_code.trim() === '') {
        data.batch_code = generateBatchCode();
    }

    // 3. Kiểm tra trùng mã lô
    const isBatchExist = await checkBatchCodeExists(data.batch_code);
    if (isBatchExist) throw new Error(`Mã lô hàng (${data.batch_code}) đã tồn tại. Vui lòng nhập mã khác.`);

    // 4. QUAN TRỌNG: Mới nhập kho thì Số lượng còn lại = Số lượng ban đầu
    data.remain_quantity = data.original_quantity;

    // 5. Nếu ngày rỗng, chuyển thành null để DB không báo lỗi
    if (!data.mfg_date) data.mfg_date = null;
    if (!data.exp_date) data.exp_date = null;

    return await insertBatch(data);
};

export const getListLogic = async (productId) => {
    if (!productId) throw new Error("Vui lòng cung cấp mã sản phẩm (product_id).");
    return await fetchBatchesByProductId(productId);
};

export const updateLogic = async (id, data) => {
    const currentBatch = await fetchBatchById(id);
    if (!currentBatch) throw new Error("Không tìm thấy lô hàng này.");

    // Nếu người dùng xóa trắng mã lô lúc cập nhật, lấy lại mã cũ
    if (!data.batch_code || data.batch_code.trim() === '') {
        data.batch_code = currentBatch.batch_code;
    }

    const isBatchExist = await checkBatchCodeExists(data.batch_code, id);
    if (isBatchExist) throw new Error(`Mã lô hàng (${data.batch_code}) đã bị trùng với lô khác.`);

    // Xử lý các ngày tháng rỗng
    if (!data.mfg_date) data.mfg_date = null;
    if (!data.exp_date) data.exp_date = null;

    // Nếu lúc cập nhật mà Frontend không gửi remain_quantity, ta giữ nguyên số cũ
    if (data.remain_quantity === undefined || data.remain_quantity === null) {
        data.remain_quantity = currentBatch.remain_quantity;
    }

    return await updateBatchById(id, data);
};

export const deleteLogic = async (id) => {
    const currentBatch = await fetchBatchById(id);
    if (!currentBatch) throw new Error("Không tìm thấy lô hàng này.");

    return await deleteBatchById(id);
};