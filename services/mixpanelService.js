const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const api_secret = process.env.API_SECRET;

const fetchDynamicMixpanelEvents = async (fromDateMoment, toDateMoment, namespace = "com.binogi", model = null) => {
    if (!api_secret) throw new Error("API_SECRET is missing");

    const jqlUrl = 'https://mixpanel.com/api/2.0/jql';

    const query = `
        function main() {
            return Events({
                from_date: "${fromDateMoment.format('YYYY-MM-DD')}",
                to_date: "${toDateMoment.format('YYYY-MM-DD')}"
            })
            .filter(function(event) {
                return event.properties["$app_namespace"] == "${namespace}"${
                    model ? ` && event.properties["$model"] == "${model}"` : ''
                };
            });
        }
    `;

    const response = await axios.post(jqlUrl, { script: query }, {
        headers: {
            Authorization: `Basic ${Buffer.from(`${api_secret}:`).toString('base64')}`,
            'Content-Type': 'application/json'
        }
    });

    const limitedEvents = response.data.slice(0, 300);

    return limitedEvents;
};



module.exports = { fetchDynamicMixpanelEvents };
