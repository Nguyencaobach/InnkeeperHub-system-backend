import Joi from 'joi';

export const ratingSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Số sao đánh giá phải là một con số.',
        'number.integer': 'Số sao phải là số nguyên.',
        'number.min': 'Đánh giá tối thiểu là 1 sao.',
        'number.max': 'Đánh giá tối đa là 5 sao.',
        'any.required': 'Vui lòng cung cấp số sao đánh giá (rating).'
    })
});
