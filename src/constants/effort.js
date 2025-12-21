/**
 * Effort level constants and utilities
 * Consolidates effort level definitions used across the application
 */

export const EFFORT_LEVELS = [
    { value: 1, label: 'Very Easy', emoji: '😌', color: '#10b981' },
    { value: 2, label: 'Easy', emoji: '🙂', color: '#3b82f6' },
    { value: 3, label: 'Moderate', emoji: '😐', color: '#f59e0b' },
    { value: 4, label: 'Hard', emoji: '😓', color: '#ef4444' },
    { value: 5, label: 'Very Hard', emoji: '🥵', color: '#dc2626' }
];

/**
 * Get formatted effort label with emoji
 * @param {number} value - Effort level (1-5)
 * @returns {string} Formatted label (e.g., "😌 Very Easy")
 */
export const getEffortLabel = (value) => {
    const level = EFFORT_LEVELS.find(l => l.value === Number(value));
    return level ? `${level.emoji} ${level.label}` : '-';
};

/**
 * Get effort emoji only
 * @param {number} value - Effort level (1-5)
 * @returns {string} Emoji character
 */
export const getEffortEmoji = (value) => {
    const level = EFFORT_LEVELS.find(l => l.value === Number(value));
    return level ? level.emoji : '-';
};

/**
 * Get effort color
 * @param {number} value - Effort level (1-5)
 * @returns {string} Hex color code
 */
export const getEffortColor = (value) => {
    const level = EFFORT_LEVELS.find(l => l.value === Number(value));
    return level ? level.color : '#6b7280';
};
