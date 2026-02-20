/**
 * Utility functions for Lodge-related logic and display.
 */

/**
 * Formats the Lodge's affiliation containing obedience and subobedience.
 * Examples:
 * - "Confederada à CMSB"
 * - "Federada ao GOB\nJurisdicionada ao GOB-SP"
 * 
 * @param obedience - Standard Obedience (Potência name) 
 * @param subobedience - Subobedience (Jurisdicionada name)
 * @returns Formatted multi-line string or single line depending on data.
 */
export const formatLodgeAffiliation = (obedience?: string | null, subobedience?: string | null): string => {
    if (subobedience && obedience) {
        return `Federada ao ${obedience}\nJurisdicionada ao ${subobedience}`;
    } else if (obedience) {
        return `Confederada à ${obedience}`;
    }
    return '';
};
