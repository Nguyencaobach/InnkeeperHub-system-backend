import jwt from 'jsonwebtoken';

export const generateToken = (payload) => {
    const secretKey = process.env.JWT_SECRET || 'chuoi_bi_mat_cuc_ky_kho_doan';
    return jwt.sign(payload, secretKey, { expiresIn: '1d' });
};