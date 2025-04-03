const SKIP_KEYS = ["$anon_id", "$insert_id", "$distinct_id_before_identity", "event_original_name", "id"];

function getExpectedProps(props) {
    if (!props || !props.properties) return [];
    return props.properties.filter(p => !SKIP_KEYS.includes(p.name));
}

function getMissingKeys(eventProps, expectedProps, isOptional) {
    return expectedProps
        .filter(p => p.optional === isOptional)
        .map(p => p.name)
        .filter(name => !Object.prototype.hasOwnProperty.call(eventProps, name));
}

function getInvalidKeys(eventProps, expectedProps) {
    const { missingRequired, missingOptional, typeOrValueMismatch } = validateEvent(eventProps, expectedProps);
    const failedKeys = new Set();

    missingRequired.forEach(k => failedKeys.add(k));
    missingOptional.forEach(k => failedKeys.add(k));
    typeOrValueMismatch.forEach(m => failedKeys.add(m.name));

    return Array.from(failedKeys);
}

function validateTypes(eventProps, expectedProps) {
    const mismatches = [];

    expectedProps.forEach(prop => {
        const value = eventProps[prop.name];
        if (value === undefined) return; // Skip if missing (already handled)

        const expectedType = Array.isArray(prop.type) ? prop.type : [prop.type];
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        const isEmpty = value === null || value === '' || 
                        (Array.isArray(value) && value.length === 0) ||
                        (typeof value === 'object' && value !== null && Object.keys(value).length === 0);

        // -- Normal type match
        const typeMatch = expectedType.some(type => {
            if (type === "string" && Array.isArray(value) && value.length === 1 && typeof value[0] === "string") {
                return true; // Accept array of one string
            }
            return type === actualType || type === "undefined" || type === value || (type === "null" && value === null);
        });

        // -- Check for empty value errors
        if (isEmpty && !expectedType.includes("null")) {
            mismatches.push({
                name: prop.name,
                issue: prop.optional ? 'optional-empty' : 'required-empty',
                actualType,
                expectedType,
                actualValue: value
            });
            return;
        }

        // -- Type mismatch
        if (!typeMatch) {
            mismatches.push({
                name: prop.name,
                issue: 'type-mismatch',
                actualType,
                expectedType,
                actualValue: value,
                expectedValues: prop.values || []
            });
        }
    });

    return mismatches;
}

function validateEvent(eventProps, expectedProps) {
    const expected = getExpectedProps(expectedProps);

    const missingRequired = getMissingKeys(eventProps, expected, false);
    const missingOptional = getMissingKeys(eventProps, expected, true);
    const typeOrValueMismatch = validateTypes(eventProps, expected);

    return { missingRequired, missingOptional, typeOrValueMismatch };
}

// ---------------- OLD STYLE Formatter ----------------
function renderValidationHTML(eventProps, expectedProps) {
    const { missingRequired, missingOptional, typeOrValueMismatch } = validateEvent(eventProps, expectedProps);

    const emptyIssues = typeOrValueMismatch.filter(m => m.issue === 'required-empty' || m.issue === 'optional-empty');
    const realMismatches = typeOrValueMismatch.filter(m => m.issue === 'type-mismatch');

    let html = '';

    if (missingRequired.length > 0) {
        html += `<p style="color:red; font-weight:bold;">❌ Missing Required Keys:</p><ul style="color:red;">`;
        missingRequired.forEach(key => {
            html += `<li>${key}</li>`;
        });
        html += '</ul>';
    }

    if (missingOptional.length > 0) {
        html += `<p style="color:orange; font-weight:bold;">⚠ Missing Optional Keys:</p><ul style="color:orange;">`;
        missingOptional.forEach(key => {
            html += `<li>${key}</li>`;
        });
        html += '</ul>';
    }

    if (emptyIssues.length > 0) {
        const requiredEmpty = emptyIssues.filter(e => e.issue === 'required-empty');
        const optionalEmpty = emptyIssues.filter(e => e.issue === 'optional-empty');

        if (requiredEmpty.length > 0) {
            html += `<p style="color:red; font-weight:bold;">❌ Empty Required Fields:</p><ul style="color:red;">`;
            requiredEmpty.forEach(e => {
                html += `<li>${e.name} should not be empty</li>`;
            });
            html += '</ul>';
        }

        if (optionalEmpty.length > 0) {
            html += `<p style="color:orange; font-weight:bold;">⚠ Empty Optional Fields:</p><ul style="color:orange;">`;
            optionalEmpty.forEach(e => {
                html += `<li>${e.name} is empty (optional)</li>`;
            });
            html += '</ul>';
        }
    }

    if (realMismatches.length > 0) {
        html += `<p style="color:purple; font-weight:bold;">🟣 Type/Value Issues:</p><ul style="color:purple;">`;
        realMismatches.forEach(m => {
            html += `<li>${m.name} (Expected Type: ${m.expectedType}, Actual: ${m.actualType}${
                m.expectedValues?.length ? ', Allowed Values: [' + m.expectedValues.join(', ') + ']' : ''
            })</li>`;
        });
        html += '</ul>';
    }

    return html;
}
function getBorderColor(eventProps, expectedProps) {
    const { missingRequired, missingOptional, typeOrValueMismatch } = validateEvent(eventProps, expectedProps);

    const hasRequiredEmpty = typeOrValueMismatch.some(m => m.issue === 'required-empty');
    const hasOptionalEmpty = typeOrValueMismatch.some(m => m.issue === 'optional-empty');
    const hasTypeMismatch = typeOrValueMismatch.some(m => m.issue === 'type-mismatch');

    if (missingRequired.length > 0 || hasRequiredEmpty) return 'red';
    if (missingOptional.length > 0 || hasOptionalEmpty) return 'orange';
    if (hasTypeMismatch) return 'purple';

    return 'green'; // ✅ clean
}
function getKeyIssueMap(eventProps, expectedProps) {
    const { missingRequired, missingOptional, typeOrValueMismatch } = validateEvent(eventProps, expectedProps);
    const keyColorMap = {};

    missingRequired.forEach(key => keyColorMap[key] = 'red');
    missingOptional.forEach(key => keyColorMap[key] = 'orange');

    typeOrValueMismatch.forEach(issue => {
        if (issue.issue === 'required-empty') keyColorMap[issue.name] = 'red';
        else if (issue.issue === 'optional-empty') keyColorMap[issue.name] = 'orange';
        else if (issue.issue === 'type-mismatch') keyColorMap[issue.name] = 'purple';
    });

    return keyColorMap;
}

module.exports = {
    validateEvent,
    renderValidationHTML,
    getBorderColor,
    getKeyIssueMap
};
