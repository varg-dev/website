# varg.dev entry point

This is a somewhat minimal example that allows for prototypical development applications in TypeScript. It uses `webpack` and pug for the generation of one or more static HTML files with a SCSS-based `latex.css` style.


## Test the Template before Customization

1. run `npm: install`, e.g., via the `Terminal > Run Task...` command (`ctrl+alt+t`)
2. run `npm: start:dev`, for development with live reloading etc. (built in-memory)
3. or alternatively, `npm: build:dev`, for single build (that actually creates the `build` output directory)
4. you should see something like this:
   ![WebGL-Template](https://github.com/cginternals/webgl-ts-template/blob/master/static-website-prev.png)


## Template Folder Structure

```
+-- application/
|   +-- img/...                 // copied to 'build/img'
|   +-- data/...                // copied to 'build/data'
|   +-- index.pug               // entry for 'index.html', build using pug-loader
|   +-- application.ts          // entry for 'js/application.js', build using ts-loader
|   +-- scss/styles.scss        // entry for 'css/styles.css', build using several loaders
|
+-- source/
|   +-- shaders/                // include directory for shaders and shader partials
|   |   +-- facade.frag.glsl    // example fragment shader snippet for shader import
|   |   +-- facade.vert.glsl    // example vertex shader snippet for shader import
|   |   +-- ndctest.frag        // simple fragment shader, including 'facade.frag.glsl'
|   |   +-- ndctest.vert        // simple vertex shader, including 'facade.vert.glsl'
|   |
|   +-- /polyfill.ts            // custom polyfill code to account for ES features missing on client-side
|   +-- /renderer.ts            // an example class for rendering stuff with WebGL
|   +-- /renderlib.ts           // entry for ' js/renderlib.js', build using ts-loader
|
+-- .gitignore
+-- package.json                // npm package configuration
+-- tsconfig.json               // typescript configuration
+-- tslint.json                 // typescript linter configuration
+-- webpack.config.js           // webpack configuration, customize accordingly
+-- README.md
+-- LICENSE
```


## Build Folder Structure

```
build/
+-- css/...                 // output from 'application/scss/styles.scss'
+-- img/...                 // copied from 'application/img'
+-- js/
|   +-- application.js      // output from 'application/application.ts'
|   +-- application.map     // map file for 'application.js'
|   +-- renderlib.js        // output from 'source/renderlib.ts'
|   +-- renderlib.map       // map file for 'renderlib.js'
|   +-- rxjs.umd.*          // copied from 'node_modules/rxjs/.../bundle'
|   +-- webgl-operate.*     // copied from 'node_modules/webgl-operate/dist'
+-- data/...                // copied from 'application/data'
+-- index.html              // output from 'application/index.pug'
```


## Adjust for Your 3rd Party Dependencies

There are two ways for including 3rd Party code: transpiled within the output files or as a peer dependency.
The template by default is configured to use `webgl-operate` and `rxjs` as well as the `renderlib` itself as peer dependency. This means that `application.js` will not comprise `renderlib` and `renderlib.js` will not comprise `webgl-operate` nor `rxjs.umd.*`. Instead, every script will be loaded/referenced in the html file (`index.pug`).

Peer dependencies require special treatment within the webpack configuration:

```
    externals: {
        'webgl-operate': 'gloperate'
    },
```

`rxjs` itself is already a peer dependency of `webgl-operate` and expected to be available when code is executed.

The required `js` files can be added in `index.pug` locally or using a CDN, such as `JSDelivr`. The template copies the dependencies directly from the `node_modules` directory.

```
    plugins: [
        new CopyWebpackPlugin([
            { from: 'data', to: 'data' },
            { from: 'img', to: 'img' },
            { from: '../node_modules/webgl-operate/dist', to: 'js' },
            { from: '../node_modules/rxjs/bundles', to: 'js' },
        ]),
```

In case it is required for `application.js` to include the transpiled output of the library (e.g., `renderlib.ts`),
1. then all respective external declarations must be removed,
2. and basically, the first `webpack.config` export object must be removed/merged with the application object
3. (or alternatively, just remove the entry within the renderlib object, e.g., `renderlib.ts`).

```
    externals: {
        renderlib: true,
    },
```
