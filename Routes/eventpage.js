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
        const linkedList = fetchLinkedList(); // ✅ Fetch, don't create
        res.render('eventpage', { linkedList , validator });
    } catch (error) {
        console.error('❌ Error fetching linked list:', error);
        res.status(500).send('Error fetching linked list');
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
