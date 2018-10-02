
require("./__init.js");
require("./getPrefixes.js");

var MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

/**
 * Is css animation supported in current browser
 * @function MetaphorJs.animate.isCssSupported
 * @returns {bool}
 */
module.exports = MetaphorJs.animate.isCssSupported = (function(){

    var cssAnimations = null;

    return function() {
        if (cssAnimations === null) {
            cssAnimations   = !!MetaphorJs.animate.getPrefixes();
        }
        return cssAnimations;
    };
}());