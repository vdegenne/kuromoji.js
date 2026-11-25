# @vdegenne/kuromoji-core

A modified fork of [kuromoji.js](https://github.com/takuyaa/kuromoji.js).

## Features

- Supports uncompressed `.dat` and compressed `.dat.gz` dictionary files.
- Provides download progress tracking for all 12 dictionary files through an optional `onProgress` callback.

## Usage

This package does **not** include dictionary files.

It is primarily intended to be used through [`@vdegenne/kuromoji`](https://www.npmjs.com/package/@vdegenne/kuromoji), which provides the dictionaries and handles their integration.

For direct usage, you must provide your own dictionary files and specify their location:

```js
var kuromoji = require("@vdegenne/kuromoji-core");

kuromoji.builder({
    dicPath: "/path/to/dict/",
    dictFileFormat: "dat",
    onProgress: function (progress) {
        console.log(progress);
    }
}).build(function (err, tokenizer) {
    if (err) {
        throw err;
    }

    // Tokenizer is ready
});
```

## Options

| Option | Description | Default |
| --- | --- | --- |
| `dicPath` | Dictionary directory path | `"dict/"` |
| `dictFileFormat` | `"dat"` or `"gz"` | `"dat"` |
| `onProgress` | Optional download progress callback | `null` |

The progress object contains `loaded`, `total`, `lengthComputable`, `filesLoaded` and `filesTotal`.
