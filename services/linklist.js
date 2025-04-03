const fs = require('fs');
const path = require('path');

const FORMATTED_EVENTS_PATH = path.join(__dirname, '../schema/formatted-events-man.json');
const LINKED_LIST_PATH = path.join(__dirname, '../schema/linked-list.json');

// FETCH FUNCTION 
const fetchFormattedEvents = () => {
    if (fs.existsSync(FORMATTED_EVENTS_PATH)) {
        try {
            const rawData = fs.readFileSync(FORMATTED_EVENTS_PATH, 'utf-8');
            return JSON.parse(rawData);
        } catch (error) {
            console.error(`❌ Error parsing formatted-events.json:`, error);
            return [];
        }
    }
    return [];
};

// CREATE FUNCTION 
const createLinkedLists = () => {
    const formattedEvents = fetchFormattedEvents();

    const linkedList = formattedEvents.map((event, index) => {
        const interfaceName = event.interface || event.interfaceName || `UnnamedEvent_${index}`;

        const eventNameProp = event.properties.find(p => p.name === 'eventName') || null;
        const identifyProp = event.properties.find(p => p.name === 'identify') || null;
        const propsProp = event.properties.find(p => p.name === 'props') || null;

        return {
            Interface: interfaceName,
            EventName: eventNameProp,
            Identify: identifyProp,
            Props: propsProp,
            LinkedList: []
        };
    });

    fs.writeFileSync(LINKED_LIST_PATH, JSON.stringify(linkedList, null, 4));
    console.log(`✅ Linked list saved at: ${LINKED_LIST_PATH}`);

    return linkedList;
};

const fetchLinkedList = () => {
    if (fs.existsSync(LINKED_LIST_PATH)) {
        return JSON.parse(fs.readFileSync(LINKED_LIST_PATH, 'utf-8'));
    }
    return [];
};

module.exports = {
    fetchFormattedEvents,
    createLinkedLists ,
    fetchLinkedList
};
