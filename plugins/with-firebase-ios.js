const { withDangerousMod, withEntitlementsPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// EAS cloud build sırasında Podfile'a use_modular_headers! ekler.
// FirebaseCoreInternal -> GoogleUtilities bağımlılığı modular headers olmadan
// static library olarak derlenemiyor.
function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (!contents.includes('use_modular_headers!')) {
        contents = contents.replace(
          'prepare_react_native_project!',
          'use_modular_headers!\n\nprepare_react_native_project!'
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
}

// @react-native-firebase/app plugin'i yeni Expo 54 AppDelegate yapısını
// tanımadığı için FirebaseApp.configure() ekleyemiyor. Biz ekliyoruz.
function withFirebaseConfigure(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const appDelegatePath = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        'AppDelegate.swift'
      );
      if (fs.existsSync(appDelegatePath)) {
        let contents = fs.readFileSync(appDelegatePath, 'utf8');
        if (!contents.includes('FirebaseApp.configure()')) {
          contents = contents.replace(
            /(didFinishLaunchingWithOptions[^{]*\{)/,
            '$1\n    FirebaseApp.configure()'
          );
          fs.writeFileSync(appDelegatePath, contents);
        }
      }
      return config;
    },
  ]);
}

// aps-environment entitlement'ı production build'de "production",
// diğerlerinde "development" olarak ayarlar.
function withApsEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
    config.modResults['aps-environment'] = isProduction ? 'production' : 'development';
    return config;
  });
}

module.exports = function withFirebaseIos(config) {
  config = withModularHeaders(config);
  config = withFirebaseConfigure(config);
  config = withApsEntitlement(config);
  return config;
};
