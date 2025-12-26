/**
 * Location Service using OpenStreetMap Nominatim
 */

/**
 * Reverse geocodes coordinates to a human-readable location string
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>}
 */
export const fetchLocationName = async (lat, lon) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, {
            headers: {
                'Accept-Language': 'en',
                'User-Agent': 'RunningApp/1.0'
            }
        });
        const data = await response.json();
        if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
            const neighborhood = data.address.neighbourhood || data.address.suburb || '';
            const state = data.address.state || '';

            let locationParts = [];
            if (neighborhood) locationParts.push(neighborhood);
            if (city && city !== neighborhood) locationParts.push(city);
            if (state) locationParts.push(state);

            return locationParts.join(', ');
        }
    } catch (error) {
        console.error('Error fetching location:', error);
    }
    return null;
};
