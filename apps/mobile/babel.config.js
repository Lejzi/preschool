module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@przedszkole/shared': '../../packages/shared/src/index.ts',
          },
        },
      ],
      'expo-router/babel',
    ],
  };
};
