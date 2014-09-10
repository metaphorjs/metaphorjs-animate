
var async = require("../../../metaphorjs/src/func/async.js"),
    strUndef = require("../../../metaphorjs/src/var/strUndef.js");

module.exports = function(){

    return typeof window != strUndef && window.requestAnimationFrame ?
           window.requestAnimationFrame : async;
}();