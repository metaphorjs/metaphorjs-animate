
var Promise = require("../../../metaphorjs-promise/src/metaphorjs.promise.js"),
    isThenable = require("../../../metaphorjs/src/func/isThenable.js"),
    emptyFn = require("../../../metaphorjs/src/func/emptyFn.js");

module.exports = function() {

    var animate = function(el, animation, startCallback) {

        if (startCallback) {
            var promise = startCallback(el),
                deferred    = new Promise;
            if (isThenable(promise)) {
                promise.done(function(){
                    deferred.resolve(el);
                });
            }
            else {
                deferred.resolve(el);
            }
            return deferred;
        }
        else {
            return Promise.resolve(el);
        }
    };

    animate.addAnimationType = emptyFn;
    animate.stop = emptyFn;
    animate.prefixes = {};
    animate.cssAnimations = false;

    return animate;
}();