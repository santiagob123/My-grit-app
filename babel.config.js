module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4 requires jsxImportSource set here
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
