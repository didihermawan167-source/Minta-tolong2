// Dynamic app identity for side-by-side preview installs.
// Production/default builds keep the original package ID from app.json.
module.exports = ({ config }) => {
  const isPreview = process.env.APP_VARIANT === "preview";

  return {
    ...config,
    name: isPreview ? "Minta Tolong Uji" : config.name,
    android: {
      ...config.android,
      package: isPreview ? "com.mintatolong.app.preview" : config.android?.package,
    },
  };
};
