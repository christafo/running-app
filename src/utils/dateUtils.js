import { format, parseISO, getISOWeek, getISOWeekYear } from 'date-fns';

/**
 * Returns an ISO-8601 week number for the given date.
 * Returns a string format "YYYY-Www"
 */
export const getWeekIdentifier = (dateInput) => {
    if (!dateInput) return 'Invalid Date';

    let date;
    if (typeof dateInput === 'string') {
        // If it's a simple YYYY-MM-DD, parse manually to avoid UTC shift
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            const [y, m, d] = dateInput.split('-').map(Number);
            date = new Date(y, m - 1, d);
        } else {
            date = parseISO(dateInput);
        }
    } else {
        date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return 'Invalid Date';

    const weekNo = getISOWeek(date);
    const year = getISOWeekYear(date);

    return `${year}-W${String(weekNo).padStart(2, '0')}`;
};

/**
 * Returns the start of the week (Monday) for a given date
 */
export const getStartOfWeek = (dateInput) => {
    let date = new Date(dateInput);
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, d] = dateInput.split('-').map(Number);
        date = new Date(y, m - 1, d);
    }
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
};
