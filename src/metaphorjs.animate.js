
var getAnimationPrefixes    = require("func/getAnimationPrefixes.js"),
    getAnimationDuration    = require("func/getAnimationDuration.js"),
    stopAnimation           = require("func/stopAnimation.js"),
    isArray                 = require("../../metaphorjs/src/func/isArray.js"),
    isThenable              = require("../../metaphorjs/src/func/isThenable.js"),
    extend                  = require("../../metaphorjs/src/func/extend.js"),
    data                    = require("../../metaphorjs/src/func/dom/data.js"),
    Promise                 = require("../../metaphorjs-promise/src/metaphorjs.promise.js"),
    addClass                = require("../../metaphorjs/src/func/dom/addClass.js"),
    removeClass             = require("../../metaphorjs/src/func/dom/removeClass.js"),
    isString                = require("../../metaphorjs/src/func/isString.js"),
    isFunction              = require("../../metaphorjs/src/func/isFunction.js"),
    isPlainObject           = require("../../metaphorjs/src/func/isPlainObject.js"),
    isNull                  = require('../../metaphorjs/src/func/isNull.js');


module.exports = function(){

    var types           = {
            "show":     ["mjs-show"],
            "hide":     ["mjs-hide"],
            "enter":    ["mjs-enter"],
            "leave":    ["mjs-leave"],
            "move":     ["mjs-move"]
        },

        animId          = 0,

        cssAnimations   = !!getAnimationPrefixes(),

        animFrame       = window.requestAnimationFrame ? window.requestAnimationFrame : function(cb) {
            window.setTimeout(cb, 0);
        },

        dataParam       = "mjsAnimationQueue",

        callTimeout     = function(fn, startTime, duration) {
            var tick = function(){
                var time = (new Date).getTime();
                if (time - startTime >= duration) {
                    fn();
                }
                else {
                    animFrame(tick);
                }
            };
            animFrame(tick);
        },



        nextInQueue     = function(el) {
            var queue = data(el, dataParam),
                next;
            if (queue.length) {
                next = queue[0];
                animationStage(next.el, next.stages, 0, next.start, next.deferred, false, next.id);
            }
            else {
                data(el, dataParam, null);
            }
        },

        animationStage  = function animationStage(el, stages, position, startCallback, deferred, first, id) {

            var stopped   = function() {
                var q = data(el, dataParam);
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

                if (position == stages.length) {
                    deferred.resolve(el);
                    data(el, dataParam).shift();
                    nextInQueue(el);
                }
                else {
                    data(el, dataParam)[0].position = position;
                    animationStage(el, stages, position, null, deferred);
                }

                removeClass(el, stages[thisPosition]);
                removeClass(el, stages[thisPosition] + "-active");
            };

            var setStage = function() {

                if (stopped()) {
                    return;
                }

                addClass(el, stages[position] + "-active");

                var duration = getAnimationDuration(el);

                if (duration) {
                    callTimeout(finishStage, (new Date).getTime(), duration);
                }
                else {
                    finishStage();
                }
            };

            var start = function(){

                if (stopped()) {
                    return;
                }

                addClass(el, stages[position]);

                var promise;

                if (startCallback) {
                    promise = startCallback(el);
                    startCallback = null;
                }

                if (isThenable(promise)) {
                    promise.done(setStage);
                }
                else {
                    animFrame(setStage);
                }
            };

            first ? animFrame(start) : start();
        };


    var animate = function animate(el, animation, startCallback, checkIfEnabled, namespace) {

        var deferred    = new Promise,
            queue       = data(el, dataParam) || [],
            id          = ++animId,
            attr        = el.getAttribute("mjs-animate"),
            stages,
            jsFn,
            before, after,
            options, context,
            duration;

        animation       = animation || attr;

        if (checkIfEnabled && isNull(attr)) {
            animation   = null;
        }

        if (animation) {

            if (isString(animation)) {
                if (animation.substr(0,1) == '[') {
                    stages  = (new Function('', 'return ' + animation))();
                }
                else {
                    stages      = types[animation];
                    animation   = namespace && namespace.get("animate." + animation, true);
                }
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


            if (cssAnimations && stages) {

                queue.push({
                    el: el,
                    stages: stages,
                    start: startCallback,
                    deferred: deferred,
                    position: 0,
                    id: id
                });
                data(el, dataParam, queue);

                if (queue.length == 1) {
                    animationStage(el, stages, 0, startCallback, deferred, true, id);
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
                    data(el, dataParam, jsFn.call(context, el, function(){
                        deferred.resolve(el);
                    }));
                    return deferred;
                }
                else if (window.jQuery) {

                    var j = $(el);
                    before && j.css(before);
                    data(el, dataParam, "stop");

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

    animate.addAnimationType     = function(name, stages) {
        types[name] = stages;
    };

    animate.stop = stopAnimation;

    return animate;
}();