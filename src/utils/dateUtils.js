
/**
 * Returns an ISO-8601 week number for the given date.
 * Returns a string format "YYYY-Www"
 */
export const getWeekIdentifier = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // ISO week date week number: http://en.wikipedia.org/wiki/ISO_week_date
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/**
 * Returns the start of the week (Monday) for a given date
 */
export const getStartOfWeek = (dateInput) => {
    const date = new Date(dateInput);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
};
