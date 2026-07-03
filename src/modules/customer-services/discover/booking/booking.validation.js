import Joi from 'joi';

export const customerBookingSchema = Joi.object({
    room_type_id: Joi.string().uuid().required(),
    room_detail_id: Joi.string().uuid().optional(),
    guest_name: Joi.string().max(100).required(),
    guest_phone: Joi.string().max(20).required(),
    guest_email: Joi.string().email().max(100).optional().allow(null, ''),
    rent_type: Joi.string().valid('HOURLY', 'DAILY').required(),
    expected_checkin: Joi.date().iso().required(),
    expected_checkout: Joi.date().iso().greater(Joi.ref('expected_checkin')).required(),
    total_amount: Joi.number().integer().min(0).required(),
    cccd_front_url: Joi.string().allow(null, '').optional(),
    cccd_back_url: Joi.string().allow(null, '').optional(),
    cancelUrl: Joi.string().uri().optional(),
    returnUrl: Joi.string().uri().optional()
});
