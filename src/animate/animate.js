
require("./__init.js");
require("./getDuration.js");
require("./isCssSupported.js");
require("metaphorjs-promise/src/lib/Promise.js");
require("metaphorjs/src/func/dom/data.js");
require("metaphorjs/src/func/dom/addClass.js");
require("metaphorjs/src/func/dom/removeClass.js");

var isArray                 = require("metaphorjs-shared/src/func/isArray.js"),
    isThenable              = require("metaphorjs-shared/src/func/isThenable.js"),
    extend                  = require("metaphorjs-shared/src/func/extend.js"),
    isString                = require("metaphorjs-shared/src/func/isString.js"),
    isFunction              = require("metaphorjs-shared/src/func/isFunction.js"),
    isPlainObject           = require("metaphorjs-shared/src/func/isPlainObject.js"),
    raf                     = require("../func/raf.js"),
    MetaphorJs              = require("metaphorjs-shared/src/MetaphorJs.js");

module.exports = MetaphorJs.animate.animate = function(){

    var types           = {
            "show":     ["mjs-show"],
            "hide":     ["mjs-hide"],
            "enter":    ["mjs-enter"],
            "leave":    ["mjs-leave"],
            "move":     ["mjs-move"]
        },

        animId          = 0,
        dataParam       = "mjsAnimationQueue",

        callTimeout     = function(fn, startTime, duration) {
            var tick = function(){
                var time = (new Date).getTime();
                if (time - startTime >= duration) {
                    fn();
                }
                else {
                    raf(tick);
                }
            };
            raf(tick);
        },


        nextInQueue     = function(el) {
            var queue = MetaphorJs.dom.data(el, dataParam),
                next;
            if (queue.length) {
                next = queue[0];
                animationStage(next.el, next.stages, 0, next.start, next.deferred, false, next.id, next.step);
            }
            else {
                MetaphorJs.dom.data(el, dataParam, null);
            }
        },

        animationStage  = function animationStage(el, stages, position, startCallback,
                                                  deferred, first, id, stepCallback) {

            var stopped   = function() {
                var q = MetaphorJs.dom.data(el, dataParam);
                if (!q || !q.length || q[0].id != id) {
                    deferred.reject(el);
                    return true;
                }
                return false;
            };

            var finishStage = function() {

                if (stopped()) {
                    return;
                }

                var thisPosition = position;

                position++;

                if (position === stages.length) {
                    deferred.resolve(el);
                    MetaphorJs.dom.data(el, dataParam).shift();
                    nextInQueue(el);
                }
                else {
                    MetaphorJs.dom.data(el, dataParam)[0].position = position;
                    animationStage(el, stages, position, null, deferred, false, id, stepCallback);
                }

                MetaphorJs.dom.removeClass(el, stages[thisPosition]);
                MetaphorJs.dom.removeClass(el, stages[thisPosition] + "-active");
            };

            var setStage = function() {

                if (!stopped()) {

                    MetaphorJs.dom.addClass(el, stages[position] + "-active");

                    MetaphorJs.lib.Promise.resolve(stepCallback && stepCallback(el, position, "active"))
                        .done(function(){
                            if (!stopped()) {

                                var duration = MetaphorJs.animate.getDuration(el);

                                if (duration) {
                                    callTimeout(finishStage, (new Date).getTime(), duration);
                                }
                                else {
                                    raf(finishStage);
                                }
                            }
                        });
                }

            };

            var start = function(){

                if (!stopped()) {
                    MetaphorJs.dom.addClass(el, stages[position]);

                    MetaphorJs.lib.Promise.waterfall([
                            stepCallback && stepCallback(el, position, "start"),
                            function(){
                                return startCallback ? startCallback(el) : null;
                            }
                        ])
                        .done(function(){
                            !stopped() && raf(setStage);
                        });
                }
            };

            first ? raf(start) : start();
        };


    /**
     * @function MetaphorJs.animate.animate
     * @param {Element} el Element being animated
     * @param {string|function|[]|object} animation {
     *  'string' - registered animation name,<br>
     *  'function' - fn(el, callback) - your own animation<br>
     *  'array' - array or stages (class names)<br>
     *  'array' - [{before}, {after}] - jquery animation<br>
     *  'object' - {stages, fn, before, after, options, context, duration, start}
     * }
     * @param {function} startCallback call this function before animation begins
     * @param {function} stepCallback call this function between stages
     * @returns {MetaphorJs.lib.Promise}
     */
    var animate = function animate(el, animation, startCallback, stepCallback) {

        var deferred    = new MetaphorJs.lib.Promise,
            queue       = MetaphorJs.dom.data(el, dataParam) || [],
            id          = ++animId,
            stages,
            jsFn,
            before, after,
            options, context,
            duration;

        if (animation) {

            if (isString(animation)) {
                stages = types[animation];
            }
            else if (isFunction(animation)) {
                jsFn = animation;
            }
            else if (isArray(animation)) {
                if (isString(animation[0])) {
                    stages = animation;
                }
                else {
                    before = animation[0];
                    after = animation[1];
                }
            }

            if (isPlainObject(animation)) {
                stages      = animation.stages;
                jsFn        = animation.fn;
                before      = animation.before;
                after       = animation.after;
                options     = animation.options ? extend({}, animation.options) : {};
                context     = animation.context || null;
                duration    = animation.duration || null;
                startCallback   = startCallback || options.start;
            }


            if (MetaphorJs.animate.isCssSupported() && stages) {

                queue.push({
                    el: el,
                    stages: stages,
                    start: startCallback,
                    step: stepCallback,
                    deferred: deferred,
                    position: 0,
                    id: id
                });
                MetaphorJs.dom.data(el, dataParam, queue);

                if (queue.length === 1) {
                    animationStage(el, stages, 0, startCallback, deferred, true, id, stepCallback);
                }

                return deferred;
            }
            else {

                options = options || {};

                startCallback && (options.start = function(){
                    startCallback(el);
                });

                options.complete = function() {
                    deferred.resolve(el);
                };

                duration && (options.duration = duration);

                if (jsFn && isFunction(jsFn)) {
                    if (before) {
                        extend(el.style, before, true, false);
                    }
                    startCallback && startCallback(el);
                    MetaphorJs.dom.data(el, dataParam, jsFn.call(context, el, function(){
                        deferred.resolve(el);
                    }));
                    return deferred;
                }
                else if (window.jQuery) {

                    var j = $(el);
                    before && j.css(before);
                    MetaphorJs.dom.data(el, dataParam, "stop");

                    if (jsFn && isString(jsFn)) {
                        j[jsFn](options);
                        return deferred;
                    }
                    else if (after) {
                        j.animate(after, options);
                        return deferred;
                    }
                }
            }
        }

        // no animation happened

        if (startCallback) {
            var promise = startCallback(el);
            if (isThenable(promise)) {
                promise.done(function(){
                    deferred.resolve(el);
                });
            }
            else {
                deferred.resolve(el);
            }
        }
        else {
            deferred.resolve(el);
        }

        return deferred;
    };

    /**
     * @function MetaphorJs.animate.animate.addAnimationType
     * @param {string} name 
     * @param {array} stages 
     */
    animate.addAnimationType     = function(name, stages) {
        types[name] = stages;
    };

    return animate;
}();