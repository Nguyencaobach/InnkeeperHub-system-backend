import Joi from 'joi';

export const productSchema = Joi.object({
    // Bắt buộc phải chọn danh mục
    category_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
        'string.guid': 'Mã danh mục phải là UUID hợp lệ.',
        'string.empty': 'Vui lòng chọn danh mục.',
        'any.required': 'Vui lòng chọn danh mục.'
    }),
    
    // Mã SKU (Mã vạch) - cắt khoảng trắng 2 đầu
    sku: Joi.string().trim().empty('').allow(null).messages({
        'string.empty': 'Mã SKU không được để trống.',
    }),
    
    name: Joi.string().trim().required().messages({
        'string.empty': 'Tên sản phẩm không được để trống.',
        'any.required': 'Vui lòng nhập tên sản phẩm.'
    }),
    
    unit: Joi.string().trim().required().messages({
        'string.empty': 'Đơn vị tính không được để trống.',
        'any.required': 'Vui lòng nhập đơn vị tính (Lon, Chai, Gói...).'
    }),
    
    // Ép kiểu về số nguyên, chặn số âm
    retail_price: Joi.number().integer().min(0).required().messages({
        'number.base': 'Giá bán lẻ phải là một con số.',
        'number.integer': 'Giá bán lẻ phải là số nguyên.',
        'number.min': 'Giá bán lẻ không được là số âm.',
        'any.required': 'Vui lòng nhập giá bán lẻ.'
    }),
    
    // Joi tự động chuyển "true"/"false" từ form-data thành Boolean thật
    is_active: Joi.boolean().default(true)
});