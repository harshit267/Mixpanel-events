module.exports = {
    namespace: "com.binogi",

    allowedDevices: [
        "MAR-LX2",
        "V2205",
        "SM-A032F"
    ],

    allowedVersions: [
        "1.0",
        "1.1",
        "1.2"
    ],

    allowedBuilds: [
        "17",
        "18",
        "19",
        "20"
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
