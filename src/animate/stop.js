
require("./__init.js");

var dom_data = require("metaphorjs/src/func/dom/data.js"),
    dom_removeClass = require("metaphorjs/src/func/dom/removeClass.js"),
    isFunction = require("metaphorjs-shared/src/func/isFunction.js"),
    isArray = require("metaphorjs-shared/src/func/isArray.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

/**
 * Stop ongoing animation for given element
 * @function MetaphorJs.animate.stop
 * @param {Element} el
 */
module.exports = MetaphorJs.animate.stop = function(el) {

    var queue = dom_data(el, "mjsAnimationQueue"),
        current,
        position,
        stages;

    if (isArray(queue) && queue.length) {
        current = queue[0];

        if (current) {
            if (current.stages) {
                position = current.position;
                stages = current.stages;
                dom_removeClass(el, stages[position]);
                dom_removeClass(el, stages[position] + "-active");
            }
            if (current.deferred) {
                current.deferred.reject(current.el);
            }
        }
    }
    else if (isFunction(queue)) {
        queue(el);
    }
    else if (queue === "stop") {
        $(el).stop(true, true);
    }

    dom_data(el, "mjsAnimationQueue", null);
};
