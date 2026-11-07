// Keep the original Android identity so this APK can update the installed app.
module.exports = ({ config }) => ({
  ...config,
  name: config.name,
  android: {
    ...config.android,
    package: config.android?.package || "com.mintatolong.app",
  },
});
