import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rviymgiqvwmtupwrhyic.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_wRn46UbBRcUsYdp-vIqXow_e2Kumj0R';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
    console.log('Checking database schema...');

    // Check 'runs' table columns
    const { data: runData, error: runError } = await supabase.from('runs').select('*').limit(1);
    if (runError) {
        console.error('Error fetching from runs:', runError.message);
    } else {
        const columns = runData.length > 0 ? Object.keys(runData[0]) : [];
        console.log('Runs columns:', columns);
        const needed = ['effort', 'total_seconds'];
        const missing = needed.filter(c => !columns.includes(c));
        if (missing.length > 0) {
            console.log('Missing columns in runs:', missing);
        } else {
            console.log('Runs table looks OK.');
        }
    }

    // Check 'routes' table columns
    const { data: routeData, error: routeError } = await supabase.from('routes').select('*').limit(1);
    if (routeError) {
        console.error('Error fetching from routes:', routeError.message);
    } else {
        const columns = routeData.length > 0 ? Object.keys(routeData[0]) : [];
        console.log('Routes columns:', columns);
        const needed = ['coordinates', 'location'];
        const missing = needed.filter(c => !columns.includes(c));
        if (missing.length > 0) {
            console.log('Missing columns in routes:', missing);
        } else {
            console.log('Routes table looks OK.');
        }
    }
}

checkSchema();
