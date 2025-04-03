const { fetchDynamicMixpanelEvents } = require('./mixpanelService');
const { createLinkedLists } = require('./linklist');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mixpanelConfig = require('../config/mixpanel');

const LINKED_LIST_PATH = path.join(__dirname, '../schema/linked-list.json');



function isEventMatch(mpEventName, node) {
    const allowedPrefixes = ["Viewed", "Opened", "Completed", "Started", "Finished"];

    // Step 1: Clean node values
    const type = (node.EventName?.type || "").replace(/"/g, '').trim();
    const interfaceName = (node.Interface || "").trim();

    // Step 2: Normalize event name
    const eventNameLower = mpEventName.toLowerCase().trim();
    const eventNameNoSpaces = eventNameLower.replace(/\s+/g, '');

    // Step 3: Normalize node names
    const typeLower = type.toLowerCase();
    const typeNoSpaces = typeLower.replace(/\s+/g, '');
    const interfaceLower = interfaceName.toLowerCase();
    const interfaceNoSpaces = interfaceLower.replace(/\s+/g, '');

    // ------------- Matching -----------------

    // First Priority -> Exact .type match
    if (eventNameLower === typeLower) return true;

    // Second Priority -> Exact .interface match (without spaces)
    if (eventNameNoSpaces === interfaceNoSpaces) return true;

    // Step 3: Remove prefix and try
    const parts = eventNameLower.split(" ");
    const prefix = parts[0];
    const withoutPrefix = parts.slice(1).join(" ").trim();
    const withoutPrefixNoSpaces = withoutPrefix.replace(/\s+/g, '');

    if (allowedPrefixes.includes(prefix.charAt(0).toUpperCase() + prefix.slice(1))) {
        if (withoutPrefix === typeLower || withoutPrefixNoSpaces === interfaceNoSpaces) return true;
    }

    // Step 4: Remove suffix and try
    const suffix = parts[parts.length - 1];
    const withoutSuffix = parts.slice(0, -1).join(" ").trim();
    const withoutSuffixNoSpaces = withoutSuffix.replace(/\s+/g, '');

    if (allowedPrefixes.includes(suffix.charAt(0).toUpperCase() + suffix.slice(1))) {
        if (withoutSuffix === typeLower || withoutSuffixNoSpaces === interfaceNoSpaces) return true;
    }

    return false;
}



function normalize(str) {
    return str.toLowerCase().trim();
}

function removeSpaces(str) {
    return str.replace(/\s+/g, '');
}

function removePrefix(name) {
    const allowedPrefixes = ["Viewed", "Opened", "Completed", "Started", "Finished"];
    const parts = name.split(' ');
    return (allowedPrefixes.includes(parts[0])) ? parts.slice(1).join(' ') : name;
}

function removeSuffix(name) {
    const allowedSuffixes = ["Viewed", "Opened", "Completed", "Started", "Finished"];
    const parts = name.split(' ');
    return (allowedSuffixes.includes(parts[parts.length - 1])) ? parts.slice(0, -1).join(' ') : name;
}

function tryMatch(mixpanelName, node) {
    const typeName = node.EventName?.type?.replace(/"/g, '').trim() || "";
    const interfaceName = node.Interface?.trim() || "";

    const candidates = [
        { label: 'type', value: typeName },
        { label: 'interface', value: interfaceName }
    ];

    for (const candidate of candidates) {
        if (!candidate.value) continue;

        // STEP 1: Exact Match
        if (normalize(mixpanelName) === normalize(candidate.value)) return candidate.label;

        // STEP 2: Space insensitive Match
        if (removeSpaces(normalize(mixpanelName)) === removeSpaces(normalize(candidate.value))) return candidate.label;

        // STEP 3: Prefix Removal Match
        if (normalize(removePrefix(mixpanelName)) === normalize(candidate.value)) return candidate.label;

        // STEP 4: Suffix Removal Match
        if (normalize(removeSuffix(mixpanelName)) === normalize(candidate.value)) return candidate.label;
    }

    return null; // Unmatched
}


async function updateLinkedListWithMixpanel({ mode, relative, from_date, to_date, model }) {
    const skipEvents = ["Application Installed", "Application Opened", "Application Backgrounded"];



    function getEventNameFromNode(node) {
        const type = node.EventName?.type || "";
        const interfaceName = node.Interface || "";
    
        if (type) return type.replace(/"/g, '').trim();
        if (interfaceName) return interfaceName.trim();
    
        return "";
    }

    function normalizePrefixOrSuffix(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    


    let linkedList = fs.existsSync(LINKED_LIST_PATH)
        ? JSON.parse(fs.readFileSync(LINKED_LIST_PATH, 'utf-8'))
        : createLinkedLists();

    // ----- Date calculation -----
    let finalFromDate, finalToDate;
    if (mode === 'relative') {
        const now = moment();
        const duration = relative || '10m';
        switch (duration) {
            case '10m': finalFromDate = now.clone().subtract(10, 'minutes'); break;
            case '60m': finalFromDate = now.clone().subtract(60, 'minutes'); break;
            case '24h': finalFromDate = now.clone().subtract(24, 'hours'); break;
            case '2d':  finalFromDate = now.clone().subtract(2, 'days'); break;
            case '7d':  finalFromDate = now.clone().subtract(7, 'days'); break;
            case '30d': finalFromDate = now.clone().subtract(30, 'days'); break;
            default:    finalFromDate = now.clone().subtract(10, 'minutes');
        }
        finalToDate = now;
    } else {
        finalFromDate = moment(from_date);
        finalToDate = moment(to_date);
    }

    // ----- Fetch events -----
    const events = await fetchDynamicMixpanelEvents(finalFromDate, finalToDate, mixpanelConfig.namespace, model || null);
    console.log(`✅ Total Mixpanel events fetched: ${events.length}`);

    // ----- Match Config -----
    const allowedPrefixes = ["Viewed", "Opened", "Completed", "Started", "Finished"];

    // ----- Link events -----
    for (const mpEvent of events) {
        if (skipEvents.includes(mpEvent.name)) continue;
    
        let matched = false;
    
        for (const node of linkedList) {
            const matchedBy = tryMatch(mpEvent.name, node);
    
            if (matchedBy) {
                node.LinkedList = node.LinkedList || [];
                node.LinkedList.push(mpEvent);
                console.log(`✅ Attached: '${mpEvent.name}' => '${matchedBy === 'type' ? node.EventName?.type : node.Interface}'`);
                matched = true;
                break;
            }
        }
    
        if (!matched) {
            console.log(`❌ Unmatched Event: '${mpEvent.name}'`);
            fs.writeFileSync(LINKED_LIST_PATH, JSON.stringify(linkedList, null, 4));
            return linkedList;
        }
    }
    
    
    
    
    

    // Save full linked list
    fs.writeFileSync(LINKED_LIST_PATH, JSON.stringify(linkedList, null, 4));
    console.log('✅ All events processed successfully and saved');

    return linkedList;
}



module.exports = { updateLinkedListWithMixpanel };
