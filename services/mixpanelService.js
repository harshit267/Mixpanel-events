const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const api_secret = process.env.API_SECRET;

// const fetchDynamicMixpanelEvents = async (fromDateMoment, toDateMoment, namespace = "com.binogi", model = null) => {
//     if (!api_secret) throw new Error("API_SECRET is missing");

//     const jqlUrl = 'https://mixpanel.com/api/2.0/jql';

//     const query = `
//         function main() {
//         return Events({
//             from_date: "${fromDateMoment.utc().format('YYYY-MM-DD')}",
//             to_date: "${toDateMoment.utc().format('YYYY-MM-DD')}"
//         })
//             .filter(function(event) {
//                 return event.properties["$app_namespace"] == "${namespace}"${
//                     model ? ` && event.properties["$model"] == "${model}"` : ''
//                 };
//             });
//         }
//     `;

//     const response = await axios.post(jqlUrl, { script: query }, {
//         headers: {
//             Authorization: `Basic ${Buffer.from(`${api_secret}:`).toString('base64')}`,
//             'Content-Type': 'application/json'
//         }
//     });

//     const limitedEvents = response.data.slice(0, 500); // You were limiting here

//     return limitedEvents;
// };

// const fetchDynamicMixpanelEvents = async (fromDateMoment, toDateMoment, namespace = "com.binogi", model = null) => {
//     if (!api_secret) throw new Error("API_SECRET is missing");

//     const jqlUrl = 'https://mixpanel.com/api/2.0/jql';

//     const query = `
//         function main() {
//             return Events({
//                 from_date: "${fromDateMoment.utc().format('YYYY-MM-DD')}",
//                 to_date: "${toDateMoment.utc().format('YYYY-MM-DD')}"
//             })
//             .filter(function(event) {
//                 return event.properties["$app_namespace"] == "${namespace}"${
//                     model ? ` && event.properties["$model"] == "${model}"` : ''
                    
//                 };
//             });
//         }
//     `;

//     const response = await axios.post(jqlUrl, { script: query }, {
//         headers: {
//             Authorization: `Basic ${Buffer.from(`${api_secret}:`).toString('base64')}`,
//             'Content-Type': 'application/json'
//         }
//     });

//     const events = response.data;

//     // Sort by time DESCENDING (latest first)
//     events.sort((a, b) => b.time - a.time);

//     // Optional: Limit the result after sorting
//     return events.slice(0, 500);
// };

// const fetchDynamicMixpanelEvents = async (fromDateMoment, toDateMoment, namespace = "com.binogi", model = null) => {
//     if (!api_secret) throw new Error("API_SECRET is missing");

//     const jqlUrl = 'https://mixpanel.com/api/2.0/jql';

//     const query = `
//         function main() {
//             return Events({
//                 from_date: "${fromDateMoment.utc().format('YYYY-MM-DD')}",
//                 to_date: "${toDateMoment.utc().format('YYYY-MM-DD')}"
//             })
//             .filter(function(event) {
//                 return event.properties["$app_version_string"] == "1.1" &&
//                        event.properties["$app_build_number"] == "18"
//                        ${model ? `&& event.properties["$model"] == "${model}"` : ''};
//             });
//         }
//     `;

//     const response = await axios.post(jqlUrl, { script: query }, {
//         headers: {
//             Authorization: `Basic ${Buffer.from(`${api_secret}:`).toString('base64')}`,
//             'Content-Type': 'application/json'
//         }
//     });

//     const events = response.data;

//     // Sort by time DESCENDING (latest first)
//     events.sort((a, b) => b.time - a.time);

//     // Limit to 500
//     return events.slice(0, 500);
// };

const fetchDynamicMixpanelEvents = async (
    fromDateMoment,
    toDateMoment,
    namespace = null, // optional now
    model = null,
    version = null,
    build = null
) => {
    if (!api_secret) throw new Error("API_SECRET is missing");

    const jqlUrl = 'https://mixpanel.com/api/2.0/jql';

    // ✅ Build the filter conditions safely
    const conditions = [];
    if (model) conditions.push(`event.properties["$model"] == "${model}"`);
    if (version) conditions.push(`event.properties["$app_version_string"] == "${version}"`);
    if (build) conditions.push(`event.properties["$app_build_number"] == "${build}"`);

    // If no filters are given, always return true
    const conditionString = conditions.length > 0
        ? conditions.join(" && ")
        : "true";

    const query = `
        function main() {
            return Events({
                from_date: "${fromDateMoment.utc().format('YYYY-MM-DD')}",
                to_date: "${toDateMoment.utc().format('YYYY-MM-DD')}"
            })
            .filter(function(event) {
                return ${conditionString};
            });
        }
    `;

    // console.log("🧪 Mixpanel JQL Query:\n", query); 

    const response = await axios.post(jqlUrl, { script: query }, {
        headers: {
            Authorization: `Basic ${Buffer.from(`${api_secret}:`).toString('base64')}`,
            'Content-Type': 'application/json'
        }
    });

    const events = response.data;
    events.sort((a, b) => b.time - a.time);
    return events.slice(0, 2000);
};



module.exports = { fetchDynamicMixpanelEvents };