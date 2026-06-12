import { sendError } from '../utils/response.util.js'; 

export const validateData = (schema) => {
    return (req, res, next) => {
        // [QUAN TRỌNG] convert: true → Joi tự convert string "100" → number 100
        // Cần thiết vì FormData (multipart) gửi tất cả giá trị dưới dạng string
        const { error, value } = schema.validate(req.body, { 
            abortEarly: false, 
            stripUnknown: true,
            convert: true       // ← Fix lỗi "Dữ liệu không hợp lệ" khi dùng FormData
        });
        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            return sendError(res, "Dữ liệu đầu vào không hợp lệ", 400, errorMessages);
        }
        req.body = value;
        next();
    };
};