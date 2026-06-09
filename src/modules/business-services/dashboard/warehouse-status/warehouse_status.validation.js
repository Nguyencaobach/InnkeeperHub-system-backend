import Joi from 'joi';

// Schema dùng khi Quản lý xác nhận tiêu hủy lô hàng bị khóa
export const discardBatchSchema = Joi.object({
    reason: Joi.string().trim().required().messages({
        'string.empty': 'Vui lòng nhập lý do tiêu hủy hàng hóa.',
        'any.required': 'Lý do tiêu hủy là bắt buộc để ghi lại nhật ký.'
    })
});