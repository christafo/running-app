
export const calculatePace = (distance, totalSeconds) => {
    const dist = parseFloat(distance);
    const secs = parseInt(totalSeconds);

    if (!dist || dist <= 0 || !secs) return '0:00';

    const paceSeconds = secs / dist;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const parseDurationToSeconds = (durationStr) => {
    if (!durationStr) return 0;

    const str = String(durationStr).trim();

    // Check if it is already just a number (seconds or minutes?)
    // Let's assume input "30" means 30 minutes if simple number? 
    // Or let's assume standard format HH:MM:SS or MM:SS

    const parts = str.split(':').map(Number);
    if (parts.some(isNaN)) return 0; // Invalid

    if (parts.length === 3) {
        // HH:MM:SS
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return (parts[0] * 60) + parts[1];
    } else if (parts.length === 1) {
        // Just minutes? Or seconds? Let's assume Minutes for running context usually
        return parts[0] * 60;
    }

    return 0;
};
