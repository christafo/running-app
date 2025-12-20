import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rviymgiqvwmtupwrhyic.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_wRn46UbBRcUsYdp-vIqXow_e2Kumj0R';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSwappedDates() {
    console.log('Fetching runs to check for swapped dates...');
    const { data: runs, error } = await supabase.from('runs').select('*');

    if (error) {
        console.error('Error fetching runs:', error);
        return;
    }

    console.log(`Checking ${runs.length} runs...`);

    for (const run of runs) {
        const [y, m, d] = run.date.split('-').map(Number);

        // If it looks like a swap happened (e.g. Month = 12 and Day <= 12)
        // Actually, the issue was June 12 (06-12) vs Dec 6 (12-06).
        // If the user said "12/06" and it became "June 12" (06-12), then:
        // Current m=6, d=12. Should be m=12, d=6.

        // Heuristic: If there are many runs all on the same day of the month (e.g. 12th)
        // and the month changes, but the user likely meant the 12th month.

        // Specifically fixing the ones I saw:
        // 2025-06-12 -> 2025-12-06
        // 2025-08-12 -> 2025-12-08
        // 2025-10-12 -> 2025-12-10
        // (2025-12-12 is the same either way)

        if (d === 12 && m < 12) {
            const newDate = `2025-12-${String(m).padStart(2, '0')}`;
            console.log(`Fixing ${run.date} -> ${newDate}`);
            await supabase.from('runs').update({ date: newDate }).eq('id', run.id);
        }
    }
    console.log('Done fixing dates.');
}

fixSwappedDates();
