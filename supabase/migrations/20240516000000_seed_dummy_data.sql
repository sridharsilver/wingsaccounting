-- Seed 5 Customers and 5 Products for testing
-- User ID: b1aaa6e9-4fde-4000-8319-3077a2c4587d (Test Environment)
-- User ID: 464f88fb-edc2-45a5-b270-3840bf3ec3fa (Production)

DO $$ 
DECLARE 
    test_user_id UUID := 'b1aaa6e9-4fde-4000-8319-3077a2c4587d';
    prod_user_id UUID := '464f88fb-edc2-45a5-b270-3840bf3ec3fa';
    target_user_id UUID;
BEGIN
    -- Determine which user ID to use based on which one exists in the profiles table
    SELECT id INTO target_user_id FROM public.profiles WHERE id IN (test_user_id, prod_user_id) LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Insert Customers
        INSERT INTO public.customers (user_id, name, email, phone, billing_address, state, gstin, state_code)
        VALUES 
            (target_user_id, 'Wings Design Studio', 'studio@wings.com', '9000011111', 'Hitech City, Hyderabad', 'Telangana', '36AAAAA0000A1Z5', '36'),
            (target_user_id, 'Silver Graphics', 'contact@silver.in', '9111122222', 'Banjara Hills, Hyderabad', 'Telangana', NULL, '36'),
            (target_user_id, 'Tech Solutions', 'info@tech.com', '9222233333', 'Andheri West, Mumbai', 'Maharashtra', '27BBBBB0000B1Z5', '27'),
            (target_user_id, 'Creative Media', 'media@creative.in', '9333344444', 'Indiranagar, Bangalore', 'Karnataka', '29CCCCC0000C1Z5', '29'),
            (target_user_id, 'Urban Print', 'urban@print.com', '9444455555', 'Connaught Place, Delhi', 'Delhi', '07DDDDD0000D1Z5', '07')
        ON CONFLICT DO NOTHING;

        -- Insert Products
        INSERT INTO public.products (user_id, name, hsn_code, price, unit, gst_rate)
        VALUES 
            (target_user_id, 'Vinyl Sticker', '3919', 120, 'sqft', 18),
            (target_user_id, 'Glossy Brochure', '4901', 15, 'unit', 12),
            (target_user_id, 'Digital Invitation', '4909', 500, 'set', 12),
            (target_user_id, 'Canvas Print', '5901', 2500, 'unit', 18),
            (target_user_id, 'Flex Banner', '4911', 45, 'sqft', 18)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
