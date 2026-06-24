// Dinamik config: app.json'ı temel alır, Firebase config dosyalarının yolunu
// EAS build'de secret env var'dan (materialize edilmiş dosya yolu), lokalde ise
// app.json'daki ./ relative path'ten (gitignored ama diskte mevcut) çözer.
module.exports = ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ?? config.ios.googleServicesFile,
    },
    android: {
      ...config.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
    },
  };
};
