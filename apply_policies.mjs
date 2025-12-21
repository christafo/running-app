import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUpdatePolicies() {
    console.log('🔐 Applying UPDATE RLS policies to Supabase...\n');

    try {
        // Read the SQL file
        const sqlContent = readFileSync(join(__dirname, 'add_update_policies.sql'), 'utf-8');

        console.log('📝 SQL to execute:');
        console.log(sqlContent);
        console.log('\n⚠️  Note: This requires admin/service role key, not anon key.');
        console.log('Please run this SQL manually in your Supabase SQL Editor:\n');
        console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
        console.log('2. Copy and paste the SQL from add_update_policies.sql');
        console.log('3. Click "Run"\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

applyUpdatePolicies();
