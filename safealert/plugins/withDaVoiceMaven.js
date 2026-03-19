const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withDaVoiceMaven(config) {
  return withProjectBuildGradle(config, config => {
    if (config.modResults.contents.includes('https://jitpack.io')) {
       // Si ya tiene jitpack, añadimos el de davoice después
       config.modResults.contents = config.modResults.contents.replace(
         /maven { url 'https:\/\/jitpack\.io' }/g,
         "maven { url 'https://jitpack.io' }\n        maven { url 'https://maven.davoice.io' }"
       );
    } else {
       // Si no, lo inyectamos en allprojects
       config.modResults.contents = config.modResults.contents.replace(
         /allprojects {[\s\S]*?repositories {/g,
         "allprojects {\n    repositories {\n        maven { url 'https://maven.davoice.io' }"
       );
    }
    return config;
  });
};
