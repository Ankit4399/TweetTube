/**
 * Recursively transforms an object, converting 'id' to '_id' for frontend compatibility
 * @param {any} obj - The object to transform
 * @returns {any} - The transformed object
 */
const transformIdToUnderscoreId = (obj) => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => transformIdToUnderscoreId(item));
    }

    // Handle objects
    if (typeof obj === 'object' && obj.constructor === Object) {
        const transformed = {};
        
        for (const [key, value] of Object.entries(obj)) {
            // Convert 'id' to '_id'
            if (key === 'id') {
                transformed._id = value;
            } else {
                transformed[key] = transformIdToUnderscoreId(value);
            }
        }
        
        return transformed;
    }

    // Return primitive values as-is
    return obj;
};

class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        // Transform data: convert 'id' to '_id' for frontend compatibility
        this.data = transformIdToUnderscoreId(data)
        this.message = message
        this.success = statusCode < 400
    }
}

export default ApiResponse