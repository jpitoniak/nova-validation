const esbuild = require("esbuild")

// fully automataed browser script
esbuild.build({
    entryPoints: ["./src/browser.js"],
    outfile: "./dist/browser.js",
    bundle: true,
    platform: "browser"
})

// fully automated browser script, minified
esbuild.build({
    entryPoints: ["./src/browser.js"],
    outfile: "./dist/browser.min.js",
    bundle: true,
    minify: true,
    platform: "browser"
})

// esm module
esbuild.build({
    entryPoints: ["./src/nova-validation.js"],
    outfile: "./dist/module.esm.js",
    bundle: true,
    platform: "neutral",
    mainFields: ["module", "main"]
})

// cjs module
esbuild.build({
    entryPoints: ["./src/nova-validation.js"],
    outfile: "./dist/module.cjs.js",
    bundle: true,
    platform: "node",
    target: ['node10.4']
})
