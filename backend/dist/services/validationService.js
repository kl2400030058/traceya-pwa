"use strict";
/**
 * Validation service for geofence and seasonal rules
 * These are stub implementations that can be replaced with actual business logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGeofence = validateGeofence;
exports.validateSeason = validateSeason;
exports.getAllowedRegions = getAllowedRegions;
exports.getAllowedMonths = getAllowedMonths;
exports.calculateQualityScore = calculateQualityScore;
exports.validateCollectionEvent = validateCollectionEvent;
// Mock geofence rules - replace with actual data from database or config
const GEOFENCE_RULES = [
    {
        species: 'Ashwagandha',
        allowedRegions: [
            {
                name: 'Rajasthan',
                bounds: {
                    north: 30.25,
                    south: 23.03,
                    east: 78.17,
                    west: 69.30
                }
            },
            {
                name: 'Madhya Pradesh',
                bounds: {
                    north: 26.87,
                    south: 21.07,
                    east: 82.75,
                    west: 74.02
                }
            }
        ]
    },
    {
        species: 'Turmeric',
        allowedRegions: [
            {
                name: 'Kerala',
                bounds: {
                    north: 12.78,
                    south: 8.18,
                    east: 77.42,
                    west: 74.86
                }
            },
            {
                name: 'Tamil Nadu',
                bounds: {
                    north: 13.49,
                    south: 8.07,
                    east: 80.35,
                    west: 76.22
                }
            }
        ]
    }
];
// Mock seasonal rules - replace with actual data
const SEASONAL_RULES = [
    {
        species: 'Ashwagandha',
        allowedMonths: [10, 11, 12, 1, 2], // Oct to Feb
        allowedSeasons: ['winter', 'post-monsoon']
    },
    {
        species: 'Turmeric',
        allowedMonths: [1, 2, 3, 4], // Jan to Apr
        allowedSeasons: ['winter', 'summer']
    },
    {
        species: 'Brahmi',
        allowedMonths: [6, 7, 8, 9], // Jun to Sep (monsoon)
        allowedSeasons: ['monsoon']
    }
];
/**
 * Validate if the collection location is within allowed geofence for the species
 * @param latitude - Latitude of collection point
 * @param longitude - Longitude of collection point
 * @param species - Species being collected
 * @returns Promise<boolean> - True if location is valid
 */
async function validateGeofence(latitude, longitude, species) {
    try {
        // Find geofence rules for the species
        const rule = GEOFENCE_RULES.find(r => r.species.toLowerCase() === species.toLowerCase());
        // If no specific rule found, allow collection (default behavior)
        if (!rule) {
            console.log(`No geofence rule found for species: ${species}. Allowing collection.`);
            return true;
        }
        // Check if location falls within any allowed region
        const isWithinBounds = rule.allowedRegions.some(region => {
            return (latitude >= region.bounds.south &&
                latitude <= region.bounds.north &&
                longitude >= region.bounds.west &&
                longitude <= region.bounds.east);
        });
        if (!isWithinBounds) {
            console.log(`Location (${latitude}, ${longitude}) is outside allowed regions for ${species}`);
        }
        return isWithinBounds;
    }
    catch (error) {
        console.error('Error validating geofence:', error);
        // In case of error, allow collection (fail-safe)
        return true;
    }
}
/**
 * Validate if the collection time is within allowed season for the species
 * @param species - Species being collected
 * @param timestamp - Collection timestamp
 * @returns Promise<boolean> - True if season is valid
 */
async function validateSeason(species, timestamp) {
    try {
        // Find seasonal rules for the species
        const rule = SEASONAL_RULES.find(r => r.species.toLowerCase() === species.toLowerCase());
        // If no specific rule found, allow collection (default behavior)
        if (!rule) {
            console.log(`No seasonal rule found for species: ${species}. Allowing collection.`);
            return true;
        }
        const month = timestamp.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
        const isValidMonth = rule.allowedMonths.includes(month);
        if (!isValidMonth) {
            console.log(`Month ${month} is not allowed for ${species} collection`);
        }
        return isValidMonth;
    }
    catch (error) {
        console.error('Error validating season:', error);
        // In case of error, allow collection (fail-safe)
        return true;
    }
}
/**
 * Get allowed regions for a species
 * @param species - Species name
 * @returns Array of allowed regions
 */
function getAllowedRegions(species) {
    const rule = GEOFENCE_RULES.find(r => r.species.toLowerCase() === species.toLowerCase());
    return rule?.allowedRegions || [];
}
/**
 * Get allowed months for a species
 * @param species - Species name
 * @returns Array of allowed months (1-12)
 */
function getAllowedMonths(species) {
    const rule = SEASONAL_RULES.find(r => r.species.toLowerCase() === species.toLowerCase());
    return rule?.allowedMonths || [];
}
/**
 * Calculate quality score based on various factors
 * @param event - Collection event data
 * @returns Quality score (0-100)
 */
function calculateQualityScore(event) {
    let score = 0;
    // Location validation (30 points)
    if (event.isValidLocation) {
        score += 30;
    }
    // Season validation (30 points)
    if (event.isValidSeason) {
        score += 30;
    }
    // GPS accuracy (20 points)
    if (event.accuracy !== undefined) {
        if (event.accuracy <= 5) {
            score += 20; // Excellent accuracy
        }
        else if (event.accuracy <= 10) {
            score += 15; // Good accuracy
        }
        else if (event.accuracy <= 20) {
            score += 10; // Fair accuracy
        }
        else {
            score += 5; // Poor accuracy
        }
    }
    else {
        score += 10; // Default if no accuracy data
    }
    // Moisture content (20 points)
    if (event.moisturePct !== undefined) {
        // Optimal moisture range varies by species, using general range
        if (event.moisturePct >= 10 && event.moisturePct <= 15) {
            score += 20; // Optimal moisture
        }
        else if (event.moisturePct >= 8 && event.moisturePct <= 18) {
            score += 15; // Good moisture
        }
        else if (event.moisturePct >= 5 && event.moisturePct <= 25) {
            score += 10; // Acceptable moisture
        }
        else {
            score += 5; // Poor moisture
        }
    }
    else {
        score += 10; // Default if no moisture data
    }
    return Math.min(100, Math.max(0, score));
}
/**
 * Validate collection event comprehensively
 * @param event - Collection event data
 * @returns Validation result with details
 */
async function validateCollectionEvent(event) {
    const isValidLocation = await validateGeofence(event.latitude, event.longitude, event.species);
    const isValidSeason = await validateSeason(event.species, event.timestamp);
    const qualityScore = calculateQualityScore({
        isValidLocation,
        isValidSeason,
        moisturePct: event.moisturePct,
        accuracy: event.accuracy
    });
    return {
        isValidLocation,
        isValidSeason,
        qualityScore,
        isValid: isValidLocation && isValidSeason,
        warnings: [
            ...(!isValidLocation ? ['Location is outside allowed collection area'] : []),
            ...(!isValidSeason ? ['Collection time is outside allowed season'] : []),
            ...(qualityScore < 50 ? ['Low quality score - please verify collection data'] : [])
        ]
    };
}
//# sourceMappingURL=validationService.js.map