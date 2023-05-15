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
    "baseUrl": "front_end",
    "target": "es5",
    "loose": false,
    "externalHelpers": false,
    "keepClassNames": false
  },
  "sourceMaps": true,
  "isModule": true
};