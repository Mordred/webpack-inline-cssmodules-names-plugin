# webpack-inline-cssmodules-names-plugin

When using CSS modules with [css-loader](https://github.com/webpack-contrib/css-loader) CSS files are
converted to javascript module which export object where key is className used in your code and value
is generated identifier.

```js
/***/ \\"./styles.css\\":
/***/ (function(module, exports) {

// Exports
module.exports = {
	\\"Example\\": \\"_1pnf1zespOZ6Wh_39JYiwU\\",
	\\"Example__button\\": \\"IOSoqXoyZpErJ5EF7paGS\\",
	\\"Example__button--variable\\": \\"_2yOeyO_4TJVeZD75xvzd65\\"
};

/***/ })
```

If your classNames are used once per code this idenfiers can be inlined and that is what this plugin do.

## Usage

_webpack.config.js_
```js
const InlineCSSModulessNamesPlugin = require( 'webpack-inline-cssmodules-names-plugin' );

module.exports = {
  ...,
  plugins: [
    new InlineCSSModulessNamesPlugin( [ /\.css/ ] ),
    ...
  ]
};
```

The constructor argument is an array of regexp matchers: if a matcher matches a module resource
path, the module will be treated as an constant-exporting one and these exports will be inlined.
