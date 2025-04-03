module.exports = {
    namespace: "com.binogi",

    allowedDevices: [
        "MAR-LX2",
        "V2205",
        "SM-M526B",
        "iPhone13,4",
        // Add more devices you want to filter on
    ],

    durations: [
        { label: "Last 10 minutes", value: "10m" },
        { label: "Last 60 minutes", value: "60m" },
        { label: "Last 24 hours", value: "24h" },
        { label: "Last 2 days", value: "2d" },
        { label: "Last 7 days", value: "7d" },
        { label: "Last 30 days", value: "30d" }
    ],

    defaultDuration: "7d" 
};
