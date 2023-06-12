export default {
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "decorators": false,
      "dynamicImport": false
    },
    "transform": {
      "react": {
        "runtime": "automatic"
      }
    },
    "target": "esnext",
    "baseUrl": "front_end",
    "loose": false,
    "externalHelpers": false,
    "keepClassNames": false
  },
  "sourceMaps": true,
  "isModule": true
};