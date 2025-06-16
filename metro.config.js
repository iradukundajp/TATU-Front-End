const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add socket.io-client specific resolver configuration
config.resolver.alias = {
  ...config.resolver.alias,
};

// Ensure socket.io-client modules are properly resolved
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 