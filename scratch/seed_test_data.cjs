const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.argv[2]
const supabaseKey = process.argv[3]
const userId = "7f047e84-1408-4627-98fd-38d87a47d12b"

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('🌱 Seeding dummy data for Test...')

  // 1. Add Customers
  const { error: custError } = await supabase
    .from('customers')
    .insert([
      { user_id: userId, name: 'Skyline Graphics', email: 'hello@skyline.com', phone: '9876543210', billing_address: '123 Business Hub', state: 'Telangana', gstin: '36AAAAA0000A1Z5', state_code: '36' },
      { user_id: userId, name: 'Apex Solutions', email: 'contact@apex.in', phone: '8888877777', billing_address: '456 Tech Park', state: 'Maharashtra', gstin: '27BBBBB0000B1Z5', state_code: '27' },
      { user_id: userId, name: 'Local Print Shop', phone: '7777766666', billing_address: 'Market Road', state: 'Telangana', state_code: '36' },
      { user_id: userId, name: 'Global Exports', email: 'info@global.com', billing_address: 'Export Zone', state: 'Tamil Nadu', gstin: '33CCCCC0000C1Z5', state_code: '33' }
    ])

  if (custError) console.log('Notice: Some customers might already exist or error:', custError.message)
  else console.log('✅ Added 4 Customers')

  // 2. Add Products
  const { error: prodError } = await supabase
    .from('products')
    .insert([
      { user_id: userId, name: 'Banner Printing (Large)', hsn_code: '4911', price: 1500, unit: 'sqft', gst_rate: 18 },
      { user_id: userId, name: 'Business Cards (Premium)', hsn_code: '4901', price: 500, unit: 'box', gst_rate: 12 },
      { user_id: userId, name: 'Logo Design Service', hsn_code: '9983', price: 5000, unit: 'service', gst_rate: 18 },
      { user_id: userId, name: 'Office Stationery', hsn_code: '4817', price: 2000, unit: 'set', gst_rate: 12 },
      { user_id: userId, name: 'Urgent Digital Print', hsn_code: '4911', price: 100, unit: 'page', gst_rate: 5 }
    ])

  if (prodError) console.log('Notice: Some products might already exist or error:', prodError.message)
  else console.log('✅ Added 5 Products')

  console.log('🚀 Seeding complete!')
}

seed()
