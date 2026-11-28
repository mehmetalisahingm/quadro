// Ortak motor (packages/words-engine) uygulama klasörünün dışında; Metro'nun onu izlemesi gerekir.
// Motorun kendi bağımlılığı yoktur; çözümleme Expo varsayılanlarında kalır.
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const engineRoot = path.resolve(projectRoot, "../../packages/words-engine");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [engineRoot];

module.exports = config;
