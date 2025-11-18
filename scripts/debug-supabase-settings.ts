/**
 * Debug Script: Check Supabase Settings Storage
 *
 * This script checks if settings (including Serper API key) are correctly
 * stored and retrieved from Supabase database.
 *
 * Run with: npx tsx scripts/debug-supabase-settings.ts
 */

import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSettings() {
  console.log('🔍 Checking Supabase Settings Storage...\n')

  // Step 1: Check if user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('❌ Not logged in! Please log in first.')
    console.error('Error:', authError?.message)
    process.exit(1)
  }

  console.log('✅ Logged in as:', user.email)
  console.log('User ID:', user.id)
  console.log('')

  // Step 2: Check if user_settings table exists and has correct schema
  console.log('📋 Checking user_settings table schema...')
  const { data: tableInfo, error: tableError } = await supabase
    .from('user_settings')
    .select('*')
    .limit(0)

  if (tableError) {
    console.error('❌ Cannot access user_settings table!')
    console.error('Error:', tableError.message)
    console.error('\nMake sure the table exists with these columns:')
    console.error('- user_id (uuid)')
    console.error('- serper_api_key (text)')
    console.error('- search_provider (text)')
    console.error('- openrouter_api_key (text)')
    console.error('- tavily_api_key (text)')
    process.exit(1)
  }

  console.log('✅ user_settings table accessible\n')

  // Step 3: Fetch current settings
  console.log('📥 Fetching settings from database...')
  const { data: settings, error: fetchError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      console.log('⚠️  No settings found in database (first time user)')
      console.log('\nThis is normal for new users. Settings will be created when you save them.')
      process.exit(0)
    }
    console.error('❌ Error fetching settings:', fetchError.message)
    process.exit(1)
  }

  console.log('✅ Settings found!\n')

  // Step 4: Display API keys status (masked for security)
  console.log('🔑 API Keys Status:')
  console.log('─────────────────────────────────────')

  const maskKey = (key: string | null) => {
    if (!key) return '❌ Not set'
    if (key.length < 10) return '⚠️  Too short (might be invalid)'
    return `✅ Set (${key.slice(0, 8)}...${key.slice(-4)})`
  }

  console.log('OpenRouter:', maskKey(settings.openrouter_api_key))
  console.log('Tavily:    ', maskKey(settings.tavily_api_key))
  console.log('Serper:    ', maskKey(settings.serper_api_key))
  console.log('')

  // Step 5: Check search provider setting
  console.log('🔍 Search Provider Configuration:')
  console.log('─────────────────────────────────────')
  console.log('Current provider:', settings.search_provider || '(not set, defaults to "tavily")')
  console.log('Serper max results:', settings.serper_max_results || 5)
  console.log('Serper country:', settings.serper_country || 'at')
  console.log('Serper language:', settings.serper_language || 'de')
  console.log('')

  // Step 6: Recommendations
  console.log('💡 Recommendations:')
  console.log('─────────────────────────────────────')

  if (!settings.serper_api_key) {
    console.log('⚠️  Serper API key is NOT set!')
    console.log('   → Go to Settings → API Keys → Add your Serper key')
    console.log('   → Get a key at: https://serper.dev')
  } else {
    console.log('✅ Serper API key is stored in database')
  }

  if (settings.search_provider !== 'serper') {
    console.log('⚠️  Search provider is NOT set to Serper')
    console.log(`   → Current: ${settings.search_provider}`)
    console.log('   → Switch to Serper in Settings → Websuche for better results')
  } else {
    console.log('✅ Search provider is set to Serper')
  }

  console.log('')
  console.log('✅ Debug complete!')
}

debugSettings().catch(console.error)
