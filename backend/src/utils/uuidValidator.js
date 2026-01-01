import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Validates if a string is a valid UUID
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid UUID, false otherwise
 */
export const isValidUUID = (id) => {
    if (!id || typeof id !== 'string') {
        return false;
    }
    return uuidValidate(id);
};

export { uuidValidate, uuidv4 };

