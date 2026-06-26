module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@savora/shared': '../shared/src',
          },
        },
      ],
      'nativewind/babel',
      'react-native-reanimated/plugin', // must be last
    ],
  };
};
