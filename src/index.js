function toSafeJson(value, fallback = 'null') {
    if (typeof fallback !== 'string') fallback = 'null';

    if (value === undefined) return fallback;
    if (value === null) return 'null';

    const type = typeof value;

    switch (type) {
        case 'string': {
            const trimmed = value.trim();

            // Already valid JSON? Pass through unchanged (avoid double-encoding)
            if (trimmed !== '') {
                try {
                    JSON.parse(trimmed);
                    return trimmed;
                } catch (e) {
                    // Not valid JSON -> treat as a plain string literal
                }
            }
            return JSON.stringify(value);
        }

        case 'number':
            if (Number.isNaN(value) || !Number.isFinite(value)) return fallback;
            return JSON.stringify(value);

        case 'boolean':
            return String(value);

        case 'bigint': {
            const MAX = BigInt(Number.MAX_SAFE_INTEGER);
            const MIN = BigInt(Number.MIN_SAFE_INTEGER);
            if (value <= MAX && value >= MIN) return JSON.stringify(Number(value));
            // Outside the safe range -> encode as a string literal, stays valid JSON
            return JSON.stringify(value.toString());
        }

        case 'object': {
            try {
                const seen = new WeakSet();
                const json = JSON.stringify(value, (key, val) => {
                    if (typeof val === 'bigint') {
                        const MAX = BigInt(Number.MAX_SAFE_INTEGER);
                        const MIN = BigInt(Number.MIN_SAFE_INTEGER);
                        return (val <= MAX && val >= MIN) ? Number(val) : val.toString();
                    }
                    if (typeof val === 'object' && val !== null) {
                        if (seen.has(val)) return undefined; // circular -> field gets dropped
                        seen.add(val);
                    }
                    return val;
                });
                return json === undefined ? fallback : json;
            } catch (e) {
                return fallback;
            }
        }

        case 'function':
        case 'symbol':
            return fallback;

        default:
            return fallback;
    }
}

module.exports = toSafeJson;
module.exports.toSafeJson = toSafeJson;