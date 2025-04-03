const express = require('express');
const moment = require('moment');
const mixpanelConfig = require('../config/mixpanel');

const router = express.Router();
const { fetchDynamicMixpanelEvents } = require('../services/mixpanelService');


router.post('/fetch-mixpanel-events', async (req, res) => {
    try {
        const { mode, relative, from_date, to_date, namespace, model } = req.body;

        const finalNamespace = namespace || mixpanelConfig.namespace;

        let finalFromDate, finalToDate;

        // ---------- DEFAULT LOGIC ----------
        if (mode === 'relative') {
            const now = moment();
            const durationValue = relative || '10m'; // default to 10 minutes

            switch (durationValue) {
                case '10m': finalFromDate = now.clone().subtract(10, 'minutes'); break;
                case '60m': finalFromDate = now.clone().subtract(60, 'minutes'); break;
                case '24h': finalFromDate = now.clone().subtract(24, 'hours'); break;
                case '2d':  finalFromDate = now.clone().subtract(2, 'days'); break;
                case '7d':  finalFromDate = now.clone().subtract(7, 'days'); break;
                case '30d': finalFromDate = now.clone().subtract(30, 'days'); break;
                default:    finalFromDate = now.clone().subtract(10, 'minutes'); // fallback
            }
            finalToDate = now;
        } else if (mode === 'custom') {
            if (!from_date || !to_date) {
                return res.status(400).json({ success: false, error: "from_date and to_date are required in custom mode" });
            }
            finalFromDate = moment(from_date);
            finalToDate = moment(to_date);
        } else {
            return res.status(400).json({ success: false, error: "mode must be relative or custom" });
        }

        const events = await fetchDynamicMixpanelEvents(finalFromDate, finalToDate, finalNamespace, model || null);
        res.json({ success: true, events });
    } catch (error) {
        console.error('❌ Error fetching events:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});



router.get('/get-config', (req, res) => {
    res.json({
        success: true,
        namespace: mixpanelConfig.namespace,
        allowedDevices: mixpanelConfig.allowedDevices,
        durations: mixpanelConfig.durations,
        defaultDuration: mixpanelConfig.defaultDuration
    });
});


module.exports = router; 