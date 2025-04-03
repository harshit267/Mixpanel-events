const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { createLinkedLists } = require('../services/linklist');
const { fetchLinkedList } = require('../services/linklist');
const LINKED_LIST_PATH = path.join(__dirname, '../schema/linked-list.json');
const validator = require('../services/eventValidator'); 

router.get('/events', async (req, res) => {
    try {
        let linkedList = fetchLinkedList();

        // If linked list is empty or not an array, fall back to create
        if (!Array.isArray(linkedList) || linkedList.length === 0) {
            console.warn('⚠️ Empty or invalid linked list, creating new one...');
            createLinkedLists();
            linkedList = fetchLinkedList();

            // Save it to file
            // fs.writeFileSync(LINKED_LIST_PATH, JSON.stringify(linkedList, null, 4));
        }

        res.render('eventpage', { linkedList, validator });
    } catch (error) {
        console.error('❌ Error fetching or creating linked list:', error);
        res.status(500).send('Error preparing event page');
    }
});

router.get('/api/linked-list', async (req, res) => {
    try {
        const linkedList = fs.existsSync(LINKED_LIST_PATH)
            ? JSON.parse(fs.readFileSync(LINKED_LIST_PATH, 'utf-8'))
            : [];

        res.json({ success: true, linkedList });
    } catch (error) {
        console.error("❌ Error reading linked list", error);
        res.status(500).json({ success: false, error: "Failed to read linked list" });
    }
});


module.exports = router;
