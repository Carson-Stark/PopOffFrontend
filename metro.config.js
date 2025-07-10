const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get Expo's default Metro config
const config = getDefaultConfig(__dirname);

// Get the actual resolver used by Metro
const { resolve } = require('metro-resolver');

// Override resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios' || moduleName.startsWith('axios/')) {
    return resolve(
      {
        ...context,
        unstable_conditionNames: ['browser'],
      },
      moduleName,
      platform
    );
  }

  // fallback to default
  return resolve(context, moduleName, platform);
};

module.exports = config;
