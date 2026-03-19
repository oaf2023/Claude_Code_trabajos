const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withManifestConflictFix(config) {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const messagingMetaData = mainApplication['meta-data'].find(
      d => d.$['android:name'] === 'com.google.firebase.messaging.default_notification_color'
    );

    if (messagingMetaData) {
      messagingMetaData.$['tools:replace'] = 'android:resource';
    }

    return config;
  });
};
