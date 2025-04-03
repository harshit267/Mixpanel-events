const { fetchDynamicMixpanelEvents } = require('./mixpanelService');
const { createLinkedLists } = require('./linklist');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mixpanelConfig = require('../config/mixpanel');

const LINKED_LIST_PATH = path.join(__dirname, '../schema/linked-list.json');

// ---------------------- Utilities ----------------------

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
    const allowedSuffixes = ["Viewed", "Opened"];
    const parts = name.split(' ');
    return (allowedSuffixes.includes(parts[parts.length - 1])) ? parts.slice(0, -1).join(' ') : name;
}

// ---------------------- Matching ----------------------

function tryMatch(mixpanelName, node) {
    const typeName = node.EventName?.type?.replace(/"/g, '').trim() || "";
    const interfaceName = node.Interface?.trim() || "";

    const candidates = [
        { label: 'type', value: typeName },
        { label: 'interface', value: interfaceName }
    ];

    const normalizedMPName = normalize(mixpanelName);
    const normalizedMPNoSpaces = removeSpaces(normalizedMPName);

    // === STEP 1: Exact + Space-insensitive Match ===
    for (const candidate of candidates) {
        const normalizedCandidate = normalize(candidate.value);
        if (!normalizedCandidate) continue;

        if (normalizedMPName === normalizedCandidate) return candidate.label; // exact match
        if (normalizedMPNoSpaces === removeSpaces(normalizedCandidate)) return candidate.label; // space-insensitive
    }

    // === STEP 2: Prefix Removal Match ===
    const nameWithoutPrefix = removePrefix(mixpanelName);
    for (const candidate of candidates) {
        const normalizedCandidate = normalize(candidate.value);
        if (!normalizedCandidate) continue;

        if (normalize(nameWithoutPrefix) === normalizedCandidate) return candidate.label;
    }

    // === STEP 3: Suffix Removal Match ===
    const nameWithoutSuffix = removeSuffix(mixpanelName);
    for (const candidate of candidates) {
        const normalizedCandidate = normalize(candidate.value);
        if (!normalizedCandidate) continue;

        if (normalize(nameWithoutSuffix) === normalizedCandidate) return candidate.label;
    }

    return null; // unmatched
}

// ---------------------- Main ----------------------

// async function updateLinkedListWithMixpanel({ mode, relative, from_date, to_date, model }) {
//     const skipEvents = ["Application Installed", "Application Opened", "Application Backgrounded"];

//     let linkedList = fs.existsSync(LINKED_LIST_PATH)
//         ? JSON.parse(fs.readFileSync(LINKED_LIST_PATH, 'utf-8'))
//         : createLinkedLists();

//     // ----- Date calculation -----
//     let finalFromDate, finalToDate;
//     if (mode === 'relative') {
//         const now = moment();
//         const duration = relative || '10m';
//         switch (duration) {
//             case '10m': finalFromDate = now.clone().subtract(10, 'minutes'); break;
//             case '60m': finalFromDate = now.clone().subtract(60, 'minutes'); break;
//             case '24h': finalFromDate = now.clone().subtract(24, 'hours'); break;
//             case '2d':  finalFromDate = now.clone().subtract(2, 'days'); break;
//             case '7d':  finalFromDate = now.clone().subtract(7, 'days'); break;
//             case '30d': finalFromDate = now.clone().subtract(30, 'days'); break;
//             default:    finalFromDate = now.clone().subtract(10, 'minutes');
//         }
//         finalToDate = now;
//     } else {
//         finalFromDate = moment(from_date);
//         finalToDate = moment(to_date);
//     }

//     // ----- Fetch events -----
//     console.log("Server Current Time:", moment().format());
// console.log("Final From Date:", finalFromDate.format());
// console.log("Final To Date:", finalToDate.format());
//     const events = await fetchDynamicMixpanelEvents(finalFromDate, finalToDate, mixpanelConfig.namespace, model || null);
//     console.log(`✅ Total Mixpanel events fetched: ${events.length}`);
//     console.log("First 5 event timestamps:");
// events.slice(0,5).forEach(e => console.log(moment(e.time).format()));

//     // ----- Link events -----
//     for (const mpEvent of events) {
//         if (skipEvents.includes(mpEvent.name)) continue;

//         let matched = false;

//         for (const node of linkedList) {
//             const matchedBy = tryMatch(mpEvent.name, node);

//             if (matchedBy) {
//                 node.LinkedList = node.LinkedList || [];
//                 node.LinkedList.push(mpEvent);
//                 // console.log(`✅ Attached: '${mpEvent.name}' => '${matchedBy === 'type' ? node.EventName?.type?.replace(/"/g, '').trim() : node.Interface}'`);
//                 matched = true;
//                 break;
//             }
//         }

//         if (!matched) {
//             console.log(`❌ Unmatched Event: '${mpEvent.name}'`);
            
//         }
//     }

//     // Save linked list
//     fs.writeFileSync(LINKED_LIST_PATH, JSON.stringify(linkedList, null, 4));
//     console.log('✅ All events processed successfully and saved');

//     return linkedList;
// }

async function updateLinkedListWithMixpanel({ mode, relative, from_date, to_date, model }) {
    const skipEvents = ["Application Installed", "Application Opened", "Application Backgrounded"];

    let linkedList = fs.existsSync(LINKED_LIST_PATH)
        ? JSON.parse(fs.readFileSync(LINKED_LIST_PATH, 'utf-8'))
        : createLinkedLists();

    // ✅ STEP 1: Reset all attached events
    linkedList.forEach(node => {
        node.LinkedList = []; // clear previous ones
    });

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

    console.log("Server Current Time:", moment().format());
    console.log("Final From Date:", finalFromDate.format());
    console.log("Final To Date:", finalToDate.format());

    const events = await fetchDynamicMixpanelEvents(finalFromDate, finalToDate, mixpanelConfig.namespace, model || null);
    console.log(`✅ Total Mixpanel events fetched: ${events.length}`);

    // ✅ STEP 2: Sort events in descending order by time
    events.sort((a, b) => b.time - a.time);

    // ✅ STEP 3: Attach freshly sorted events
    for (const mpEvent of events) {
        if (skipEvents.includes(mpEvent.name)) continue;

        for (const node of linkedList) {
            const matchedBy = tryMatch(mpEvent.name, node);

            if (matchedBy) {
                node.LinkedList.push(mpEvent);
                break; // ✅ Only attach once per event
            }
        }
    }

    fs.writeFileSync(LINKED_LIST_PATH, JSON.stringify(linkedList, null, 4));
    console.log('✅ All events reattached freshly and saved');

    return linkedList;
}

module.exports = { updateLinkedListWithMixpanel };