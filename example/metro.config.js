const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Resolves `rn-smart-grid` to the library source one directory up. Imports of
 * react / react-native made from ../src are redirected to this app's
 * node_modules, otherwise they would pick up the library's dev dependencies
 * (a second copy of React breaks hooks).
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');
const librarySrc = path.join(libraryRoot, 'src');
const singletons = ['react', 'react-native'];

const config = {
  watchFolders: [libraryRoot],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'rn-smart-grid') {
        return context.resolveRequest(context, path.join(librarySrc, 'index.ts'), platform);
      }
      const isSingleton = singletons.some(
        (name) => moduleName === name || moduleName.startsWith(`${name}/`),
      );
      if (isSingleton && context.originModulePath.startsWith(librarySrc)) {
        return context.resolveRequest(
          { ...context, originModulePath: path.join(projectRoot, 'index.js') },
          moduleName,
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
