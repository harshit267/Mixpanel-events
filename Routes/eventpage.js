const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { createLinkedLists } = require('../services/linklist');
const { fetchLinkedList } = require('../services/linklist');
const LINKED_LIST_PATH = path.join(__dirname, '../schema/linked-list.json');
const validator = require('../services/eventValidator'); 

// router.get('/events', async (req, res) => {
//     try {
//         let linkedList = fetchLinkedList();

//         // If linked list is empty or not an array, fall back to create
//         if (!Array.isArray(linkedList) || linkedList.length === 0) {
//             console.warn('⚠️ Empty or invalid linked list, creating new one...');
//             createLinkedLists();
//             linkedList = fetchLinkedList();

//             // Save it to file
//             // fs.writeFileSync(LINKED_LIST_PATH, JSON.stringify(linkedList, null, 4));
//         }
//         // Sort the linked list before rendering
//         linkedList.sort((a, b) => {
//             const aTime = a.LinkedList?.length > 0 ? Math.max(...a.LinkedList.map(e => e.time)) : 0;
//             const bTime = b.LinkedList?.length > 0 ? Math.max(...b.LinkedList.map(e => e.time)) : 0;
//             return bTime - aTime; // Descending
//         });




//         res.render('eventpage', { linkedList, validator });
//     } catch (error) {
//         console.error('❌ Error fetching or creating linked list:', error);
//         res.status(500).send('Error preparing event page');
//     }
// });

router.get('/events', async (req, res) => {
    try {
        let linkedList = fetchLinkedList();

        // If linked list is empty or invalid
        if (!Array.isArray(linkedList) || linkedList.length === 0) {
            console.warn('⚠️ Empty or invalid linked list, creating new one...');
            createLinkedLists();
            linkedList = fetchLinkedList();
        }

        // Sort by latest event time
        linkedList.sort((a, b) => {
            const aTime = a.LinkedList?.length > 0 ? Math.max(...a.LinkedList.map(e => e.time)) : 0;
            const bTime = b.LinkedList?.length > 0 ? Math.max(...b.LinkedList.map(e => e.time)) : 0;
            return bTime - aTime;
        });

        const summary = {
            totalEvents: 0,
            validEvents: 0,
            issues: {
                missingRequired: 0,
                missingOptional: 0,
                emptyRequired: 0,
                emptyOptional: 0,
                typeMismatch: 0
            }
        };
        
        linkedList.forEach(node => {
            (node.LinkedList || []).forEach(event => {
                summary.totalEvents++;
        
                const { missingRequired, missingOptional, typeOrValueMismatch } =
                    validator.validateEvent(event.properties, node.Props);
        
                let hasIssue = false;
                let recorded = {
                    missingRequired: false,
                    missingOptional: false,
                    emptyRequired: false,
                    emptyOptional: false,
                    typeMismatch: false
                };
        
                if (missingRequired.length > 0) {
                    summary.issues.missingRequired++;
                    recorded.missingRequired = true;
                    hasIssue = true;
                }
        
                if (missingOptional.length > 0) {
                    summary.issues.missingOptional++;
                    recorded.missingOptional = true;
                    hasIssue = true;
                }
        
                typeOrValueMismatch.forEach(issue => {
                    hasIssue = true;
                    if (issue.issue === 'required-empty' && !recorded.emptyRequired) {
                        summary.issues.emptyRequired++;
                        recorded.emptyRequired = true;
                    }
                    if (issue.issue === 'optional-empty' && !recorded.emptyOptional) {
                        summary.issues.emptyOptional++;
                        recorded.emptyOptional = true;
                    }
                    if (issue.issue === 'type-mismatch' && !recorded.typeMismatch) {
                        summary.issues.typeMismatch++;
                        recorded.typeMismatch = true;
                    }
                });
        
                if (!hasIssue) {
                    summary.validEvents++;
                }
            });
        });
        

        res.render('eventpage', {
            linkedList,
            validator,
            summary
        });
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
