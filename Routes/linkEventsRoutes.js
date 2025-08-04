const express = require('express');
const router = express.Router();
const { updateLinkedListWithMixpanel } = require('../services/linkService');

router.post('/link-events', async (req, res) => {
    try {
        const { mode, relative, from_date, to_date, model, version, build } = req.body;

        if (!mode || !version || !build || !model || !relative) {
            return res.status(400).json({ success: false, error: "mode, from_date, and to_date are required" });
        }


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
        console.error('❌ Linking error:', error.message, error.stack);
        res.status(500).json({ success: false, error: error.message, errorDetails: error.stack });
    }
});

module.exports = router;
