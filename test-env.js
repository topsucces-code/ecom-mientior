require('dotenv').config({ path: './apps/web/.env.local' });

console.log('Environment check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No');

const USE_MOCK_DATA = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co';
console.log('USE_MOCK_DATA condition result:', USE_MOCK_DATA);

if (USE_MOCK_DATA) {
  console.log('❌ The app is using MOCK DATA, not real database!');
} else {
  console.log('✅ The app should be using real database');
}