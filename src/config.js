let config = {
  // "apiHost": "http://api.penxy.local",
  "apiHost": "",
  "imageQuality": 4,
  "liveUserId": "",
  "livePlaceholderContentId": "",
  "liveRooms": ["Live video room"],
  //"signallingServer": "ws://localhost:3001"
  "signallingServer": ""
};

if (process.env.NODE_ENV === "production") {
  config = {...config, ...{
    "apiHost": "",
    "imageQuality": 2,
    "liveUserId": "",
    "livePlaceholderContentId": "",
    "signallingServer": ""
  }};
}

export default config;
