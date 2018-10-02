
require("./__init.js");

var MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js"),
    animate_getPrefixes = require("./getPrefixes.js");

/**
 * Is css animation supported in current browser
 * @function MetaphorJs.animate.isCssSupported
 * @returns {bool}
 */
module.exports = MetaphorJs.animate.isCssSupported = (function(){

    var cssAnimations = null;

    return function() {
        if (cssAnimations === null) {
            cssAnimations   = !!animate_getPrefixes();
        }
        return cssAnimations;
    };
}());