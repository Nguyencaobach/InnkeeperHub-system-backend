import { sendError } from '../utils/response.util.js'; 

export const validateData = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            return sendError(res, "Dữ liệu đầu vào không hợp lệ", 400, errorMessages);
        }
        next();
    };
};