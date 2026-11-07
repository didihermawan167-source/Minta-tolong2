// Keep the installed Android app identity stable for upgrade builds.
module.exports = ({ config }) => ({
  ...config,
  name: "Minta Tolong",
  slug: "minta-tolong",
  scheme: "mintatolong",
  android: {
    ...config.android,
    package: "com.mintatolong.app",
  },
});
