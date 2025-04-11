const express = require('express');
const router = express.Router();
const { updateLinkedListWithMixpanel } = require('../services/linkService'); // we'll create this next

router.post('/link-events', async (req, res) => {
    try {
        const { mode, relative, from_date, to_date, model, version, build } = req.body;

        const linkedList = await updateLinkedListWithMixpanel({
            mode,
            relative,
            from_date,
            to_date,
            model,
            version,
            build
        });
        res.json({ success: true, linkedList });
    } catch (error) {
        console.error('❌ Linking error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
