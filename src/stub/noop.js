require("metaphorjs-promise/src/lib/Promise.js");

const isThenable = require("metaphorjs-shared/src/func/isThenable.js"),
    emptyFn = require("metaphorjs-shared/src/func/emptyFn.js");

module.exports = function() {

    var animate = function(el, animation, startCallback) {

        if (startCallback) {
            var promise = startCallback(el),
                deferred    = new MetaphorJs.lib.Promise;
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
            return MetaphorJs.lib.Promise.resolve(el);
        }
    };

    animate.addAnimationType = emptyFn;
    animate.stop = emptyFn;
    animate.getPrefixes = function(){
        return {};
    };
    animate.getDuration = function(){
        return 0;
    };
    animate.cssAnimationSupported = function() {
        return false;
    };

    return animate;
}();