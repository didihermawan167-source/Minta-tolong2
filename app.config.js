// Preserve the installed Android app identity across PR merge builds.
// Never inherit the temporary ".test" package from an older base-branch config.
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
