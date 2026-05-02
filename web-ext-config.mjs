export default {
  sourceDir: ".",
  artifactsDir: "web-ext-artifacts",
  ignoreFiles: [
    "amo/**",
    "native-host/**",
    "scripts/**",
    "README.md",
    ".gitattributes"
  ],
  build: {
    overwriteDest: true,
  },
  lint: {
    selfHosted: true,
  },
};
