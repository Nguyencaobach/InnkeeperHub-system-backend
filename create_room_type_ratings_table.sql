CREATE TABLE room_type_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Chỉ cho phép 1 đến 5 sao
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ràng buộc: Mỗi khách hàng chỉ được đánh giá 1 loại phòng 1 lần
    UNIQUE(room_type_id, customer_id) 
);
