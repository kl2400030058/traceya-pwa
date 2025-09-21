/**
 * Validation service for geofence and seasonal rules
 * These are stub implementations that can be replaced with actual business logic
 */
export interface GeofenceRule {
    species: string;
    allowedRegions: {
        name: string;
        bounds: {
            north: number;
            south: number;
            east: number;
            west: number;
        };
    }[];
}
export interface SeasonalRule {
    species: string;
    allowedMonths: number[];
    allowedSeasons: string[];
}
/**
 * Validate if the collection location is within allowed geofence for the species
 * @param latitude - Latitude of collection point
 * @param longitude - Longitude of collection point
 * @param species - Species being collected
 * @returns Promise<boolean> - True if location is valid
 */
export declare function validateGeofence(latitude: number, longitude: number, species: string): Promise<boolean>;
/**
 * Validate if the collection time is within allowed season for the species
 * @param species - Species being collected
 * @param timestamp - Collection timestamp
 * @returns Promise<boolean> - True if season is valid
 */
export declare function validateSeason(species: string, timestamp: Date): Promise<boolean>;
/**
 * Get allowed regions for a species
 * @param species - Species name
 * @returns Array of allowed regions
 */
export declare function getAllowedRegions(species: string): {
    name: string;
    bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}[];
/**
 * Get allowed months for a species
 * @param species - Species name
 * @returns Array of allowed months (1-12)
 */
export declare function getAllowedMonths(species: string): number[];
/**
 * Calculate quality score based on various factors
 * @param event - Collection event data
 * @returns Quality score (0-100)
 */
export declare function calculateQualityScore(event: {
    isValidLocation: boolean;
    isValidSeason: boolean;
    moisturePct?: number | undefined;
    accuracy?: number | undefined;
}): number;
/**
 * Validate collection event comprehensively
 * @param event - Collection event data
 * @returns Validation result with details
 */
export declare function validateCollectionEvent(event: {
    species: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
    moisturePct?: number | undefined;
    accuracy?: number | undefined;
}): Promise<{
    isValidLocation: boolean;
    isValidSeason: boolean;
    qualityScore: number;
    isValid: boolean;
    warnings: string[];
}>;
//# sourceMappingURL=validationService.d.ts.map