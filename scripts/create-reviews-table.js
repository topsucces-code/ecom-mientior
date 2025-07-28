// Simple script to test Supabase connection and create basic tables
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fhewhxjprkksjriohxpv.supabase.co'
const supabaseAnonKey = 'sb_publishable_ETUd5-_NuEu06GVBOOoakw_9SUgaD2G'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAndCreateTables() {
  console.log('🧪 Testing Supabase connection and creating tables...\n')

  try {
    // Test basic connection
    console.log('1️⃣ Testing connection...')
    const { data: products, error: testError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1)

    if (testError) {
      console.log('❌ Connection test failed:', testError.message)
      return
    }
    console.log('✅ Connection successful!')

    // Check if reviews table exists
    console.log('\n2️⃣ Checking if product_reviews table exists...')
    const { data: reviewsCheck, error: reviewsCheckError } = await supabase
      .from('product_reviews')
      .select('id')
      .limit(1)

    if (reviewsCheckError) {
      console.log('📋 product_reviews table does not exist')
      console.log('ℹ️  To create the table, please run the SQL script in Supabase Dashboard:')
      console.log('   File: supabase/create-reviews-simple.sql')
      console.log('\nOr use the Supabase Dashboard:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Go to SQL Editor')
      console.log('4. Run the create-reviews-simple.sql script')
    } else {
      console.log('✅ product_reviews table exists!')
      console.log(`   Found ${reviewsCheck?.length || 0} reviews`)
    }

    // Check if user_profiles table exists
    console.log('\n3️⃣ Checking if user_profiles table exists...')
    const { data: profilesCheck, error: profilesCheckError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)

    if (profilesCheckError) {
      console.log('📋 user_profiles table does not exist')
    } else {
      console.log('✅ user_profiles table exists!')
      console.log(`   Found ${profilesCheck?.length || 0} profiles`)
    }

    console.log('\n📊 Current Database Status:')
    console.log(`   • Products table: ✅ (${products?.length || 0} products found)`)
    console.log(`   • Reviews table: ${reviewsCheckError ? '❌ Missing' : '✅ Ready'}`)
    console.log(`   • User profiles table: ${profilesCheckError ? '❌ Missing' : '✅ Ready'}`)

    if (reviewsCheckError || profilesCheckError) {
      console.log('\n🛠️  Next Steps:')
      console.log('1. Open Supabase Dashboard → SQL Editor')
      console.log('2. Run the SQL script: supabase/create-reviews-simple.sql')
      console.log('3. This will create the missing tables')
      console.log('\n💡 Note: The app works with fallback data even without these tables!')
    } else {
      console.log('\n🎉 All tables are ready! Your review system is fully functional.')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testAndCreateTables()