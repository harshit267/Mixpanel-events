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

function validateTypes(eventProps, expectedProps) {
    const mismatches = [];

    expectedProps.forEach(prop => {
        const value = eventProps[prop.name];
        if (value === undefined) return;

        const expectedType = Array.isArray(prop.type) ? prop.type : [prop.type];
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        const typeMatch = expectedType.some(type => type === actualType || type === "undefined" || type === value || (type === "null" && value === null));
        const valueMatch = !prop.values || (prop.values.includes(value));

        if (!typeMatch || !valueMatch) {
            mismatches.push({
                name: prop.name,
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

    let html = '';

    if (missingRequired.length > 0) {
        html += `<p style="color:red; font-weight:bold;">❌ Missing Required Keys: ${missingRequired.join(", ")}</p>`;
    }

    if (missingOptional.length > 0) {
        html += `<p style="color:orange; font-weight:bold;">⚠ Missing Optional Keys: ${missingOptional.join(", ")}</p>`;
    }

    if (typeOrValueMismatch.length > 0) {
        html += `<p style="color:purple; font-weight:bold;">🟣 Type/Value Issues:<br>`;
        html += typeOrValueMismatch.map(m =>
            `- ${m.name} (Expected Type: ${m.expectedType}, Actual: ${m.actualType}${m.expectedValues.length ? ', Allowed Values: [' + m.expectedValues.join(', ') + ']' : ''})`
        ).join('<br>');
        html += '</p>';
    }

    return html;
}

module.exports = {
    validateEvent,
    renderValidationHTML
};
