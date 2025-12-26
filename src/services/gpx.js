/**
 * GPX Parsing Service
 */

/**
 * Haversine formula to calculate distance between two points on Earth
 */
export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

/**
 * Parses GPX file content into coordinates and total distance
 * @param {string} gpxText - XML content of the GPX file
 * @returns {Object} { coordinates, distance }
 */
export const parseGPX = (gpxText) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, "text/xml");
    const trkpts = xmlDoc.getElementsByTagName("trkpt");

    if (trkpts.length < 2) {
        throw new Error("GPX file does not contain enough data points.");
    }

    let totalDist = 0;
    const coordinates = [];

    for (let i = 0; i < trkpts.length; i++) {
        const p = trkpts[i];
        const lat = parseFloat(p.getAttribute("lat"));
        const lon = parseFloat(p.getAttribute("lon"));
        coordinates.push([lat, lon]);
    }

    for (let i = 0; i < coordinates.length - 1; i++) {
        const [lat1, lon1] = coordinates[i];
        const [lat2, lon2] = coordinates[i + 1];
        totalDist += getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
    }

    return { coordinates, distance: totalDist };
};
