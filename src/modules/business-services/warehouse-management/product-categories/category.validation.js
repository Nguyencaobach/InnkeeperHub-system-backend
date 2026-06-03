import Joi from 'joi';

// ================= SCHEMA CHO THÊM MỚI DANH MỤC =================
export const createCategorySchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Tên danh mục không được để trống.',
        'any.required': 'Vui lòng nhập tên danh mục sản phẩm.'
    }),
    
    // Cho phép người dùng bỏ trống mô tả (Joi tự động ép chuỗi rỗng thành null)
    description: Joi.string().trim().empty('').allow(null)
});

// ================= SCHEMA CHO CẬP NHẬT DANH MỤC =================
export const updateCategorySchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Tên danh mục không được để trống.',
        'any.required': 'Vui lòng nhập tên danh mục sản phẩm.'
    }),
    
    description: Joi.string().trim().empty('').allow(null)
});