const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kkcxixnxsnakwrqhmtjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrY3hpeG54c25ha3dycWhtdGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzE2ODgsImV4cCI6MjA5NDM0NzY4OH0.NQZOCsN1YrvFzaiIAL0_1DcrTQAqGkuv0LCOd2eJylw'
const userId = 'b1aaa6e9-4fde-4000-8319-3077a2c4587d'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('🌱 Seeding 5 Customers and 5 Products...')

  // 1. Add Customers
  const { data: custData, error: custError } = await supabase
    .from('customers')
    .insert([
      { user_id: userId, name: 'Wings Design Studio', email: 'studio@wings.com', phone: '9000011111', billing_address: 'Hitech City, Hyderabad', state: 'Telangana', gstin: '36AAAAA0000A1Z5', state_code: '36' },
      { user_id: userId, name: 'Silver Graphics', email: 'contact@silver.in', phone: '9111122222', billing_address: 'Banjara Hills, Hyderabad', state: 'Telangana', state_code: '36' },
      { user_id: userId, name: 'Tech Solutions', email: 'info@tech.com', phone: '9222233333', billing_address: 'Andheri West, Mumbai', state: 'Maharashtra', gstin: '27BBBBB0000B1Z5', state_code: '27' },
      { user_id: userId, name: 'Creative Media', email: 'media@creative.in', phone: '9333344444', billing_address: 'Indiranagar, Bangalore', state: 'Karnataka', gstin: '29CCCCC0000C1Z5', state_code: '29' },
      { user_id: userId, name: 'Urban Print', email: 'urban@print.com', phone: '9444455555', billing_address: 'Connaught Place, Delhi', state: 'Delhi', gstin: '07DDDDD0000D1Z5', state_code: '07' }
    ])
    .select()

  if (custError) console.error('Error adding customers:', custError.message)
  else console.log('✅ Added 5 Customers')

  // 2. Add Products
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .insert([
      { user_id: userId, name: 'Vinyl Sticker', hsn_code: '3919', price: 120, unit: 'sqft', gst_rate: 18 },
      { user_id: userId, name: 'Glossy Brochure', hsn_code: '4901', price: 15, unit: 'unit', gst_rate: 12 },
      { user_id: userId, name: 'Digital Invitation', hsn_code: '4909', price: 500, unit: 'set', gst_rate: 12 },
      { user_id: userId, name: 'Canvas Print', hsn_code: '5901', price: 2500, unit: 'unit', gst_rate: 18 },
      { user_id: userId, name: 'Flex Banner', hsn_code: '4911', price: 45, unit: 'sqft', gst_rate: 18 }
    ])
    .select()

  if (prodError) console.error('Error adding products:', prodError.message)
  else console.log('✅ Added 5 Products')

  console.log('🚀 Seeding complete!')
}

seed()
