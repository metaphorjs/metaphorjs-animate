(function(){
"use strict";
var __MetaphorJsPrebuilt = {};


var MetaphorJs = {


};


function isFunction(value) {
    return typeof value == 'function';
};

var toString = Object.prototype.toString;

var undf = undefined;




var varType = function(){

    var types = {
        '[object String]': 0,
        '[object Number]': 1,
        '[object Boolean]': 2,
        '[object Object]': 3,
        '[object Function]': 4,
        '[object Array]': 5,
        '[object RegExp]': 9,
        '[object Date]': 10
    };


    /*
     * 'string': 0,
     * 'number': 1,
     * 'boolean': 2,
     * 'object': 3,
     * 'function': 4,
     * 'array': 5,
     * 'null': 6,
     * 'undefined': 7,
     * 'NaN': 8,
     * 'regexp': 9,
     * 'date': 10,
     * unknown: -1
     * @param {*} value
     * @returns {number}
     */



    return function varType(val) {

        if (!val) {
            if (val === null) {
                return 6;
            }
            if (val === undf) {
                return 7;
            }
        }

        var num = types[toString.call(val)];

        if (num === undf) {
            return -1;
        }

        if (num === 1 && isNaN(val)) {
            return 8;
        }

        return num;
    };

}();



function isString(value) {
    return typeof value == "string" || value === ""+value;
    //return typeof value == "string" || varType(value) === 0;
};



/**
 * @param {*} value
 * @returns {boolean}
 */
function isArray(value) {
    return typeof value === "object" && varType(value) === 5;
};

var strUndef = "undefined";



function isObject(value) {
    if (value === null || typeof value != "object") {
        return false;
    }
    var vt = varType(value);
    return vt > 2 || vt == -1;
};



var Cache = function(){

    var globalCache;

    /**
     * @class Cache
     */

    /**
     * @constructor
     * @param {bool} cacheRewritable
     */
    var Cache = function(cacheRewritable) {

        var storage = {},

            finders = [];

        if (arguments.length == 0) {
            cacheRewritable = true;
        }

        return {

            /**
             * @param {function} fn
             * @param {object} context
             * @param {bool} prepend
             */
            addFinder: function(fn, context, prepend) {
                finders[prepend? "unshift" : "push"]({fn: fn, context: context});
            },

            /**
             * @method
             * @param {string} name
             * @param {*} value
             * @param {bool} rewritable
             * @returns {*} value
             */
            add: function(name, value, rewritable) {

                if (storage[name] && storage[name].rewritable === false) {
                    return storage[name];
                }

                storage[name] = {
                    rewritable: typeof rewritable != strUndef ? rewritable : cacheRewritable,
                    value: value
                };

                return value;
            },

            /**
             * @method
             * @param {string} name
             * @returns {*}
             */
            get: function(name) {

                if (!storage[name]) {
                    if (finders.length) {

                        var i, l, res,
                            self = this;

                        for (i = 0, l = finders.length; i < l; i++) {

                            res = finders[i].fn.call(finders[i].context, name, self);

                            if (res !== undf) {
                                return self.add(name, res, true);
                            }
                        }
                    }

                    return undf;
                }

                return storage[name].value;
            },

            /**
             * @method
             * @param {string} name
             * @returns {*}
             */
            remove: function(name) {
                var rec = storage[name];
                if (rec && rec.rewritable === true) {
                    delete storage[name];
                }
                return rec ? rec.value : undf;
            },

            /**
             * @method
             * @param {string} name
             * @returns {boolean}
             */
            exists: function(name) {
                return !!storage[name];
            },

            /**
             * @param {function} fn
             * @param {object} context
             */
            eachEntry: function(fn, context) {
                var k;
                for (k in storage) {
                    fn.call(context, storage[k].value, k);
                }
            },

            /**
             * @method
             */
            destroy: function() {

                var self = this;

                if (self === globalCache) {
                    globalCache = null;
                }

                storage = null;
                cacheRewritable = null;

                self.add = null;
                self.get = null;
                self.destroy = null;
                self.exists = null;
                self.remove = null;
            }
        };
    };

    /**
     * @method
     * @static
     * @returns {Cache}
     */
    Cache.global = function() {

        if (!globalCache) {
            globalCache = new Cache(true);
        }

        return globalCache;
    };

    return Cache;

}();





/**
 * @class Namespace
 * @code ../examples/main.js
 */
var Namespace = function(){


    /**
     * @param {Object} root optional; usually window or global
     * @param {String} rootName optional. If you want custom object to be root and
     * this object itself is the first level of namespace
     * @param {Cache} cache optional
     * @constructor
     */
    var Namespace   = function(root, rootName, cache) {

        cache       = cache || new Cache(false);
        var self    = this,
            rootL   = rootName ? rootName.length : null;

        if (!root) {
            if (typeof global !== strUndef) {
                root    = global;
            }
            else {
                root    = window;
            }
        }

        var normalize   = function(ns) {
            if (ns && rootName && ns.substr(0, rootL) !== rootName) {
                return rootName + "." + ns;
            }
            return ns;
        };

        var parseNs     = function(ns) {

            ns = normalize(ns);

            var tmp     = ns.split("."),
                i,
                last    = tmp.pop(),
                parent  = tmp.join("."),
                len     = tmp.length,
                name,
                current = root;


            if (cache[parent]) {
                return [cache[parent], last, ns];
            }

            if (len > 0) {
                for (i = 0; i < len; i++) {

                    name    = tmp[i];

                    if (rootName && i === 0 && name === rootName) {
                        current = root;
                        continue;
                    }

                    if (current[name] === undf) {
                        current[name]   = {};
                    }

                    current = current[name];
                }
            }

            return [current, last, ns];
        };

        /**
         * Get namespace/cache object
         * @method
         * @param {string} ns
         * @param {bool} cacheOnly
         * @returns {*}
         */
        var get       = function(ns, cacheOnly) {

            ns = normalize(ns);

            if (cache.exists(ns)) {
                return cache.get(ns);
            }

            if (cacheOnly) {
                return undf;
            }

            var tmp     = ns.split("."),
                i,
                len     = tmp.length,
                name,
                current = root;

            for (i = 0; i < len; i++) {

                name    = tmp[i];

                if (rootName && i === 0 && name === rootName) {
                    current = root;
                    continue;
                }

                if (current[name] === undf) {
                    return undf;
                }

                current = current[name];
            }

            if (current) {
                cache.add(ns, current);
            }

            return current;
        };

        /**
         * Register item
         * @method
         * @param {string} ns
         * @param {*} value
         */
        var register    = function(ns, value) {

            var parse   = parseNs(ns),
                parent  = parse[0],
                name    = parse[1];

            if (isObject(parent) && parent[name] === undf) {

                parent[name]        = value;
                cache.add(parse[2], value);
            }

            return value;
        };

        /**
         * Item exists
         * @method
         * @param {string} ns
         * @returns boolean
         */
        var exists      = function(ns) {
            return get(ns, true) !== undf;
        };

        /**
         * Add item only to the cache
         * @function add
         * @param {string} ns
         * @param {*} value
         */
        var add = function(ns, value) {

            ns = normalize(ns);
            cache.add(ns, value);
            return value;
        };

        /**
         * Remove item from cache
         * @method
         * @param {string} ns
         */
        var remove = function(ns) {
            ns = normalize(ns);
            cache.remove(ns);
        };

        /**
         * Make alias in the cache
         * @method
         * @param {string} from
         * @param {string} to
         */
        var makeAlias = function(from, to) {

            from = normalize(from);
            to = normalize(to);

            var value = cache.get(from);

            if (value !== undf) {
                cache.add(to, value);
            }
        };

        /**
         * Destroy namespace and all classes in it
         * @method
         */
        var destroy     = function() {

            var self = this,
                k;

            if (self === globalNs) {
                globalNs = null;
            }

            cache.eachEntry(function(entry){
                if (entry && entry.$destroy) {
                    entry.$destroy();
                }
            });

            cache.destroy();
            cache = null;

            for (k in self) {
                self[k] = null;
            }
        };

        self.register   = register;
        self.exists     = exists;
        self.get        = get;
        self.add        = add;
        self.remove     = remove;
        self.normalize  = normalize;
        self.makeAlias  = makeAlias;
        self.destroy    = destroy;
    };

    Namespace.prototype.register = null;
    Namespace.prototype.exists = null;
    Namespace.prototype.get = null;
    Namespace.prototype.add = null;
    Namespace.prototype.remove = null;
    Namespace.prototype.normalize = null;
    Namespace.prototype.makeAlias = null;
    Namespace.prototype.destroy = null;

    var globalNs;

    /**
     * Get global namespace
     * @method
     * @static
     * @returns {Namespace}
     */
    Namespace.global = function() {
        if (!globalNs) {
            globalNs = new Namespace;
        }
        return globalNs;
    };

    return Namespace;

}();



var slice = Array.prototype.slice;



function isPlainObject(value) {
    // IE < 9 returns [object Object] from toString(htmlElement)
    return typeof value == "object" &&
           varType(value) === 3 &&
            !value.nodeType &&
            value.constructor === Object;

};

function isBool(value) {
    return value === true || value === false;
};




var extend = function(){

    /**
     * @param {Object} dst
     * @param {Object} src
     * @param {Object} src2 ... srcN
     * @param {boolean} override = false
     * @param {boolean} deep = false
     * @returns {object}
     */
    var extend = function extend() {


        var override    = false,
            deep        = false,
            args        = slice.call(arguments),
            dst         = args.shift(),
            src,
            k,
            value;

        if (isBool(args[args.length - 1])) {
            override    = args.pop();
        }
        if (isBool(args[args.length - 1])) {
            deep        = override;
            override    = args.pop();
        }

        while (args.length) {
            // IE < 9 fix: check for hasOwnProperty presence
            if ((src = args.shift()) && src.hasOwnProperty) {
                for (k in src) {

                    if (src.hasOwnProperty(k) && (value = src[k]) !== undf) {

                        if (deep) {
                            if (dst[k] && isPlainObject(dst[k]) && isPlainObject(value)) {
                                extend(dst[k], value, override, deep);
                            }
                            else {
                                if (override === true || dst[k] == undf) { // == checks for null and undefined
                                    if (isPlainObject(value)) {
                                        dst[k] = {};
                                        extend(dst[k], value, override, true);
                                    }
                                    else {
                                        dst[k] = value;
                                    }
                                }
                            }
                        }
                        else {
                            if (override === true || dst[k] == undf) {
                                dst[k] = value;
                            }
                        }
                    }
                }
            }
        }

        return dst;
    };

    return extend;
}();


function emptyFn(){};



var instantiate = function(fn, args) {

    var Temp = function(){},
        inst, ret;

    Temp.prototype  = fn.prototype;
    inst            = new Temp;
    ret             = fn.apply(inst, args);

    // If an object has been returned then return it otherwise
    // return the original instance.
    // (consistent with behaviour of the new operator)
    return isObject(ret) || ret === false ? ret : inst;

};
/**
 * Function interceptor
 * @param {function} origFn
 * @param {function} interceptor
 * @param {object|null} context
 * @param {object|null} origContext
 * @param {string} when
 * @param {bool} replaceValue
 * @returns {Function}
 */
function intercept(origFn, interceptor, context, origContext, when, replaceValue) {

    when = when || "before";

    return function() {

        var intrRes,
            origRes;

        if (when == "instead") {
            return interceptor.apply(context || origContext, arguments);
        }
        else if (when == "before") {
            intrRes = interceptor.apply(context || origContext, arguments);
            origRes = intrRes !== false ? origFn.apply(origContext || context, arguments) : null;
        }
        else {
            origRes = origFn.apply(origContext || context, arguments);
            intrRes = interceptor.apply(context || origContext, arguments);
        }

        return replaceValue ? intrRes : origRes;
    };
};



var Class = function(){


    var proto   = "prototype",

        constr  = "$constructor",

        $constr = function $constr() {
            var self = this;
            if (self.$super && self.$super !== emptyFn) {
                self.$super.apply(self, arguments);
            }
        },

        wrapPrototypeMethod = function wrapPrototypeMethod(parent, k, fn) {

            var $super = parent[proto][k] ||
                        (k === constr ? parent : emptyFn) ||
                        emptyFn;

            return function() {
                var ret,
                    self    = this,
                    prev    = self.$super;

                if (self.$destroyed) {
                    self.$super = null;
                    return null;
                }

                self.$super     = $super;
                ret             = fn.apply(self, arguments);
                self.$super     = prev;

                return ret;
            };
        },

        preparePrototype = function preparePrototype(prototype, cls, parent, onlyWrap) {
            var k, ck, pk, pp = parent[proto];

            for (k in cls) {
                if (cls.hasOwnProperty(k)) {
                    
                    pk = pp[k];
                    ck = cls[k];

                    prototype[k] = isFunction(ck) && (!pk || isFunction(pk)) ?
                                    wrapPrototypeMethod(parent, k, ck) :
                                    ck;
                }
            }

            if (onlyWrap) {
                return;
            }

            prototype.$plugins      = null;
            prototype.$pluginMap    = null;

            if (pp.$beforeInit) {
                prototype.$beforeInit = pp.$beforeInit.slice();
                prototype.$afterInit = pp.$afterInit.slice();
                prototype.$beforeDestroy = pp.$beforeDestroy.slice();
                prototype.$afterDestroy = pp.$afterDestroy.slice();
            }
            else {
                prototype.$beforeInit = [];
                prototype.$afterInit = [];
                prototype.$beforeDestroy = [];
                prototype.$afterDestroy = [];
            }
        },
        
        mixinToPrototype = function(prototype, mixin) {
            
            var k;
            for (k in mixin) {
                if (mixin.hasOwnProperty(k)) {
                    if (k === "$beforeInit") {
                        prototype.$beforeInit.push(mixin[k]);
                    }
                    else if (k === "$afterInit") {
                        prototype.$afterInit.push(mixin[k]);
                    }
                    else if (k === "$beforeDestroy") {
                        prototype.$beforeDestroy.push(mixin[k]);
                    }
                    else if (k === "$afterDestroy") {
                        prototype.$afterDestroy.push(mixin[k]);
                    }
                    else if (!prototype[k]) {
                        prototype[k] = mixin[k];
                    }
                }
            }
        };


    var Class = function(ns){

        if (!ns) {
            ns = new Namespace;
        }

        var createConstructor = function(className) {

            return function() {

                var self    = this,
                    before  = [],
                    after   = [],
                    args    = arguments,
                    newArgs,
                    i, l,
                    plugins, plugin,
                    pmap,
                    plCls;

                if (!self) {
                    throw "Must instantiate via new: " + className;
                }

                self.$plugins   = [];

                newArgs = self[constr].apply(self, arguments);

                if (newArgs && isArray(newArgs)) {
                    args = newArgs;
                }

                plugins = self.$plugins;
                pmap    = self.$pluginMap = {};

                for (i = -1, l = self.$beforeInit.length; ++i < l;
                     before.push([self.$beforeInit[i], self])) {}

                for (i = -1, l = self.$afterInit.length; ++i < l;
                     after.push([self.$afterInit[i], self])) {}

                if (plugins && plugins.length) {

                    for (i = 0, l = plugins.length; i < l; i++) {

                        plugin = plugins[i];

                        if (isString(plugin)) {
                            plCls = plugin;
                            plugin = ns.get(plugin, true);
                            if (!plugin) {
                                throw plCls + " not found";
                            }
                        }

                        plugin = new plugin(self, args);

                        pmap[plugin.$class] = plugin;

                        if (plugin.$beforeHostInit) {
                            before.push([plugin.$beforeHostInit, plugin]);
                        }
                        if (plugin.$afterHostInit) {
                            after.push([plugin.$afterHostInit, plugin]);
                        }

                        plugins[i] = plugin;
                    }
                }

                for (i = -1, l = before.length; ++i < l;
                     before[i][0].apply(before[i][1], args)){}

                if (self.$init) {
                    self.$init.apply(self, args);
                }

                for (i = -1, l = after.length; ++i < l;
                     after[i][0].apply(after[i][1], args)){}

            };
        };


        /**
         * @class BaseClass
         * @description All classes defined with MetaphorJs.Class extend this class.
         * You can access it via <code>cs.BaseClass</code>. Basically,
         * <code>cs.define({});</code> is the same as <code>cs.BaseClass.$extend({})</code>.
         * @constructor
         */
        var BaseClass = function() {

        };

        extend(BaseClass.prototype, {

            $class: null,
            $extends: null,
            $plugins: null,
            $pluginMap: null,
            $mixins: null,

            $destroyed: false,
            $destroying: false,

            $constructor: emptyFn,
            $init: emptyFn,
            $beforeInit: [],
            $afterInit: [],
            $beforeDestroy: [],
            $afterDestroy: [],

            /**
             * Get class name
             * @method
             * @returns {string}
             */
            $getClass: function() {
                return this.$class;
            },

            /**
             * @param {string} cls
             * @returns {boolean}
             */
            $is: function(cls) {
                return isInstanceOf(this, cls);
            },

            /**
             * Get parent class name
             * @method
             * @returns {string | null}
             */
            $getParentClass: function() {
                return this.$extends;
            },

            /**
             * Intercept method
             * @method
             * @param {string} method Intercepted method name
             * @param {function} fn function to call before or after intercepted method
             * @param {object} newContext optional interceptor's "this" object
             * @param {string} when optional, when to call interceptor before | after | instead; default "before"
             * @param {bool} replaceValue optional, return interceptor's return value or original method's; default false
             * @returns {function} original method
             */
            $intercept: function(method, fn, newContext, when, replaceValue) {
                var self = this,
                    orig = self[method];
                self[method] = intercept(orig || emptyFn, fn, newContext || self, self, when, replaceValue);
                return orig || emptyFn;
            },

            /**
             * Implement new methods or properties on instance
             * @param {object} methods
             */
            $implement: function(methods) {
                var $self = this.constructor;
                if ($self && $self.$parent) {
                    preparePrototype(this, methods, $self.$parent, true);
                }
            },

            /**
             * Does this instance have a plugin
             * @param cls
             * @returns {boolean}
             */
            $hasPlugin: function(cls) {
                return !!this.$pluginMap[ns.normalize(cls)];
            },

            /**
             * @param {string} cls
             * @returns {object|null}
             */
            $getPlugin: function(cls) {
                return this.$pluginMap[ns.normalize(cls)] || null;
            },

            /**
             * @param {function} fn
             * @returns {Function}
             */
            $bind: function(fn) {
                var self = this;
                return function() {
                    if (self.$isDestroyed()) {
                        return;
                    }
                    return fn.apply(self, arguments);
                };
            },

            /**
             * @return boolean
             */
            $isDestroyed: function() {
                return self.$destroying || self.$destroyed;
            },

            /**
             * Destroy instance
             * @method
             */
            $destroy: function() {

                var self    = this,
                    before  = self.$beforeDestroy,
                    after   = self.$afterDestroy,
                    plugins = self.$plugins,
                    i, l, res;

                if (self.$destroying || self.$destroyed) {
                    return;
                }

                self.$destroying = true;

                for (i = -1, l = before.length; ++i < l;
                     before[i].apply(self, arguments)){}

                for (i = 0, l = plugins.length; i < l; i++) {
                    if (plugins[i].$beforeHostDestroy) {
                        plugins[i].$beforeHostDestroy.call(plugins[i], arguments);
                    }
                }

                res = self.destroy.apply(self, arguments);

                for (i = -1, l = after.length; ++i < l;
                     after[i].apply(self, arguments)){}

                for (i = 0, l = plugins.length; i < l; i++) {
                    plugins[i].$destroy.apply(plugins[i], arguments);
                }

                if (res !== false) {
                    for (i in self) {
                        if (self.hasOwnProperty(i)) {
                            self[i] = null;
                        }
                    }
                }

                self.$destroying = false;
                self.$destroyed = true;
            },

            destroy: function(){}
        });

        BaseClass.$self = BaseClass;

        /**
         * Create an instance of current class. Same as cs.factory(name)
         * @method
         * @static
         * @code var myObj = My.Class.$instantiate(arg1, arg2, ...);
         * @returns {object} class instance
         */
        BaseClass.$instantiate = function() {

            var cls = this,
                args = arguments,
                cnt = args.length;

            // lets make it ugly, but without creating temprorary classes and leaks.
            // and fallback to normal instantiation.

            switch (cnt) {
                case 0:
                    return new cls;
                case 1:
                    return new cls(args[0]);
                case 2:
                    return new cls(args[0], args[1]);
                case 3:
                    return new cls(args[0], args[1], args[2]);
                case 4:
                    return new cls(args[0], args[1], args[2], args[3]);
                default:
                    return instantiate(cls, args);
            }
        };

        /**
         * Override class methods (on prototype level, not on instance level)
         * @method
         * @static
         * @param {object} methods
         */
        BaseClass.$override = function(methods) {
            var $self = this.$self,
                $parent = this.$parent;

            if ($self && $parent) {
                preparePrototype($self.prototype, methods, $parent);
            }
        };

        /**
         * Create new class based on current one
         * @param {object} definition
         * @param {object} statics
         * @returns {function}
         */
        BaseClass.$extend = function(definition, statics) {
            return defineClass(definition, statics, this);
        };

        /**
         * Destroy class
         * @method
         */
        BaseClass.$destroy = function() {
            var self = this,
                k;

            for (k in self) {
                self[k] = null;
            }
        };

        /**
         * @class Class
         */

        /**
         * @method Class
         * @constructor
         * @param {Namespace} ns optional namespace. See metaphorjs-namespace repository
         */

        /**
         * @method
         * @param {object} definition {
         *  @type {string} $class optional
         *  @type {string} $extends optional
         *  @type {array} $mixins optional
         *  @type {function} $constructor optional
         *  @type {function} $init optional
         *  @type {function} $beforeInit if this is a mixin
         *  @type {function} $afterInit if this is a mixin
         *  @type {function} $beforeHostInit if this is a plugin
         *  @type {function} $afterHostInit if this is a plugin
         *  @type {function} $beforeDestroy if this is a mixin
         *  @type {function} $afterDestroy if this is a mixin
         *  @type {function} $beforeHostDestroy if this is a plugin
         *  @type {function} destroy your own destroy function
         * }
         * @param {object} statics any statis properties or methods
         * @param {string|function} $extends this is a private parameter; use definition.$extends
         * @code var cls = cs.define({$class: "Name"});
         */
        var defineClass = function(definition, statics, $extends) {

            definition          = definition || {};
            
            var name            = definition.$class,
                parentClass     = $extends || definition.$extends,
                mixins          = definition.$mixins,
                alias           = definition.$alias,
                pConstructor,
                i, l, k, noop, prototype, c, mixin;

            if (parentClass) {
                if (isString(parentClass)) {
                    pConstructor = ns.get(parentClass);
                }
                else {
                    pConstructor = parentClass;
                    parentClass = pConstructor.$class || "";
                }
            }
            else {
                pConstructor = BaseClass;
                parentClass = "";
            }

            if (parentClass && !pConstructor) {
                throw parentClass + " not found";
            }

            if (name) {
                name = ns.normalize(name);
            }

            definition.$class   = name;
            definition.$extends = parentClass;
            definition.$mixins  = null;


            noop                = function(){};
            noop[proto]         = pConstructor[proto];
            prototype           = new noop;
            noop                = null;
            definition[constr]  = definition[constr] || $constr;

            preparePrototype(prototype, definition, pConstructor);

            if (mixins) {
                for (i = 0, l = mixins.length; i < l; i++) {
                    mixin = mixins[i];
                    if (isString(mixin)) {
                        mixin = ns.get(mixin, true);
                    }
                    mixinToPrototype(prototype, mixin);
                }
            }

            c = createConstructor(name);
            prototype.constructor = c;
            c[proto] = prototype;

            for (k in BaseClass) {
                if (k !== proto && BaseClass.hasOwnProperty(k)) {
                    c[k] = BaseClass[k];
                }
            }

            for (k in pConstructor) {
                if (k !== proto && pConstructor.hasOwnProperty(k)) {
                    c[k] = pConstructor[k];
                }
            }

            if (statics) {
                for (k in statics) {
                    if (k !== proto && statics.hasOwnProperty(k)) {
                        c[k] = statics[k];
                    }
                }
            }

            c.$parent   = pConstructor;
            c.$self     = c;

            if (name) {
                ns.register(name, c);
            }
            if (alias) {
                ns.register(alias, c);
            }

            return c;
        };




        /**
         * Instantiate class. Pass constructor parameters after "name"
         * @method
         * @code cs.factory("My.Class.Name", arg1, arg2, ...);
         * @param {string} name Full name of the class
         * @returns {object} class instance
         */
        var factory = function(name) {

            var cls     = ns.get(name),
                args    = slice.call(arguments, 1);

            if (!cls) {
                throw name + " not found";
            }

            return cls.$instantiate.apply(cls, args);
        };



        /**
         * Is cmp instance of cls
         * @method
         * @code cs.instanceOf(myObj, "My.Class");
         * @code cs.instanceOf(myObj, My.Class);
         * @param {object} cmp
         * @param {string|object} cls
         * @returns {boolean}
         */
        var isInstanceOf = function(cmp, cls) {
            var _cls    = isString(cls) ? ns.get(cls) : cls;
            return _cls ? cmp instanceof _cls : false;
        };



        /**
         * Is one class subclass of another class
         * @method
         * @code cs.isSubclassOf("My.Subclass", "My.Class");
         * @code cs.isSubclassOf(myObj, "My.Class");
         * @code cs.isSubclassOf("My.Subclass", My.Class);
         * @code cs.isSubclassOf(myObj, My.Class);
         * @param {string|object} childClass
         * @param {string|object} parentClass
         * @return {boolean}
         */
        var isSubclassOf = function(childClass, parentClass) {

            var p   = childClass,
                g   = ns.get;

            if (!isString(parentClass)) {
                parentClass  = parentClass.prototype.$class;
            }
            else {
                parentClass = ns.normalize(parentClass);
            }
            if (isString(childClass)) {
                p   = g(ns.normalize(childClass));
            }

            while (p && p.prototype) {

                if (p.prototype.$class === parentClass) {
                    return true;
                }

                p = p.$parent;
            }

            return false;
        };

        var self    = this;

        self.factory = factory;
        self.isSubclassOf = isSubclassOf;
        self.isInstanceOf = isInstanceOf;
        self.define = defineClass;

        self.destroy = function(){

            if (self === globalCs) {
                globalCs = null;
            }

            BaseClass.$destroy();
            BaseClass = null;

            ns.destroy();
            ns = null;

            Class = null;

        };

        /**
         * @type {BaseClass} BaseClass reference to the BaseClass class
         */
        self.BaseClass = BaseClass;

    };

    Class.prototype = {

        factory: null,
        isSubclassOf: null,
        isInstanceOf: null,
        define: null,
        destroy: null
    };

    var globalCs;

    /**
     * Get default global class manager
     * @method
     * @static
     * @returns {Class}
     */
    Class.global = function() {
        if (!globalCs) {
            globalCs = new Class(Namespace.global());
        }
        return globalCs;
    };

    return Class;

}();




var ns  = new Namespace(MetaphorJs, "MetaphorJs");



var cs = new Class(ns);





var defineClass = cs.define;

function getAttr(el, name) {
    return el.getAttribute ? el.getAttribute(name) : null;
};

/**
 * @param {Function} fn
 * @param {*} context
 */
var bind = Function.prototype.bind ?
              function(fn, context){
                  return fn.bind(context);
              } :
              function(fn, context) {
                  return function() {
                      return fn.apply(context, arguments);
                  };
              };




var nextUid = function(){
    var uid = ['0', '0', '0'];

    // from AngularJs
    /**
     * @returns {String}
     */
    return function nextUid() {
        var index = uid.length;
        var digit;

        while(index) {
            index--;
            digit = uid[index].charCodeAt(0);
            if (digit == 57 /*'9'*/) {
                uid[index] = 'A';
                return uid.join('');
            }
            if (digit == 90  /*'Z'*/) {
                uid[index] = '0';
            } else {
                uid[index] = String.fromCharCode(digit + 1);
                return uid.join('');
            }
        }
        uid.unshift('0');
        return uid.join('');
    };
}();

/**
 * @param {Function} fn
 * @param {Object} context
 * @param {[]} args
 * @param {number} timeout
 */
function async(fn, context, args, timeout) {
    return setTimeout(function(){
        fn.apply(context, args || []);
    }, timeout || 0);
};




var ObservableEvent = (function(){

    /**
     * This class is private - you can't create an event other than via Observable.
     * See {@link class:Observable} reference.
     * @class ObservableEvent
     * @private
     */
    var ObservableEvent = function(name, returnResult, autoTrigger,
                                   triggerFilter, filterContext) {

        var self    = this;

        self.name           = name;
        self.listeners      = [];
        self.map            = {};
        self.hash           = nextUid();
        self.uni            = '$$' + name + '_' + self.hash;
        self.suspended      = false;
        self.lid            = 0;

        if (typeof returnResult === "object" && returnResult !== null) {
            extend(self, returnResult, true, false);
        }
        else {
            // first|last|all
            self.returnResult = returnResult === undf ? null : returnResult;
            self.autoTrigger = autoTrigger;
            self.triggerFilter = triggerFilter;
            self.filterContext = filterContext;
        }
    };


    extend(ObservableEvent.prototype, {

        name: null,
        listeners: null,
        map: null,
        hash: null,
        uni: null,
        suspended: false,
        lid: null,
        returnResult: null,
        autoTrigger: null,
        lastTrigger: null,
        triggerFilter: null,
        filterContext: null,

        /**
         * Get event name
         * @method
         * @returns {string}
         */
        getName: function() {
            return this.name;
        },

        /**
         * @method
         */
        destroy: function() {
            var self        = this,
                k;

            for (k in self) {
                self[k] = null;
            }
        },

        /**
         * @method
         * @param {function} fn Callback function { @required }
         * @param {object} context Function's "this" object
         * @param {object} options See {@link class:Observable.on}
         */
        on: function(fn, context, options) {

            if (!fn) {
                return null;
            }

            context     = context || null;
            options     = options || {};

            var self        = this,
                uni         = self.uni,
                uniContext  = context || fn;

            if (uniContext[uni] && !options.allowDupes) {
                return null;
            }

            var id      = ++self.lid,
                first   = options.first || false;

            uniContext[uni]  = id;


            var e = {
                fn:         fn,
                context:    context,
                uniContext: uniContext,
                id:         id,
                called:     0, // how many times the function was triggered
                limit:      0, // how many times the function is allowed to trigger
                start:      1, // from which attempt it is allowed to trigger the function
                count:      0, // how many attempts to trigger the function was made
                append:     null, // append parameters
                prepend:    null // prepend parameters
            };

            extend(e, options, true, false);

            if (first) {
                self.listeners.unshift(e);
            }
            else {
                self.listeners.push(e);
            }

            self.map[id] = e;

            if (self.autoTrigger && self.lastTrigger && !self.suspended) {
                var prevFilter = self.triggerFilter;
                self.triggerFilter = function(l){
                    if (l.id === id) {
                        return prevFilter ? prevFilter(l) !== false : true;
                    }
                    return false;
                };
                self.trigger.apply(self, self.lastTrigger);
                self.triggerFilter = prevFilter;
            }

            return id;
        },

        /**
         * @method
         * @param {function} fn Callback function { @required }
         * @param {object} context Function's "this" object
         * @param {object} options See {@link class:Observable.on}
         */
        once: function(fn, context, options) {

            options = options || {};
            options.limit = 1;

            return this.on(fn, context, options);
        },

        /**
         * @method
         * @param {function} fn Callback function { @required }
         * @param {object} context Callback context
         */
        un: function(fn, context) {

            var self        = this,
                inx         = -1,
                uni         = self.uni,
                listeners   = self.listeners,
                id;

            if (fn == parseInt(fn)) {
                id      = parseInt(fn);
            }
            else {
                context = context || fn;
                id      = context[uni];
            }

            if (!id) {
                return false;
            }

            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i].id === id) {
                    inx = i;
                    delete listeners[i].uniContext[uni];
                    break;
                }
            }

            if (inx === -1) {
                return false;
            }

            listeners.splice(inx, 1);
            delete self.map[id];
            return true;
        },

        /**
         * @method hasListener
         * @return bool
         */

        /**
         * @method
         * @param {function} fn Callback function { @required }
         * @param {object} context Callback context
         * @return boolean
         */
        hasListener: function(fn, context) {

            var self    = this,
                listeners   = self.listeners,
                id;

            if (fn) {

                context = context || fn;

                if (!isFunction(fn)) {
                    id  = parseInt(fn);
                }
                else {
                    id  = context[self.uni];
                }

                if (!id) {
                    return false;
                }

                for (var i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i].id === id) {
                        return true;
                    }
                }

                return false;
            }
            else {
                return listeners.length > 0;
            }
        },


        /**
         * @method
         */
        removeAllListeners: function() {
            var self    = this,
                listeners = self.listeners,
                uni     = self.uni,
                i, len;

            for (i = 0, len = listeners.length; i < len; i++) {
                delete listeners[i].uniContext[uni];
            }
            self.listeners   = [];
            self.map         = {};
        },

        /**
         * @method
         */
        suspend: function() {
            this.suspended = true;
        },

        /**
         * @method
         */
        resume: function() {
            this.suspended = false;
        },


        _prepareArgs: function(l, triggerArgs) {
            var args;

            if (l.append || l.prepend) {
                args    = slice.call(triggerArgs);
                if (l.prepend) {
                    args    = l.prepend.concat(args);
                }
                if (l.append) {
                    args    = args.concat(l.append);
                }
            }
            else {
                args = triggerArgs;
            }

            return args;
        },

        /**
         * @method
         * @return {*}
         */
        trigger: function() {

            var self            = this,
                listeners       = self.listeners,
                returnResult    = self.returnResult,
                filter          = self.triggerFilter,
                filterContext   = self.filterContext,
                args;

            if (self.suspended) {
                return null;
            }

            if (self.autoTrigger) {
                self.lastTrigger = slice.call(arguments);
            }

            if (listeners.length === 0) {
                return null;
            }

            var ret     = returnResult === "all" || returnResult === "merge" ?
                          [] : null,
                q, l,
                res;



            if (returnResult === "first") {
                q = [listeners[0]];
            }
            else {
                // create a snapshot of listeners list
                q = slice.call(listeners);
            }

            // now if during triggering someone unsubscribes
            // we won't skip any listener due to shifted
            // index
            while (l = q.shift()) {

                // listener may already have unsubscribed
                if (!l || !self.map[l.id]) {
                    continue;
                }

                args = self._prepareArgs(l, arguments);

                if (filter && filter.call(filterContext, l, args, self) === false) {
                    continue;
                }

                if (l.filter && l.filter.apply(l.filterContext || l.context, args) === false) {
                    continue;
                }

                l.count++;

                if (l.count < l.start) {
                    continue;
                }

                if (l.async) {
                    res = null;
                    async(l.fn, l.context, args);
                }
                else {
                    res = l.fn.apply(l.context, args);
                }

                l.called++;

                if (l.called === l.limit) {
                    self.un(l.id);
                }

                if (returnResult === "all") {
                    ret.push(res);
                }
                else if (returnResult === "merge" && res) {
                    ret = ret.concat(res);
                }
                else if (returnResult === "first") {
                    return res;
                }
                else if (returnResult === "nonempty" && res) {
                    return res;
                }
                else if (returnResult === "last") {
                    ret = res;
                }
                else if (returnResult === false && res === false) {
                    return false;
                }
            }

            if (returnResult) {
                return ret;
            }
        }
    }, true, false);


    return ObservableEvent;
}());




var Observable = (function(){


    /**
     * @description A javascript event system implementing two patterns - observable and collector.
     * @description Observable:
     * @code examples/observable.js
     *
     * @description Collector:
     * @code examples/collector.js
     *
     * @class Observable
     * @version 1.2
     * @author Ivan Kuindzhi
     * @link https://github.com/kuindji/metaphorjs-observable
     */
    var Observable = function() {

        this.events = {};

    };


    extend(Observable.prototype, {



        /**
        * You don't have to call this function unless you want to pass params other than event name.
        * Normally, events are created automatically.
        *
        * @method createEvent
        * @access public
        * @param {string} name {
        *       Event name
        *       @required
        * }
        * @param {bool|string} returnResult {
        *   false -- return first 'false' result and stop calling listeners after that<br>
        *   "all" -- return all results as array<br>
        *   "merge" -- merge all results into one array (each result must be array)<br>
        *   "first" -- return result of the first handler (next listener will not be called)<br>
        *   "nonempty" -- return first nonempty result<br>
        *   "last" -- return result of the last handler (all listeners will be called)<br>
        * }
        * @param {bool} autoTrigger {
        *   once triggered, all future subscribers will be automatically called
        *   with last trigger params
        *   @code examples/autoTrigger.js
        * }
        * @param {function} triggerFilter {
        *   This function will be called each time event is triggered. Return false to skip listener.
        *   @code examples/triggerFilter.js
        *   @param {object} listener This object contains all information about the listener, including
        *       all data you provided in options while subscribing to the event.
        *   @param {[]} arguments
        *   @return {bool}
        * }
        * @param {object} filterContext triggerFilter's context
        * @return {ObservableEvent}
        */

        /**
         * @method createEvent
         * @param {string} name
         * @param {object} options {
         *  @type {string} returnResult
         *  @type {bool} autoTrigger
         *  @type {function} triggerFilter
         *  @type {object} filterContext
         * }
         * @returns {ObservableEvent}
         */
        createEvent: function(name, returnResult, autoTrigger, triggerFilter, filterContext) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                events[name] = new ObservableEvent(name, returnResult, autoTrigger, triggerFilter, filterContext);
            }
            return events[name];
        },

        /**
        * @method
        * @access public
        * @param {string} name Event name
        * @return {ObservableEvent|undefined}
        */
        getEvent: function(name) {
            name = name.toLowerCase();
            return this.events[name];
        },

        /**
        * Subscribe to an event or register collector function.
        * @method
        * @access public
        * @param {string} name {
        *       Event name
        *       @required
        * }
        * @param {function} fn {
        *       Callback function
        *       @required
        * }
        * @param {object} context "this" object for the callback function
        * @param {object} options {
        *       You can pass any key-value pairs in this object. All of them will be passed to triggerFilter (if
        *       you're using one).
        *       @type {bool} first {
        *           True to prepend to the list of handlers
        *           @default false
        *       }
        *       @type {number} limit {
        *           Call handler this number of times; 0 for unlimited
        *           @default 0
        *       }
        *       @type {number} start {
        *           Start calling handler after this number of calls. Starts from 1
        *           @default 1
        *       }
         *      @type {[]} append Append parameters
         *      @type {[]} prepend Prepend parameters
         *      @type {bool} allowDupes allow the same handler twice
         *      @type {bool} async run event asynchronously
        * }
        */
        on: function(name, fn, context, options) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                events[name] = new ObservableEvent(name);
            }
            return events[name].on(fn, context, options);
        },

        /**
        * Same as {@link class:Observable.on}, but options.limit is forcefully set to 1.
        * @method
        * @access public
        */
        once: function(name, fn, context, options) {
            options     = options || {};
            options.limit = 1;
            return this.on(name, fn, context, options);
        },


        /**
        * Unsubscribe from an event
        * @method
        * @access public
        * @param {string} name Event name
        * @param {function} fn Event handler
        * @param {object} context If you called on() with context you must call un() with the same context
        */
        un: function(name, fn, context) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                return;
            }
            events[name].un(fn, context);
        },

        /**
         * @method hasListener
         * @access public
         * @return bool
         */

        /**
        * @method hasListener
        * @access public
        * @param {string} name Event name { @required }
        * @return bool
        */

        /**
        * @method
        * @access public
        * @param {string} name Event name { @required }
        * @param {function} fn Callback function { @required }
        * @param {object} context Function's "this" object
        * @return bool
        */
        hasListener: function(name, fn, context) {
            var events = this.events;

            if (name) {
                name = name.toLowerCase();
                if (!events[name]) {
                    return false;
                }
                return fn ? events[name].hasListener(fn, context) : true;
            }
            else {
                for (name in events) {
                    if (events[name].hasListener()) {
                        return true;
                    }
                }
                return false;
            }
        },

        /**
        * @method
        * @access public
        * @param {string} name Event name { @required }
        * @return bool
        */
        hasEvent: function(name) {
            return !!this.events[name];
        },


        /**
        * Remove all listeners from all events
        * @method removeAllListeners
        * @access public
        */

        /**
        * Remove all listeners from specific event
        * @method
        * @access public
        * @param {string} name Event name { @required }
        */
        removeAllListeners: function(name) {
            var events  = this.events;
            if (name) {
                if (!events[name]) {
                    return;
                }
                events[name].removeAllListeners();
            }
            else {
                for (name in events) {
                    events[name].removeAllListeners();
                }
            }
        },

        /**
        * Trigger an event -- call all listeners.
        * @method
        * @access public
        * @param {string} name Event name { @required }
        * @param {*} ... As many other params as needed
        * @return mixed
        */
        trigger: function() {

            var name = arguments[0],
                events  = this.events;

            name = name.toLowerCase();

            if (!events[name]) {
                return null;
            }

            var e = events[name];
            return e.trigger.apply(e, slice.call(arguments, 1));
        },

        /**
        * Suspend an event. Suspended event will not call any listeners on trigger().
        * @method
        * @access public
        * @param {string} name Event name
        */
        suspendEvent: function(name) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                return;
            }
            events[name].suspend();
        },

        /**
        * @method
        * @access public
        */
        suspendAllEvents: function() {
            var events  = this.events;
            for (var name in events) {
                events[name].suspend();
            }
        },

        /**
        * Resume suspended event.
        * @method
        * @access public
        * @param {string} name Event name
        */
        resumeEvent: function(name) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                return;
            }
            events[name].resume();
        },

        /**
        * @method
        * @access public
        */
        resumeAllEvents: function() {
            var events  = this.events;
            for (var name in events) {
                events[name].resume();
            }
        },

        /**
         * @method
         * @access public
         * @param {string} name Event name
         */
        destroyEvent: function(name) {
            var events  = this.events;
            if (events[name]) {
                events[name].removeAllListeners();
                events[name].destroy();
                delete events[name];
            }
        },


        /**
        * Destroy observable
        * @method
        * @md-not-inheritable
        * @access public
        */
        destroy: function() {
            var self    = this,
                events  = self.events;

            for (var i in events) {
                self.destroyEvent(i);
            }

            for (i in self) {
                self[i] = null;
            }
        },

        /**
        * Although all methods are public there is getApi() method that allows you
        * extending your own objects without overriding "destroy" (which you probably have)
        * @code examples/api.js
        * @method
        * @md-not-inheritable
        * @returns object
        */
        getApi: function() {

            var self    = this;

            if (!self.api) {

                var methods = [
                        "createEvent", "getEvent", "on", "un", "once", "hasListener", "removeAllListeners",
                        "trigger", "suspendEvent", "suspendAllEvents", "resumeEvent",
                        "resumeAllEvents", "destroyEvent"
                    ],
                    api = {},
                    name;

                for(var i =- 1, l = methods.length;
                        ++i < l;
                        name = methods[i],
                        api[name] = bind(self[name], self)){}

                self.api = api;
            }

            return self.api;

        }
    }, true, false);


    return Observable;
}());



/**
 * @param {*} list
 * @returns {[]}
 */
function toArray(list) {
    if (list && !list.length != undf && list !== ""+list) {
        for(var a = [], i =- 1, l = list.length>>>0; ++i !== l; a[i] = list[i]){}
        return a;
    }
    else if (list) {
        return [list];
    }
    else {
        return [];
    }
};



/**
 * @function trim
 * @param {String} value
 * @returns {string}
 */
var trim = function() {
    // native trim is way faster: http://jsperf.com/angular-trim-test
    // but IE doesn't have it... :-(
    if (!String.prototype.trim) {
        return function(value) {
            return isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
        };
    }
    return function(value) {
        return isString(value) ? value.trim() : value;
    };
}();

/**
 * @param {string} str
 * @param {string} separator
 * @param {bool} allowEmpty
 * @returns {[]}
 */
var split = function(str, separator, allowEmpty) {

    var l       = str.length,
        sl      = separator.length,
        i       = 0,
        prev    = 0,
        prevChar= "",
        inQDbl  = false,
        inQSng  = false,
        parts   = [],
        esc     = "\\",
        char;

    if (!sl) {
        return [str];
    }

    for (; i < l; i++) {

        char = str.charAt(i);

        if (char == esc) {
            i++;
            continue;
        }

        if (char == '"') {
            inQDbl = !inQDbl;
            continue;
        }
        if (char == "'") {
            inQSng = !inQSng;
            continue;
        }

        if (!inQDbl && !inQSng) {
            if ((sl == 1 && char == separator) ||
                (sl > 1 && str.substring(i, i + sl) == separator)) {

                if (str.substr(i - 1, sl) == separator ||
                    str.substr(i + 1, sl) == separator) {

                    if (!allowEmpty) {
                        i += (sl - 1);
                        continue;
                    }
                }

                parts.push(str.substring(prev, i).replace(esc + separator, separator));
                prev = i + sl;
                i += (sl - 1);
            }
        }

        prevChar = char;
    }

    parts.push(str.substring(prev).replace(esc + separator, separator));

    return parts;
};



function isDate(value) {
    return varType(value) === 10;
};



function isRegExp(value) {
    return varType(value) === 9;
};

function isWindow(obj) {
    return obj === window ||
           (obj && obj.document && obj.location && obj.alert && obj.setInterval);
};



// from Angular

var equals = function(){

    var equals = function equals(o1, o2) {
        if (o1 === o2) return true;
        if (o1 === null || o2 === null) return false;
        if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
        var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
        if (t1 == t2) {
            if (t1 == 'object') {
                if (isArray(o1)) {
                    if (!isArray(o2)) return false;
                    if ((length = o1.length) == o2.length) {
                        for(key=0; key<length; key++) {
                            if (!equals(o1[key], o2[key])) return false;
                        }
                        return true;
                    }
                } else if (isDate(o1)) {
                    return isDate(o2) && o1.getTime() == o2.getTime();
                } else if (isRegExp(o1) && isRegExp(o2)) {
                    return o1.toString() == o2.toString();
                } else {
                    if (isWindow(o1) || isWindow(o2) || isArray(o2)) return false;
                    keySet = {};
                    for(key in o1) {
                        if (key.charAt(0) == '$' || isFunction(o1[key])) {//&& typeof o1[key] == "object") {
                            continue;
                        }
                        //if (isFunction(o1[key])) {
                        //    continue;
                        //}
                        if (!equals(o1[key], o2[key])) {
                            return false;
                        }
                        keySet[key] = true;
                    }
                    for(key in o2) {
                        if (!keySet.hasOwnProperty(key) &&
                            key.charAt(0) != '$' &&
                            o2[key] !== undf &&
                            !isFunction(o2[key])) return false;
                    }
                    return true;
                }
            }
        }
        return false;
    };

    return equals;
}();



var copy = function() {

    var win = typeof window != strUndef ? window : null,
        glob = typeof global != strUndef ? global : null;

    var copy = function copy(source, dest){

        if (win && source === win) {
            throw new Error("Cannot copy window object");
        }
        if (glob && source === glob) {
            throw new Error("Cannot copy global object");
        }

        if (!dest) {
            dest = source;
            if (source) {
                if (isArray(source)) {
                    dest = copy(source, []);
                } else if (isDate(source)) {
                    dest = new Date(source.getTime());
                } else if (isRegExp(source)) {
                    dest = new RegExp(source.source);
                } else if (isPlainObject(source)) {
                    dest = copy(source, {});
                }
            }
        } else {
            if (source === dest) {
                throw new Error("Objects are identical");
            }
            if (isArray(source)) {
                dest.length = 0;
                for ( var i = 0, l = source.length; i < l; i++) {
                    dest.push(copy(source[i]));
                }
            } else {
                var key;
                for (key in dest) {
                    delete dest[key];
                }
                for (key in source) {
                    if (source.hasOwnProperty(key)) {
                        if (key.charAt(0) == '$' || isFunction(source[key])) {
                            dest[key] = source[key];
                        }
                        else {
                            dest[key] = copy(source[key]);
                        }
                    }
                }
            }
        }
        return dest;
    };

    return copy;
}();



function isPrimitive(value) {
    var vt = varType(value);
    return vt < 3 && vt > -1;
};

function returnFalse() {
    return false;
};



function levenshteinArray(from, to) {

    var m = from.length,
        n = to.length,
        D = new Array(m + 1),
        P = new Array(m + 1),
        i, j, c,
        route,
        cost,
        dist,
        ops = 0;

    if (m == n && m == 0) {
        return {
            changes: 0,
            distance: 0,
            prescription: []
        };
    }

    for (i = 0; i <= m; i++) {
        D[i]    = new Array(n + 1);
        P[i]    = new Array(n + 1);
        D[i][0] = i;
        P[i][0] = 'D';
    }
    for (i = 0; i <= n; i++) {
        D[0][i] = i;
        P[0][i] = 'I';
    }

    for (i = 1; i <= m; i++) {
        for (j = 1; j <= n; j++) {
            cost = (!equals(from[i - 1], to[j - 1])) ? 1 : 0;

            if(D[i][j - 1] < D[i - 1][j] && D[i][j - 1] < D[i - 1][j - 1] + cost) {
                //Insert
                D[i][j] = D[i][j - 1] + 1;
                P[i][j] = 'I';
            }
            else if(D[i - 1][j] < D[i - 1][j - 1] + cost) {
                //Delete
                D[i][j] = D[i - 1][j] + 1;
                P[i][j] = 'D';
            }
            else {
                //Replace or noop
                D[i][j] = D[i - 1][j - 1] + cost;
                if (cost == 1) {
                    P[i][j] = 'R';
                }
                else {
                    P[i][j] = '-';
                }
            }
        }
    }

    //Prescription
    route = [];
    i = m;
    j = n;

    do {
        c = P[i][j];
        route.push(c);
        if (c != '-') {
            ops++;
        }
        if(c == 'R' || c == '-') {
            i --;
            j --;
        }
        else if(c == 'D') {
            i --;
        }
        else {
            j --;
        }
    } while((i != 0) || (j != 0));

    dist = D[m][n];

    return {
        changes: ops / route.length,
        distance: dist,
        prescription: route.reverse()
    };
};



var error = (function(){

    var listeners = [];

    var error = function error(e) {

        var i, l;

        for (i = 0, l = listeners.length; i < l; i++) {
            if (listeners[i][0].call(listeners[i][1], e) === false) {
                return;
            }
        }

        var stack = (e ? e.stack : null) || (new Error).stack;

        if (typeof console != strUndef && console.error) {
            //async(function(){
                if (e) {
                    console.error(e);
                }
                if (stack) {
                    console.error(stack);
                }
            //});
        }
        else {
            throw e;
        }
    };

    error.on = function(fn, context) {
        error.un(fn, context);
        listeners.push([fn, context]);
    };

    error.un = function(fn, context) {
        var i, l;
        for (i = 0, l = listeners.length; i < l; i++) {
            if (listeners[i][0] === fn && listeners[i][1] === context) {
                listeners.splice(i, 1);
                break;
            }
        }
    };

    return error;
}());





var functionFactory = function() {

    var REG_REPLACE_EXPR    = /((^|[^a-z0-9_$\]\)'"])|(this))(\.)([^0-9])/ig,
        REG_REPLACER        = "$2____.$5",

        f               = Function,
        fnBodyStart     = 'try {',
        getterBodyEnd   = ';} catch (thrownError) { return undefined; }',
        setterBodyEnd   = ';} catch (thrownError) { return undefined; }',

        getterCache     = {},
        getterCacheCnt  = 0,

        createGetter    = function createGetter(expr, returnAsCode) {

            try {
                if (!getterCache[expr] || returnAsCode) {
                    getterCacheCnt++;

                    var body = "".concat(
                        fnBodyStart,
                        'return ',
                        expr.replace(REG_REPLACE_EXPR, REG_REPLACER),
                        getterBodyEnd
                    );

                    if (returnAsCode) {
                        return "function(____) {" + body + "}";
                    }
                    else {
                        return getterCache[expr] = new f(
                            '____',
                            body
                        );
                    }
                }
                return getterCache[expr];
            }
            catch (thrownError){
                error(thrownError);
                return emptyFn;
            }
        },

        setterCache     = {},
        setterCacheCnt  = 0,

        createSetter    = function createSetter(expr, returnAsCode) {
            try {
                if (!setterCache[expr] || returnAsCode) {
                    setterCacheCnt++;
                    var code = expr.replace(REG_REPLACE_EXPR, REG_REPLACER),
                        body = "".concat(fnBodyStart, code, ' = $$$$', setterBodyEnd);

                    if (returnAsCode) {
                        return "function(____, $$$$) {" + body + "}";
                    }
                    else {
                        return setterCache[expr] = new f(
                            '____',
                            '$$$$',
                            body
                        );
                    }
                }
                return setterCache[expr];
            }
            catch (thrownError) {
                error(thrownError);
                return emptyFn;
            }
        },

        funcCache       = {},
        funcCacheCnt    = 0,

        createFunc      = function createFunc(expr, returnAsCode) {
            try {
                if (!funcCache[expr] || returnAsCode) {
                    funcCacheCnt++;

                    var body = "".concat(
                        fnBodyStart,
                        expr.replace(REG_REPLACE_EXPR, REG_REPLACER),
                        getterBodyEnd
                    );

                    if (returnAsCode) {
                        return "function(____) {" + body + "}";
                    }
                    else {
                        return funcCache[expr] = new f(
                            '____',
                            body
                        );
                    }
                }
                return funcCache[expr];
            }
            catch (thrownError) {
                error(thrownError);
                return emptyFn;
            }
        },

        resetCache = function() {
            getterCacheCnt >= 1000 && (getterCache = {});
            setterCacheCnt >= 1000 && (setterCache = {});
            funcCacheCnt >= 1000 && (funcCache = {});
        };

    return {
        createGetter: createGetter,
        createSetter: createSetter,
        createFunc: createFunc,
        resetCache: resetCache,
        enableResetCacheInterval: function() {
            setTimeout(resetCache, 10000);
        }
    };
}();



var createGetter = functionFactory.createGetter;




var createSetter = functionFactory.createSetter;



var Watchable = function(){

    var isStatic    = function(val) {

            if (!isString(val)) {
                return true;
            }

            var first   = val.substr(0, 1),
                last    = val.length - 1;

            if (first === '"' || first === "'") {
                if (val.indexOf(first, 1) === last) {
                    return val.substring(1, last);
                }
            }

            return false;
        },

        prescription2moves = function(a1, a2, prs, getKey) {

            var newPrs = [],
                i, l, k, action,
                map1 = {},
                prsi,
                a2i,
                index;

            for (i = 0, l = a1.length; i < l; i++) {
                k = getKey(a1[i]);
                if (k) {
                    map1[k] = i;
                }
            }

            a2i = 0;
            var used = {};

            for (prsi = 0, l = prs.length; prsi < l; prsi++) {

                action = prs[prsi];

                if (action === 'D') {
                    continue;
                }

                k = getKey(a2[a2i]);

                if (k !== undf && used[k] !== true && (index = map1[k]) !== undf) {
                    newPrs.push(index);
                    used[k] = true;
                }
                else {
                    newPrs.push(action);
                }
                a2i++;
            }

            return newPrs;
        },


        observable;

    /**
     * @class Watchable
     */

    /**
     * @param {object} dataObj object containing observed property
     * @param {string} code property name or custom code
     * @param {function} fn optional listener
     * @param {object} fnScope optional listener's "this" object
     *  @subparam {*} userData optional data to pass to the listener
     *  @subparam {function} filterLookup
     *  @subparam {*} mock do not calculate real values, use mock instead
     *  @subparam {function} predefined getter fn
     * @param {object} opt
     * @constructor
     */
    var Watchable   = function(dataObj, code, fn, fnScope, opt) {

        if (!observable) {
            observable  = new Observable;
        }

        opt = opt || {};

        var self    = this,
            id      = nextUid(),
            type;

        if (opt.filterLookup) {
            self.filterLookup = opt.filterLookup;
        }

        self.mock = opt.mock;
        self.origCode = code;

        if (opt.mock && code.indexOf(".") === -1) {
            type = "attr";
        }
        else if (code && dataObj) {
            type    = dataObj.hasOwnProperty(code) ? "attr" : "expr";
        }
        else if (code && !dataObj) {
            type = "expr";
        }


        if (fn) {
            observable.on(id, fn, fnScope || this, {
                append: [opt.userData],
                allowDupes: true
            });
        }

        if (type === "expr") {
            code        = self._parsePipes(code, dataObj, true);
            code        = self._parsePipes(code, dataObj, false);

            if (self.inputPipes || self.pipes) {
                code    = normalizeExpr(dataObj, code);
                type    = dataObj.hasOwnProperty(code) ? "attr" : "expr";
            }

            if (self.staticValue = isStatic(code)) {
                type    = "static";
            }
        }

        self.userData   = opt.userData;
        self.code       = code;
        self.id         = id;
        self.type       = type;
        self.obj        = dataObj;

        if (type === "expr") {
            self.getterFn   = opt.getterFn || createGetter(code);
        }

        if (type !== "static" || self.pipes) {
            self.curr = self.curr || self._getValue();
            self.currCopy = isPrimitive(self.curr) ? self.curr : copy(self.curr);
        }
        else {
            self.check = returnFalse;
            self.curr = self.prev = self.staticValue;
        }
    };

    extend(Watchable.prototype, {

        //namespace: null,
        //nsGet: null,

        filterLookup: null,

        staticValue: null,
        origCode: null,
        code: null,
        getterFn: null,
        setterFn: null,
        id: null,
        type: null,
        obj: null,
        itv: null,
        curr: null,
        currCopy: null,
        prev: null,
        unfilteredCopy: null,
        unfiltered: null,
        pipes: null,
        inputPipes: null,
        lastSetValue: null,
        userData: null,
        obsrvDelegate: null,
        obsrvChanged: false,
        forcePipes: false,

        mock: false,

        // means that pipes always return the same output given the same input.
        // if you want to mark pipe as undeterministic - put ? before it
        // {{ .somevalue | ?pipe }}
        // then value will be passed through all pipes on each check.
        deterministic: true,

        getConfig: function() {
            var getterFn = null;
            if (this.type === "expr") {
                getterFn   = createGetter(this.code, true);
            }
            return {
                type: this.type,
                code: this.origCode,
                withoutPipes: this.code,
                getter: getterFn,
                hasPipes: this.pipes !== null,
                hasInputPipes: this.inputPipes !== null
            }
        },

        _indexArrayItems: function(a) {

            var key = '$$' + this.id,
                i, l, item;

            if (a) {
                for (i = 0, l = a.length; i < l; i++) {
                    item = a[i];
                    if (item && !isPrimitive(item) && !item[key]) {
                        item[key] = nextUid();
                    }
                }
            }
        },


        _parsePipes: function(text, dataObj, input) {

            var self        = this,
                separator   = input ? ">>" : "|",
                propName    = input ? "inputPipes" : "pipes",
                cb          = input ? self.onInputParamChange : self.onPipeParamChange;

            if (text.indexOf(separator) === -1) {
                return text;
            }

            var parts   = split(text, separator),
                ret     = input ? parts.pop() : parts.shift(),
                pipes   = [],
                pipe,
                i, l;

            for(i = 0, l = parts.length; i < l; i++) {
                pipe = split(trim(parts[i]), ':');
                self._addPipe(pipes, pipe, dataObj, cb, false);
            }

            if (pipes.length) {
                self[propName] = pipes;
            }

            return trim(ret);
        },

        prependInuptPipe: function() {
            this.inputPipes = this.inputPipes || [];
            this._addPipe(
                this.inputPipes,
                toArray(arguments),
                this.obj,
                this.onInputParamChange,
                true
            );
        },
        addInuptPipe: function() {
            this.inputPipes = this.inputPipes || [];
            this._addPipe(
                this.inputPipes,
                toArray(arguments),
                this.obj,
                this.onInputParamChange,
                false
            );
        },

        addPipe: function() {
            this.pipes = this.pipes || [];
            this._addPipe(
                this.pipes,
                toArray(arguments),
                this.obj,
                this.onPipeParamChange,
                false
            );
        },
        prependPipe: function() {
            this.pipes = this.pipes || [];
            this._addPipe(
                this.pipes,
                toArray(arguments),
                this.obj,
                this.onPipeParamChange,
                true
            );
        },

        _addPipe: function(pipes, pipe, dataObj, onParamChange, prepend) {

            var self    = this,
                name    = pipe.shift(),
                fn      = isFunction(name) ? name : null,
                ws      = [],
                fchar   = fn ? null : name.substr(0,1),
                opt     = {
                    neg: false,
                    dblneg: false,
                    undeterm: false,
                    name: name
                },
                i, l;

            if (!fn) {
                if (name.substr(0, 2) === "!!") {
                    name = name.substr(2);
                    opt.dblneg = true;
                }
                else {
                    if (fchar === "!") {
                        name = name.substr(1);
                        opt.neg = true;
                    }
                    else if (fchar === "?") {
                        name = name.substr(1);
                        opt.undeterm = true;
                    }
                }
            }
            else {
                opt.name = fn.name;
            }

            if (self.mock) {
                fn      = function(){};
            }
            else {
                if (!fn && self.filterLookup) {
                    fn = self.filterLookup(name);
                }
                if (!fn) {
                    fn = (typeof window !== "undefined" ? window[name] : null) || dataObj[name];
                }
            }

            //console.log(!!self.nsGet, name, fn)

            if (isFunction(fn)) {

                for (i = -1, l = pipe.length; ++i < l;
                     ws.push(create(
                         dataObj,
                         pipe[i],
                         onParamChange,
                         self,
                         {
                             filterLookup: self.filterLookup,
                             mock: self.mock
                         }
                     ))) {}

                if (fn.$undeterministic) {
                    opt.undeterm = true;
                }

                pipes[prepend?"unshift":"push"]([fn, pipe, ws, opt]);

                if (opt.undeterm) {
                    self.deterministic = false;
                }
            }
        },

        _getRawValue: function() {
            var self    = this,
                val;

            if (self.mock) {
                return self.mock;
            }

            switch (self.type) {
                case "static":
                    val = self.staticValue;
                    break;

                case "attr":
                    val = self.obj[self.code];
                    break;
                case "expr":
                    val = self.getterFn(self.obj);
                    break;
                case "object":
                    val = self.obj;
                    break;
            }

            if (isArray(val)) {
                if (!self.inputPipes) {
                    self._indexArrayItems(val);
                }
                val = val.slice();
            }

            return val;
        },

        _getValue: function(useUnfiltered) {

            var self    = this,
                val     = useUnfiltered ? self.unfiltered : self._getRawValue();

            self.unfiltered = val;

            if (self.mock) {
                val = self.mock;
            }
            else {
                val = self._runThroughPipes(val, self.pipes);
            }

            return val;
        },


        _runThroughPipes: function(val, pipes) {

            if (pipes) {
                var j,
                    args,
                    exprs,
                    self    = this,
                    jlen    = pipes.length,
                    dataObj = self.obj,
                    opt,
                    z, zl;

                for (j = 0; j < jlen; j++) {
                    exprs   = pipes[j][1];
                    opt     = pipes[j][3];
                    args    = [];
                    for (z = -1, zl = exprs.length; ++z < zl;
                         args.push(evaluate(exprs[z], dataObj))){}

                    args.unshift(dataObj);
                    args.unshift(val);

                    val     = pipes[j][0].apply(null, args);

                    if (opt.neg) {
                        val = !val;
                    }
                    else if (opt.dblneg) {
                        val = !!val;
                    }
                }
            }

            return val;
        },

        /**
         * Subscribe to the change event
         * @method
         * @param {function} fn listener
         * @param {object} fnScope listener's "this" object
         * @param {object} options see Observable's options in on()
         */
        subscribe: function(fn, fnScope, options) {
            observable.on(this.id, fn, fnScope, options);
        },

        /**
         * Unsubscribe from change event
         * @param {function} fn
         * @param {object} fnScope
         * @returns {*}
         */
        unsubscribe: function(fn, fnScope) {
            return observable.un(this.id, fn, fnScope);
        },

        /**
         * @returns {boolean}
         */
        hasPipes: function() {
            return this.pipes !== null;
        },

        /**
         * @returns {boolean}
         */
        hasInputPipes: function() {
            return this.inputPipes != null;
        },

        /**
         * @param {function|string} p
         * @returns {boolean}
         */
        hasPipe: function(p) {
            return this._hasPipe(this.pipes, p);
        },

        /**
         * @param {function|string} p
         * @returns {boolean}
         */
        hasInputPipe: function(p) {
            return this._hasPipe(this.inputPipes, p);
        },

        /**
         * @param {array} pipes
         * @param {function|string} p
         * @returns {boolean}
         */
        _hasPipe: function(pipes, p) {
            if (!pipes) {
                return false;
            }
            var i, l, name;
            name = isFunction(p) ? p.name : p;
            for (i = 0, l = pipes.length; i < l; i++) {
                if (pipes[i][3].name === name) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Get current value (filtered and via executing the code)
         * @returns {*}
         */
        getValue: function() {
            return this._getValue();
        },

        /**
         * Get last calculated value before filters were applied
         * @returns {*}
         */
        getUnfilteredValue: function() {
            return this.unfiltered || this.curr;
        },

        /**
         * Get previous value
         * @returns {*}
         */
        getPrevValue: function() {
            return this.prev;
        },

        /**
         * Get last calculated value (with filters and pipes)
         * @returns {*}
         */
        getLastValue: function() {
            return this.curr;
        },

        /**
         * Get simple array change prescription
         * @param {[]} from optional
         * @param {[]} to optional
         * @returns {[]}
         */
        getPrescription: function(from, to) {
            to = to || this._getValue();
            return levenshteinArray(from || [], to || []).prescription;
        },

        /**
         * Get array change prescription with moves
         * @param {[]} from
         * @param {function} trackByFn
         * @param {[]} to
         * @returns {[]}
         */
        getMovePrescription: function(from, trackByFn, to) {

            var self    = this;
                to      = to || self._getValue();

            return prescription2moves(
                from || [],
                to || [],
                self.getPrescription(from || [], to || []),
                trackByFn
            );
        },

        /**
         * Set value to observed property
         * @param {*} val
         */
        setValue: function(val) {

            var self    = this,
                type    = self.type;

            self.lastSetValue = val;

            val = self._runThroughPipes(val, self.inputPipes);

            if (type === "attr") {
                self.obj[self.code] = val;
            }
            else if (type === "expr") {

                if (!self.setterFn) {
                    self.setterFn   = createSetter(self.code);
                }

                self.setterFn(self.obj, val);
            }
            else if (type === "object") {
                self.obj = val;
            }
        },

        onInputParamChange: function(val, prev, async) {
            this.setValue(this.lastSetValue);
            if (async) {
                this.checkAll();
            }
        },

        onPipeParamChange: function(val, prev, async) {
            this.forcePipes = true;
            this.check();
            this.forcePipes = false;
        },

        /*onObserverChange: function(changes) {

            var self = this,
                code = self.code,
                i, l,
                change;

            for (i = 0, l = changes.length; i < l; i++) {
                change = changes[i];
                if (change.name == code) {
                    self.obsrvChanged = true;
                    break;
                }
            }
        },*/

        _check: function(async) {

            var self    = this,
                val;

            if (self.deterministic && self.pipes && !self.forcePipes) {
                if (!self._checkUnfiltered()) {
                    return false;
                }
                else {
                    // code smell.
                    // useUnfiltered param implies that
                    // _checkUnfiltered has been called.
                    val = self._getValue(true);
                }
            }
            else {
                val     = self._getValue();
            }

            var curr    = self.currCopy,
                eq      = equals(curr, val);

            //if (self.obsrvDelegate) {
            //    eq      = !self.obsrvChanged;
            //}
            //else {
            //    eq      = equals(curr, val);
            //}

            if (!eq) {
                self.curr = val;
                self.prev = curr;
                self.currCopy = isPrimitive(val) ? val : copy(val);
                //self.obsrvChanged = false;
                observable.trigger(self.id, val, curr, async);
                return true;
            }

            return false;
        },

        _checkUnfiltered: function() {

            var self    = this,
                val     = self._getRawValue(),
                curr    = self.unfilteredCopy,
                eq      = equals(curr, val);

            if (!eq) {
                self.unfiltered = val;
                self.unfilteredCopy = isPrimitive(val) ? val : copy(val);
                return true;
            }

            return false;
        },

        /**
         * Check for changes
         * @param {bool} async
         * @returns {bool}
         */
        check: function(async) {
            return this._check(async);
        },

        /**
         * Check all observed properties for changes
         * @returns {bool}
         */
        checkAll: function() {
            return this.obj.$$watchers.$checkAll();
        },

        /**
         * Get last calculated value (with filters and pipes)
         * @returns {*}
         */
        getLastResult: function() {
            return this.curr;
        },

        /**
         * Set time interval to check for changes periodically
         * @param {number} ms
         */
        setInterval: function(ms) {

            var self    = this;
            if (self.itv) {
                self.clearInterval();
            }
            self.itv = setInterval(function(){self.check();}, ms);
        },

        /**
         * Clear check interval
         * @method
         */
        clearInterval: function() {
            var self    = this;
            if (self.itv) {
                clearInterval(self.itv);
                self.itv = null;
            }
        },

        /**
         * Unsubscribe and destroy if there are no other listeners
         * @param {function} fn
         * @param {object} fnScope
         * @returns {boolean} true if destroyed
         */
        unsubscribeAndDestroy: function(fn, fnScope) {

            var self    = this,
                id      = self.id;
            
            if (!id) {
                return false;
            }

            if (fn) {
                observable.un(id, fn, fnScope);
            }

            if (!observable.hasListener(id)) {
                self.destroy();
                return true;
            }

            return false;
        },

        /**
         * @method
         */
        destroy: function() {

            var self    = this,
                pipes   = self.pipes,
                ipipes  = self.inputPipes,
                i, il,
                j, jl,
                ws;

            if (self.itv) {
                self.clearInterval();
            }

            if (pipes) {
                for (i = -1, il = pipes.length; ++i < il;) {
                    ws = pipes[i][2];
                    for (j = -1, jl = ws.length; ++j < jl;) {
                        ws[j].unsubscribeAndDestroy(self.check, self);
                    }
                }
            }
            if (ipipes) {
                for (i = -1, il = ipipes.length; ++i < il;) {
                    ws = ipipes[i][2];
                    for (j = -1, jl = ws.length; ++j < jl;) {
                        ws[j].unsubscribeAndDestroy(self.onInputParamChange, self);
                    }
                }
            }

            //if (self.obsrvDelegate) {
            //    Object.unobserve(self.obj, self.obsrvDelegate);
            //}

            if (self.obj) {
                //delete self.obj.$$watchers.$codes[self.origCode];
                self.obj.$$watchers.$codes[self.origCode] = null;
            }

            observable.destroyEvent(self.id);

            for (i in self) {
                if (self.hasOwnProperty(i)){
                    self[i] = null;
                }
            }
        }
    }, true, false);


    /**
     * @method
     * @static
     * @param {object} obj
     * @param {string} code
     * @param {function} fn
     * @param {object} fnScope
     * @param {object} opt
     * @returns {Watchable}
     */
    var create = function(obj, code, fn, fnScope, opt) {

            opt = opt || {};
            code = code || "";

            code = normalizeExpr(obj, trim(code), opt.mock);

            if (obj) {
                if (!obj.$$watchers) {
                    obj.$$watchers = {
                        $codes: {},
                        $checkAll: function() {

                            var ws      = this.$codes,
                                i,
                                changes = 0;

                            for (i in ws) {

                                if (ws[i] && ws[i].check()) {
                                    changes++;
                                }
                            }

                            return changes;
                        },
                        $destroyAll: function() {

                            var ws      = this.$codes,
                                i;

                            for (i in ws) {
                                if (ws[i]) {
                                    ws[i].destroy();
                                    //delete ws[i];
                                    ws[i] = null;
                                }
                            }
                        }
                    };
                }

                if (obj.$$watchers.$codes[code]) {
                    obj.$$watchers.$codes[code].subscribe(fn, fnScope,
                        {append: [opt.userData || null], allowDupes: true});
                }
                else {
                    obj.$$watchers.$codes[code] = new Watchable(
                        obj, code, fn, fnScope, opt);
                }

                return obj.$$watchers.$codes[code];
            }
            else {
                return new Watchable(obj, code, fn, fnScope, opt);
            }
        },

        /**
         * @method
         * @static
         * @param {object} obj
         * @param {string} code
         * @param {function} fn
         * @param {object} fnScope
         */
        unsubscribeAndDestroy = function(obj, code, fn, fnScope) {
            code = trim(code);

            var ws = obj.$$watchers ? obj.$$watchers.$codes : null;

            if (ws && ws[code] && ws[code].unsubscribeAndDestroy(fn, fnScope)) {
                //delete ws[code];
                ws[code] = null;
            }
        },

        /**
         * Normalize expression
         * @param {object} dataObj
         * @param {string} expr
         * @param {*} mockMode
         * @returns {string}
         */
        normalizeExpr = function(dataObj, expr, mockMode) {

            if (expr.substr(0, 2) === '{{') {
                expr = expr.substring(2, expr.length - 2);
            }

            // in mock mode we can't check dataObj for having
            // a property. dataObj does not exists in this
            // context
            if (mockMode) {
                var match;
                if ((match = expr.match(/(^|this)\.([A-Z0-9_$]+)$/i)) !== null) {
                    return match[2];
                }
                else {
                    return expr;
                }
            }

            if (dataObj && expr) {
                if (dataObj.hasOwnProperty(expr)) {
                    return expr;
                }
                var prop;
                if (expr.charAt(0) === '.') {
                    prop = expr.substr(1);
                    if (dataObj.hasOwnProperty(prop)) {
                        return prop;
                    }
                }
                else if (expr.substr(0, 5) === "this.") {
                    prop = expr.substr(5);
                    if (dataObj.hasOwnProperty(prop)) {
                        return prop;
                    }
                }
            }
            return expr;
        },

        /**
         * Evaluate code against object
         * @param {string} expr
         * @param {object} scope
         * @param {object} opt
         * @returns {*}
         */
        evaluate    = function(expr, scope, opt) {
            var val;
            if (val = isStatic(expr)) {
                return val;
            }
            if (expr.indexOf('|') === -1) {
                return createGetter(expr)(scope);
            }
            var w = create(scope, expr, null, null, opt),
                v = w.getValue();
            w.unsubscribeAndDestroy();
            return v;
        };



    Watchable.create = create;
    Watchable.unsubscribeAndDestroy = unsubscribeAndDestroy;
    Watchable.normalizeExpr = normalizeExpr;
    Watchable.eval = evaluate;

    return Watchable;
}();






var createFunc = functionFactory.createFunc;



var Scope = function(cfg) {
    var self    = this;

    self.$$observable    = new Observable;
    self.$$historyWatchers  = {};
    extend(self, cfg, true, false);

    if (self.$parent) {
        self.$parent.$on("check", self.$$onParentCheck, self);
        self.$parent.$on("destroy", self.$$onParentDestroy, self);
        self.$parent.$on("freeze", self.$freeze, self);
        self.$parent.$on("unfreeze", self.$unfreeze, self);
    }
    else {
        self.$root  = self;
        self.$isRoot= true;
    }
};

extend(Scope.prototype, {

    $app: null,
    $parent: null,
    $root: null,
    $isRoot: false,
    $level: 0,
    $static: false,
    $$frozen: false,
    $$observable: null,
    $$watchers: null,
    $$historyWatchers: null,
    $$checking: false,
    $$destroyed: false,
    $$changing: false,

    $$tmt: null,

    $new: function(data) {
        var self = this;
        return new Scope(extend({}, data, {
            $parent: self,
            $root: self.$root,
            $app: self.$app,
            $level: self.$level + 1,
            $static: self.$static
        }, true, false));
    },

    $newIsolated: function() {
        return new Scope({
            $app: this.$app,
            $level: self.$level + 1,
            $static: this.$static
        });
    },

    $freeze: function() {
        var self = this;
        if (!self.$$frozen) {
            self.$$frozen = true;
            self.$$observable.trigger("freeze", self);
        }
    },

    $unfreeze: function() {
        var self = this;
        if (self.$$frozen) {
            self.$$frozen = false;
            self.$$observable.trigger("unfreeze", self);
        }
    },

    $on: function(event, fn, fnScope) {
        return this.$$observable.on(event, fn, fnScope);
    },

    $un: function(event, fn, fnScope) {
        return this.$$observable.un(event, fn, fnScope);
    },

    $watch: function(expr, fn, fnScope) {
        return Watchable.create(this, expr, fn, fnScope);
    },

    $unwatch: function(expr, fn, fnScope) {
        return Watchable.unsubscribeAndDestroy(this, expr, fn, fnScope);
    },

    $createGetter: function(expr) {
        var self    = this,
            getter  = createGetter(expr);
        return function() {
            return getter(self);
        };
    },

    $createSetter: function(expr) {
        var self    = this,
            setter  = createSetter(expr);
        return function(value) {
            return setter(value, self);
        };
    },

    $createFunc: function(expr) {
        var self    = this,
            fn      = createFunc(expr);
        return function() {
            return fn(self);
        };
    },

    $watchHistory: function(prop, param) {
        var self = this;
        if (!self.$$historyWatchers[param]) {
            self.$$historyWatchers[param] = prop;
            MetaphorJs.history.on("change-" + param, self.$$onHistoryChange, self);
        }
    },

    $unwatchHistory: function(param) {
        var self = this;
        if (!self.$$historyWatchers[param]) {
            delete self.$$historyWatchers[param];
            MetaphorJs.history.un("change-" + param, self.$$onHistoryChange, self);
        }
    },

    $wrap: function(fn, context) {
        var self = this,
            name;

        if (typeof fn === "string") {
            name = fn;
            fn = context[name];
        }

        var wrapper = function() {
            var res = fn.apply(context, arguments);
            self.$check();
            return res;
        };

        if (name) {
            context[name] = wrapper;
        }

        return wrapper;
    },

    $get: function(key) {

        var s = this;

        while (s) {
            if (s[key] !== undf) {
                return s[key];
            }
            s = s.$parent;
        }

        return undf;
    },

    $set: function(key, value) {
        var self = this;
        if (typeof key === "string") {
            this[key] = value;
        }
        else {
            for (var k in key) {
                self[k] = key[k];
            }
        }
        this.$check();
    },

    $$onParentDestroy: function() {
        this.$destroy();
    },

    $$onParentCheck: function() {
        this.$check();
    },

    $$onHistoryChange: function(val, prev, name) {
        var self = this,
            prop;
        if (self.$$historyWatchers[name]) {
            prop = self.$$historyWatchers[name];
            self[prop] = val;
            self.$check();
        }
    },

    $scheduleCheck: function(timeout) {
        var self = this;
        if (!self.$$tmt) {
            self.$tmt = async(self.$check, self, null, timeout);
        }
    },

    $check: function() {
        var self = this,
            changes;

        if (self.$$checking || self.$static || self.$$frozen) {
            return;
        }
        self.$$checking = true;

        if (self.$$tmt) {
            clearTimeout(self.$$tmt);
            self.$$tmt = null;
        }

        if (self.$$watchers) {
            changes = self.$$watchers.$checkAll();
        }

        self.$$checking = false;

        if (!self.$$destroyed) {
            self.$$observable.trigger("check", changes);
        }

        if (changes > 0) {
            self.$$changing = true;
            self.$check();
        }
        else {
            // finished changing after all iterations
            if (self.$$changing) {
                self.$$changing = false;
                self.$$observable.trigger("changed");
            }
        }
    },

    $reset: function(resetVars) {
        var self = this;
        self.$$observable.trigger("reset");
    },

    $destroy: function() {

        var self    = this,
            param, i;

        if (self.$$destroyed) {
            return;
        }

        self.$$destroyed = true;
        self.$$observable.trigger("destroy");
        self.$$observable.destroy();

        if (self.$parent && self.$parent.$un) {
            self.$parent.$un("check", self.$$onParentCheck, self);
            self.$parent.$un("destroy", self.$$onParentDestroy, self);
            self.$parent.$un("freeze", self.$freeze, self);
            self.$parent.$un("unfreeze", self.$unfreeze, self);
        }

        if (self.$$watchers) {
            self.$$watchers.$destroyAll();
        }

        for (param in self.$$historyWatchers) {
            self.$unwatchHistory(param);
        }

        for (i in self) {
            if (self.hasOwnProperty(i)) {
                self[i] = null;
            }
        }

        self.$$destroyed = true;
    }

}, true, false);






/**
 * Returns 'then' function or false
 * @param {*} any
 * @returns {Function|boolean}
 */
function isThenable(any) {

    // any.then must only be accessed once
    // this is a promise/a+ requirement

    if (!any) { //  || !any.then
        return false;
    }
    var then, t;

    //if (!any || (!isObject(any) && !isFunction(any))) {
    if (((t = typeof any) != "object" && t != "function")) {
        return false;
    }
    return isFunction((then = any.then)) ?
           then : false;
};




var createWatchable = Watchable.create;



var nsGet = ns.get;



var filterLookup = function(name) {
    return nsGet("filter." + name, true);
};



var nsAdd = ns.add;





var Directive = function(){

    var attributes          = [],
        attributesSorted    = false,

        compare             = function(a, b) {
            //if (a is less than b by some ordering criterion)
            if (a.priority < b.priority) {
                return -1;
            }

            //if (a is greater than b by the ordering criterion)
            if (a.priority > b.priority) {
                return 1;
            }

            // a must be equal to b
            return 0;
        },

        commentHolders      = function(node, name) {

            name = name || "";

            var before = window.document.createComment(name + " - start"),
                after = window.document.createComment(name + " - end"),
                parent = node.parentNode;

            parent.insertBefore(before, node);

            if (node.nextSibling) {
                parent.insertBefore(after, node.nextSibling);
            }
            else {
                parent.appendChild(after);
            }

            return [before, after];
        };

    return defineClass({

        $class: "Directive",

        watcher: null,
        stateFn: null,
        scope: null,
        node: null,
        expr: null,
        mods: null,

        autoOnChange: true,

        $init: function(scope, node, expr, renderer, attr) {

            var self        = this,
                config      = attr ? attr.config : {},
                val;

            expr            = trim(expr);

            self.node       = node;
            self.expr       = expr;
            self.scope      = scope;
            self.saveState  = config.saveState;
            self.watcher    = createWatchable(scope, expr, self.onChange, self, {filterLookup: filterLookup});

            if (self.saveState) {
                self.stateFn = createSetter(self.saveState);
            }

            if (self.autoOnChange && (val = self.watcher.getLastResult()) !== undf) {
                self.onChange(val, undf);
            }

            scope.$on("destroy", self.onScopeDestroy, self);
            scope.$on("reset", self.onScopeReset, self);
        },

        getChildren: function() {
            return null;
        },

        createCommentHolders: function(node, name) {
            var cmts = commentHolders(node, name || this.$class);
            this.prevEl = cmts[0];
            this.nextEl = cmts[1];
        },

        onScopeDestroy: function() {
            this.$destroy();
        },

        onScopeReset: function() {

        },

        onChange: function(val) {
            this.saveStateOnChange(val);
        },

        saveStateOnChange: function(val) {
            if (this.stateFn) {
                this.stateFn(this.scope, val);
            }
        },

        destroy: function() {
            var self    = this;

            if (self.scope) {
                self.scope.$un("destroy", self.onScopeDestroy, self);
                self.scope.$un("reset", self.onScopeReset, self);
            }

            if (self.watcher) {
                self.watcher.unsubscribeAndDestroy(self.onChange, self);
            }

            if (self.prevEl) {
                self.prevEl.parentNode.removeChild(self.prevEl);
            }
            if (self.nextEl) {
                self.nextEl.parentNode.removeChild(self.nextEl);
            }

            self.$super();
        }
    }, {

        getDirective: function(type, name) {
            return nsGet("directive." + type +"."+ name, true);
        },

        registerAttribute: function registerAttribute(name, priority, handler) {
            if (!nsGet("directive.attr." + name, true)) {
                attributes.push({
                    priority: priority,
                    name: name,
                    handler: nsAdd("directive.attr." + name, handler)
                });
                attributesSorted = false;
            }
        },

        getAttributes: function getAttributes() {
            if (!attributesSorted) {
                attributes.sort(compare);
                attributesSorted = true;
            }
            return attributes;
        },

        registerTag: function registerTag(name, handler) {
            if (!nsGet("directive.tag." + name, true)) {
                nsAdd("directive.tag." + name, handler)
            }
        },

        // components are case sensitive
        registerComponent: function(name, cmp) {
            if (!cmp) {
                cmp = name;
            }
            if (isString(cmp)) {
                cmp = nsGet(cmp, true);
            }
            if (!nsGet("directive.component." + name, true)) {
                nsAdd("directive.component." + name.toLowerCase(), cmp)
            }
        },

        commentHolders: commentHolders
    });

}();




function isNull(value) {
    return value === null;
};





var TextRenderer = function(){

    var startSymbol             = '{{',
        endSymbol               = '}}',
        startSymbolLength       = 2,
        endSymbolLength         = 2,

        savedBoundary           = '--##--',

        rReplaceEscape          = /\\{/g,

        observer                = new Observable,

        //parent, userData, recursive
        factory                 = function(scope, origin, opt) {

            if (!origin || !origin.indexOf ||
                (origin.indexOf(startSymbol) === -1 &&
                 origin.indexOf(savedBoundary) === -1)) {

                if (opt.force) {
                    return new TextRenderer(
                        scope,
                        startSymbol + origin + endSymbol,
                        opt
                    );
                }

                return null;
            }

            return new TextRenderer(scope, origin, opt);
        };

    var TextRenderer = defineClass({

        $class: "TextRenderer",

        id: null,
        parent: null,
        isRoot: null,
        scope: null,
        origin: "",
        processed: null,
        text: null,
        watchers: null,
        children: null,
        data: null,
        recursive: false,
        dataChangeDelegate: null,
        changeTmt: null,
        lang: null,
        boundary: null,
        mock: null,

        //parent, userData, recursive, boundary, mock
        $init: function(scope, origin, opt) {

            opt = opt || {};

            var self        = this;

            self.id         = nextUid();
            self.origin     = origin;
            self.scope      = scope;
            self.parent     = opt.parent;
            self.isRoot     = !opt.parent;
            self.data       = opt.userData;
            self.lang       = scope.$app ? scope.$app.lang : null;
            self.boundary   = opt.boundary || "---";
            self.mock       = opt.mock;

            if (opt.recursive === true || opt.recursive === false) {
                self.recursive = opt.recursive;
            }

            self.watchers   = [];
            self.children   = [];

            self.dataChangeDelegate = bind(self.doDataChange, self);
            self.processed  = self.processText(origin, self.mock);
            self.render();
        },

        subscribe: function(fn, context) {
            return observer.on(this.id, fn, context);
        },

        unsubscribe: function(fn, context) {
            return observer.un(this.id, fn, context);
        },

        getString: function() {
            var self = this;

            if (isNull(self.text)) {
                self.render();
            }

            var text = self.text || "";

            if (text.indexOf('\\{') !== -1) {
                return text.replace(rReplaceEscape, '{');
            }

            return text;
        },


        render: function() {

            var self    = this,
                text    = self.processed,
                b       = self.boundary,
                i, l,
                str,
                ch;

            if (!self.children.length) {
                self.createChildren();
            }

            ch = self.children;

            for (i = -1, l = ch.length; ++i < l;) {
                str = ch[i] instanceof TextRenderer ? ch[i].getString() : ch[i];
                text = text.replace(
                    b + i + b,
                    str === null ? "" : str
                );
            }

            self.text = text;

            return text;
        },



        processText: function(text, mock) {

            /*
             arguably, str += "" is faster than separators.push() + separators.join()
             well, at least in my Firefox it is so.
             */

            var self        = this,
                index       = 0,
                textLength  = text.length,
                startIndex,
                endIndex,
                result      = "";

            while(index < textLength) {
                if (((startIndex = text.indexOf(startSymbol, index)) !== -1) &&
                    ((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) !== -1) &&
                    text.substr(startIndex - 1, 1) !== '\\') {

                    result += text.substring(index, startIndex);

                    if (endIndex !== startIndex + startSymbolLength) {
                        result += self.watcherMatch(
                            text.substring(startIndex + startSymbolLength, endIndex),
                            mock
                        );
                    }

                    index = endIndex + endSymbolLength;

                } else {
                    // we did not find an interpolation
                    if (index !== textLength) {
                        result += text.substring(index);
                    }
                    break;
                }
            }


            //saved keys
            /*index       = 0;
            text        = result;
            textLength  = text.length;
            result      = "";
            var bndLen      = savedBoundary.length,
                getterid;

            while(index < textLength) {
                if (((startIndex = text.indexOf(savedBoundary, index)) !== -1) &&
                    (endIndex = text.indexOf(savedBoundary, startIndex + bndLen)) !== -1) {

                    result += text.substring(index, startIndex);

                    getterid    = text.substring(startIndex, endIndex + bndLen);
                    getterid    = getterid.replace(savedBoundary, "");
                    getterid    = parseInt(getterid);

                    result += self.watcherMatch(
                        getterid,
                        mock
                    );

                    index = endIndex + bndLen;
                } else {
                    // we did not find an interpolation
                    if (index !== textLength) {
                        result += text.substring(index);
                    }
                    break;
                }
            }*/

            return result;
        },

        watcherMatch: function(expr, mock) {

            var self        = this,
                ws          = self.watchers,
                b           = self.boundary,
                w,
                isLang      = false,
                recursive   = self.recursive,
                getter      = null;

            expr        = trim(expr);

            if (expr.substr(0,1) === '-') {
                var inx = expr.indexOf(" "),
                    mods = expr.substr(1,inx);
                expr = expr.substr(inx);

                if (!recursive && mods.indexOf("r") !== -1) {
                    recursive = true;
                }
                if (mods.indexOf("l") !== -1) {
                    isLang = true;
                }
            }

            /*if (typeof expr === "number") {
                var getterId = expr;
                if (typeof __MetaphorJsPrebuilt !== "undefined") {
                    expr = __MetaphorJsPrebuilt['__tpl_getter_codes'][getterId];
                    getter = __MetaphorJsPrebuilt['__tpl_getters'][getterId];
                }
                else {
                    return "";
                }
            }*/

            w = createWatchable(
                self.scope,
                expr,
                self.onDataChange,
                self,
                {
                    filterLookup: filterLookup, mock: mock, getterFn: getter,
                    userData: {
                        recursive: recursive
                    }
                }
            );

            if (isLang && !w.hasPipe("l")) {
                w.addPipe("l");
            }

            ws.push(w);

            return b + (ws.length-1) + b;
        },

        onDataChange: function() {

            var self    = this;

            if (!self.changeTmt) {
                self.changeTmt = setTimeout(self.dataChangeDelegate, 0);
            }
        },

        doDataChange: function() {
            var self = this;
            self.destroyChildren();
            self.triggerChange();
            self.changeTmt = null;
        },

        triggerChange: function() {

            var self    = this;
            self.text   = null;

            if (self.isRoot) {
                observer.trigger(self.id, self, self.data);
            }
            else {
                self.parent.triggerChange();
            }
        },


        createChildren: function() {

            var self    = this,
                ws      = self.watchers,
                ch      = self.children,
                scope   = self.scope,
                rec     = false,
                i, l,
                val;

            for (i = -1, l = ws.length; ++i < l; ){
                val     = ws[i].getLastResult();

                //TODO: watcher must have userData!
                // if it doesn't, it was taken from cache and it is wrong
                // because -rl flags may be different
                rec     = self.recursive || (ws[i].userData && ws[i].userData.recursive);
                if (val === undf) {
                    val = "";
                }
                ch.push((rec && factory(scope, val, {parent: self, recursive: true})) || val);
            }
        },

        destroyChildren: function() {

            var self    = this,
                ch      = self.children,
                i, l;

            for (i = -1, l = ch.length; ++i < l; ){
                if (ch[i] instanceof TextRenderer) {
                    ch[i].$destroy();
                }
            }

            self.children = [];
        },

        destroyWatchers: function() {

            var self    = this,
                ws      = self.watchers,
                i, l;

            for (i = -1, l = ws.length; ++i < l;
                 ws[i].unsubscribeAndDestroy(self.onDataChange, self)){}

            self.watchers = [];
        },

        destroy: function() {

            var self = this;

            self.destroyChildren();
            self.destroyWatchers();

            observer.destroyEvent(self.id);

            if (self.changeTmt) {
                clearTimeout(self.changeTmt);
            }
        }

    }, {
        create: factory
    });

    return TextRenderer;
}();





function setAttr(el, name, value) {
    return el.setAttribute(name, value);
};

function removeAttr(el, name) {
    return el.removeAttribute(name);
};

var rToCamelCase = /-./g;

function toCamelCase(str) {
    return str.replace(rToCamelCase, function(match){
        return match.charAt(1).toUpperCase();
    });
};



var getAttrSet = (function() {


    // regular expression seems to be a few milliseconds faster
    // than plain parsing
    var reg = /^([\[({#$])([^)\]}"']+)[\])}]?$/;

    var removeDirective = function removeDirective(node, directive) {
        if (this.directive[directive] && 
            this.directive[directive].original) {
            removeAttr(node, this.directive[directive].original);
        }
        var i, l, sn = this.subnames[directive];
        if (sn) {
            for (i = 0, l = sn.length; i < l; i++) {
                removeAttr(node, sn[i]);
            }
            delete this.subnames[directive];
        }
    };

    return function getAttrSet(node, lookupDirective) {

        var set = {
                directive: {},
                attribute: {},
                config: {},
                rest: {},
                reference: null,
                subnames: {},
                removeDirective: removeDirective
            },
            i, l, tagName,
            name, value,
            match, parts,
            coll, mode,
            subname,
            attrs = isArray(node) ? node : node.attributes;

        for (i = 0, l = attrs.length; i < l; i++) {

            name = attrs[i].name;
            value = attrs[i].value;
            mode = null;
            match = name.match(reg);

            if (match) {
                name = match[2];
                mode = match[1];

                if (mode === '#') {
                    set.reference = name;
                    continue;
                }
            }
            else {
                if (name.substr(0, 4) === "mjs-") {
                    name = name.substr(4);
                    mode = '{';
                }
                else {
                    set['rest'][name] = value;
                    continue;
                }
            }

            parts = name.split(".");
            name = parts.shift();

            if (mode === '$') {
                if (value === "") {
                    value = true;
                }

                tagName = node.tagName.toLowerCase();

                set['config'][toCamelCase(name)] = value;

                if (!set['subnames'][tagName]) {
                    set['subnames'][tagName] = [];
                }

                set['subnames'][tagName].push(attrs[i].name);
            }
            else if (mode === '(' || mode === '{') { 

                coll = set['directive'];
                subname = parts.length ? parts[0] : null;

                if (!coll[name]) {
                    coll[name] = {
                        name: name,
                        original: null,
                        config: {},
                        value: null,
                        values: null
                    };
                }

                if (!subname) {
                    coll[name].original = attrs[i].name;
                }

                if (subname && !set['subnames'][name]) {
                    set['subnames'][name] = [];
                }

                if (subname && subname[0] === '$') {
                    if (value === "") {
                        value = true;
                    }
                    coll[name].config[toCamelCase(subname.substr(1))] = value;
                    set['subnames'][name].push(attrs[i].name);
                }
                else {
                    if (subname) {
                        if (!coll[name].values) {
                            coll[name].values = {};
                        }
                        // directive value keys are not camelcased
                        // do this inside directive if needed
                        // ('class' directive needs originals)
                        coll[name].values[parts.join(".")] = value;
                        set['subnames'][name].push(attrs[i].name);
                    }
                    else {
                        coll[name].value = value;
                    }
                }
            }
            else if (mode === '[') {
                set['attribute'][name] = {
                    value: value,
                    original: attrs[i].name
                };
            }
        }

        return set;
    }

}());




var Promise = function(){

    var PENDING     = 0,
        FULFILLED   = 1,
        REJECTED    = 2,

        queue       = [],
        qRunning    = false,


        nextTick    = typeof process !== strUndef ?
                        process.nextTick :
                        function(fn) {
                            setTimeout(fn, 0);
                        },

        // synchronous queue of asynchronous functions:
        // callbacks must be called in "platform stack"
        // which means setTimeout/nextTick;
        // also, they must be called in a strict order.
        nextInQueue = function() {
            qRunning    = true;
            var next    = queue.shift();
            nextTick(function(){
                next[0].apply(next[1], next[2]);
                if (queue.length) {
                    nextInQueue();
                }
                else {
                    qRunning = false;
                }
            }, 0);
        },

        /**
         * add to execution queue
         * @param {Function} fn
         * @param {Object} scope
         * @param {[]} args
         * @ignore
         */
        next        = function(fn, scope, args) {
            args = args || [];
            queue.push([fn, scope, args]);
            if (!qRunning) {
                nextInQueue();
            }
        },

        /**
         * returns function which receives value from previous promise
         * and tries to resolve next promise with new value returned from given function(prev value)
         * or reject on error.
         * promise1.then(success, failure) -> promise2
         * wrapper(success, promise2) -> fn
         * fn(promise1 resolve value) -> new value
         * promise2.resolve(new value)
         *
         * @param {Function} fn
         * @param {Promise} promise
         * @returns {Function}
         * @ignore
         */
        wrapper     = function(fn, promise) {
            return function(value) {
                try {
                    promise.resolve(fn(value));
                }
                catch (thrownError) {
                    promise.reject(thrownError);
                }
            };
        };


    /**
     * @class Promise
     */


    /**
     * @method Promise
     * @param {Function} fn {
     *  @description Function that accepts two parameters: resolve and reject functions.
     *  @param {function} resolve {
     *      @param {*} value
     *  }
     *  @param {function} reject {
     *      @param {*} reason
     *  }
     * }
     * @param {Object} context
     * @returns {Promise}
     * @constructor
     */

    /**
     * @method Promise
     * @param {Thenable} thenable
     * @returns {Promise}
     * @constructor
     */

    /**
     * @method Promise
     * @param {*} value Value to resolve promise with
     * @returns {Promise}
     * @constructor
     */


    /**
     * @method Promise
     * @returns {Promise}
     * @constructor
     */
    var Promise = function(fn, context) {

        if (fn instanceof Promise) {
            return fn;
        }

        if (!(this instanceof Promise)) {
            return new Promise(fn, context);
        }

        var self = this,
            then;

        self._fulfills   = [];
        self._rejects    = [];
        self._dones      = [];
        self._fails      = [];

        if (arguments.length > 0) {

            if (then = isThenable(fn)) {
                if (fn instanceof Promise) {
                    fn.then(
                        bind(self.resolve, self),
                        bind(self.reject, self));
                }
                else {
                    (new Promise(then, fn)).then(
                        bind(self.resolve, self),
                        bind(self.reject, self));
                }
            }
            else if (isFunction(fn)) {
                try {
                    fn.call(context,
                            bind(self.resolve, self),
                            bind(self.reject, self));
                }
                catch (thrownError) {
                    self.reject(thrownError);
                }
            }
            else {
                self.resolve(fn);
            }
        }
    };

    extend(Promise.prototype, {

        _state: PENDING,

        _fulfills: null,
        _rejects: null,
        _dones: null,
        _fails: null,

        _wait: 0,

        _value: null,
        _reason: null,

        _triggered: false,

        isPending: function() {
            return this._state === PENDING;
        },

        isFulfilled: function() {
            return this._state === FULFILLED;
        },

        isResolved: function() {
            return this._state === FULFILLED;
        },

        isRejected: function() {
            return this._state === REJECTED;
        },

        hasListeners: function() {
            var self = this,
                ls  = [self._fulfills, self._rejects, self._dones, self._fails],
                i, l;

            for (i = 0, l = ls.length; i < l; i++) {
                if (ls[i] && ls[i].length) {
                    return true;
                }
            }

            return false;
        },

        _cleanup: function() {
            var self    = this;

            self._fulfills = null;
            self._rejects = null;
            self._dones = null;
            self._fails = null;
        },

        _processValue: function(value, cb) {

            var self    = this,
                then;

            if (self._state !== PENDING) {
                return;
            }

            if (value === self) {
                self._doReject(new TypeError("cannot resolve promise with itself"));
                return;
            }

            try {
                if (then = isThenable(value)) {
                    if (value instanceof Promise) {
                        value.then(
                            bind(self._processResolveValue, self),
                            bind(self._processRejectReason, self));
                    }
                    else {
                        (new Promise(then, value)).then(
                            bind(self._processResolveValue, self),
                            bind(self._processRejectReason, self));
                    }
                    return;
                }
            }
            catch (thrownError) {
                if (self._state === PENDING) {
                    self._doReject(thrownError);
                }
                return;
            }

            cb.call(self, value);
        },


        _callResolveHandlers: function() {

            var self    = this;

            self._done();

            var cbs  = self._fulfills,
                cb;

            while (cb = cbs.shift()) {
                next(cb[0], cb[1], [self._value]);
            }

            self._cleanup();
        },


        _doResolve: function(value) {
            var self    = this;

            self._value = value;
            self._state = FULFILLED;

            if (self._wait === 0) {
                self._callResolveHandlers();
            }
        },

        _processResolveValue: function(value) {
            this._processValue(value, this._doResolve);
        },

        /**
         * @param {*} value
         */
        resolve: function(value) {

            var self    = this;

            if (self._triggered) {
                return self;
            }

            self._triggered = true;
            self._processResolveValue(value);

            return self;
        },


        _callRejectHandlers: function() {

            var self    = this;

            self._fail();

            var cbs  = self._rejects,
                cb;

            while (cb = cbs.shift()) {
                next(cb[0], cb[1], [self._reason]);
            }

            self._cleanup();
        },

        _doReject: function(reason) {

            var self        = this;

            self._state     = REJECTED;
            self._reason    = reason;

            if (self._wait === 0) {
                self._callRejectHandlers();
            }
        },


        _processRejectReason: function(reason) {
            this._processValue(reason, this._doReject);
        },

        /**
         * @param {*} reason
         */
        reject: function(reason) {

            var self    = this;

            if (self._triggered) {
                return self;
            }

            self._triggered = true;

            self._processRejectReason(reason);

            return self;
        },

        /**
         * @param {Function} resolve -- called when this promise is resolved; returns new resolve value
         * @param {Function} reject -- called when this promise is rejects; returns new reject reason
         * @param {object} context -- resolve's and reject's functions "this" object
         * @returns {Promise} new promise
         */
        then: function(resolve, reject, context) {

            var self            = this,
                promise         = new Promise,
                state           = self._state;

            if (context) {
                if (resolve) {
                    resolve = bind(resolve, context);
                }
                if (reject) {
                    reject = bind(reject, context);
                }
            }

            if (state === PENDING || self._wait !== 0) {

                if (resolve && isFunction(resolve)) {
                    self._fulfills.push([wrapper(resolve, promise), null]);
                }
                else {
                    self._fulfills.push([promise.resolve, promise])
                }

                if (reject && isFunction(reject)) {
                    self._rejects.push([wrapper(reject, promise), null]);
                }
                else {
                    self._rejects.push([promise.reject, promise]);
                }
            }
            else if (state === FULFILLED) {

                if (resolve && isFunction(resolve)) {
                    next(wrapper(resolve, promise), null, [self._value]);
                }
                else {
                    promise.resolve(self._value);
                }
            }
            else if (state === REJECTED) {
                if (reject && isFunction(reject)) {
                    next(wrapper(reject, promise), null, [self._reason]);
                }
                else {
                    promise.reject(self._reason);
                }
            }

            return promise;
        },

        /**
         * @param {Function} reject -- same as then(null, reject)
         * @returns {Promise} new promise
         */
        "catch": function(reject) {
            return this.then(null, reject);
        },

        _done: function() {

            var self    = this,
                cbs     = self._dones,
                cb;

            while (cb = cbs.shift()) {
                try {
                    cb[0].call(cb[1] || null, self._value);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
        },

        /**
         * @param {Function} fn -- function to call when promise is resolved
         * @param {Object} context -- function's "this" object
         * @returns {Promise} same promise
         */
        done: function(fn, context) {
            var self    = this,
                state   = self._state;

            if (state === FULFILLED && self._wait === 0) {
                try {
                    fn.call(context || null, self._value);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
            else if (state === PENDING) {
                self._dones.push([fn, context]);
            }

            return self;
        },

        _fail: function() {

            var self    = this,
                cbs     = self._fails,
                cb;

            while (cb = cbs.shift()) {
                try {
                    cb[0].call(cb[1] || null, self._reason);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
        },

        /**
         * @param {Function} fn -- function to call when promise is rejected.
         * @param {Object} context -- function's "this" object
         * @returns {Promise} same promise
         */
        fail: function(fn, context) {

            var self    = this,
                state   = self._state;

            if (state === REJECTED && self._wait === 0) {
                try {
                    fn.call(context || null, self._reason);
                }
                catch (thrown) {
                    error(thrown);
                }
            }
            else if (state === PENDING) {
                self._fails.push([fn, context]);
            }

            return self;
        },

        /**
         * @param {Function} fn -- function to call when promise resolved or rejected
         * @param {Object} context -- function's "this" object
         * @return {Promise} same promise
         */
        always: function(fn, context) {
            this.done(fn, context);
            this.fail(fn, context);
            return this;
        },

        /**
         * @returns {object} then: function, done: function, fail: function, always: function
         */
        promise: function() {
            var self = this;
            return {
                then: bind(self.then, self),
                done: bind(self.done, self),
                fail: bind(self.fail, self),
                always: bind(self.always, self)
            };
        },

        after: function(value) {

            var self = this;

            if (isThenable(value)) {

                self._wait++;

                var done = function() {
                    self._wait--;
                    if (self._wait === 0 && self._state !== PENDING) {
                        self._state === FULFILLED ?
                            self._callResolveHandlers() :
                            self._callRejectHandlers();
                    }
                };

                if (isFunction(value.done)) {
                    value.done(done);
                }
                else {
                    value.then(done);
                }
            }

            return self;
        }
    }, true, false);


    /**
     * @param {function} fn
     * @param {object} context
     * @param {[]} args
     * @returns {Promise}
     * @static
     */
    Promise.fcall = function(fn, context, args) {
        return Promise.resolve(fn.apply(context, args || []));
    };

    /**
     * @param {*} value
     * @returns {Promise}
     * @static
     */
    Promise.resolve = function(value) {
        var p = new Promise;
        p.resolve(value);
        return p;
    };


    /**
     * @param {*} reason
     * @returns {Promise}
     * @static
     */
    Promise.reject = function(reason) {
        var p = new Promise;
        p.reject(reason);
        return p;
    };


    /**
     * @param {[]} promises -- array of promises or resolve values
     * @returns {Promise}
     * @static
     */
    Promise.all = function(promises) {

        if (!promises.length) {
            return Promise.resolve(null);
        }

        var p       = new Promise,
            len     = promises.length,
            values  = new Array(len),
            cnt     = len,
            i,
            item,
            done    = function(value, inx) {
                values[inx] = value;
                cnt--;

                if (cnt === 0) {
                    p.resolve(values);
                }
            };

        for (i = 0; i < len; i++) {

            (function(inx){
                item = promises[i];

                if (item instanceof Promise) {
                    item.done(function(value){
                        done(value, inx);
                    })
                        .fail(p.reject, p);
                }
                else if (isThenable(item) || isFunction(item)) {
                    (new Promise(item))
                        .done(function(value){
                            done(value, inx);
                        })
                        .fail(p.reject, p);
                }
                else {
                    done(item, inx);
                }
            })(i);
        }

        return p;
    };

    /**
     * @param {Promise|*} promise1
     * @param {Promise|*} promise2
     * @param {Promise|*} promiseN
     * @returns {Promise}
     * @static
     */
    Promise.when = function() {
        return Promise.all(arguments);
    };

    /**
     * @param {[]} promises -- array of promises or resolve values
     * @returns {Promise}
     * @static
     */
    Promise.allResolved = function(promises) {

        if (!promises.length) {
            return Promise.resolve(null);
        }

        var p       = new Promise,
            len     = promises.length,
            values  = [],
            cnt     = len,
            i,
            item,
            settle  = function(value) {
                values.push(value);
                proceed();
            },
            proceed = function() {
                cnt--;
                if (cnt === 0) {
                    p.resolve(values);
                }
            };

        for (i = 0; i < len; i++) {
            item = promises[i];

            if (item instanceof Promise) {
                item.done(settle).fail(proceed);
            }
            else if (isThenable(item) || isFunction(item)) {
                (new Promise(item)).done(settle).fail(proceed);
            }
            else {
                settle(item);
            }
        }

        return p;
    };

    /**
     * @param {[]} promises -- array of promises or resolve values
     * @returns {Promise}
     * @static
     */
    Promise.race = function(promises) {

        if (!promises.length) {
            return Promise.resolve(null);
        }

        var p   = new Promise,
            len = promises.length,
            i,
            item;

        for (i = 0; i < len; i++) {
            item = promises[i];

            if (item instanceof Promise) {
                item.done(p.resolve, p).fail(p.reject, p);
            }
            else if (isThenable(item) || isFunction(item)) {
                (new Promise(item)).done(p.resolve, p).fail(p.reject, p);
            }
            else {
                p.resolve(item);
            }

            if (!p.isPending()) {
                break;
            }
        }

        return p;
    };

    /**
     * @param {[]} functions -- array of promises or resolve values or functions
     * @returns {Promise}
     * @static
     */
    Promise.waterfall = function(functions) {

        if (!functions.length) {
            return Promise.resolve(null);
        }

        var first   = functions.shift(),
            promise = isFunction(first) ? Promise.fcall(first) : Promise.resolve(fn),
            fn;

        while (fn = functions.shift()) {
            if (isThenable(fn)) {
                promise = promise.then(function(fn){
                    return function(){
                        return fn;
                    };
                }(fn));
            }
            else if (isFunction(fn)) {
                promise = promise.then(fn);
            }
            else {
                promise.resolve(fn);
            }
        }

        return promise;
    };

    Promise.forEach = function(items, fn, context, allResolved) {

        var left = items.slice(),
            p = new Promise,
            values = [],
            i = 0;

        var next = function() {

            if (!left.length) {
                p.resolve(values);
                return;
            }

            var item = left.shift(),
                index = i;

            i++;

            Promise.fcall(fn, context, [item, index])
                .done(function(result){
                    values.push(result);
                    next();
                })
                .fail(function(reason){
                    if (allResolved) {
                        p.reject(reason);
                    }
                    else {
                        values.push(null);
                        next();
                    }
                });
        };

        next();

        return p;
    };

    Promise.counter = function(cnt) {

        var promise     = new Promise;

        promise.countdown = function() {
            cnt--;
            if (cnt === 0) {
                promise.resolve();
            }
        };

        return promise;
    };

    return Promise;
}();




var aIndexOf = (function(){

    var aIndexOf    = Array.prototype.indexOf;

    if (!aIndexOf) {
        aIndexOf = Array.prototype.indexOf = function (searchElement, fromIndex) {

            var k;

            // 1. Let O be the result of calling ToObject passing
            //    the this value as the argument.
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get
            //    internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If len is 0, return -1.
            if (len === 0) {
                return -1;
            }

            // 5. If argument fromIndex was passed let n be
            //    ToInteger(fromIndex); else let n be 0.
            var n = +fromIndex || 0;

            if (Math.abs(n) === Infinity) {
                n = 0;
            }

            // 6. If n >= len, return -1.
            if (n >= len) {
                return -1;
            }

            // 7. If n >= 0, then Let k be n.
            // 8. Else, n<0, Let k be len - abs(n).
            //    If k is less than 0, then let k be 0.
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            // 9. Repeat, while k < len
            while (k < len) {
                var kValue;
                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the
                //    HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                //    i.  Let elementK be the result of calling the Get
                //        internal method of O with the argument ToString(k).
                //   ii.  Let same be the result of applying the
                //        Strict Equality Comparison Algorithm to
                //        searchElement and elementK.
                //  iii.  If same is true, return k.
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }

    return aIndexOf;
}());






var Renderer = function(){

    var handlers                = null,
        createText              = TextRenderer.create,

        lookupDirective = function(name) {
            return !!nsGet("directive.attr." + name, true);
        },

        nodeChildren = function(res, el, fn, fnScope, finish, cnt) {

            var children = [],
                i, len;

            if (res && res !== true) {
                if (res.nodeType) {
                    cnt.countdown += 1;
                    eachNode(res, fn, fnScope, finish, cnt);
                    return;
                }
                else {
                    children = slice.call(res);
                }
            }

            if (!children.length) {
                children = toArray(el.childNodes || el);
            }

            len = children.length;

            cnt.countdown += len;

            for(i = -1;
                ++i < len;
                eachNode(children[i], fn, fnScope, finish, cnt)){}
        },


        collectNodes    = function(coll, add) {

            if (add) {
                if (add.nodeType) {
                    coll.push(add);
                }
                else if (isArray(add)) {
                    for (var i = -1, l = add.length; ++i < l; collectNodes(coll, add[i])){}
                }
            }
        },

        //rSkipTag = /^(script|template|mjs-template|style)$/i,

        skipMap = {
            "script": true,
            "template": true,
            "mjs-template": true,
            "style": true,
            "link": true
        },

        eachNode = function(el, fn, fnScope, finish, cnt) {

            if (!el) {
                return;
            }

            var res,
                tag = el.nodeName;

            if (!cnt) {
                cnt = {countdown: 1};
            }

            if (tag && skipMap[tag.toLowerCase()]) { //tag.match(rSkipTag)) {
                --cnt.countdown === 0 && finish && finish.call(fnScope);
                return;
            }

            res = fn.call(fnScope, el);

            if (res !== false) {

                if (isThenable(res)) {

                    res.done(function(response){

                        if (response !== false) {
                            nodeChildren(response, el, fn, fnScope, finish, cnt);
                        }

                        --cnt.countdown === 0 && finish && finish.call(fnScope);
                    });
                    return; // prevent countdown
                }
                else {
                    nodeChildren(res, el, fn, fnScope, finish, cnt);
                }
            }

            --cnt.countdown === 0 && finish && finish.call(fnScope);
        },

        observer = new Observable;

    return defineClass({

        $class: "Renderer",

        id: null,
        el: null,
        scope: null,
        texts: null,
        parent: null,
        passedAttrs: null,
        reportFirstNode: true,

        $init: function(el, scope, parent, passedAttrs) {
            var self            = this;

            self.id             = nextUid();
            self.el             = el;
            self.scope          = scope;
            self.texts          = [];
            self.parent         = parent;
            self.passedAttrs    = passedAttrs;

            if (scope instanceof Scope) {
                scope.$on("destroy", self.$destroy, self);
            }

            if (parent) {
                parent.on("destroy", self.$destroy, self);
            }
        },

        on: function(event, fn, context) {
            return observer.on(event + '-' + this.id, fn, context);
        },

        once: function(event, fn, context) {
            return observer.once(event + '-' + this.id, fn, context);
        },

        un: function(event, fn, context) {
            return observer.un(event + '-' + this.id, fn, context);
        },

        createChild: function(node) {
            return new Renderer(node, this.scope, this);
        },

        getEl: function() {
            return this.el;
        },

        runHandler: function(f, parentScope, node, attr, attrs) {

            var self    = this,
                scope   = f.$isolateScope ?
                            parentScope.$newIsolated() :
                          (f.$breakScope  ?
                           parentScope.$new() :
                           parentScope),
                app     = parentScope.$app,
                value   = attr ? attr.value : null,
                // attribute directives receive mods,
                // tag directives receive cmpConfig
                inject  = {
                    $scope: scope,
                    $node: node,
                    $attr: attr,
                    $attrValue: value,
                    $attrMap: attrs,
                    $renderer: self
                },
                args    = [scope, node, value, self, attr],
                inst;

            if (attrs.reference) {
                scope[attrs.reference] = node;
            }

            if (app) {
                inst = app.inject(f, null, inject, args);
            }
            else if (f.$instantiate) {
                inst = f.$instantiate.apply(f, args);
            }
            else {
                inst = f.apply(null, args);
            }

            if (app && f.$registerBy && inst) {
                if (isThenable(inst)) {
                    inst.done(function(cmp){
                        app.registerCmp(cmp, parentScope, f.$registerBy);
                    });
                }
                else {
                    app.registerCmp(inst, parentScope, f.$registerBy);
                }
            }


            if (inst && inst.$destroy) {
                self.on("destroy", inst.$destroy, inst);
            }
            else if (typeof inst === "function") {
                self.on("destroy", inst);
            }

            if (f.$stopRenderer) {
                return false;
            }

            if (inst && inst.getChildren) {
                return inst.getChildren();
            }

            return inst;
        },


        processNode: function(node) {

            var self        = this,
                nodeType    = node.nodeType,
                texts       = self.texts,
                scope       = self.scope,
                textRenderer;

            // text node
            if (nodeType === 3) {
                textRenderer    = createText(
                    scope,
                    node.textContent || node.nodeValue,
                    {userData: texts.length});

                if (textRenderer) {
                    textRenderer.subscribe(self.onTextChange, self);
                    texts.push({
                        node: node,
                        tr: textRenderer
                    });
                    self.renderText(texts.length - 1);
                }
            }

            // element node
            else if (nodeType === 1) {

                if (self.reportFirstNode) {
                    observer.trigger("first-node-" + self.id, node);
                    self.reportFirstNode = false;
                }

                if (!handlers) {
                    handlers = Directive.getAttributes();
                }

                var tag     = node.tagName.toLowerCase(),
                    defers  = [],
                    nodes   = [],
                    i, l, f, len, c,
                    attrs, as,
                    attrProps,
                    name,
                    res,
                    handler,
                    someHandler = false;

                if (tag.substr(0, 4) === "mjs-") {
                    tag = tag.substr(4);
                }

                attrs = getAttrSet(node, lookupDirective);

                if (attrs.config.ignore) {
                    return false;
                }

                if (self.passedAttrs) {
                    attrs['directive'] = extend(
                        {}, 
                        attrs['directive'], 
                        self.passedAttrs['directive'], 
                        true, true
                    );
                    self.passedAttrs = null;
                }

                // this tag represents component
                // we just pass it to attr.cmp directive
                // by adding it to the attr map
                if (c = nsGet("directive.component." + tag, true)) {

                    as = attrs.config.as || c.tag;

                    if (as) {

                        attrs["directive"]['cmp'] = {
                            value: c.prototype.$class,
                            name: "cmp",
                            original: "{cmp}",
                            config: extend({}, attrs.config),
                            values: null
                        };

                        as = window.document.createElement(as);
                        node.parentNode.replaceChild(as, node);
                        while (node.firstChild) {
                            as.appendChild(node.firstChild);
                        }
                        node = as;
                        for (name in attrs.rest) {
                            setAttr(node, name, attrs.rest[name]);
                        }
                    }
                    else {

                        f = nsGet("directive.attr.cmp", true);
                        var passAttrs = extend({}, attrs);
                        delete passAttrs['directive']['cmp'];

                        attrs.config.passAttrs = passAttrs;

                        res = self.runHandler(f, scope, node, {
                            value: c,
                            config: attrs.config
                        }, attrs);
                        someHandler = true;

                        if (res === false) {
                            return false;
                        }
                        if (isThenable(res)) {
                            defers.push(res);
                        }
                        else {
                            collectNodes(nodes, res);
                        }
                    }
                }

                // this is a tag directive
                else if (f = nsGet("directive.tag." + tag, true)) {

                    res = self.runHandler(
                        f, scope, node, 
                        {value: null, config: attrs.config}, 
                        attrs
                    );
                    someHandler = true;

                    attrs.removeDirective(node, tag);

                    if (res === false) {
                        return false;
                    }
                    if (isThenable(res)) {
                        defers.push(res);
                    }
                    else {
                        collectNodes(nodes, res);
                    }
                }


                // this is an attribute directive
                for (i = 0, len = handlers.length; i < len; i++) {
                    name    = handlers[i].name;

                    if ((attrProps = attrs['directive'][name]) !== undf &&
                        !attrProps.handled) {

                        handler = handlers[i].handler;

                        if (!handler.$keepAttribute) {
                            removeAttr(node, attrProps.original);
                        }
                        attrs.removeDirective(node, name);

                        res     = self.runHandler(handler, scope, node, attrProps, attrs);

                        someHandler = true;
                        attrProps.handled = true;

                        if (res === false) {
                            return false;
                        }
                        if (isThenable(res)) {
                            defers.push(res);
                        }
                        else {
                            collectNodes(nodes, res);
                        }
                    }
                }

                if (!someHandler && attrs.reference) {
                    scope[attrs.reference] = node;
                }

                if (defers.length && !attrs.config.ignoreInside) {
                    var deferred = new Promise;
                    Promise.all(defers).done(function(values){
                        collectNodes(nodes, values);
                        deferred.resolve(nodes);
                    });
                    return deferred;
                }

                // this is a plain attribute
                for (i in attrs['attribute']) {

                    textRenderer = createText(
                        scope,
                        attrs['attribute'][i].value,
                        {userData: texts.length, force: true});

                    removeAttr(node, attrs['attribute'][i].original);
                    textRenderer.subscribe(self.onTextChange, self);
                    texts.push({
                        node: node,
                        attr: i,
                        //attrProp: attrs['attribute'][i],
                        tr: textRenderer
                    });
                    self.renderText(texts.length - 1);
                }

                if (attrs.config.ignoreInside) {
                    if (defers.length) {
                        var deferred = new Promise;
                        return Promise.all(defers).done(function(){
                            return deferred.resolve(false);
                        });
                        return deferred;
                    }
                    else {
                        return false;
                    }
                }

                return nodes.length ? nodes : true;
            }

            return true;
        },

        process: function() {
            var self    = this;

            if (self.el.nodeType) {
                eachNode(self.el, self.processNode, self,
                    self.onProcessingFinished, {countdown: 1});
            }
            else {
                nodeChildren(
                    null, self.el, self.processNode,
                    self, self.onProcessingFinished, {countdown: 0});
            }
        },

        onProcessingFinished: function() {
            observer.trigger("rendered-" + this.id, this);
        },


        onTextChange: function(textRenderer, inx) {
            this.renderText(inx);
        },

        renderText: function(inx) {

            var self        = this,
                text        = self.texts[inx],
                res         = text.tr.getString(),
                attrName    = text.attr;

            if (attrName) {

                if (attrName === "value") {
                    text.node.value = res;
                }
                else if (attrName === "class") {
                    text.node.className = res;
                }
                else if (attrName === "src") {
                    text.node.src = res;
                }

                setAttr(text.node, attrName, res);
            }
            else {
                //text.node.textContent = res;
                text.node.nodeValue = res;
            }
        },


        destroy: function() {

            var self    = this,
                texts   = self.texts,
                i, len;

            for (i = -1, len = texts.length; ++i < len; texts[i].tr.$destroy()) {}

            if (self.parent) {
                self.parent.un("destroy", self.$destroy, self);
            }

            observer.trigger("destroy-" + self.id);
        }

    }, {

        setSkip: function(tag, value) {
            skipMap[tag] = value;
        }
    });

}();






var Text = function(){

    var pluralDef       = function($number, $locale) {

            if ($locale === "pt_BR") {
                // temporary set a locale for brasilian
                $locale = "xbr";
            }

            if ($locale.length > 3) {
                $locale = $locale.substr(0, -$locale.lastIndexOf('_'));
            }

            switch($locale) {
                case 'bo':
                case 'dz':
                case 'id':
                case 'ja':
                case 'jv':
                case 'ka':
                case 'km':
                case 'kn':
                case 'ko':
                case 'ms':
                case 'th':
                case 'tr':
                case 'vi':
                case 'zh':
                    return 0;

                case 'af':
                case 'az':
                case 'bn':
                case 'bg':
                case 'ca':
                case 'da':
                case 'de':
                case 'el':
                case 'en':
                case 'eo':
                case 'es':
                case 'et':
                case 'eu':
                case 'fa':
                case 'fi':
                case 'fo':
                case 'fur':
                case 'fy':
                case 'gl':
                case 'gu':
                case 'ha':
                case 'he':
                case 'hu':
                case 'is':
                case 'it':
                case 'ku':
                case 'lb':
                case 'ml':
                case 'mn':
                case 'mr':
                case 'nah':
                case 'nb':
                case 'ne':
                case 'nl':
                case 'nn':
                case 'no':
                case 'om':
                case 'or':
                case 'pa':
                case 'pap':
                case 'ps':
                case 'pt':
                case 'so':
                case 'sq':
                case 'sv':
                case 'sw':
                case 'ta':
                case 'te':
                case 'tk':
                case 'ur':
                case 'zu':
                    return ($number === 1) ? 0 : 1;

                case 'am':
                case 'bh':
                case 'fil':
                case 'fr':
                case 'gun':
                case 'hi':
                case 'ln':
                case 'mg':
                case 'nso':
                case 'xbr':
                case 'ti':
                case 'wa':
                    return (($number === 0) || ($number === 1)) ? 0 : 1;

                case 'be':
                case 'bs':
                case 'hr':
                case 'ru':
                case 'sr':
                case 'uk':
                    return (($number % 10 === 1) && ($number % 100 !== 11)) ?
                           0 :
                           ((($number % 10 >= 2) && ($number % 10 <= 4) &&
                             (($number % 100 < 10) || ($number % 100 >= 20))) ? 1 : 2);

                case 'cs':
                case 'sk':
                    return ($number === 1) ? 0 : ((($number >= 2) && ($number <= 4)) ? 1 : 2);

                case 'ga':
                    return ($number === 1) ? 0 : (($number === 2) ? 1 : 2);

                case 'lt':
                    return (($number % 10 === 1) && ($number % 100 !== 11)) ?
                           0 :
                           ((($number % 10 >= 2) &&
                             (($number % 100 < 10) || ($number % 100 >= 20))) ? 1 : 2);

                case 'sl':
                    return ($number % 100 === 1) ?
                           0 :
                           (($number % 100 === 2) ?
                                1 :
                                ((($number % 100 === 3) || ($number % 100 === 4)) ? 2 : 3));

                case 'mk':
                    return ($number % 10 === 1) ? 0 : 1;

                case 'mt':
                    return ($number === 1) ?
                           0 :
                           ((($number === 0) || (($number % 100 > 1) && ($number % 100 < 11))) ?
                                1 :
                                ((($number % 100 > 10) && ($number % 100 < 20)) ? 2 : 3));

                case 'lv':
                    return ($number === 0) ? 0 : ((($number % 10 === 1) && ($number % 100 !== 11)) ? 1 : 2);

                case 'pl':
                    return ($number === 1) ?
                           0 :
                           ((($number % 10 >= 2) && ($number % 10 <= 4) &&
                             (($number % 100 < 12) || ($number % 100 > 14))) ? 1 : 2);

                case 'cy':
                    return ($number === 1) ? 0 : (($number === 2) ? 1 : ((($number === 8) || ($number === 11)) ? 2 : 3));

                case 'ro':
                    return ($number === 1) ?
                           0 :
                           ((($number === 0) || (($number % 100 > 0) && ($number % 100 < 20))) ? 1 : 2);

                case 'ar':
                    return ($number === 0) ?
                           0 :
                           (($number === 1) ?
                                1 :
                                (($number === 2) ?
                                    2 :
                                    ((($number >= 3) && ($number <= 10)) ?
                                        3 :
                                        ((($number >= 11) && ($number <= 99)) ? 4 : 5))));

                default:
                    return 0;
            }
        };


    var Text = function(locale) {

        var self    = this;
        self.store  = {};
        if (locale) {
            self.locale = locale;
        }
    };

    extend(Text.prototype, {

        store: null,
        locale: "en",

        setLocale: function(locale) {
            this.locale = locale;
        },

        set: function(key, value) {
            var store = this.store;
            if (store[key] === undf) {
                store[key] = value;
            }
        },

        load: function(keys) {
            extend(this.store, keys, false, false);
        },

        get: function(key) {
            var self    = this;
            return self.store[key] ||
                   (self === globalText ? '-- ' + key + ' --' : globalText.get(key));
        },

        plural: function(key, number) {
            var self    = this,
                strings = typeof key === "string" ? self.get(key): key,
                def     = pluralDef(number, self.locale);

            if (!isArray(strings)) {
                if (isPlainObject(strings)) {
                    if (strings[number]) {
                        return strings[number];
                    }
                    if (number === 1 && strings.one !== undf) {
                        return strings.one;
                    }
                    else if (number < 0 && strings.negative !== undf) {
                        return strings.negative;
                    }
                    else {
                        return strings.other;
                    }
                }
                return strings;
            }
            else {
                return strings[def];
            }
        },

        destroy: function() {

            this.store = null;

        }

    }, true, false);


    var globalText  = new Text;

    Text.global     = function() {
        return globalText;
    };

    return Text;
}();




var destroy = function() {

    var items = [];

    var destroy = function destroyMetaphor(destroyWindow) {

        var i, l, item,
            k;

        for (i = 0, l = items.length; i < l; i++) {
            item = items[i];

            if (item.$destroy) {
                item.$destroy();
            }
            else if (item.destroy) {
                item.destroy();
            }
        }

        items = null;

        if (cs && cs.destroy) {
            cs.destroy();
            cs = null;
        }

        if (ns && ns.destroy) {
            ns.destroy();
            ns = null;
        }

        for (k in MetaphorJs) {
            MetaphorJs[k] = null;
        }

        MetaphorJs = null;

        if (destroyWindow) {
            for (k in window) {
                if (window.hasOwnProperty(k)) {
                    window[k] = null;
                }
            }
        }
    };

    destroy.collect = function(item) {
        items.push(item);
    };

    return destroy;

}();



/**
 * @mixin Observable
 * @description Mixin adds observable features to the host object.
 *              It adds 'callback' option to the host config. See $beforeInit.
 *              Mixin is designed for MetaphorJs class system.
 * @code examples/mixin.js
 */
ns.register("mixin.Observable", {

    /**
     * @private
     * @type {Observable}
     * @description You can use this instance in your $init function
     */
    $$observable: null,

    /**
     * @private
     * @type {object}
     */
    $$callbackContext: null,

    /**
     * @protected
     * @type {object} {
     *      Override this to define event properties. 
     *      Object's key is event name, value - either returnResult or 
     *      options object. See {@link class:Observable.createEvent}
     * }
     */
    $$events: null,

    /**
     * @method
     * @private
     * @param {object} cfg {
     *      This is a config that was passed to the host object's constructor.
     *      It is being passed to mixin's $beforeInit automatically.
     *      @type {object} callback {
     *          Here, except for 'context', '$context' and 'scope', 
     *          keys are event names and values are listeners. 
     *          @type {object} context All given listeners context
     *          @type {object} scope The same
     *      }
     * }
     */
    $beforeInit: function(cfg) {
        var self = this;
        self.$$observable = new Observable;
        self.$initObservable(cfg);
    },

    /**
     * @method
     * @private
     * @ignore
     * @param {object} cfg
     */
    $initObservable: function(cfg) {

        var self    = this,
            obs     = self.$$observable,
            i;

        if (cfg && cfg.callback) {
            var ls = cfg.callback,
                context = ls.context || ls.scope || ls.$context,
                events = extend({}, self.$$events, ls.$events, true, false);

            for (i in events) {
                obs.createEvent(i, events[i]);
            }

            ls.context = null;
            ls.scope = null;

            for (i in ls) {
                if (ls[i]) {
                    obs.on(i, ls[i], context || self);
                }
            }

            cfg.callback = null;

            if (context) {
                self.$$callbackContext = context;
            }
        }
        else if (self.$$events) {
            for (i in self.$$events) {
                obs.createEvent(i, self.$$events[i]);
            }
        }
    },

    /**
     * @method
     * @see {@link class:Observable.on}
     */
    on: function() {
        var o = this.$$observable;
        return o ? o.on.apply(o, arguments) : null;
    },

    /**
     * @method
     * @see {@link class:Observable.un}
     */
    un: function() {
        var o = this.$$observable;
        return o ? o.un.apply(o, arguments) : null;
    },

    /**
     * @method
     * @see {@link class:Observable.once}
     */
    once: function() {
        var o = this.$$observable;
        return o ? o.once.apply(o, arguments) : null;
    },

    /**
     * @method
     * @see {@link class:Observable.trigger}
     */
    trigger: function() {
        var o = this.$$observable;
        return o ? o.trigger.apply(o, arguments) : null;
    },

    /**
     * @method
     * @private
     * @ignore
     */
    $beforeDestroy: function() {
        this.$$observable.trigger("before-destroy", this);
    },

    /**
     * @method
     * @private
     * @ignore
     */
    $afterDestroy: function() {
        var self = this;
        self.$$observable.trigger("destroy", self);
        self.$$observable.destroy();
        self.$$observable = null;
    }
});






var Provider = function(){

    var VALUE       = 1,
        CONSTANT    = 2,
        FACTORY     = 3,
        SERVICE     = 4,
        PROVIDER    = 5,
        globalProvider;

    var Provider = function() {
        this.store  = {};
    };

    extend(Provider.prototype, {

        store: null,

        instantiate: function(fn, context, args, isClass) {
            if (fn.$instantiate) {
                return fn.$instantiate.apply(fn, args);
            }
            else if (isClass) {
                return instantiate(fn, args);
            }
            else {
                return fn.apply(context, args);
            }
        },

        inject: function(injectable, context, currentValues, callArgs, isClass) {

            currentValues   = currentValues || {};
            callArgs        = callArgs || [];

            var self = this;

            if (isFunction(injectable)) {

                if (injectable.inject) {
                    var tmp = slice.call(injectable.inject);
                    tmp.push(injectable);
                    injectable = tmp;
                }
                else {
                    return self.instantiate(injectable, context, callArgs, isClass);
                }
            }
            else if (isString(injectable)) {
                return self.resolve(injectable, currentValues);
            }
            else {
                injectable = slice.call(injectable);
            }

            var values  = [],
                fn      = injectable.pop(),
                i, l;

            for (i = -1, l = injectable.length; ++i < l;
                 values.push(self.resolve(injectable[i], currentValues))) {}

            return Promise.all(values).then(function(values){
                return self.instantiate(fn, context, values, isClass);
            });
        },

        value: function(name, value) {
            this.store[name] = {
                type: VALUE,
                value: value
            };
        },

        constant: function(name, value) {
            var store = this.store;
            if (!store[name]) {
                store[name] = {
                    type: CONSTANT,
                    value: value
                };
            }
        },

        factory: function(name, fn, context, singleton) {

            if (isBool(context)) {
                singleton = context;
                context = null;
            }

            this.store[name] = {
                type: FACTORY,
                singleton: singleton,
                fn: fn,
                context: context
            };
        },

        service: function(name, constr, singleton) {
            this.store[name] = {
                type: SERVICE,
                singleton: singleton,
                fn: constr
            };
        },

        provider: function(name, constr) {

            this.store[name + "Provider"] = {
                name: name,
                type: PROVIDER,
                fn: constr,
                instance: null
            };
        },

        resolve: function(name, currentValues, callArgs) {

            var self    = this,
                store   = self.store,
                type,
                item,
                res;

            currentValues = currentValues || {};
            callArgs = callArgs || [];

            if (currentValues[name] !== undf) {
                return currentValues[name];
            }

            if (item = store[name]) {

                type    = item.type;

                if (type === VALUE || type === CONSTANT) {
                    return item.value;
                }
                else if (type === FACTORY) {
                    res = self.inject(item.fn, item.context, currentValues, callArgs);
                }
                else if (type === SERVICE) {
                    res = self.inject(item.fn, null, currentValues, callArgs, true);
                }
                else if (type === PROVIDER) {

                    if (!item.instance) {

                        item.instance = Promise.resolve(
                                self.inject(item.fn, null, currentValues)
                            )
                            .done(function(instance){
                                item.instance = instance;
                                store[item.name] = {
                                    type: FACTORY,
                                    fn: instance.$get,
                                    context: instance
                                };
                            });
                    }

                    return item.instance;
                }

                if (item.singleton) {
                    item.type = VALUE;
                    item.value = res;

                    if (type === FACTORY && isThenable(res)) {
                        res.done(function(value){
                            item.value = value;
                        });
                    }
                }

                return currentValues[name] = res;
            }
            else {

                if (store[name + "Provider"]) {
                    self.resolve(name + "Provider", currentValues);
                    return self.resolve(name, currentValues);
                }

                if (self === globalProvider) {
                    throw "Could not provide value for " + name;
                }
                else {
                    return globalProvider.resolve(name);
                }
            }
        },

        destroy: function() {

            var self = this;

            self.store = null;
            self.scope = null;
        }

    }, true, false);

    Provider.global = function() {
        return globalProvider;
    };

    globalProvider = new Provider;

    return Provider;
}();






ns.register("mixin.Provider", {

    /**
     * @type {Provider}
     */
    $$provider: null,

    $beforeInit: function() {

        this.$$provider = new Provider;

    },

    value: function() {
        var p = this.$$provider;
        return p.value.apply(p, arguments);
    },

    constant: function() {
        var p = this.$$provider;
        return p.constant.apply(p, arguments);
    },

    factory: function() {
        var p = this.$$provider;
        return p.factory.apply(p, arguments);
    },

    service: function() {
        var p = this.$$provider;
        return p.service.apply(p, arguments);
    },

    provider: function() {
        var p = this.$$provider;
        return p.provider.apply(p, arguments);
    },

    resolve: function() {
        var p = this.$$provider;
        return p.resolve.apply(p, arguments);
    },

    inject: function() {
        var p = this.$$provider;
        return p.inject.apply(p, arguments);
    },

    $afterDestroy: function() {

        this.$$provider.destroy();
        this.$$provider = null;

    }

});







var App = defineClass({

    $class: "App",
    $mixins: ["mixin.Observable", "mixin.Provider"],

    lang: null,
    scope: null,
    renderer: null,
    cmpListeners: null,
    components: null,
    sourceObs: null,

    $init: function(node, data) {

        var self        = this,
            scope       = data instanceof Scope ? data : new Scope(data),
            args;

        destroy.collect(self);

        removeAttr(node, "mjs-app");

        scope.$app      = self;
        self.$super();

        self.lang       = new Text;

        self.scope          = scope;
        self.cmpListeners   = {};
        self.components     = {};

        self.factory('$parentCmp', ['$node', self.getParentCmp], self);
        self.value('$app', self);
        self.value('$rootScope', scope.$root);
        self.value('$lang', self.lang);

        self.renderer       = new Renderer(node, scope);
        self.renderer.on("rendered", self.afterRender, self);

        args = slice.call(arguments);
        args[1] = scope;
        self.initApp.apply(self, args);
    },

    initApp: emptyFn,

    afterRender: function() {

    },

    run: function() {
        this.renderer.process();
    },

    createSource: function(name, returnResult) {
        var key = "source-" + name,
            self = this;

        if (!self.$$observable.getEvent(key)) {
            self.$$observable.createEvent(key, returnResult || "nonempty");
        }
    },

    registerSource: function(name, fn, context) {
        this.on("source-" + name, fn, context);
    },

    unregisterSource: function(name, fn, context) {
        this.un("source-" + name, fn, context);
    },

    collect: function(name) {
        arguments[0] = "source-" + arguments[0];
        return this.trigger.apply(this, arguments);
    },


    getParentCmp: function(node, includeSelf) {

        var self    = this,
            parent  = includeSelf ? node : node.parentNode,
            id;

        while (parent) {
            if (id = (getAttr(parent, "cmp-id") || parent.$$cmpId)) {
                return self.getCmp(id);
            }
            parent = parent.parentNode;
        }

        return null;
    },

    onAvailable: function(cmpId, fn, context) {

        var self = this,
            cmpListeners = self.cmpListeners,
            components = self.components;

        if (!cmpListeners[cmpId]) {
            cmpListeners[cmpId] = new Promise;
        }

        if (fn) {
            cmpListeners[cmpId].done(fn, context);
        }

        if (components[cmpId]) {
            cmpListeners[cmpId].resolve(components[cmpId])
        }

        return cmpListeners[cmpId];
    },

    getCmp: function(id) {
        return this.components[id] || null;
    },

    registerCmp: function(cmp, scope, byKey) {
        var self = this,
            id = cmp[byKey],
            deregister = function() {
                delete self.cmpListeners[id];
                delete self.components[id];
            };

        self.components[id] = cmp;

        if (self.cmpListeners[id]) {
            self.cmpListeners[id].resolve(cmp);
        }

        if (cmp.on) {
            cmp.on("destroy", deregister);
        }
        scope.$on("$destroy", deregister);
    },

    destroy: function() {

        var self    = this;

        self.renderer.$destroy();
        self.scope.$destroy();
        self.lang.destroy();

        self.$super();
    }

});



var isAttached = function(){
    var isAttached = function isAttached(node) {

        if (node === window) {
            return true;
        }
        if (node.nodeType == 3) {
            if (node.parentElement) {
                return isAttached(node.parentElement);
            }
            else {
                return true;
            }
        }

        var html = window.document.documentElement;

        return node === html ? true : html.contains(node);
    };
    return isAttached;
}();




var data = function(){

    var dataCache   = {},

        getNodeId   = function(el) {
            return el._mjsid || (el._mjsid = nextUid());
        };

    /**
     * @param {Element} el
     * @param {String} key
     * @param {*} value optional
     */
    return function data(el, key, value) {
        var id  = getNodeId(el),
            obj = dataCache[id];

        if (value !== undf) {
            if (!obj) {
                obj = dataCache[id] = {};
            }
            obj[key] = value;
            return value;
        }
        else {
            return obj ? obj[key] : undf;
        }
    };

}();



function toFragment(nodes, doc) {

    var fragment = (doc || window.document).createDocumentFragment(),
        i, l;

    if (isString(nodes)) {
        var tmp = window.document.createElement('div');
        tmp.innerHTML = nodes;
        nodes = tmp.childNodes;
    }

    if (!nodes) {
        return fragment;
    }

    if (nodes.nodeType) {
        fragment.appendChild(nodes);
    }
    else {
        // due to a bug in jsdom, we turn NodeList into array first
        if (nodes.item) {
            var tmpNodes = nodes;
            nodes = [];
            for (i = -1, l = tmpNodes.length >>> 0; ++i !== l; nodes.push(tmpNodes[i])) {}
        }

        for (i = -1, l = nodes.length; ++i !== l; fragment.appendChild(nodes[i])) {}
    }

    return fragment;
};



/**
 * @param {[]|Element} node
 * @returns {[]|Element}
 */
var clone = function clone(node) {

    var i, len, cloned;

    if (isArray(node)) {
        cloned = [];
        for (i = 0, len = node.length; i < len; i++) {
            cloned.push(clone(node[i]));
        }
        return cloned;
    }
    else if (node) {
        switch (node.nodeType) {
            // element
            case 1:
                return node.cloneNode(true);
            // text node
            case 3:
                return window.document.createTextNode(node.innerText || node.textContent);
            // document fragment
            case 11:
                return node.cloneNode(true);

            default:
                return null;
        }
    }

    return null;
};





var getAnimationPrefixes = function(){

    var domPrefixes         = ['Moz', 'Webkit', 'ms', 'O', 'Khtml'],
        animationDelay      = "animationDelay",
        animationDuration   = "animationDuration",
        transitionDelay     = "transitionDelay",
        transitionDuration  = "transitionDuration",
        transform           = "transform",
        transitionend       = null,
        prefixes            = null,

        probed              = false,

        detectCssPrefixes   = function() {

            var el = window.document.createElement("div"),
                animation = false,
                pfx,
                i, len;

            if (el.style['animationName'] !== undf) {
                animation = true;
            }
            else {
                for(i = 0, len = domPrefixes.length; i < len; i++) {
                    pfx = domPrefixes[i];
                    if (el.style[ pfx + 'AnimationName' ] !== undf) {
                        animation           = true;
                        animationDelay      = pfx + "AnimationDelay";
                        animationDuration   = pfx + "AnimationDuration";
                        transitionDelay     = pfx + "TransitionDelay";
                        transitionDuration  = pfx + "TransitionDuration";
                        transform           = pfx + "Transform";
                        break;
                    }
                }
            }

            if (animation) {
                if('ontransitionend' in window) {
                    // Chrome/Saf (+ Mobile Saf)/Android
                    transitionend = 'transitionend';
                }
                else if('onwebkittransitionend' in window) {
                    // Chrome/Saf (+ Mobile Saf)/Android
                    transitionend = 'webkitTransitionEnd';
                }
            }

            return animation;
        };


    /**
     * @function animate.getPrefixes
     * @returns {object}
     */
    return function() {

        if (!probed) {
            if (detectCssPrefixes()) {
                prefixes = {
                    animationDelay: animationDelay,
                    animationDuration: animationDuration,
                    transitionDelay: transitionDelay,
                    transitionDuration: transitionDuration,
                    transform: transform,
                    transitionend: transitionend
                };
            }
            else {
                prefixes = {};
            }

            probed = true;
        }


        return prefixes;
    };
}();



var getAnimationDuration = function(){

    var parseTime       = function(str) {
            if (!str) {
                return 0;
            }
            var time = parseFloat(str);
            if (str.indexOf("ms") === -1) {
                time *= 1000;
            }
            return time;
        },

        getMaxTimeFromPair = function(max, dur, delay) {

            var i, sum, len = dur.length;

            for (i = 0; i < len; i++) {
                sum = parseTime(dur[i]) + parseTime(delay[i]);
                max = Math.max(sum, max);
            }

            return max;
        },

        pfx                 = false,
        animationDuration   = null,
        animationDelay      = null,
        transitionDuration  = null,
        transitionDelay     = null;


    /**
     * @function animate.getDuration
     * @param {Element} el
     * @returns {number}
     */
    return function(el) {

        if (pfx === false) {
            pfx = getAnimationPrefixes();
            animationDuration = pfx ? pfx.animationDuration : null;
            animationDelay = pfx ? pfx.animationDelay : null;
            transitionDuration = pfx ? pfx.transitionDuration : null;
            transitionDelay = pfx ? pfx.transitionDelay : null;
        }

        if (!pfx) {
            return 0;
        }

        var style       = window.getComputedStyle ? window.getComputedStyle(el, null) : el.style,
            duration    = 0,
            animDur     = (style[animationDuration] || '').split(','),
            animDelay   = (style[animationDelay] || '').split(','),
            transDur    = (style[transitionDuration] || '').split(','),
            transDelay  = (style[transitionDelay] || '').split(',');

        duration    = Math.max(duration, getMaxTimeFromPair(duration, animDur, animDelay));
        duration    = Math.max(duration, getMaxTimeFromPair(duration, transDur, transDelay));

        return duration;
    };

}();



var getRegExp = function(){

    var cache = {};

    /**
     * @param {String} expr
     * @returns RegExp
     */
    return function getRegExp(expr) {
        return cache[expr] || (cache[expr] = new RegExp(expr));
    };
}();



/**
 * @param {String} cls
 * @returns {RegExp}
 */
function getClsReg(cls) {
    return getRegExp('(?:^|\\s)'+cls+'(?!\\S)');
};



/**
 * @param {Element} el
 * @param {String} cls
 */
function removeClass(el, cls) {
    if (cls) {
        el.className = el.className.replace(getClsReg(cls), '');
    }
};



/**
 * @function animate.stop
 * @param {Element} el
 */
var stopAnimation = function(el) {

    var queue = data(el, "mjsAnimationQueue"),
        current,
        position,
        stages;

    if (isArray(queue) && queue.length) {
        current = queue[0];

        if (current) {
            if (current.stages) {
                position = current.position;
                stages = current.stages;
                removeClass(el, stages[position]);
                removeClass(el, stages[position] + "-active");
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

    data(el, "mjsAnimationQueue", null);
};




/**
 * @param {Element} el
 * @param {String} cls
 * @returns {boolean}
 */
function hasClass(el, cls) {
    return cls ? getClsReg(cls).test(el.className) : false;
};



/**
 * @param {Element} el
 * @param {String} cls
 */
function addClass(el, cls) {
    if (cls && !hasClass(el, cls)) {
        el.className += " " + cls;
    }
};



var raf = function() {

    var raf,
        cancel;

    if (typeof window !== strUndef) {
        var w   = window;
        raf     = w.requestAnimationFrame ||
                    w.webkitRequestAnimationFrame ||
                    w.mozRequestAnimationFrame;
        cancel  = w.cancelAnimationFrame ||
                    w.webkitCancelAnimationFrame ||
                    w.mozCancelAnimationFrame ||
                    w.webkitCancelRequestAnimationFrame;

        if (raf) {
            return function(fn, context, args) {
                var id = raf(context || args ? function(){
                    fn.apply(context, args || []);
                } : fn);
                return function() {
                    cancel(id);
                };
            };
        }
    }

    return function(fn, context, args){
        var id = async(fn, context, args, 0);
        return function(){
            clearTimeout(id);
        };
    };

}();




var animate = function(){


    var types           = {
            "show":     ["mjs-show"],
            "hide":     ["mjs-hide"],
            "enter":    ["mjs-enter"],
            "leave":    ["mjs-leave"],
            "move":     ["mjs-move"]
        },

        animId          = 0,

        prefixes        = false,
        cssAnimations   = false,

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


        cssAnimSupported= function(){
            if (prefixes === false) {
                prefixes        = getAnimationPrefixes();
                cssAnimations   = !!prefixes;
            }
            return cssAnimations;
        },



        nextInQueue     = function(el) {
            var queue = data(el, dataParam),
                next;
            if (queue.length) {
                next = queue[0];
                animationStage(next.el, next.stages, 0, next.start, next.deferred, false, next.id, next.step);
            }
            else {
                data(el, dataParam, null);
            }
        },

        animationStage  = function animationStage(el, stages, position, startCallback,
                                                  deferred, first, id, stepCallback) {

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

                if (position === stages.length) {
                    deferred.resolve(el);
                    data(el, dataParam).shift();
                    nextInQueue(el);
                }
                else {
                    data(el, dataParam)[0].position = position;
                    animationStage(el, stages, position, null, deferred, false, id, stepCallback);
                }

                removeClass(el, stages[thisPosition]);
                removeClass(el, stages[thisPosition] + "-active");
            };

            var setStage = function() {

                if (!stopped()) {

                    addClass(el, stages[position] + "-active");

                    Promise.resolve(stepCallback && stepCallback(el, position, "active"))
                        .done(function(){
                            if (!stopped()) {

                                var duration = getAnimationDuration(el);

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
                    addClass(el, stages[position]);

                    Promise.waterfall([
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
     * @function animate
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
     * @returns {MetaphorJs.Promise}
     */
    var animate = function animate(el, animation, startCallback, stepCallback) {

        var deferred    = new Promise,
            queue       = data(el, dataParam) || [],
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


            if (cssAnimSupported() && stages) {

                queue.push({
                    el: el,
                    stages: stages,
                    start: startCallback,
                    step: stepCallback,
                    deferred: deferred,
                    position: 0,
                    id: id
                });
                data(el, dataParam, queue);

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
    animate.getPrefixes = getAnimationPrefixes;
    animate.getDuration = getAnimationDuration;

    /**
     * @function animate.cssAnimationSupported
     * @returns {bool}
     */
    animate.cssAnimationSupported = cssAnimSupported;

    return animate;
}();



var parseJSON = function() {

    return typeof JSON != strUndef ?
           function(data) {
               return JSON.parse(data);
           } :
           function(data) {
               return (new Function("return " + data))();
           };
}();





function parseXML(data, type) {

    var xml, tmp;

    if (!data || !isString(data)) {
        return null;
    }

    // Support: IE9
    try {
        tmp = new DOMParser();
        xml = tmp.parseFromString(data, type || "text/xml");
    } catch (thrownError) {
        xml = undf;
    }

    if (!xml || xml.getElementsByTagName("parsererror").length) {
        throw "Invalid XML: " + data;
    }

    return xml;
};



/**
 * Modified version of YASS (http://yass.webo.in)
 */

/**
 * Returns array of nodes or an empty array
 * @function select
 * @param {String} selector
 * @param {Element} root to look into
 */
var select = function() {

    var rGeneric    = /^[\w[:#.][\w\]*^|=!]*$/,
        rQuote      = /=([^\]]+)/,
        rGrpSplit   = / *, */,
        rRepPlus    = /(\([^)]*)\+/,
        rRepTild    = /(\[[^\]]+)~/,
        rRepAll     = /(~|>|\+)/,
        rSplitPlus  = / +/,
        rSingleMatch= /([^[:.#]+)?(?:#([^[:.#]+))?(?:\.([^[:.]+))?(?:\[([^!&^*|$[:=]+)([!$^*|&]?=)?([^:\]]+)?\])?(?::([^(]+)(?:\(([^)]+)\))?)?/,
        rNthNum     = /(?:(-?\d*)n)?(?:(%|-)(\d*))?/,
        rNonDig     = /\D/,
        rRepPrnth   = /[^(]*\(([^)]*)\)/,
        rRepAftPrn  = /\(.*/,
        rGetSquare  = /\[([^!~^*|$ [:=]+)([$^*|]?=)?([^ :\]]+)?\]/,

        doc         = window.document,
        bcn         = !!doc.getElementsByClassName,
        qsa         = !!doc.querySelectorAll,

        /*
         function calls for CSS2/3 modificatos. Specification taken from
         http://www.w3.org/TR/2005/WD-css3-selectors-20051215/
         on success return negative result.
         */
        mods        = {
            /* W3C: "an E element, first child of its parent" */
            'first-child': function (child) {
                /* implementation was taken from jQuery.1.2.6, line 1394 */
                return child.parentNode.getElementsByTagName('*')[0] !== child;
            },
            /* W3C: "an E element, last child of its parent" */
            'last-child': function (child) {
                var brother = child;
                /* loop in lastChilds while nodeType isn't element */
                while ((brother = brother.nextSibling) && brother.nodeType !== 1) {}
                /* Check for node's existence */
                return !!brother;
            },
            /* W3C: "an E element, root of the document" */
            root: function (child) {
                return child.nodeName.toLowerCase() !== 'html';
            },
            /* W3C: "an E element, the n-th child of its parent" */
            'nth-child': function (child, ind) {
                var i = child.nodeIndex || 0,
                    a = ind[3] = ind[3] ? (ind[2] === '%' ? -1 : 1) * ind[3] : 0,
                    b = ind[1];
                /* check if we have already looked into siblings, using exando - very bad */
                if (i) {
                    return !( (i + a) % b);
                } else {
                    /* in the other case just reverse logic for n and loop siblings */
                    var brother = child.parentNode.firstChild;
                    i++;
                    /* looping in child to find if nth expression is correct */
                    do {
                        /* nodeIndex expando used from Peppy / Sizzle/ jQuery */
                        if (brother.nodeType === 1 && (brother.nodeIndex = ++i) && child === brother && ((i + a) % b)) {
                            return 0;
                        }
                    } while (brother = brother.nextSibling);
                    return 1;
                }
            },
            /*
             W3C: "an E element, the n-th child of its parent,
             counting from the last one"
             */
            'nth-last-child': function (child, ind) {
                /* almost the same as the previous one */
                var i = child.nodeIndexLast || 0,
                    a = ind[3] ? (ind[2] === '%' ? -1 : 1) * ind[3] : 0,
                    b = ind[1];
                if (i) {
                    return !( (i + a) % b);
                } else {
                    var brother = child.parentNode.lastChild;
                    i++;
                    do {
                        if (brother.nodeType === 1 && (brother.nodeLastIndex = i++) && child === brother && ((i + a) % b)) {
                            return 0;
                        }
                    } while (brother = brother.previousSibling);
                    return 1;
                }
            },
            /*
             Rrom w3.org: "an E element that has no children (including text nodes)".
             Thx to John, from Sizzle, 2008-12-05, line 416
             */
            empty: function (child) {
                return !!child.firstChild;
            },
            /* thx to John, stolen from Sizzle, 2008-12-05, line 413 */
            parent: function (child) {
                return !child.firstChild;
            },
            /* W3C: "an E element, only child of its parent" */
            'only-child': function (child) {
                return child.parentNode.getElementsByTagName('*').length !== 1;
            },
            /*
             W3C: "a user interface element E which is checked
             (for instance a radio-button or checkbox)"
             */
            checked: function (child) {
                return !child.checked;
            },
            /*
             W3C: "an element of type E in language "fr"
             (the document language specifies how language is determined)"
             */
            lang: function (child, ind) {
                return child.lang !== ind && doc.documentElement.lang !== ind;
            },
            /* thx to John, from Sizzle, 2008-12-05, line 398 */
            enabled: function (child) {
                return child.disabled || child.type === 'hidden';
            },
            /* thx to John, from Sizzle, 2008-12-05, line 401 */
            disabled: function (child) {
                return !child.disabled;
            },
            /* thx to John, from Sizzle, 2008-12-05, line 407 */
            selected: function(elem){
                /*
                 Accessing this property makes selected-by-default
                 options in Safari work properly.
                 */
                var tmp = elem.parentNode.selectedIndex;
                return !elem.selected;
            }
        },

        attrRegCache = {},

        getAttrReg  = function(value) {
            return attrRegCache[value] || (attrRegCache[value] = new RegExp('(^| +)' + value + '($| +)'));
        },

        attrMods    = {
            /* W3C "an E element with a "attr" attribute" */
            '': function (child, name) {
                return getAttr(child, name) !== null;
            },
            /*
             W3C "an E element whose "attr" attribute value is
             exactly equal to "value"
             */
            '=': function (child, name, value) {
                var attrValue;
                return (attrValue = getAttr(child, name)) && attrValue === value;
            },
            /*
             from w3.prg "an E element whose "attr" attribute value is
             a list of space-separated values, one of which is exactly
             equal to "value"
             */
            '&=': function (child, name, value) {
                var attrValue;
                return (attrValue = getAttr(child, name)) && getAttrReg(value).test(attrValue);
            },
            /*
             from w3.prg "an E element whose "attr" attribute value
             begins exactly with the string "value"
             */
            '^=': function (child, name, value) {
                var attrValue;
                return (attrValue = getAttr(child, name) + '') && !attrValue.indexOf(value);
            },
            /*
             W3C "an E element whose "attr" attribute value
             ends exactly with the string "value"
             */
            '$=': function (child, name, value) {
                var attrValue;
                return (attrValue = getAttr(child, name) + '') &&
                       attrValue.indexOf(value) === attrValue.length - value.length;
            },
            /*
             W3C "an E element whose "attr" attribute value
             contains the substring "value"
             */
            '*=': function (child, name, value) {
                var attrValue;
                return (attrValue = getAttr(child, name) + '') && attrValue.indexOf(value) !== -1;
            },
            /*
             W3C "an E element whose "attr" attribute has
             a hyphen-separated list of values beginning (from the
             left) with "value"
             */
            '|=': function (child, name, value) {
                var attrValue;
                return (attrValue = getAttr(child, name) + '') &&
                       (attrValue === value || !!attrValue.indexOf(value + '-'));
            },
            /* attr doesn't contain given value */
            '!=': function (child, name, value) {
                var attrValue;
                return !(attrValue = getAttr(child, name)) || !getAttrReg(value).test(attrValue);
            }
        };


    var select = function (selector, root) {

        /* clean root with document */
        root = root || doc;

        /* sets of nodes, to handle comma-separated selectors */
        var sets    = [],
            qsaErr  = null,
            idx, cls, nodes,
            i, node, ind, mod,
            attrs, attrName, eql, value;

        if (qsa && root.querySelectorAll) {
            /* replace not quoted args with quoted one -- Safari doesn't understand either */
            try {
                sets = toArray(root.querySelectorAll(selector.replace(rQuote, '="$1"')));
            }
            catch (thrownError) {
                //console.log(thrownError);
                qsaErr = true;
            }
        }

        if (!qsa || qsaErr) {

            /* quick return or generic call, missed ~ in attributes selector */
            if (rGeneric.test(selector)) {

                /*
                 some simple cases - only ID or only CLASS for the very first occurence
                 - don't need additional checks. Switch works as a hash.
                 */
                idx = 0;

                /* the only call -- no cache, thx to GreLI */
                switch (selector.charAt(0)) {

                    case '#':
                        idx = selector.slice(1);
                        sets = doc.getElementById(idx);

                        /*
                         workaround with IE bug about returning element by name not by ID.
                         Solution completely changed, thx to deerua.
                         Get all matching elements with this id
                         */
                        if (sets.id !== idx) {
                            sets = doc.all[idx];
                        }

                        sets = sets ? [sets] : [];
                        break;

                    case '.':

                        cls = selector.slice(1);

                        if (bcn) {

                            sets = toArray((idx = (sets = root.getElementsByClassName(cls)).length) ? sets : []);

                        } else {

                            /* no RegExp, thx to DenVdmj */
                            cls = ' ' + cls + ' ';

                            nodes = root.getElementsByTagName('*');
                            i = 0;

                            while (node = nodes[i++]) {
                                if ((' ' + node.className + ' ').indexOf(cls) !== -1) {
                                    sets[idx++] = node;
                                }

                            }
                            sets = idx ? sets : [];
                        }
                        break;

                    case ':':

                        nodes   = root.getElementsByTagName('*');
                        i       = 0;
                        ind     = selector.replace(rRepPrnth,"$1");
                        mod     = selector.replace(rRepAftPrn,'');

                        while (node = nodes[i++]) {
                            if (mods[mod] && !mods[mod](node, ind)) {
                                sets[idx++] = node;
                            }
                        }
                        sets = idx ? sets : [];
                        break;

                    case '[':

                        nodes   = root.getElementsByTagName('*');
                        i       = 0;
                        attrs   = rGetSquare.exec(selector);
                        attrName    = attrs[1];
                        eql     = attrs[2] || '';
                        value   = attrs[3];

                        while (node = nodes[i++]) {
                            /* check either attr is defined for given node or it's equal to given value */
                            if (attrMods[eql] && (attrMods[eql](node, attrName, value) ||
                                                  (attrName === 'class' && attrMods[eql](node, 'className', value)))) {
                                sets[idx++] = node;
                            }
                        }
                        sets = idx ? sets : [];
                        break;

                    default:
                        sets = toArray((idx = (sets = root.getElementsByTagName(selector)).length) ? sets : []);
                        break;
                }

            } else {

                /* number of groups to merge or not result arrays */
                /*
                 groups of selectors separated by commas.
                 Split by RegExp, thx to tenshi.
                 */
                var groups  = selector.split(rGrpSplit),
                    gl      = groups.length - 1, /* group counter */
                    concat  = !!gl, /* if we need to concat several groups */
                    group,
                    singles,
                    singles_length,
                    single, /* to handle RegExp for single selector */
                    ancestor, /* to remember ancestor call for next childs, default is " " */
                /* for inner looping */
                    tag, id, klass, newNodes, J, child, last, childs, item, h;

                /* loop in groups, maybe the fastest way */
                while (group = groups[gl--]) {

                    /*
                     Split selectors by space - to form single group tag-id-class,
                     or to get heredity operator. Replace + in child modificators
                     to % to avoid collisions. Additional replace is required for IE.
                     Replace ~ in attributes to & to avoid collisions.
                     */
                    singles_length = (singles = group
                        .replace(rRepPlus,"$1%")
                        .replace(rRepTild,"$1&")
                        .replace(rRepAll," $1 ").split(rSplitPlus)).length;

                    i = 0;
                    ancestor = ' ';
                    /* is cleanded up with DOM root */
                    if (root instanceof DocumentFragment) {
                        nodes = root.children;
                    }
                    else {
                        nodes = [root];
                    }

                    /*
                     John's Resig fast replace works a bit slower than
                     simple exec. Thx to GreLI for 'greed' RegExp
                     */
                    while (single = singles[i++]) {

                        /* simple comparison is faster than hash */
                        if (single !== ' ' && single !== '>' &&
                            single !== '~' && single !== '+' && nodes) {

                            single = single.match(rSingleMatch);

                            /*
                             Get all required matches from exec:
                             tag, id, class, attribute, value, modificator, index.
                             */
                            tag     = single[1] || '*';
                            id      = single[2];
                            klass   = single[3] ? ' ' + single[3] + ' ' : '';
                            attrName    = single[4];
                            eql     = single[5] || '';
                            mod     = single[7];

                            /*
                             for nth-childs modificator already transformed into array.
                             Example used from Sizzle, rev. 2008-12-05, line 362.
                             */
                            ind = mod === 'nth-child' ||
                                    mod === 'nth-last-child' ?
                                  rNthNum.exec(
                                      single[8] === 'even' && '2n' ||
                                      single[8] === 'odd' && '2n%1' ||
                                      !rNonDig.test(single[8]) && '0n%' + single[8] ||
                                      single[8]
                                  ) :
                                  single[8];

                            /* new nodes array */
                            newNodes = [];

                            /*
                             cached length of new nodes array
                             and length of root nodes
                             */
                            idx = J = 0;

                            /* if we need to mark node with expando yeasss */
                            last = i === singles_length;

                            /* loop in all root nodes */
                            while (child = nodes[J++]) {
                                /*
                                 find all TAGs or just return all possible neibours.
                                 Find correct 'children' for given node. They can be
                                 direct childs, neighbours or something else.
                                 */
                                switch (ancestor) {
                                    case ' ':
                                        if (child.getElementsByTagName) {
                                            childs = child.getElementsByTagName(tag);
                                            h = 0;
                                            while (item = childs[h++]) {
                                                /*
                                                check them for ID or Class. Also check for expando 'yeasss'
                                                to filter non-selected elements. Typeof 'string' not added -
                                                if we get element with name="id" it won't be equal to given ID string.
                                                Also check for given attributes selector.
                                                Modificator is either not set in the selector, or just has been nulled
                                                by modificator functions hash.
                                                */
                                                if ((!id || item.id === id) &&
                                                    (!klass || (' ' + item.className + ' ').indexOf(klass) != -1) &&
                                                    (!attrName || (attrMods[eql] &&
                                                            (attrMods[eql](item, attrName, single[6]) ||
                                                                (attrName === 'class' &&
                                                                attrMods[eql](item, 'className', single[6]))))) &&
                                                    !item.yeasss && !(mods[mod] ? mods[mod](item, ind) : mod)) {

                                                    /*
                                                    Need to define expando property to true for the last step.
                                                    Then mark selected element with expando
                                                    */
                                                    if (last) {
                                                        item.yeasss = 1;
                                                    }
                                                    newNodes[idx++] = item;
                                                }
                                            }
                                        }
                                        break;
                                    /* W3C: "an F element preceded by an E element" */
                                    case '~':

                                        tag = tag.toLowerCase();

                                        /* don't touch already selected elements */
                                        while ((child = child.nextSibling) && !child.yeasss) {
                                            if (child.nodeType === 1 &&
                                                (tag === '*' || child.nodeName.toLowerCase() === tag) &&
                                                (!id || child.id === id) &&
                                                (!klass || (' ' + child.className + ' ').indexOf(klass) !== -1) &&
                                                (!attrName || (attrMods[eql] &&
                                                           (attrMods[eql](item, attrName, single[6]) ||
                                                            (attrName === 'class' &&
                                                             attrMods[eql](item, 'className', single[6]))))) &&
                                                !child.yeasss &&
                                                !(mods[mod] ? mods[mod](child, ind) : mod)) {

                                                if (last) {
                                                    child.yeasss = 1;
                                                }
                                                newNodes[idx++] = child;
                                            }
                                        }
                                        break;

                                    /* W3C: "an F element immediately preceded by an E element" */
                                    case '+':
                                        while ((child = child.nextSibling) && child.nodeType !== 1) {}
                                        if (child &&
                                            (child.nodeName.toLowerCase() === tag.toLowerCase() || tag === '*') &&
                                            (!id || child.id === id) &&
                                            (!klass || (' ' + item.className + ' ').indexOf(klass) !== -1) &&
                                            (!attrName ||
                                             (attrMods[eql] && (attrMods[eql](item, attrName, single[6]) ||
                                                                (attrName === 'class' &&
                                                                 attrMods[eql](item, 'className', single[6]))))) &&
                                            !child.yeasss && !(mods[mod] ? mods[mod](child, ind) : mod)) {

                                            if (last) {
                                                child.yeasss = 1;
                                            }
                                            newNodes[idx++] = child;
                                        }
                                        break;

                                    /* W3C: "an F element child of an E element" */
                                    case '>':
                                        if (child.getElementsByTagName) {
                                            childs = child.getElementsByTagName(tag);
                                            i = 0;
                                            while (item = childs[i++]) {
                                                if (item.parentNode === child &&
                                                    (!id || item.id === id) &&
                                                    (!klass || (' ' + item.className + ' ').indexOf(klass) != -1) &&
                                                    (!attrName || (attrMods[eql] &&
                                                            (attrMods[eql](item, attrName, single[6]) ||
                                                                (attrName === 'class' &&
                                                                attrMods[eql](item, 'className', single[6]))))) &&
                                                    !item.yeasss &&
                                                    !(mods[mod] ? mods[mod](item, ind) : mod)) {

                                                    if (last) {
                                                        item.yeasss = 1;
                                                    }
                                                    newNodes[idx++] = item;
                                                }
                                            }
                                        }
                                        break;
                                }
                            }

                            /* put selected nodes in local nodes' set */
                            nodes = newNodes;

                        } else {

                            /* switch ancestor ( , > , ~ , +) */
                            ancestor = single;
                        }
                    }

                    if (concat) {
                        /* if sets isn't an array - create new one */
                        if (!nodes.concat) {
                            newNodes = [];
                            h = 0;
                            while (item = nodes[h]) {
                                newNodes[h++] = item;
                            }
                            nodes = newNodes;
                            /* concat is faster than simple looping */
                        }
                        sets = nodes.concat(sets.length === 1 ? sets[0] : sets);

                    } else {

                        /* inialize sets with nodes */
                        sets = nodes;
                    }
                }

                /* define sets length to clean up expando */
                idx = sets.length;

                /*
                 Need this looping as far as we also have expando 'yeasss'
                 that must be nulled. Need this only to generic case
                 */
                while (idx--) {
                    sets[idx].yeasss = sets[idx].nodeIndex = sets[idx].nodeIndexLast = null;
                }
            }
        }

        /* return and cache results */
        return sets;
    };

    select.is = function(el, selector) {

        var els = select(selector, el.parentNode),
            i, l;

        for (i = -1, l = els.length; ++i < l;) {
            if (els[i] === el) {
                return true;
            }
        }
        return false;
    };

    return select;
}();



// partly from jQuery serialize.js

var serializeParam = function(){

    var r20 = /%20/g,
        rbracket = /\[\]$/;

    function buildParams(prefix, obj, add) {
        var name,
            i, l, v;

        if (isArray(obj)) {
            // Serialize array item.

            for (i = 0, l = obj.length; i < l; i++) {
                v = obj[i];

                if (rbracket.test(prefix)) {
                    // Treat each array item as a scalar.
                    add(prefix, v);

                } else {
                    // Item is non-scalar (array or object), encode its numeric index.
                    buildParams(
                        prefix + "[" + ( typeof v === "object" ? i : "" ) + "]",
                        v,
                        add
                    );
                }
            }
        } else if (isPlainObject(obj)) {
            // Serialize object item.
            for (name in obj) {
                buildParams(prefix + "[" + name + "]", obj[ name ], add);
            }

        } else {
            // Serialize scalar item.
            add(prefix, obj);
        }
    }

    return function(obj) {

        var prefix,
            s = [],
            add = function( key, value ) {
                // If value is a function, invoke it and return its value
                value = isFunction(value) ? value() : (value == null ? "" : value);
                s[s.length] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
            };

        for ( prefix in obj ) {
            buildParams(prefix, obj[prefix], add);
        }

        // Return the resulting serialization
        return s.join( "&" ).replace( r20, "+" );
    };


}();


/**
 * @mixin Promise
 */
ns.register("mixin.Promise", {

    $$promise: null,

    $beforeInit: function() {
        this.$$promise = new Promise;
    },

    then: function(){
        return this.$$promise.then.apply(this.$$promise, arguments);
    },

    done: function() {
        this.$$promise.done.apply(this.$$promise, arguments);
        return this;
    },

    always: function() {
        this.$$promise.always.apply(this.$$promise, arguments);
        return this;
    },

    fail: function() {
        this.$$promise.fail.apply(this.$$promise, arguments);
        return this;
    }

});




(function(){



    var accepts     = {
            xml:        "application/xml, text/xml",
            html:       "text/html",
            script:     "text/javascript, application/javascript",
            json:       "application/json, text/javascript",
            text:       "text/plain",
            _default:   "*/*"
        },

        createXHR       = function() {

            var xhr;

            if (!window.XMLHttpRequest || !(xhr = new XMLHttpRequest())) {
                if (!(xhr = new ActiveXObject("Msxml2.XMLHTTP"))) {
                    if (!(xhr = new ActiveXObject("Microsoft.XMLHTTP"))) {
                        throw "Unable to create XHR object";
                    }
                }
            }

            return xhr;
        },

        httpSuccess     = function(r) {
            try {
                return (!r.status && location && location.protocol == "file:")
                       || (r.status >= 200 && r.status < 300)
                       || r.status === 304 || r.status === 1223; // || r.status === 0;
            } catch(thrownError){}
            return false;
        };

    return defineClass({

        $class: "ajax.transport.XHR",

        type: "xhr",
        _xhr: null,
        _deferred: null,
        _ajax: null,

        $init: function(opt, deferred, ajax) {

            var self    = this,
                xhr;

            self._xhr = xhr     = createXHR();
            self._deferred      = deferred;
            self._opt           = opt;
            self._ajax          = ajax;

            if (opt.progress) {
                xhr.onprogress = bind(opt.progress, opt.context);
            }
            if (opt.uploadProgress && xhr.upload) {
                xhr.upload.onprogress = bind(opt.uploadProgress, opt.context);
            }

            xhr.onreadystatechange = bind(self.onReadyStateChange, self);
        },

        setHeaders: function() {

            var self = this,
                opt = self._opt,
                xhr = self._xhr,
                i;

            if (opt.xhrFields) {
                for (i in opt.xhrFields) {
                    xhr[i] = opt.xhrFields[i];
                }
            }
            if (opt.data && opt.contentType) {
                xhr.setRequestHeader("Content-Type", opt.contentType);
            }
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("Accept",
                opt.dataType && accepts[opt.dataType] ?
                accepts[opt.dataType] + ", */*; q=0.01" :
                accepts._default
            );
            for (i in opt.headers) {
                xhr.setRequestHeader(i, opt.headers[i]);
            }

        },

        onReadyStateChange: function() {

            var self        = this,
                xhr         = self._xhr,
                deferred    = self._deferred;

            if (xhr.readyState === 0) {
                xhr.onreadystatechange = emptyFn;
                deferred.resolve(xhr);
                return;
            }

            if (xhr.readyState === 4) {
                xhr.onreadystatechange = emptyFn;

                if (httpSuccess(xhr)) {

                    self._ajax.processResponse(
                        isString(xhr.responseText) ? xhr.responseText : undf,
                        xhr.getResponseHeader("content-type") || ''
                    );
                }
                else {

                    xhr.responseData = null;

                    try {
                        xhr.responseData = self._ajax.returnResponse(
                            isString(xhr.responseText) ? xhr.responseText : undf,
                            xhr.getResponseHeader("content-type") || ''
                        );
                    }
                    catch (thrownErr) {}

                    deferred.reject(xhr);
                }
            }
        },

        abort: function() {
            var self    = this;
            self._xhr.onreadystatechange = emptyFn;
            self._xhr.abort();
        },

        send: function() {

            var self    = this,
                opt     = self._opt;

            try {
                self._xhr.open(opt.method, opt.url, true, opt.username, opt.password);
                self.setHeaders();
                self._xhr.send(opt.data);
            }
            catch (thrownError) {
                if (self._deferred) {
                    self._deferred.reject(thrownError);
                }
            }
        }
    });

}());





function returnTrue() {
    return true;
};



// from jQuery

var DomEvent = function(src) {

    if (src instanceof DomEvent) {
        return src;
    }

    // Allow instantiation without the 'new' keyword
    if (!(this instanceof DomEvent)) {
        return new DomEvent(src);
    }


    var self    = this;

    for (var i in src) {
        if (!self[i]) {
            try {
                self[i] = src[i];
            }
            catch (thrownError){}
        }
    }


    // Event object
    self.originalEvent = src;
    self.type = src.type;

    if (!self.target && src.srcElement) {
        self.target = src.srcElement;
    }


    var eventDoc, doc, body,
        button = src.button;

    // Calculate pageX/Y if missing and clientX/Y available
    if (self.pageX === undf && !isNull(src.clientX)) {
        eventDoc = self.target ? self.target.ownerDocument || window.document : window.document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        self.pageX = src.clientX +
                      ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
                      ( doc && doc.clientLeft || body && body.clientLeft || 0 );
        self.pageY = src.clientY +
                      ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
                      ( doc && doc.clientTop  || body && body.clientTop  || 0 );
    }

    // Add which for click: 1 === left; 2 === middle; 3 === right
    // Note: button is not normalized, so don't use it
    if ( !self.which && button !== undf ) {
        self.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
    }

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    self.isDefaultPrevented = src.defaultPrevented ||
                              src.defaultPrevented === undf &&
                                  // Support: Android<4.0
                              src.returnValue === false ?
                              returnTrue :
                              returnFalse;


    // Create a timestamp if incoming event doesn't have one
    self.timeStamp = src && src.timeStamp || (new Date).getTime();
};

// Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
extend(DomEvent.prototype, {

    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,

    preventDefault: function() {
        var e = this.originalEvent;

        this.isDefaultPrevented = returnTrue;
        e.returnValue = false;

        if ( e && e.preventDefault ) {
            e.preventDefault();
        }
    },
    stopPropagation: function() {
        var e = this.originalEvent;

        this.isPropagationStopped = returnTrue;
        e.cancelBubble = true;

        if ( e && e.stopPropagation ) {
            e.stopPropagation();
        }
    },
    stopImmediatePropagation: function() {
        var e = this.originalEvent;

        this.isImmediatePropagationStopped = returnTrue;

        if ( e && e.stopImmediatePropagation ) {
            e.stopImmediatePropagation();
        }

        this.stopPropagation();
    }
}, true, false);




function normalizeEvent(originalEvent) {
    return new DomEvent(originalEvent);
};


// from jquery.mousewheel plugin



var mousewheelHandler = function(e) {

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    var toBind = ( 'onwheel' in window.document || window.document.documentMode >= 9 ) ?
                 ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        nullLowestDeltaTimeout, lowestDelta;

    var mousewheelHandler = function(fn) {

        return function(e) {

            var event = normalizeEvent(e || window.event),
                args = slice.call(arguments, 1),
                delta = 0,
                deltaX = 0,
                deltaY = 0,
                absDelta = 0,
                offsetX = 0,
                offsetY = 0;


            event.type = 'mousewheel';

            // Old school scrollwheel delta
            if ('detail'      in event) { deltaY = event.detail * -1; }
            if ('wheelDelta'  in event) { deltaY = event.wheelDelta; }
            if ('wheelDeltaY' in event) { deltaY = event.wheelDeltaY; }
            if ('wheelDeltaX' in event) { deltaX = event.wheelDeltaX * -1; }

            // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
            if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
                deltaX = deltaY * -1;
                deltaY = 0;
            }

            // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
            delta = deltaY === 0 ? deltaX : deltaY;

            // New school wheel delta (wheel event)
            if ('deltaY' in event) {
                deltaY = event.deltaY * -1;
                delta = deltaY;
            }
            if ('deltaX' in event) {
                deltaX = event.deltaX;
                if (deltaY === 0) { delta = deltaX * -1; }
            }

            // No change actually happened, no reason to go any further
            if (deltaY === 0 && deltaX === 0) { return; }

            // Store lowest absolute delta to normalize the delta values
            absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

            if (!lowestDelta || absDelta < lowestDelta) {
                lowestDelta = absDelta;

                // Adjust older deltas if necessary
                if (shouldAdjustOldDeltas(event, absDelta)) {
                    lowestDelta /= 40;
                }
            }

            // Adjust older deltas if necessary
            if (shouldAdjustOldDeltas(event, absDelta)) {
                // Divide all the things by 40!
                delta /= 40;
                deltaX /= 40;
                deltaY /= 40;
            }

            // Get a whole, normalized value for the deltas
            delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
            deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
            deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

            // Normalise offsetX and offsetY properties
            if (this.getBoundingClientRect) {
                var boundingRect = this.getBoundingClientRect();
                offsetX = event.clientX - boundingRect.left;
                offsetY = event.clientY - boundingRect.top;
            }

            // Add information to the event object
            event.deltaX = deltaX;
            event.deltaY = deltaY;
            event.deltaFactor = lowestDelta;
            event.offsetX = offsetX;
            event.offsetY = offsetY;
            // Go ahead and set deltaMode to 0 since we converted to pixels
            // Although this is a little odd since we overwrite the deltaX/Y
            // properties with normalized deltas.
            event.deltaMode = 0;

            // Add event and delta to the front of the arguments
            args.unshift(event, delta, deltaX, deltaY);

            // Clearout lowestDelta after sometime to better
            // handle multiple device types that give different
            // a different lowestDelta
            // Ex: trackpad = 3 and mouse wheel = 120
            if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
            nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);



            return fn.apply(this, args);
        }
    };

    mousewheelHandler.events = function() {
        var doc = window.document;
        return ( 'onwheel' in doc || doc.documentMode >= 9 ) ?
               ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    };

    return mousewheelHandler;

}();



var addListener = function(){

    var fn = null,
        prefix = null;

    return function addListener(el, event, func) {

        if (fn === null) {
            if (el.addEventListener) {
                fn = "addEventListener";
                prefix = "";
            }
            else {
                fn = "attachEvent";
                prefix = "on";
            }
            //fn = el.attachEvent ? "attachEvent" : "addEventListener";
            //prefix = el.attachEvent ? "on" : "";
        }


        if (event == "mousewheel") {
            func = mousewheelHandler(func);
            var events = mousewheelHandler.events(),
                i, l;
            for (i = 0, l = events.length; i < l; i++) {
                el[fn](prefix + events[i], func, false);
            }
        }
        else {
            el[fn](prefix + event, func, false);
        }

        return func;
    }

}();




defineClass({
    $class: "ajax.transport.Script",

    type: "script",
    _opt: null,
    _deferred: null,
    _ajax: null,
    _el: null,

    $init: function(opt, deferred, ajax) {
        var self        = this;

        self._opt       = opt;
        self._ajax      = ajax;
        self._deferred  = deferred;
    },

    send: function() {

        var self    = this,
            script  = document.createElement("script");

        setAttr(script, "async", "async");
        setAttr(script, "charset", "utf-8");
        setAttr(script, "src", self._opt.url);

        addListener(script, "load", bind(self.onLoad, self));
        addListener(script, "error", bind(self.onError, self));

        document.head.appendChild(script);

        self._el = script;
    },

    onLoad: function(evt) {
        if (this._deferred) { // haven't been destroyed yet
            this._deferred.resolve(evt);
        }
    },

    onError: function(evt) {
        this._deferred.reject(evt);
    },

    abort: function() {
        var self    = this;

        if (self._el.parentNode) {
            self._el.parentNode.removeChild(self._el);
        }
    },

    destroy: function() {

        var self    = this;

        if (self._el.parentNode) {
            self._el.parentNode.removeChild(self._el);
        }
    }
});





defineClass({

    $class: "ajax.transport.IFrame",

    type: "iframe",
    _opt: null,
    _deferred: null,
    _ajax: null,
    _el: null,
    _sent: false,

    $init: function(opt, deferred, ajax) {
        var self        = this;

        self._opt       = opt;
        self._ajax      = ajax;
        self._deferred  = deferred;
    },

    send: function() {

        var self    = this,
            frame   = document.createElement("iframe"),
            id      = "frame-" + nextUid(),
            form    = self._opt.form;

        setAttr(frame, "id", id);
        setAttr(frame, "name", id);
        frame.style.display = "none";
        document.body.appendChild(frame);

        setAttr(form, "action", self._opt.url);
        setAttr(form, "target", id);

        addListener(frame, "load", bind(self.onLoad, self));
        addListener(frame, "error", bind(self.onError, self));

        self._el = frame;

        var tries = 0;

        var submit = function() {

            tries++;

            try {
                form.submit();
                self._sent = true;
            }
            catch (thrownError) {
                if (tries > 2) {
                    self._deferred.reject(thrownError);
                }
                else {
                    async(submit, null, [], 1000);
                }
            }
        };

        submit();
    },

    onLoad: function() {

        var self    = this,
            frame   = self._el,
            doc,
            data;

        if (!self._sent) {
            return;
        }

        if (self._opt && !self._opt.jsonp) {

            try {
                doc = frame.contentDocument || frame.contentWindow.document;
                data = doc.body.innerHTML;
                self._ajax.processResponse(data);
            }
            catch (thrownError) {
                self._deferred.reject(thrownError);
            }
        }
    },

    onError: function(evt) {

        if (!this._sent) {
            return;
        }

        this._deferred.reject(evt);
    },

    abort: function() {
        var self    = this;

        if (self._el.parentNode) {
            self._el.parentNode.removeChild(self._el);
        }
    },

    destroy: function() {
        var self    = this;

        if (self._el.parentNode) {
            self._el.parentNode.removeChild(self._el);
        }
    }

});









(function(){

    var rquery          = /\?/,
        rurl            = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
        rhash           = /#.*$/,
        rts             = /([?&])_=[^&]*/,
        rgethead        = /^(?:GET|HEAD)$/i,

        globalEvents    = new Observable,

        formDataSupport = !!(window && window.FormData),

        processData     = function(data, opt, ct) {

            var type        = opt ? opt.dataType : null,
                selector    = opt ? opt.selector : null,
                doc;

            if (!isString(data)) {
                return data;
            }

            ct = ct || "";

            if (type === "xml" || !type && ct.indexOf("xml") >= 0) {
                doc = parseXML(trim(data));
                return selector ? select(selector, doc) : doc;
            }
            else if (type === "html") {
                doc = parseXML(data, "text/html");
                return selector ? select(selector, doc) : doc;
            }
            else if (type == "fragment") {
                var fragment    = document.createDocumentFragment(),
                    div         = document.createElement("div");

                div.innerHTML   = data;

                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }

                return fragment;
            }
            else if (type === "json" || !type && ct.indexOf("json") >= 0) {
                return parseJSON(trim(data));
            }
            else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                globalEval(data);
            }

            return data + "";
        },


        fixUrlDomain    = function(url) {

            if (url.substr(0,1) == "/") {
                return location.protocol + "//" + location.host + url;
            }
            else {
                return url;
            }
        },

        prepareUrl  = function(url, opt) {

            url.replace(rhash, "");

            if (!opt.allowCache) {

                var stamp   = (new Date).getTime();

                url = rts.test(url) ?
                    // If there is already a '_' parameter, set its value
                      url.replace(rts, "$1_=" + stamp) :
                    // Otherwise add one to the end
                      url + (rquery.test(url) ? "&" : "?" ) + "_=" + stamp;
            }

            if (opt.data && opt.method != "POST" && !opt.contentType && (!formDataSupport || !(opt.data instanceof window.FormData))) {

                opt.data = !isString(opt.data) ? serializeParam(opt.data) : opt.data;
                url += (rquery.test(url) ? "&" : "?") + opt.data;
                opt.data = null;
            }

            return url;
        },

        data2form       = function(data, form, name) {

            var i, input, len;

            if (!isObject(data) && !isFunction(data) && name) {
                input   = document.createElement("input");
                setAttr(input, "type", "hidden");
                setAttr(input, "name", name);
                setAttr(input, "value", data);
                form.appendChild(input);
            }
            else if (isArray(data) && name) {
                for (i = 0, len = data.length; i < len; i++) {
                    data2form(data[i], form, name + "["+i+"]");
                }
            }
            else if (isObject(data)) {
                for (i in data) {
                    if (data.hasOwnProperty(i)) {
                        data2form(data[i], form, name ? name + "["+i+"]" : i);
                    }
                }
            }
        },


        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
        serializeForm   = function(form) {

            var oField, sFieldType, nFile, obj = {};

            for (var nItem = 0; nItem < form.elements.length; nItem++) {

                oField = form.elements[nItem];

                if (getAttr(oField, "name") === null) {
                    continue;
                }

                sFieldType = oField.nodeName.toUpperCase() === "INPUT" ?
                             getAttr(oField, "type").toUpperCase() : "TEXT";

                if (sFieldType === "FILE") {
                    for (nFile = 0;
                         nFile < oField.files.length;
                         obj[oField.name] = oField.files[nFile++].name){}

                } else if ((sFieldType !== "RADIO" && sFieldType !== "CHECKBOX") || oField.checked) {
                    obj[oField.name] = oField.value;
                }
            }

            return serializeParam(obj);
        },

        globalEval = function(code){
            var script, indirect = eval;
            if (code) {
                if (/^[^\S]*use strict/.test(code)) {
                    script = document.createElement("script");
                    script.text = code;
                    document.head.appendChild(script)
                        .parentNode.removeChild(script);
                } else {
                    indirect(code);
                }
            }
        };

    defineClass({

        $class: "Ajax",
        $mixins: ["mixin.Promise"],

        _jsonpName: null,
        _transport: null,
        _opt: null,
        _deferred: null,
        _promise: null,
        _timeout: null,
        _form: null,
        _removeForm: false,

        $init: function(opt) {

            if (opt.url) {
                opt.url = fixUrlDomain(opt.url);
            }

            var self        = this,
                href        = window ? window.location.href : "",
                local       = rurl.exec(href.toLowerCase()) || [],
                parts       = rurl.exec(opt.url.toLowerCase());

            self._opt       = opt;

            if (opt.crossDomain !== true && opt.ignoreCrossDomain !== true) {
                opt.crossDomain = !!(parts &&
                                     (parts[1] !== local[1] || parts[2] !== local[2] ||
                                      (parts[3] || (parts[1] === "http:" ? "80" : "443")) !==
                                      (local[3] || (local[1] === "http:" ? "80" : "443"))));
            }

            //deferred    = new Promise,
            var transport;

            if (opt.files) {
                if (!formDataSupport) {
                    opt.transport = "iframe";
                }
            }

            if (opt.transport == "iframe" && !opt.form) {
                self.createForm();
                opt.form = self._form;
            }
            else if (opt.form) {
                self._form = opt.form;
                if (opt.method == "POST" && !formDataSupport) {
                    opt.transport = "iframe";
                }
            }

            if (opt.form && opt.transport != "iframe" && opt.method == "POST") {
                if (formDataSupport) {
                    opt.data = new FormData(opt.form);
                }
                else {
                    opt.contentType = "application/x-www-form-urlencoded";
                    opt.data = serializeForm(opt.form);
                }
            }
            else if (opt.contentType == "json") {
                opt.contentType = opt.contentTypeHeader || "text/plain";
                opt.data = isString(opt.data) ? opt.data : JSON.stringify(opt.data);
            }
            else if (isPlainObject(opt.data) && opt.method == "POST" && formDataSupport) {

                var d = opt.data,
                    k;

                opt.data = new FormData;

                for (k in d) {
                    opt.data.append(k, d[k]);
                }
            }

            if (opt.files) {
                self.importFiles();
            }

            opt.url = prepareUrl(opt.url, opt);

            if ((opt.crossDomain || opt.transport == "script") && !opt.form) {
                transport   = new MetaphorJs.ajax.transport.Script(opt, self.$$promise, self);
            }
            else if (opt.transport == "iframe") {
                transport   = new MetaphorJs.ajax.transport.IFrame(opt, self.$$promise, self);
            }
            else {
                transport   = new MetaphorJs.ajax.transport.XHR(opt, self.$$promise, self);
            }

            //self._deferred      = deferred;
            self._transport     = transport;

            self.$$promise.done(function(value) {
                globalEvents.trigger("success", value);
            });
            self.$$promise.fail(function(reason) {
                globalEvents.trigger("error", reason);
            });
            self.$$promise.always(function(){
                globalEvents.trigger("end");
            });

            globalEvents.trigger("start");


            if (opt.timeout) {
                self._timeout = setTimeout(bind(self.onTimeout, self), opt.timeout);
            }

            if (opt.jsonp) {
                self.createJsonp();
            }

            if (globalEvents.trigger("before-send", opt, transport) === false) {
                //self._promise = Promise.reject();
                self.$$promise.reject();
            }
            if (opt.beforeSend && opt.beforeSend.call(opt.context, opt, transport) === false) {
                //self._promise = Promise.reject();
                self.$$promise.reject();
            }

            if (self.$$promise.isPending()) {
                async(transport.send, transport);

                //deferred.abort = bind(self.abort, self);
                self.$$promise.always(self.asyncDestroy, self);

                //self._promise = deferred;
            }
            else {
                async(self.asyncDestroy, self, [], 1000);
            }
        },

        asyncDestroy: function() {

            var self = this;

            if (self.$isDestroyed()) {
                return;
            }

            if (self.$$promise.hasListeners()) {
                async(self.asyncDestroy, self, [], 1000);
                return;
            }

            self.$destroy();
        },

        /*promise: function() {
            return this._promise;
        },*/

        abort: function(reason) {
            this.$$promise.reject(reason || "abort");
            this._transport.abort();
            //this._deferred.reject(reason || "abort");
            return this;
        },

        onTimeout: function() {
            this.abort("timeout");
        },

        getTransport: function() {
            return this._transport;
        },

        createForm: function() {

            var self    = this,
                form    = document.createElement("form");

            form.style.display = "none";
            setAttr(form, "method", self._opt.method);
            setAttr(form, "enctype", "multipart/form-data");

            data2form(self._opt.data, form, null);

            document.body.appendChild(form);

            self._form = form;
            self._removeForm = true;
        },

        importFiles: function() {

            var self    = this,
                opt     = self._opt,
                files   = opt.files,
                tr      = opt.transport,
                form    = self._form,
                data    = opt.data,
                i, l,
                j, jl,
                name,
                input,
                file,
                item;

            for (i = 0, l = files.length; i < l; i++) {

                item = files[i];

                if (isArray(item)) {
                    name = item[0];
                    file = item[1];
                }
                else {
                    if (window.File && item instanceof File) {
                        name = item.uploadName || ("upload" + (l > 1 ? "[]" : ""));
                    }
                    else {
                        name = item.name || "upload" + (l > 1 ? "[]" : "");
                    }
                    file = item;
                }

                if (!window.File || !(file instanceof File)) {
                    input = file;
                    file = null;
                }

                if (form) {
                    if (input) {
                        form.appendChild(input);
                    }
                }
                else {
                    if (file) {
                        data.append(name, file);
                    }
                    else if (input.files && input.files.length) {
                        for (j = 0, jl = input.files.length; j < jl; j++) {
                            data.append(name, input.files[j]);
                        }
                    }
                }
            }
        },

        createJsonp: function() {

            var self        = this,
                opt         = self._opt,
                paramName   = opt.jsonpParam || "callback",
                cbName      = opt.jsonpCallback || "jsonp_" + nextUid();

            opt.url += (rquery.test(opt.url) ? "&" : "?") + paramName + "=" + cbName;

            self._jsonpName = cbName;

            if (typeof window != strUndef) {
                window[cbName] = bind(self.jsonpCallback, self);
            }
            if (typeof global != strUndef) {
                global[cbName] = bind(self.jsonpCallback, self);
            }

            return cbName;
        },

        jsonpCallback: function(data) {

            var self    = this,
                res;

            try {
                res = self.processResponseData(data);
            }
            catch (thrownError) {
                if (self.$$promise) {
                    self.$$promise.reject(thrownError);
                }
                else {
                    error(thrownError);
                }
            }

            if (self.$$promise) {
                self.$$promise.resolve(res);
            }
        },

        processResponseData: function(data, contentType) {

            var self    = this,
                opt     = self._opt;

            data    = processData(data, opt, contentType);

            if (globalEvents.hasListener("process-response")) {
                globalEvents.trigger("process-response", data, self.$$promise);
            }

            if (opt.processResponse) {
                data    = opt.processResponse.call(opt.context, data, self.$$promise);
            }

            return data;
        },

        returnResponse: function(data, contentType) {

            var self    = this;

            if (!self._opt.jsonp) {
                return self.processResponseData(data, contentType);
            }

            return null;
        },

        processResponse: function(data, contentType) {

            var self        = this,
                deferred    = self.$$promise,
                result;

            if (!self._opt.jsonp) {
                try {
                    result = self.processResponseData(data, contentType)
                }
                catch (thrownError) {
                    deferred.reject(thrownError);
                }

                deferred.resolve(result);
            }
            else {
                if (!data) {
                    deferred.reject("jsonp script is empty");
                    return;
                }

                try {
                    globalEval(data);
                }
                catch (thrownError) {
                    deferred.reject(thrownError);
                }

                if (deferred.isPending()) {
                    deferred.reject("jsonp script didn't invoke callback");
                }
            }
        },

        destroy: function() {

            var self    = this;

            if (self._timeout) {
                clearTimeout(self._timeout);
            }

            if (self._form && self._form.parentNode && self._removeForm) {
                self._form.parentNode.removeChild(self._form);
            }

            self._transport.$destroy();

            if (self._jsonpName) {
                if (typeof window != strUndef) {
                    delete window[self._jsonpName];
                }
                if (typeof global != strUndef) {
                    delete global[self._jsonpName];
                }
            }
        }

    }, {

        prepareUrl: prepareUrl,
        global: globalEvents
    });


}());







/*
* Contents of this file are partially taken from jQuery
*/

var ajax = function(){

    

    var defaults    = {
            url:            null,
            data:           null,
            method:         "GET",
            headers:        null,
            username:       null,
            password:       null,
            cache:          null,
            dataType:       null, // response data type
            timeout:        0,
            contentType:    null, // request data type
            xhrFields:      null,
            jsonp:          false,
            jsonpParam:     null,
            jsonpCallback:  null,
            transport:      null,
            replace:        false,
            selector:       null,
            form:           null,
            beforeSend:     null,
            progress:       null,
            uploadProgress: null,
            processResponse:null,
            context:        null
        },

        defaultSetup    = {};


    var ajax    = function(url, opt) {

        opt = opt || {};

        if (url && !isString(url)) {
            opt = url;
        }
        else {
            opt.url = url;
        }

        if (!opt.url) {
            if (opt.form) {
                opt.url = getAttr(opt.form, "action");
            }
            if (!opt.url) {
                throw "Must provide url";
            }
        }

        extend(opt, defaultSetup, false, true);
        extend(opt, defaults, false, true);

        if (!opt.method) {
            if (opt.form) {
                opt.method = getAttr(opt.form, "method").toUpperCase() || "GET";
            }
            else {
                opt.method = "GET";
            }
        }
        else {
            opt.method = opt.method.toUpperCase();
        }

        return new MetaphorJs.Ajax(opt);
    };

    ajax.setup  = function(opt) {
        extend(defaultSetup, opt, true, true);
    };

    ajax.on     = function() {
        MetaphorJs.Ajax.global.on.apply(MetaphorJs.Ajax.global, arguments);
    };

    ajax.un     = function() {
        MetaphorJs.Ajax.global.un.apply(MetaphorJs.Ajax.global, arguments);
    };

    ajax.get    = function(url, opt) {
        opt = opt || {};
        opt.method = "GET";
        return ajax(url, opt);
    };

    ajax.post   = function(url, opt) {
        opt = opt || {};
        opt.method = "POST";
        return ajax(url, opt);
    };

    ajax.load   = function(el, url, opt) {

        opt = opt || {};

        if (!isString(url)) {
            opt = url;
        }

        opt.dataType = "fragment";

        return ajax(url, opt).done(function(fragment){
            if (opt.replace) {
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            }
            el.appendChild(fragment);
        });
    };

    ajax.loadScript = function(url) {
        return ajax(url, {transport: "script"});
    };

    ajax.submit = function(form, opt) {

        opt = opt || {};
        opt.form = form;

        return ajax(null, opt);
    };

    ajax.prepareUrl = function(url, opt) {
        return MetaphorJs.Ajax.prepareUrl(url, opt || {});
    };

    return ajax;
}();










var Template = function(){

    var observable      = new Observable,
        cache           = new Cache,
        options         = {},

        getFragmentContent  = function(frg) {
            var div = window.document.createElement("div");
            div.appendChild(clone(frg));
            return div.innerHTML;
        },

        resolveInclude  = function(cmt, tplId) {
            var frg = getTemplate(trim(tplId));
            if (!frg) {
                return "";
            }
            if (typeof frg === "string") {
                return frg;
            }
            return getFragmentContent(frg);
        },

        resolveIncludes = function(tpl) {
            return tpl.replace(/<!--\s*include (.+?)-->/ig, resolveInclude);
        },

        getTemplate     = function(tplId) {

            var tpl = cache.get(tplId),
                opt = options[tplId] || {};

            if (typeof tpl === "function") {
                tpl = tpl(tplId);
            }
            if (typeof tpl === "string" && !opt.text) {
                if (!opt.processed) {
                    tpl = processTextTemplate(tplId, tpl);
                }
                tpl = toFragment(tpl);
                cache.add(tplId, tpl);
            }
            else if (tpl && tpl.nodeType) {
                if ("content" in tpl) {
                    tpl = tpl.content;
                }
                else {
                    tpl = toFragment(tpl.childNodes);
                }
                cache.add(tplId, tpl);
            }

            return tpl;
        },

        processTextTemplate = function(tplId, tpl) {
            if (tpl.substr(0,5) === "<!--{") {
                var inx = tpl.indexOf("-->"),
                    opt = createGetter(tpl.substr(4, inx-4))({});

                options[tplId] = opt;
                options[tplId].processed = true;

                tpl = tpl.substr(inx + 3);

                if (opt.includes) {
                    tpl = resolveIncludes(tpl);
                }

                if (opt.text) {
                    return tpl;
                }
            }
            
            if (!options[tplId]) {
                options[tplId] = {};
            }

            options[tplId].processed = true;

            return toFragment(tpl);
        },

        findInPrebuilt = function(tplId) {
            if (__MetaphorJsPrebuilt['__tpls'][tplId]) {
                tpl = __MetaphorJsPrebuilt['__tpls'][tplId];
                delete __MetaphorJsPrebuilt['__tpls'][tplId];
                return tpl;
                //return processTextTemplate(tplId, tpl);
            }
        },

        findInScripts = function(tplId) {
            var tplNode = window.document.getElementById(tplId),
                tpl,
                tag;

            if (tplNode) {
                tag = tplNode.tagName.toLowerCase();
                if (tag === "script") {
                    tpl = tplNode.innerHTML;
                    tplNode.parentNode.removeChild(tplNode);
                    return tpl;
                }
                else {
                    return tplNode;
                }
            }
        },

        loadTemplate = function(tplUrl) {
            if (!cache.exists(tplUrl)) {
                return cache.add(tplUrl,
                    ajax(tplUrl, {dataType: 'fragment'})
                        .then(function(fragment){
                            return cache.add(tplUrl, fragment);
                        })
                );
            }
            return cache.get(tplUrl);
        },

        isExpression = function(str) {
            if (str.substr(0,1) === '.') {
                var second = str.substr(1,1);
                return !(second === '.' || second === '/');
            }
            return str.substr(0,1) === '{' || str.substr(0,5) === 'this.';
        };

    if (typeof __MetaphorJsPrebuilt !== "undefined" &&
                __MetaphorJsPrebuilt['__tpls']) {
        cache.addFinder(findInPrebuilt);
    }

    cache.addFinder(findInScripts);

    return defineClass({

        $class:             "Template",

        _watcher:           null,
        _tpl:               null,
        _renderer:          null,
        _initial:           true,
        _fragment:          null,
        _id:                null,
        _originalNode:      null,
        _intendedShadow:    false,
        _prevEl:            null,
        _nextEl:            null,

        scope:              null,
        node:               null,
        tpl:                null,
        url:                null,
        html:               null,
        ownRenderer:        true,
        initPromise:        null,
        tplPromise:         null,
        parentRenderer:     null,
        deferRendering:     false,
        replace:            false,
        shadow:             false,
        animate:            false,

        passAttrs:          null,

        $init: function(cfg) {

            var self    = this;

            extend(self, cfg, true, false);

            var shadowRootSupported =
                !!window.document.documentElement.createShadowRoot;

            if (!shadowRootSupported) {
                self._intendedShadow = self.shadow;
                self.shadow = false;
            }

            self.id     = nextUid();

            if (!self.scope) {
                self.scope = new Scope;
            }

            observable.createEvent("rendered-" + self.id, false, true);

            self.tpl && (self.tpl = trim(self.tpl));
            self.url && (self.url = trim(self.url));

            var node    = self.node,
                tpl     = self.tpl || self.url;

            //node && removeAttr(node, "include");

            if (self.replace && node) {
                self._prevEl = window.document.createComment(self.id + " - start");
                self._nextEl = window.document.createComment(self.id + " - end");
                var parent = node.parentNode;
                if (parent) {
                    parent.insertBefore(self._prevEl, node);
                    parent.insertBefore(self._nextEl, node.nextSibling);
                }
            }

            if (self.shadow) {
                self._originalNode = node;
                self.node = node = node.createShadowRoot();
            }

            if (!node) {
                self.deferRendering = true;
            }

            if (tpl) {

                if (node && node.firstChild && !self.shadow) {
                    data(node, "mjs-transclude", toFragment(node.childNodes));
                }

                if (isExpression(tpl)) {
                    self._watcher = createWatchable(
                        self.scope,
                        tpl,
                        self.onChange,
                        self,
                        {filterLookup: filterLookup});
                    var val = self._watcher.getLastResult();
                    if (typeof val !== "string") {
                        extend(self, val, true, false);
                    }
                }

                self.resolveTemplate();

                if (!self.deferRendering || !self.ownRenderer) {
                    self.tplPromise.done(self.applyTemplate, self);
                }
            }
            else if (self.html) {
                self._watcher = createWatchable(
                    self.scope,
                    self.html,
                    self.onHtmlChange,
                    self,
                    {filterLookup: filterLookup});

                self.initPromise    = new Promise;
                self.onHtmlChange();
            }
            else {
                if (!self.deferRendering && self.ownRenderer) {
                    self.doRender();
                }
            }

            // moved from if (tpl)
            if (self.ownRenderer && self.parentRenderer) {
                self.parentRenderer.on("destroy",
                    self.onParentRendererDestroy,
                    self);
            }

            self.scope.$on("destroy", self.onScopeDestroy, self);
        },

        setAnimation: function(state) {
            this.animate = state;
        },

        doRender: function() {
            var self = this;
            if (!self._renderer) {
                self._renderer   = new Renderer(self.node, self.scope, null, self.passAttrs);
                self._renderer.on("rendered", self.onRendered, self);
                self._renderer.on("first-node", self.onFirstNodeReported, self);
                self._renderer.process();
            }
        },

        onFirstNodeReported: function(node) {
            observable.trigger("first-node-" + this.id, node);
        },

        onRendered: function() {
            observable.trigger("rendered-" + this.id, this);
        },

        on: function(event, fn, context) {
            return observable.on(event + "-" + this.id, fn, context);
        },

        un: function(event, fn, context) {
            return observable.un(event + "-" + this.id, fn, context);
        },

        startRendering: function() {

            var self    = this,
                tpl     = self.tpl || self.url;

            if (self.deferRendering && (self.node || self.node === false)) {

                self.deferRendering = false;
                if (self.tplPromise) {
                    self.tplPromise.done(
                        tpl ? self.applyTemplate : self.doRender,
                        self
                    );
                    return self.initPromise;
                }
                else {
                    tpl ? self.applyTemplate() : self.doRender();
                }
            }

            return null;
        },

        resolveTemplate: function() {

            var self    = this,
                url     = self.url,
                tpl     = self._watcher ?
                          self._watcher.getLastResult() :
                          (self.tpl || url);

            if (self._watcher && !tpl) {
                url     = null;
            }

            if (tpl && typeof tpl !== "string") {
                tpl     = tpl.tpl || tpl.url;
                url     = null;
            }

            self.initPromise    = new Promise;
            self.tplPromise     = new Promise;

            if (self.ownRenderer) {
                self.initPromise.resolve(false);
            }

            return new Promise(function(resolve, reject){
                if (tpl || url) {

                    if (url) {
                        resolve(getTemplate(tpl) || loadTemplate(url));
                    }
                    else {
                        resolve(getTemplate(tpl) || toFragment(tpl));
                    }
                }
                else {
                    reject();
                }
            })
                .done(function(fragment){
                    self._fragment = fragment;
                    self.tplPromise.resolve();
                })
                .fail(self.initPromise.reject, self.initPromise)
                .fail(self.tplPromise.reject, self.tplPromise);
        },

        onHtmlChange: function() {
            var self    = this,
                el      = self.node;

            if (self._renderer) {
                self._renderer.$destroy();
                self._renderer = null;
            }

            var htmlVal = self._watcher.getLastResult();

            if (htmlVal) {
                self._fragment = toFragment(htmlVal);
                self.applyTemplate();
            }
            else if (el) {
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            }
        },

        onChange: function() {

            var self    = this,
                el      = self.node;

            if (self._renderer) {
                self._renderer.$destroy();
                self._renderer = null;
            }

            var tplVal = self._watcher.getLastResult();

            if (tplVal) {
                self.resolveTemplate()
                    .done(self.applyTemplate, self);
            }
            else if (el) {
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            }
        },

        doApplyTemplate: function() {

            var self    = this,
                el      = self.node,
                frg,
                children,
                i, l;

            if (el) {
                if (self.replace) {
                    var next = self._nextEl, prev = self._prevEl;
                    while (prev.parentNode && prev.nextSibling && 
                            prev.nextSibling !== next) {
                        prev.parentNode.removeChild(prev.nextSibling);
                    }
                    /*for (i = 0, l = el.length; i < l; i++) {
                        if (el[i].parentNode) {
                            el[i].parentNode.removeChild(el[i]);
                        }
                    }*/
                }
                else if (el.firstChild) {
                    while (el.firstChild) {
                        el.removeChild(el.firstChild);
                    }
                }
            }

            if (self._intendedShadow) {
                self.makeTranscludes();
            }

            if (self.replace) {

                frg = clone(self._fragment);
                children = toArray(frg.childNodes);

                if (el && el.nodeType) {
                    var transclude = el ? data(el, "mjs-transclude") : null;

                    if (transclude) {
                        var tr = select("[{transclude}], [mjs-transclude], mjs-transclude", frg);
                        if (tr.length) {
                            data(tr[0], "mjs-transclude", transclude);
                        }
                    }

                    el.parentNode && el.parentNode.removeChild(el);
                }

                self._nextEl.parentNode.insertBefore(frg, self._nextEl);
                self.node = children;
                self.initPromise.resolve(children);
            }
            else {

                if (el) {
                    el.appendChild(clone(self._fragment));
                }
                else {
                    self.node = el = clone(self._fragment);
                }
                self.initPromise.resolve(el);
            }

            observable.trigger("before-render-" + self.id, self);

            if (self.ownRenderer) {
                self.doRender();
            }
        },

        applyTemplate: function() {

            var self        = this,
                el          = self.node,
                deferred    = new Promise;

            if (!self._initial && self.animate) {
                animate(el, "leave")
                    .done(self.doApplyTemplate, self)
                    .done(deferred.resolve, deferred);
                animate(el, "enter");
            }
            else {
                self.doApplyTemplate();
                deferred.resolve();
            }

            self._initial = false;

            return deferred;
        },

        makeTranscludes: function() {

            var self    = this,
                fr      = self._fragment,
                cnts    = select("content", fr),
                el, next,
                tr, sel,
                i, l;

            for (i = 0, l = cnts.length; i < l;  i++) {

                tr      = window.document.createElement("transclude");
                el      = cnts[i];
                next    = el.nextSibling;
                sel     = getAttr(el, "select");

                sel && setAttr(tr, "select", sel);

                fr.removeChild(el);
                fr.insertBefore(tr, next);
            }
        },

        onParentRendererDestroy: function() {
            var self = this;

            if (!self.$destroyed && self._renderer &&
                !self._renderer.$destroyed) {
                self._renderer.$destroy();
            }
            self.$destroy();
        },

        onScopeDestroy: function() {
            this.$destroy();
        },

        destroy: function() {

            var self = this;

            if (self._nextEl && self._nextEl.parentNode) {
                self._nextEl.parentNode.removeChild(self._nextEl);
            }
            
            if (self._prevEl && self._prevEl.parentNode) {
                self._prevEl.parentNode.removeChild(self._prevEl);
            }

            if (self.shadow) {
                self._originalNode.createShadowRoot();
            }

            if (self._watcher) {
                if (self.html) {
                    self._watcher.unsubscribeAndDestroy(self.onHtmlChange, self);
                }
                else {
                    self._watcher.unsubscribeAndDestroy(self.onChange, self);
                }
            }
        }

    }, {
        cache: cache
    });
}();





/**
 * @param {*} val
 * @param {[]} arr
 * @returns {boolean}
 */
function inArray(val, arr) {
    return arr ? (aIndexOf.call(arr, val) !== -1) : false;
};

var htmlTags = [
    "a",
    "abbr",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "bdi",
    "bdo",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "keygen",
    "label",
    "legend",
    "li",
    "link",
    "main",
    "map",
    "mark",
    "math",
    "menu",
    "menuitem",
    "meta",
    "meter",
    "nav",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "pre",
    "progress",
    "q",
    "rb",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "script",
    "section",
    "select",
    "slot",
    "small",
    "source",
    "span",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "svg",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "u",
    "ul",
    "var",
    "video",
    "wbr"
];






/**
 * @namespace MetaphorJs
 * @class Component
 */
var Component = defineClass({

    $class: "Component",
    $mixins: ["mixin.Observable"],

    /**
     * @access protected
     * @var string
     */
    id:             null,

    originalId:     false,

    /**
     * @var Element
     * @access protected
     */
    node:           null,

    /**
     * @var boolean
     * @access private
     */
    _nodeReplaced:  false,

    /**
     * @var string
     */
    cls:            null,

    /**
     * @var string|Element
     * @access protected
     */
    renderTo:       null,

    /**
     * @var {boolean}
     */
    autoRender:     true,

    /**
     * @var bool
     * @access protected
     */
    rendered:       false,

    /**
     * @var bool
     * @access protected
     */
    hidden:         false,

    /**
     * @var bool
     * @access protected
     */
    destroyEl:      true,


    /**
     * @var {bool}
     */
    destroyScope:   false,

    /**
     * @var {Scope}
     */
    scope:          null,

    /**
     * @var {Template}
     */
    template:       null,

    /**
     * @var string
     */
    templateUrl:    null,

    /**
     * @var string
     */
    tag:            null,

    /**
     * @var string
     */
    as:             null,


    /**
     * @constructor
     * @param {object} cfg {
     *      @type string id Element id
     *      @type string|Element el
     *      @type string|Element renderTo
     *      @type bool hidden
     *      @type bool destroyEl
     * }
     */
    $init: function(cfg) {

        var self    = this;

        cfg = cfg || {};

        self.$super(cfg);

        extend(self, cfg, true, false);

        if (!self.scope) {
            self.scope = new Scope;
        }

        if (self.as) {
            self.scope[self.as] = self;
        }

        if (self.node) {
            var nodeId = getAttr(self.node, "id");
            if (nodeId) {
                self.originalId = true;
                if (!self.id) {
                    self.id = nodeId;
                }
            }
        }

        self.id = self.id || "cmp-" + nextUid();

        if (!self.node && self.node !== false) {
            self._createNode();
        }

        self.beforeInitComponent.apply(self, arguments);
        self.initComponent.apply(self, arguments);

        if (self.scope.$app){
            self.scope.$app.registerCmp(self, self.scope, "id");
        }

        var tpl = self.template,
            url = self.templateUrl;

        self._nodeReplaced = !inArray(self.node.tagName.toLowerCase(), htmlTags);

        if (!tpl || !(tpl instanceof Template)) {

            self.template = tpl = new Template({
                scope: self.scope,
                node: self.node,
                deferRendering: !tpl || self._nodeReplaced,
                ownRenderer: true,
                replace: self._nodeReplaced,
                tpl: tpl,
                url: url,
                shadow: self.constructor.$shadow,
                animate: !self.hidden && !!self.animate,
                passAttrs: self.passAttrs
            });

            self.template.on("first-node", self.onFirstNodeReported, self);
        }
        else if (tpl instanceof Template) {
            // it may have just been created
            self.template.node = self.node;
        }

        self.afterInitComponent.apply(self, arguments);

        self.template.on("rendered", self.onRenderingFinished, self);

        if (self.parentRenderer) {
            self.parentRenderer.on("destroy", self.onParentRendererDestroy, self);
        }

        if (self.node) {
            self._initElement();
        }

        if (self.autoRender) {

            if (tpl.initPromise) {
                tpl.initPromise.done(self.render, self);
            }
            else {
                self.render();
            }
        }
    },

    _createNode: function() {

        var self    = this;
        self.node   = window.document.createElement(self.tag || 'div');
    },

    _initElement: function() {

        var self    = this,
            node    = self.node;

        if (!self.originalId) {
            setAttr(node, "id", self.id);
        }

        self.initNode();
    },

    releaseNode: function() {

        var self = this,
            node = self.node;

        removeAttr(node, "cmp-id");

        if (self.cls) {
            removeClass(node, self.cls);
        }
    },

    onFirstNodeReported: function(node) {
        var self = this;
        if (self._nodeReplaced) {
            setAttr(node, "cmp-id", self.id);
            node.$$cmpId = self.id;
        }
    },

    initNode: function() {

        var self = this,
            node = self.node;

        setAttr(node, "cmp-id", self.id);
        node.$$cmpId = self.id;

        if (self.cls) {
            addClass(node, self.cls);
        }

        if (self.hidden) {
            node.style.display = "none";
        }
    },

    replaceNodeWithTemplate: function() {
        var self = this;

        if (self._nodeReplaced && self.node.parentNode) {
            removeAttr(self.node, "id");
            //self.node.parentNode.removeChild(self.node);
        }

        self.node = self.template.node;

        // document fragment
        if (self.node.nodeType === 11 || isArray(self.node)) {
            var ch = self.node.nodeType === 11 ?
                self.node.childNodes :
                self.node,
                i, l;
            for (i = 0, l = ch.length; i < l; i++) {
                if (ch[i].nodeType === 1) {
                    self.node = ch[i];
                    break;
                }
            }
        }

        self._initElement();
    },

    render: function() {

        var self        = this;

        if (self.rendered) {
            return;
        }

        if ((self._nodeReplaced && self.node !== self.template.node) ||
            !self.node) {
            self.replaceNodeWithTemplate();
        }

        self.trigger('render', self);
        self.template.startRendering();
    },

    onRenderingFinished: function() {
        var self = this;

        if ((self._nodeReplaced && self.node !== self.template.node) ||
            !self.node) {
            self.replaceNodeWithTemplate();
        }

        if (self.renderTo) {
            self.renderTo.appendChild(self.node);
        }
        else if (!isAttached(self.node)) {
            window.document.body.appendChild(self.node);
        }

        self.rendered   = true;
        self.afterRender();
        self.trigger('after-render', self);
    },


    /**
     * @access public
     * @method
     */
    show: function() {
        var self    = this;
        if (!self.hidden) {
            return;
        }
        if (self.trigger('before-show', self) === false) {
            return false;
        }

        if (!self.rendered) {
            self.render();
        }

        self.template.setAnimation(true);
        self.showApply();

        self.hidden = false;
        self.onShow();
        self.trigger("show", self);
    },

    showApply: function() {
        var self = this;
        if (self.node) {
            self.node.style.display = "block";
        }

    },

    /**
     * @access public
     * @method
     */
    hide: function() {
        var self    = this;
        if (self.hidden) {
            return;
        }
        if (self.trigger('before-hide', self) === false) {
            return false;
        }

        self.template.setAnimation(false);
        self.hideApply();

        self.hidden = true;
        self.onHide();
        self.trigger("hide", self);
    },

    hideApply: function() {
        var self = this;
        if (self.node) {
            self.node.style.display = "none";
        }
    },

    freezeByView: function(view) {
        var self = this;
        self.releaseNode();
        self.scope.$freeze();
        self.trigger("view-freeze", self, view);

    },

    unfreezeByView: function(view) {
        var self = this;
        self.initNode();
        self.scope.$unfreeze();
        self.trigger("view-unfreeze", self, view);
        self.scope.$check();
    },

    /**
     * @access public
     * @return bool
     */
    isHidden: function() {
        return this.hidden;
    },

    /**
     * @access public
     * @return bool
     */
    isRendered: function() {
        return this.rendered;
    },

    /**
     * @access public
     * @return bool
     */
    isDestroyed: function() {
        return this.destroyed;
    },

    /**
     * @access public
     * @return Element
     */
    getEl: function() {
        return this.node;
    },

    /**
     * @method
     * @access protected
     */
    beforeInitComponent:  emptyFn,

    /**
     * @method
     * @access protected
     */
    initComponent:  emptyFn,

    /**
     * @method
     * @access protected
     */
    afterInitComponent:  emptyFn,

    /**
     * @method
     * @access protected
     */
    afterRender:    emptyFn,

    /**
     * @method
     * @access protected
     */
    onShow:         emptyFn,

    /**
     * @method
     * @access protected
     */
    onHide:         emptyFn,

    onParentRendererDestroy: function() {
        this.$destroy();
    },

    destroy:      function() {

        var self    = this;

        if (self.template) {
            self.template.$destroy();
        }

        if (self.destroyEl) {
            if (self.node && isAttached(self.node)) {
                self.node.parentNode.removeChild(self.node);
            }
        }
        else if (self.node) {

            if (!self.originalId) {
                removeAttr(self.node, "id");
            }

            self.releaseNode();
        }

        if (self.destroyScope && self.scope) {
            self.scope.$destroy();
        }

        self.$super();
    }

}, {
    registerDirective: function(cmp) {
        if (typeof(cmp) === "string") {
            Directive.registerComponent(cmp);
        }
        else {
            Directive.registerComponent(cmp.prototype.$class, cmp);
        }
    }
});

/**
 * @md-end-class
 */





function isNumber(value) {
    return varType(value) === 1;
};





var Queue = (function(){


var Queue = function(cfg) {

    var self = this;

    cfg = cfg || {};

    self._queue = [];
    self._map = {};
    self.id = "$$" + nextUid();

    for (var i in cfg) {
        self[i] = cfg[i];
    }
};


Queue.REPLACE = 1;
Queue.ONCE = 2;
Queue.MULTIPLE = 3;
Queue.ONCE_EVER = 4;


extend(Queue.prototype, {

    _queue: null,
    _map: null,
    _nextRequested: false,
    _running: false,

    length: 0,
    id: null,
    async: true,
    auto: true,
    thenable: false,
    stack: false,
    context: null,
    mode: Queue.MULTIPLE,

    add: function(fn, context, args, mode, prepend, async) {

        var self    = this,
            qid     = self.id,
            id      = fn[qid] || nextUid(),
            item    = {
                id: id,
                fn: fn,
                context: context,
                args: args,
                async: async
            };

        mode = mode || self.mode;

        if (mode === Queue.ONCE_EVER && fn[qid]) {
            return fn[qid];
        }

        fn[qid] = id;

        if (self._map[id]) {
            if (mode === Queue.REPLACE) {
                self.remove(id);
            }
            else if (mode === Queue.ONCE) {
                return id;
            }
        }

        self._queue[prepend ? "unshift" : "push"](item);
        self._map[id] = item;

        self.length = self._queue.length;

        if (self.auto) {
            self.next();
        }

        return id;
    },

    append: function(fn, context, args, mode, async) {
        return this.add(fn, context, args, mode, false, async);
    },

    prepend: function(fn, context, args, mode, async) {
        return this.add(fn, context, args, mode, true, async);
    },

    remove: function(id) {
        var self = this,
            queue = self._queue,
            i, l;

        for (i = 0, l = queue.length; i < l; i++) {
            if (queue[i].id === id) {
                queue.splice(i, 1);
                break;
            }
        }
        delete self._map[id];
    },

    isEmpty: function() {
        return this.length === 0;
    },

    isRunning: function() {
        return this._running;
    },

    next: function() {

        var self    = this,
            item;

        if (self._running) {
            self._nextRequested = true;
            return;
        }

        self._nextRequested = false;

        item = self._queue[self.stack ? "pop" : "shift"]();
        self.length = self._queue.length;

        if (!item) {
            return;
        }

        self._running = true;

        delete self._map[item.id];

        if (!self.async && !item.async) {
            try {
                self._processResult(item.fn.apply(item.context || self.context, item.args || []));
            }
            catch (thrown) {
                error(thrown);
                self._finish();
                throw thrown;
            }
        }
        else {
            var timeout = 0;
            if (isNumber(item.async)) {
                timeout = item.async;
            }
            else if (isNumber(self.async)) {
                timeout = self.async;
            }

            var fn = function(){
                try {
                    self._processResult(item.fn.apply(item.context || self.context, item.args || []));
                }
                catch (thrown) {
                    error(thrown);
                    self._finish();
                    throw thrown;
                }
            };

            if (item.async === "raf" || (!item.async && self.async === "raf")) {
                raf(fn);
            }
            else {
                async(fn, null, null, timeout);
            }
        }
    },

    _processResult: function(res) {
        var self = this;
        if (self.thenable && isThenable(res)) {
            res.then(function(){self._finish()}, function(){self._finish()});
        }
        else {
            self._finish();
        }
        return res;
    },

    _finish: function() {
        var self = this;
        self._running = false;
        if (self.auto || self._nextRequested) {
            self.next();
        }
    },

    destroy: function() {

        var self = this;

        self._queue = null;
        self._map = null;
        self.context = null;
        self._nextRequested = false;
        self._running = false;
        self.next = emptyFn;

    }
}, true, false);

return Queue;
}());







var ListRenderer = defineClass({

    $class: "ListRenderer",

    id: null,

    cfg: null,
    model: null,
    itemName: null,
    tpl: null,
    renderers: null,
    parentEl: null,
    prevEl: null,
    nextEl: null,
    trackBy: null,
    trackByWatcher: null,
    animateMove: false,
    animate: false,
    trackByFn: null,
    griDelegate: null,
    tagMode: false,

    queue: null,

    buffered: false,
    bufferPlugin: null,

    $constructor: function(scope, node, expr, parentRenderer, attr) {

        var self    = this,
            cfg     = attr ? attr.config : {};

        self.cfg            = cfg;
        self.scope          = scope;

        self.tagMode        = node.nodeName.toLowerCase() === "mjs-each";
        self.animateMove    = !self.tagMode && !cfg['buffered'] &&
                                cfg["animateMove"] && animate.cssAnimationSupported();
        self.animate        = !self.tagMode && !cfg['buffered'] && cfg["animate"];
        self.id             = cfg['id'] || nextUid();

        if (self.animate) {
            self.$plugins.push(cfg['animatePlugin'] || "plugin.ListAnimated");
        }

        if (cfg['observable']) {
            self.$plugins.push(cfg['observable'] || "plugin.Observable");
        }

        if (self.tagMode) {
            cfg['buffered'] = false;
        }

        if (cfg['buffered']) {
            self.buffered = true;
            self.$plugins.push(cfg['buffered'] || "plugin.ListBuffered");
        }

        if (cfg['plugin']) {
            self.$plugins.push(cfg['plugin']);
        }

        if (cfg['trackby'] && cfg['trackby'] === 'false') {
            self.trackBy = false;
        }
    },

    $init: function(scope, node, expr, parentRenderer, attr) {

        var self = this;

        if (self.tagMode) {
            expr = getAttr(node, "value");
        }

        self.parseExpr(expr);

        self.tpl        = self.tagMode ? toFragment(node.childNodes) : node;
        self.renderers  = [];

        var cmts = Directive.commentHolders(node, self.$class + "-" + self.id);

        self.prevEl     = cmts[0];
        self.nextEl     = cmts[1];
        self.parentEl   = node.parentNode;
        self.node       = null; //node;

        self.queue      = new Queue({
            async: false, auto: true, thenable: true,
            stack: false, context: self, mode: Queue.ONCE
        });

        self.parentEl.removeChild(node);

        self.afterInit(scope, node, expr, parentRenderer, attr);

        self.queue.add(self.render, self, [toArray(self.watcher.getLastResult())]);
    },

    afterInit: function(scope, node) {

        var self        = this,
            cfg         = self.cfg;

        self.watcher    = createWatchable(scope, self.model, self.onChange, self, {filterLookup: filterLookup});
        self.trackBy    = cfg.trackby; // lowercase from attributes
        
        if (self.trackBy !== false) {
            if (self.trackBy && self.trackBy !== '$') {
                self.trackByWatcher = createWatchable(scope, self.trackBy, self.onChangeTrackBy, self, {filterLookup: filterLookup});
            }
            else if (self.trackBy !== '$' && !self.watcher.hasInputPipes()) {
                self.trackBy    = '$$'+self.watcher.id;
            }
        }

        self.griDelegate = bind(self.scopeGetRawIndex, self);
    },

    trigger: emptyFn,

    /*
     * <!-- render and re-render
     */

    render: function(list) {

        var self        = this,
            renderers   = self.renderers,
            tpl         = self.tpl,
            i, len;

        for (i = 0, len = list.length; i < len; i++) {
            renderers.push(self.createItem(tpl.cloneNode(true), list, i));
        }

        self.doRender();
    },

    doRender: function() {

        var self        = this,
            fragment    = window.document.createDocumentFragment(),
            renderers   = self.renderers,
            tm          = self.tagMode,
            i, len;

        for (i = 0, len = renderers.length; i < len; i++) {

            if (!renderers[i].hidden) {
                if (tm) {
                    fragment.appendChild(toFragment(renderers[i].el));
                }
                else {
                    fragment.appendChild(renderers[i].el);
                }
                renderers[i].attached = true;
            }
        }

        self.parentEl.insertBefore(fragment, self.nextEl);
        self.doUpdate();

        self.trigger("render", self);
    },

    doUpdate: function(start, end, action, renderOnly) {

        var self        = this,
            renderers   = self.renderers,
            index       = start || 0,
            cnt         = renderers.length,
            x           = end || cnt - 1,
            list        = self.watcher.getLastResult(),
            trackByFn   = self.getTrackByFunction();

        if (x > cnt - 1) {
            x = cnt - 1;
        }

        for (; index <= x; index++) {

            if (action && renderers[index].action !== action) {
                continue;
            }

            self.renderItem(index, renderers, list, trackByFn, renderOnly);
        }
    },

    renderItem: function(index, rs, list, trackByFn, renderOnly) {

        var self = this;

        list = list || self.watcher.getLastResult();
        rs = rs || self.renderers;
        trackByFn = trackByFn || self.getTrackByFunction();

        var item        = rs[index],
            scope       = item.scope,
            last        = rs.length - 1,
            even        = !(index % 2);

        if (renderOnly && item.rendered) {
            return;
        }

        scope.$index    = index;
        scope.$first    = index === 0;
        scope.$last     = index === last;
        scope.$even     = even;
        scope.$odd      = !even;
        scope.$trackId  = trackByFn(list[index]);
        scope.$getRawIndex = self.griDelegate;

        if (!item.renderer) {
            item.renderer  = new Renderer(item.el, scope);
            item.renderer.process();
            item.rendered = true;
        }
        else {
            scope.$check();
        }
    },


    createItem: function(el, list, index) {

        var self        = this,
            iname       = self.itemName,
            itemScope   = self.scope.$new(),
            tm          = self.tagMode;

        itemScope.$on("changed", self.scope.$check, self.scope);

        itemScope[iname]    = self.getListItem(list, index);
        el = tm ? toArray(el.childNodes) : el;

        return {
            index: index,
            action: "enter",
            el: el,
            firstEl: tm ? el[0] : el,
            lastEl: tm ? el[el.length - 1] : el,
            scope: itemScope,
            attached: false,
            rendered: false,
            hidden: false
        };
    },

    /*
     * render and re-render -->
     */

    /*
     * <!-- reflect changes
     */

    onChange: function(current, prev) {
        var self = this;
        self.queue.prepend(self.applyChanges, self, [prev], Queue.REPLACE);
    },

    applyChanges: function(prevList) {

        var self        = this,
            renderers   = self.renderers,
            tpl         = self.tpl,
            index       = 0,
            list        = toArray(self.watcher.getLastResult()),
            updateStart = null,
            animateMove = self.animateMove,
            newrs       = [],
            iname       = self.itemName,
            origrs      = renderers.slice(),
            doesMove    = false,
            prevr,
            prevrInx,
            i, len,
            r,
            action;

        if (self.trackBy === false) {
            renderers = self.renderers.slice();
            updateStart = 0;
            doesMove = false;
            for (i = 0, len = list.length; i < len; i++) {
                r = self.createItem(tpl.cloneNode(true), list, i);
                newrs.push(r);
            }
        }
        else {

            var prs  = self.watcher.getMovePrescription(prevList, self.getTrackByFunction(), list);

            // redefine renderers
            for (i = 0, len = prs.length; i < len; i++) {

                action = prs[i];

                if (isNumber(action)) {
                    prevrInx    = action;
                    prevr       = renderers[prevrInx];

                    if (prevrInx !== index && isNull(updateStart)) {
                        updateStart = i;
                    }

                    prevr.action = "move";
                    prevr.scope[iname] = self.getListItem(list, i);
                    doesMove = animateMove;

                    newrs.push(prevr);
                    renderers[prevrInx] = null;
                    index++;
                }
                else {
                    if (isNull(updateStart)) {
                        updateStart = i;
                    }
                    r = self.createItem(tpl.cloneNode(true), list, i);
                    newrs.push(r);
                    // add new elements to old renderers
                    // so that we could correctly determine positions
                }
            }
        }

        self.renderers  = newrs;

        self.reflectChanges({
            oldRenderers:   renderers,
            updateStart:    updateStart,
            newRenderers:   newrs,
            origRenderers:  origrs,
            doesMove:       doesMove
        });
    },


    reflectChanges: function(vars) {
        var self = this;
        self.applyDomPositions(vars.oldRenderers);
        self.doUpdate(vars.updateStart || 0);
        self.removeOldElements(vars.oldRenderers);
        self.trigger("change", self);
    },



    removeOldElements: function(rs) {
        var i, len, r,
            j, jl,
            self    = this,
            parent  = self.parentEl;

        for (i = 0, len = rs.length; i < len; i++) {
            r = rs[i];
            if (r && r.attached) {
                r.attached = false;
                if (!self.tagMode && r.el.parentNode) {
                    r.el.parentNode.removeChild(r.el);
                }
                else {
                    for (j = 0, jl = r.el.length; j < jl; j++) {
                        if (r.el[j].parentNode) {
                            r.el[j].parentNode.removeChild(r.el[j]);
                        }
                    }
                }
            }
            if (r && r.scope) {
                r.scope.$destroy();
            }
        }
    },


    applyDomPositions: function(oldrs) {

        var self        = this,
            rs          = self.renderers,
            parent      = self.parentEl,
            prevEl      = self.prevEl,
            tm          = self.tagMode,
            nc          = self.nextEl,
            next,
            i, l, el, r,
            j;

        /*if (nc && nc.parentNode !== parent) {
            nc = null;
        }
        //if (!nc && prevEl && prevEl.parentNode === parent) {
        //    nc = prevEl.nextSibling;
        //}*/

        for (i = 0, l = rs.length; i < l; i++) {
            r = rs[i];
            el = r.el;
            next = null;

            if (r.hidden) {
                if (el.parentNode) {
                    if (tm) {
                        el.parentNode.removeChild(toFragment(el));
                    }
                    else {
                        el.parentNode.removeChild(el);
                    }
                    r.attached = false;
                }
                continue;
            }

            for (j = Math.max(i - 1, 0); j >= 0; j--) {
                if (rs[j].attached) {
                    next = rs[j].lastEl.nextSibling;
                    break;
                    //if (next && next.parentNode === parent) {
                    //    break;
                    //}
                }
            }

            if (!next) {
                next = nc;
            }

            // positions of some elements have changed
            /*if (oldrs) {
                // oldrs looks like [obj, obj, null, obj] where nulls are instead
                // of items that were moved somewhere else
                if (oldrs && oldrs[i]) {
                    // so if item is found in oldrs[i] it means it hasn't moved
                    next = oldrs[i].lastEl.nextSibling;
                }
                // if oldrs is shorter than rs, then we put all following items
                // at the end
                else if (oldrs && oldrs.length && oldrs.length <= i) {
                    next = self.nextEl && self.nextEl.parentNode === parent ?
                           self.nextEl : null;
                }
                // if oldrs[i] === null or it is empty
                // we put the first item before nextEl and all all following
                // items after first one
                else {
                    next = i > 0 ? (rs[i - 1].lastEl.nextSibling || nc) : nc;
                }
            }
            // items were hidden/shown but positions haven't changed
            else {
                for (j = Math.max(i - 1, 0); j < l; j++) {
                    if (j === i) {
                        continue;
                    }
                    if (rs[j].attached && rs[j].lastEl.parentNode === parent) {
                        next = j < i ? rs[j].lastEl.nextSibling : rs[j].firstEl;
                        if (next.parentNode === parent) {
                            break;
                        }
                    }
                }
                if (!next) {
                    next = nc;
                }
            }

            if (next && next.parentNode !== parent) {
                next = null;
            }*/

            if (r.firstEl !== next) {
                if (next && r.lastEl.nextSibling !== next) {
                    parent.insertBefore(tm ? toFragment(el) : el, next);
                }
                else if (!next) {
                    parent.appendChild(tm ? toFragment(el) : el);
                }
            }

            r.attached = true;
        }
    },

    /*
     * reflect changes -->
     */


    /*
     * <!-- configurable item functions
     */


    getListItem: function(list, index) {
        return list[index];
    },

    onChangeTrackBy: function(val) {
        this.trackByFn = null;
        this.trackBy = val;
    },

    getTrackByFunction: function() {

        var self = this,
            trackBy;

        if (!self.trackByFn) {

            trackBy = self.trackBy;

            if (!trackBy || trackBy === '$') {
                self.trackByFn = function(item) {
                    return isPrimitive(item) ? item : undf;
                };
            }
            else if (isFunction(trackBy)) {
                self.trackByFn = trackBy;
            }
            else {
                self.trackByFn = function(item){
                    return item && !isPrimitive(item) ? item[trackBy] : undf;
                };
            }
        }

        return self.trackByFn;
    },


    scopeGetRawIndex: function(id) {

        if (id === undf) {
            return -1;
        }

        var self        = this,
            list        = self.watcher.getUnfilteredValue(),
            trackByFn   = self.getTrackByFunction(),
            i, l;

        for (i = 0, l = list.length; i < l; i++) {
            if (trackByFn(list[i]) === id) {
                return i;
            }
        }

        return -1;
    },

    /*
     * configurable item functions -->
     */



    parseExpr: function(expr) {

        var tmp = expr.split(" "),
            i, len,
            model, name,
            row;

        for (i = 0, len = tmp.length; i < len; i++) {

            row = tmp[i];

            if (row === "" || row === "in") {
                continue;
            }

            if (!name) {
                name = row;
            }
            else {
                model = tmp.slice(i).join(" ");
                break;
            }
        }

        this.model = model;
        this.itemName = name || "item";
    },


    destroy: function() {

        var self        = this,
            renderers   = self.renderers,
            i, len;

        for (i = 0, len = renderers.length; i < len; i++) {
            if (renderers[i].renderer && !renderers[i].renderer.$destroyed) {
                renderers[i].renderer.$destroy();
            }
        }

        if (self.trackByWatcher) {
            self.trackByWatcher.unsubscribeAndDestroy();
        }

        self.queue.destroy();

        if (self.watcher) {
            self.watcher.unsubscribeAndDestroy(self.onChange, self);
        }
    }

}, {
    $stopRenderer: true,
    $registerBy: "id"
});


var rParseLocation = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;




var parseLocation = function(url) {

    var matches = url.match(rParseLocation) || [],
        wl = (typeof window != "undefined" ? window.location : null) || {};

    return {
        protocol: matches[4] || wl.protocol || "http:",
        hostname: matches[11] || wl.hostname || "",
        host: ((matches[11] || "") + (matches[12] ? ":" + matches[12] : "")) || wl.host || "",
        username: matches[8] || wl.username || "",
        password: matches[9] || wl.password || "",
        port: parseInt(matches[12], 10) || wl.port || "",
        href: url,
        path: (matches[13] || "/") + (matches[16] || ""),
        pathname: matches[13] || "/",
        search: matches[16] || "",
        hash: matches[17] && matches[17] != "#" ? matches[17] : ""
    };
};

var joinLocation = function(location, opt) {

    var url = "";
    opt = opt || {};

    if (!opt.onlyPath) {
        url += location.protocol + "//";

        if (location.username && location.password) {
            url += location.username + ":" + location.password + "@";
        }

        url += location.hostname;

        if (location.hostname && location.port) {
            url += ":" + location.port;
        }
    }

    if (!opt.onlyHost) {
        url += (location.pathname || "/");

        if (location.search && location.search != "?") {
            url += location.search;
        }

        if (location.hash && location.hash != "#") {
            url += location.hash;
        }
    }

    return url;
};




var mhistory = function(){

    var win,
        history,
        location,
        observable      = new Observable,
        api             = {},
        programId       = nextUid(),
        stateKeyId      = "$$" + programId,
        currentId       = nextUid(),

        hashIdReg       = new RegExp("#" + programId + "=([A-Z0-9]+)"),

        pushState,
        replaceState,

        windowLoaded    = typeof window == "undefined",

        prevLocation    = null,

        pushStateSupported,
        hashChangeSupported,
        useHash;


    observable.createEvent("before-location-change", false);
    observable.createEvent("void-click", false);

    var initWindow = function() {
        win                 = window;
        history             = win.history;
        location            = win.location;
        pushStateSupported  = !!history.pushState;
        hashChangeSupported = "onhashchange" in win;
        useHash             = false; //pushStateSupported && (navigator.vendor || "").match(/Opera/);
        prevLocation        = extend({}, location, true, false);

    };

    var preparePushState = function(state) {
        state = state || {};
        if (!state[stateKeyId]) {
            state[stateKeyId] = nextUid();
        }
        currentId = state[stateKeyId];

        return state;
    };

    var prepareReplaceState = function(state) {
        state = state || {};
        if (!state[stateKeyId]) {
            state[stateKeyId] = currentId;
        }
        return state;
    };


    var hostsDiffer = function(prev, next) {

        if (typeof prev == "string") {
            prev = parseLocation(prev);
        }
        if (typeof next == "string") {
            next = parseLocation(next);
        }

        var canBeEmpty = ["protocol", "host", "port"],
            i, l,
            k;

        for (i = 0, l = canBeEmpty.length; i < l; i++) {
            k = canBeEmpty[i];
            if (prev[k] && next[k] && prev[k] != next[k]) {
                return true;
            }
        }

        return false;
    };

    var pathsDiffer = function(prev, next) {

        if (typeof prev == "string") {
            prev = parseLocation(prev);
        }
        if (typeof next == "string") {
            next = parseLocation(next);
        }

        return hostsDiffer(prev, next) || prev.pathname != next.pathname ||
            prev.search != next.search || prev.hash != next.hash;
    };









    var preparePath = function(url) {

        var loc = parseLocation(url);

        if (!pushStateSupported || useHash) {
            return loc.path;
        }

        return joinLocation(loc, {onlyPath: true});
    };






    var getCurrentStateId = function() {


        if (pushStateSupported) {
            return history.state ? history.state[stateKeyId] : null;
        }
        else {
            return parseOutHashStateId(location.hash).id;
        }

    };

    var parseOutHashStateId = function(hash) {

        var id = null;

        hash = hash.replace(hashIdReg, function(match, idMatch){
            id = idMatch;
            return "";
        });

        return {
            hash: hash,
            id: id
        };
    };

    var setHash = function(hash, state) {

        if (hash) {
            if (hash.substr(0,1) != '#') {
                hash = parseOutHashStateId(hash).hash;
                hash = "!" + hash + "#" + programId + "=" + currentId;
            }
            location.hash = hash;
        }
        else {
            location.hash = "";
        }
    };

    var getCurrentUrl = function() {
        var loc,
            tmp;

        if (pushStateSupported) {
            //loc = location.pathname + location.search + location.hash;
            loc = joinLocation(location);
        }
        else {
            loc = location.hash.substr(1);
            tmp = extend({}, location, true, false);

            if (loc) {

                loc = parseOutHashStateId(loc).hash;

                if (loc.substr(0, 1) == "!") {
                    loc = loc.substr(1);
                }
                var p = decodeURIComponent(loc).split("?");
                tmp.pathname = p[0];
                tmp.search = p[1] ? "?" + p[1] : "";
            }

            loc = joinLocation(tmp);
        }

        return loc;
    };


    var onLocationPush = function(url) {
        prevLocation = extend({}, location, true, false);
        triggerEvent("location-change", url);
    };

    var onLocationPop = function() {
        if (pathsDiffer(prevLocation, location)) {

            var url     = getCurrentUrl(),
                state   = history.state || {};

            triggerEvent("before-location-pop", url);

            currentId       = getCurrentStateId();
            prevLocation    = extend({}, location, true, false);

            triggerEvent("location-change", url);
        }
    };

    var triggerEvent = function triggerEvent(event, data, anchor) {
        var url     = data || getCurrentUrl(),
            loc     = parseLocation(url),
            path    = loc.pathname + loc.search + loc.hash;
        return observable.trigger(event, path, anchor, url);
    };

    var init = function() {

        initWindow();

        // normal pushState
        if (pushStateSupported) {

            //history.origPushState       = history.pushState;
            //history.origReplaceState    = history.replaceState;

            addListener(win, "popstate", onLocationPop);

            pushState = function(url, anchor, state) {
                if (triggerEvent("before-location-change", url, anchor) === false) {
                    return false;
                }
                history.pushState(preparePushState(state), null, preparePath(url));
                onLocationPush(url);
            };


            replaceState = function(url, anchor, state) {
                history.replaceState(prepareReplaceState(state), null, preparePath(url));
                onLocationPush(url);
            };

            replaceState(getCurrentUrl());
        }
        else {

            // onhashchange
            if (hashChangeSupported) {

                pushState = function(url, anchor, state) {
                    if (triggerEvent("before-location-change", url, anchor) === false) {
                        return false;
                    }
                    async(setHash, null, [preparePath(url), preparePushState(state)]);
                };

                replaceState = function(url, anchor, state) {
                    async(setHash, null, [preparePath(url), prepareReplaceState(state)]);
                };

                addListener(win, "hashchange", onLocationPop);
            }
            // iframe
            else {

                var frame   = null,
                    initialUpdate = false;

                var createFrame = function() {
                    frame   = window.document.createElement("iframe");
                    frame.src = 'about:blank';
                    frame.style.display = 'none';
                    window.document.body.appendChild(frame);
                };

                win.onIframeHistoryChange = function(val) {
                    if (!initialUpdate) {
                        async(function(){
                            setHash(val);
                            onLocationPop();
                        });
                    }
                };

                var pushFrame = function(value) {
                    var frameDoc;
                    if (frame.contentDocument) {
                        frameDoc = frame.contentDocument;
                    }
                    else {
                        frameDoc = frame.contentWindow.document;
                    }
                    frameDoc.open();
                    //update iframe content to force new history record.
                    frameDoc.write('<html><head><title>' + document.title +
                                   '</title><script type="text/javascript">' +
                                   'var hashValue = "'+value+'";'+
                                   'window.top.onIframeHistoryChange(hashValue);' +
                                   '</script>' +
                                   '</head><body>&nbsp;</body></html>'
                    );
                    frameDoc.close();
                };

                var replaceFrame = function(value) {
                    frame.contentWindow.hashValue = value;
                };


                pushState = function(url, anchor, state) {
                    if (triggerEvent("before-location-change", url, anchor) === false) {
                        return false;
                    }
                    pushFrame(preparePath(url));
                };

                replaceState = function(url, anchor, state) {
                    if (triggerEvent("before-location-change", url, anchor) === false) {
                        return false;
                    }
                    replaceFrame(preparePath(url));
                };

                var initFrame = function(){
                    createFrame();
                    initialUpdate = true;
                    pushFrame(preparePath(location.hash.substr(1)));
                    initialUpdate = false;
                };

                if (windowLoaded) {
                    initFrame();
                }
                else {
                    addListener(win, "load", initFrame);
                }
            }
        }

        addListener(window.document.documentElement, "click", function(e) {

            e = normalizeEvent(e || win.event);

            var a = e.target,
                href;

            while (a && a.nodeName.toLowerCase() != "a") {
                a = a.parentNode;
            }

            if (a && !e.isDefaultPrevented()) {

                href = getAttr(a, "href");

                if (href == "#") {

                    var res = observable.trigger("void-click", a);

                    if (!res) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }

                if (href && href.substr(0,1) != "#" && !getAttr(a, "target")) {

                    var prev = extend({}, location, true, false),
                        next = parseLocation(href);

                    if (hostsDiffer(prev, next)) {
                        return null;
                    }

                    if (pathsDiffer(prev, next)) {
                        pushState(href, a);
                    }
                    else {
                        triggerEvent("same-location", null, a);
                    }

                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }

            return null;
        });

        init = emptyFn;
    };


    addListener(window, "load", function() {
        windowLoaded = true;
    });


    return extend(api, observable.getApi(), {

        push: function(url, state) {
            init();

            var prev = extend({}, location, true, false),
                next = parseLocation(url);

            if (hostsDiffer(prev, next)) {
                return null;
            }

            if (pathsDiffer(prev, next)) {
                pushState(url, null, state);
            }
        },

        replace: function(url, state) {
            init();
            replaceState(url, null, state);
        },

        saveState: function(state) {
            init();
            replaceState(getCurrentUrl(), null, state);
        },

        mergeState: function(state) {
            this.saveState(extend({}, history.state, state, true, false));
        },

        getState: function() {
            return history.state;
        },

        getCurrentStateId: function() {
            return currentId;
        },

        current: function() {
            init();
            return getCurrentUrl();
        },

        init: function() {
            return init();
        },

        polyfill: function() {
            init();
            window.history.pushState = function(state, title, url) {
                pushState(url, null, state);
            };
            window.history.replaceState = function(state, title, url) {
                replaceState(url, null, state);
            };
        }
    });

}();




var currentUrl = mhistory.current;





var UrlParam = (function(){

    var cache = {};

    var UrlParam = defineClass({

        $mixins: ["mixin.Observable"],

        id: null,
        name: null,
        extractor: null,
        context: null,
        regexp: null,
        valueIndex: 1,
        prev: null,
        value: null,
        enabled: true,

        $init: function(cfg) {

            var self = this;

            extend(self, cfg, true, false);

            if (self.regexp && isString(self.regexp)) {
                self.regexp = getRegExp(self.regexp);
            }

            if (self.name && !self.regexp && !self.extractor) {
                self.regexp = getRegExp(self.name + "=([^&]+)");
            }

            if (!self.regexp && !self.extractor) {
                throw "Invalid UrlParam config, missing regexp or extractor";
            }

            if (self.enabled) {
                self.enabled = false;
                self.enable();
            }
        },

        enable: function() {
            var self = this;
            if (!self.enabled) {
                self.enabled = true;
                mhistory.on("location-change", self.onLocationChange, self);
                var url = currentUrl(),
                    loc = parseLocation(url);
                self.onLocationChange(loc.pathname + loc.search + loc.hash);
            }
        },

        disable: function() {
            var self = this;
            if (self.enabled) {
                self.enabled = false;
                mhistory.un("location-change", self.onLocationChange, self);
            }
        },

        onLocationChange: function(url) {

            var self = this,
                value = self.extractValue(url);

            if (self.value != value) {
                self.prev = self.value;
                self.value = value;
                self.trigger("change", value, self.prev);
            }
        },

        extractValue: function(url) {
            var self = this;
            if (self.regexp) {
                var match = url.match(self.regexp);
                return match ? match[self.valueIndex] : null;
            }
            else if (self.extractor) {
                return self.extractor.call(self.context, url);
            }
        },

        getValue: function() {
            return this.value;
        },

        getPrev: function() {
            return this.prev;
        },

        destroyIfIdle: function() {

            var self = this;
            if (!self.$$observable.hasListener()) {
                self.$destroy();
            }
        },

        destroy: function() {
            var self = this;
            self.disable();
        }

    }, {

        get: function(cfg) {
            if (cfg.id && cache[cfg.id]) {
                return cache[cfg.id];
            }
            else {
                return new UrlParam(cfg);
            }
        }

    });

    return UrlParam;
}());




function resolveComponent(cmp, cfg, scope, node, args) {

    cfg         = cfg || {};
    args        = args || [];

    scope       = scope || cfg.scope; // || new Scope;
    node        = node || cfg.node;

    cfg.scope   = cfg.scope || scope;
    cfg.node    = cfg.node || node;

    var constr      = isString(cmp) ? nsGet(cmp) : cmp;

    if (!constr) {
        throw "Component " + cmp + " not found";
    }

    if (scope && constr.$isolateScope) {
        cfg.scope   = scope = scope.$newIsolated();
    }

    var i,
        defers      = [],
        tpl         = constr.template || cfg.template || null,
        tplUrl      = constr.templateUrl || cfg.templateUrl || null,
        app         = scope ? scope.$app : null,
        gProvider   = Provider.global(),
        injectFn    = app ? app.inject : gProvider.inject,
        injectCt    = app ? app : gProvider,
        cloak       = cfg.cloak || null,
        inject      = {
            $node: node || null,
            $scope: scope || null,
            $config: cfg || null,
            $args: args || null
        };

    if (constr.resolve) {

        for (i in constr.resolve) {
            (function(name){
                var d = new Promise,
                    fn;

                defers.push(d.done(function(value){
                    inject[name] = value;
                    cfg[name] = value;
                    args.push(value);
                }));

                fn = constr.resolve[i];

                if (isFunction(fn)) {
                    d.resolve(fn(scope, node));
                }
                /*else if (isString(fn)) {
                    d.resolve(injectFn(fn));
                }*/
                else {
                    d.resolve(
                        injectFn.call(
                            injectCt, fn, null, extend({}, inject, cfg, false, false)
                        )
                    );
                }

                d.fail(function(reason){
                    if (reason instanceof Error) {
                        error(reason);
                    }
                });

            }(i));
        }
    }

    if (tpl || tplUrl) {

        cfg.template = new Template({
            scope: scope,
            node: node,
            deferRendering: true,
            ownRenderer: true,
            shadow: constr.$shadow,
            tpl: tpl,
            url: tplUrl,
            animate: !!cfg.animate
        });

        defers.push(cfg.template.initPromise);

        if (node && node.firstChild) {
            data(node, "mjs-transclude", toFragment(node.childNodes));
        }
    }

    var p;

    if (defers.length) {
        p = new Promise;

        Promise.all(defers)
            .done(function(){
                p.resolve(
                    injectFn.call(
                        injectCt, constr, null, extend({}, inject, cfg, false, false), args
                    )
                );
            })
            .fail(p.reject, p)
    }
    else {
        p = Promise.resolve(
            injectFn.call(
                injectCt, constr, null, extend({}, inject, cfg, false, false), args
            )
        );
    }

    if (node && p.isPending() && cloak !== null) {
        cloak !== true ? addClass(node, cloak) : node.style.visibility = "hidden";
        p.then(function() {
            cloak !== true ? removeClass(node, cloak) : node.style.visibility = "";
        });
    }

    if (node) {
        p.then(function(){
            removeClass(node, "mjs-cloak");
        });
    }

    return p;
};







var View = defineClass({

    $class: "View",

    /**
     * [
     *  {
     *      reg: /.../,
     *      cmp: 'Cmp.Name',
     *      params: [name, name...], // param index in array is the same as reg match number - 1
     *      template: '',
     *      isolateScope: bool
     *  }
     * ]
     */
    route: null,
    node: null,
    scope: null,
    cmp: null,
    id: null,

    currentViewId: null,
    currentComponent: null,
    cmpCache: null,
    domCache: null,
    currentView: null,

    routeMap: null,

    watchable: null,
    defaultCmp: null,

    currentCls: null,
    currentHtmlCls: null,

    scrollOnChange: true,

    animate: false,

    $init: function(cfg, attr)  {

        var self    = this;

        extend(self, cfg, true, false);

        if (attr) {
            extend(self, attr.config, true, false);
        }

        self.routeMap = {};

        var node = self.node;

        if (node && node.firstChild) {
            data(node, "mjs-transclude", toFragment(node.childNodes));
        }

        if (!self.id) {
            self.id = nextUid();
        }

        self.cmpCache = {};
        self.domCache = {};

        self.initView();

        self.scope.$app.registerCmp(self, self.scope, "id");

        if (self.route) {
            mhistory.init();
            mhistory.on("location-change", self.onLocationChange, self);
            self.initRoutes();
            self.onLocationChange();
        }
        else if (self.cmp) {
            self.watchable = createWatchable(self.scope, self.cmp, self.onCmpChange, self, {filterLookup: filterLookup});
            self.onCmpChange();
        }
    },

    initView: function() {

    },

    initRoutes: function() {

        var self = this,
            routes = self.route,
            params,
            param,
            route,
            i, l,
            j, z;
        
        if (routes) {
            for (i = 0, l = routes.length; i < l; i++) {
                route = routes[i];
                route.id = route.id || nextUid();

                if (route.params) {
                    params = {};
                    for (j = 0, z = route.params.length; j < z; j++) {
                        param = route.params[j];
                        if (param.name) {
                            params[param.name] = new UrlParam(extend({}, param, {enabled: false}, true, false));
                        }
                    }
                    route.params = params;
                }

                self.routeMap[route.id] = route;
            }
        }
    },





    onCmpChange: function() {

        var self    = this,
            cmp     = self.watchable.getLastResult() || self.defaultCmp;

        if (cmp) {
            self.setComponent(cmp);
        }
        else if (self.defaultCmp) {
            self.setComponent(self.defaultCmp);
        }
    },

    onLocationChange: function() {

        var self        = this,
            url         = currentUrl(),
            loc         = parseLocation(url),
            path        = loc.pathname + loc.search + loc.hash,
            routes      = self.route,
            def,
            i, len,
            r, matches;

        if (routes) {
            for (i = 0, len = routes.length; i < len; i++) {
                r = routes[i];

                if (r.regexp && (matches = loc.pathname.match(r.regexp))) {
                    self.resolveRoute(r, matches);
                    return;
                }
                else if (r.regexpFull && (matches = path.match(r.regexp))) {
                    self.resolveRoute(r, matches);
                    return;
                }
                if (r['default'] && !def) {
                    def = r;
                }
            }
        }

        var tmp = self.onNoMatchFound(loc);

        if (tmp) {
            if (isThenable(tmp)) {
                tmp.done(self.resolveRoute, self);
                tmp.fail(function(){
                    self.finishOnLocationChange(def);
                });
            }
            else {
                self.resolveRoute(tmp);
            }
        }
        else {
            self.finishOnLocationChange(def);
        }
    },

    finishOnLocationChange: function(def) {
        var self = this;
        if (def) {
            self.resolveRoute(def);
        }
        else if (self.defaultCmp) {
            self.setComponent(self.defaultCmp);
        }
    },

    resolveRoute: function(route, matches) {

        var self = this;

        matches = matches || [];

        if (route.resolve) {
            var promise = route.resolve.call(self, route, matches);
            if (isThenable(promise)) {
                promise.done(function(){
                    self.setRouteComponent(route, matches);
                });
            }
            else if (promise) {
                self.setRouteComponent(route, matches);
            }
        }
        else {
            self.setRouteComponent(route, matches);
        }

    },


    onNoMatchFound: function() {



    },





    clearComponent: function() {
        var self    = this,
            node    = self.node,
            cview   = self.currentView || {};

        if (self.currentCls) {
            removeClass(self.node, self.currentCls);
        }

        if (self.currentHtmlCls) {
            removeClass(window.document.documentElement, self.currentHtmlCls);
        }

        if (self.currentComponent) {

            animate(node, self.animate ? "leave" : null).done(function(){
                
                if (!cview.keepAlive) {
                    
                    if (self.currentComponent &&
                        !self.currentComponent.$destroyed &&
                        !self.currentComponent.$destroying) {
                        self.currentComponent.$destroy();
                    }
                    
                    while (node.firstChild) {
                        node.removeChild(node.firstChild);
                    }
                }
                else {
                    self.currentComponent.freezeByView(self);
                    //self.currentComponent.trigger("view-hide", self, self.currentComponent);
                    var frg = self.domCache[cview.id];
                    while (node.firstChild) {
                        frg.appendChild(node.firstChild);
                    }
                    if (cview.ttl) {
                        cview.ttlTmt = async(self.onCmpTtl, self, [cview], cview.ttl);
                    }
                }

                self.currentComponent = null;
            });
        }

    },

    onCmpTtl: function(route) {

        var self = this,
            id = route.id;
        route.ttlTmt = null;

        if (self.cmpCache[id]) {
            self.cmpCache[id].$destroy();
            delete self.cmpCache[id];
            delete self.domCache[id];
        }
    },




    toggleRouteParams: function(route, fn) {

        if (route.params) {
            for (var i in route.params) {
                route.params[i][fn]();
            }
        }
    },

    setRouteClasses: function(route) {
        var self    = this;

        if (route.cls) {
            self.currentCls = route.cls;
            addClass(self.node, route.cls);
        }
        if (route.htmlCls) {
            self.currentHtmlCls = route.htmlCls;
            addClass(window.document.documentElement, route.htmlCls);
        }
    },

    onRouteFail: function(route) {

    },

    setRouteComponent: function(route, matches) {

        var self    = this,
            node    = self.node,
            params  = route.params,
            cview   = self.currentView || {};

        if (route.id == cview.id) {
            if (self.currentComponent && self.currentComponent.onViewRepeat) {
                self.currentComponent.onViewRepeat();
            }
            return;
        }

        if (route.ttlTmt) {
            clearTimeout(route.ttlTmt);
        }

        self.beforeRouteCmpChange(route);

        self.toggleRouteParams(cview, "disable");
        self.toggleRouteParams(route, "enable");
        stopAnimation(self.node);
        self.clearComponent();

        if (cview.teardown) {
            cview.teardown(cview, route, matches);
        }

        self.setRouteClasses(route);

        self.currentView = route;

        animate(node, self.animate ? "enter" : null, function(){

            var args    = matches || [],
                cfg     = {
                    destroyEl: false,
                    node: node,
                    destroyScope: true,
                    scope: route.$isolateScope ?
                           self.scope.$newIsolated() :
                           self.scope.$new()
                };

            if (route.as) {
                cfg.as = route.as;
            }
            if (route.template) {
                cfg.template = route.template;
            }

            args.shift();

            if (params) {
                extend(cfg, params, false, false);
            }

            args.unshift(cfg);

            if (self.cmpCache[route.id]) {
                self.currentComponent = self.cmpCache[route.id];
                node.appendChild(self.domCache[route.id]);
                self.currentComponent.unfreezeByView(self);
                self.afterRouteCmpChange();
                self.afterCmpChange();
            }
            else {

                if (route.cmp) {

                    return resolveComponent(
                        route.cmp || "MetaphorJs.Component",
                        cfg,
                        cfg.scope,
                        node,
                        args
                    )
                    .done(function (newCmp) {

                        self.currentComponent = newCmp;

                        if (route.keepAlive) {
                            newCmp[self.id] = route.id;
                            self.cmpCache[route.id] = newCmp;
                            self.domCache[route.id] = window.document.createDocumentFragment();
                            newCmp.on("destroy", self.onCmpDestroy, self);
                        }

                        self.afterRouteCmpChange();
                        self.afterCmpChange();
                    })
                    .fail(function(){

                        if (route.onFail) {
                            route.onFail.call(self);
                        }
                        else {
                            self.onRouteFail(route);
                        }
                    });
                }
                else if (route.setup) {
                    route.setup(route, matches);
                }
            }
        });
    },


    onCmpDestroy: function(cmp) {

        var self = this,
            routeId = cmp[self.id];

        if (routeId && self.cmpCache[routeId]) {
            delete self.cmpCache[routeId];
            delete self.domCache[routeId];
        }
    },



    setComponent: function(cmp) {

        var self    = this,
            node    = self.node;

        self.beforeCmpChange(cmp);

        stopAnimation(self.node);
        self.clearComponent();
        self.currentView = null;

        animate(node, self.animate ? "enter" : null, function(){

            var cfg     = isObject(cmp) ? cmp : {},
                cls     = (isString(cmp) ? cmp : null) || "MetaphorJs.Component",
                scope   = cfg.scope || self.scope.$new();

            cfg.destroyEl = false;

            return resolveComponent(cls, cfg, scope, node, [cfg]).done(function(newCmp){
                self.currentComponent = newCmp;
                self.afterCmpChange();
            });

        });
    },



    beforeRouteCmpChange: function(route) {

    },

    afterRouteCmpChange: function() {

    },

    beforeCmpChange: function(cmpCls) {

    },

    afterCmpChange: function() {
        var self = this;
        if (self.scrollOnChange) {
            raf(function () {
                self.node.scrollTop = 0;
            });
        }
    },



    destroy: function() {

        var self    = this;

        self.clearComponent();

        if (self.route) {
            mhistory.un("location-change", self.onLocationChange, self);

            var i, l, j;

            for (i = 0, l = self.route.length; i < l; i++) {
                if (self.route[i].params) {
                    for (j in self.route[i].params) {
                        self.route[i].params[j].$destroy();
                    }
                }
            }

            self.route = null;
        }

        if (self.watchable) {
            self.watchable.unsubscribeAndDestroy(self.onCmpChange, self);
            self.watchable = null;
        }

        self.scope = null;
        self.currentComponent = null;

        self.$super();
    }
});








Directive.registerAttribute("app", 100, returnFalse);

function isField(el) {
    var tag	= el.nodeName.toLowerCase(),
        type = el.type;
    if (tag == 'input' || tag == 'textarea' || tag == 'select') {
        if (type != "submit" && type != "reset" && type != "button") {
            return true;
        }
    }
    return false;
};



/**
 * @param {Element} elem
 */
var getValue = function(){


    var rreturn = /\r/,

        hooks = {

        option: function(elem) {
            var val = elem.getAttribute("value") || elem.value;

            return val !== undf ?
                   val :
                   trim( elem.innerText || elem.textContent );
        },

        select: function(elem) {

            var value, option,
                options = elem.options,
                index = elem.selectedIndex,
                one = elem.type === "select-one" || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                disabled,
                i = index < 0 ?
                    max :
                    one ? index : 0;

            // Loop through all the selected options
            for ( ; i < max; i++ ) {
                option = options[ i ];

                disabled = option.disabled ||
                           option.parentNode.disabled;

                // IE6-9 doesn't update selected after form reset (#2551)
                if ((option.selected || i === index) && !disabled ) {
                    // Get the specific value for the option
                    value = getValue(option);

                    // We don't need an array for one selects
                    if ( one ) {
                        return value;
                    }

                    // Multi-Selects return an array
                    values.push( value );
                }
            }

            return values;
        },

        radio: function( elem ) {
            return isNull(elem.getAttribute("value")) ? "on" : elem.value;
        },

        checkbox: function( elem ) {
            return isNull(elem.getAttribute("value")) ? "on" : elem.value;
        }
    };

    return function(elem) {

        var hook, ret;

        hook = hooks[elem.type] || hooks[elem.nodeName.toLowerCase()];

        if (hook && (ret = hook(elem, "value")) !== undf) {
            return ret;
        }

        ret = elem.value;

        return isString(ret) ?
            // Handle most common string cases
               ret.replace(rreturn, "") :
            // Handle cases where value is null/undef or number
               ret == null ? "" : ret;

    };
}();



/**
 * @param {Element} el
 * @param {*} val
 */
var setValue = function() {

    var hooks = {
        select:  function(elem, value) {

            var optionSet, option,
                options     = elem.options,
                values      = toArray(value),
                i           = options.length,
                selected,
                setIndex    = -1;

            while ( i-- ) {
                option      = options[i];
                selected    = inArray(option.value, values);

                if (selected) {
                    setAttr(option, "selected", "selected");
                    option.selected = true;
                    optionSet = true;
                }
                else {
                    removeAttr(option, "selected");
                }

                if (!selected && !isNull(getAttr(option, "default-option"))) {
                    setIndex = i;
                }
            }

            // Force browsers to behave consistently when non-matching value is set
            if (!optionSet) {
                elem.selectedIndex = setIndex;
            }

            return values;
        }
    };

    hooks["radio"] = hooks["checkbox"] = function(elem, value) {
        if (isArray(value) ) {
            return (elem.checked = inArray(getValue(elem), value));
        }
    };


    return function(el, val) {

        if (el.nodeType !== 1) {
            return;
        }

        // Treat null/undefined as ""; convert numbers to string
        if (isNull(val)) {
            val = "";
        }
        else if (isNumber(val)) {
            val += "";
        }

        var hook = hooks[el.type] || hooks[el.nodeName.toLowerCase()];

        // If set returns undefined, fall back to normal setting
        if (!hook || hook(el, val, "value") === undf) {
            el.value = val;
        }
    };
}();


var removeListener = function(){

    var fn = null,
        prefix = null;

    return function removeListener(el, event, func) {

        if (fn === null) {
            if (el.removeEventListener) {
                fn = "removeEventListener";
                prefix = "";
            }
            else {
                fn = "detachEvent";
                prefix = "on";
            }
            //fn = el.detachEvent ? "detachEvent" : "removeEventListener";
            //prefix = el.detachEvent ? "on" : "";
        }

        el[fn](prefix + event, func);
    }
}();

var isAndroid = function(){

    var android = null;

    return function isAndroid() {

        if (android === null) {
            android = parseInt((/android (\d+)/i.exec(navigator.userAgent) || [])[1], 10) || false;
        }

        return android;
    };

}();


var isIE = function(){

    var msie;

    return function isIE() {

        if (msie === null) {
            var ua = navigator.userAgent;
            msie = parseInt((/msie (\d+)/i.exec(ua) || [])[1], 10);
            if (isNaN(msie)) {
                msie = parseInt((/trident\/.*; rv:(\d+)/i.exec(ua) || [])[1], 10) || false;
            }
        }

        return msie;
    };
}();



/**
 * @param {String} event
 * @return {boolean}
 */
var browserHasEvent = function(){

    var eventSupport = {},
        divElm;

    return function browserHasEvent(event) {
        // IE9 implements 'input' event it's so fubared that we rather pretend that it doesn't have
        // it. In particular the event is not fired when backspace or delete key are pressed or
        // when cut operation is performed.

        if (eventSupport[event] === undf) {

            if (event == 'input' && isIE() == 9) {
                return eventSupport[event] = false;
            }
            if (!divElm) {
                divElm = window.document.createElement('div');
            }

            eventSupport[event] = !!('on' + event in divElm);
        }

        return eventSupport[event];
    };
}();




var Input = function(el, changeFn, changeFnContext, cfg) {

    if (el.$$input) {
        if (changeFn) {
            el.$$input.on("change", changeFn, changeFnContext);
        }
        return el.$$input;
    }

    var self    = this;

    cfg = cfg || {};

    self.observable     = new Observable;
    self.el             = el;
    self.inputType      = el.type.toLowerCase();
    self.dataType       = cfg.type || getAttr(el, "data-type") || self.inputType;
    self.listeners      = [];

    if (changeFn) {
        self.onChange(changeFn, changeFnContext);
    }
};

extend(Input.prototype, {

    el: null,
    inputType: null,
    dataType: null,
    listeners: null,
    radio: null,
    keydownDelegate: null,
    changeInitialized: false,

    destroy: function() {

        var self        = this,
            i;

        self.observable.destroy();
        self._addOrRemoveListeners(removeListener, true);

        self.el.$$input = null;

        for (i in self) {
            if (self.hasOwnProperty(i)) {
                self[i] = null;
            }
        }
    },

    _addOrRemoveListeners: function(fn, onlyUsed) {

        var self        = this,
            type        = self.inputType,
            listeners   = self.listeners,
            radio       = self.radio,
            el          = self.el,
            used,
            i, ilen,
            j, jlen;

        for (i = 0, ilen = listeners.length; i < ilen; i++) {

            used = !!listeners[i][2];

            if (used === onlyUsed) {
                if (type === "radio") {
                    for (j = 0, jlen = radio.length; j < jlen; j++) {
                        fn(radio[j], listeners[i][0], listeners[i][1]);
                    }
                }
                else {
                    fn(el, listeners[i][0], listeners[i][1]);
                }
                listeners[i][2] = !onlyUsed;
            }
        }
    },

    initInputChange: function() {

        var self = this,
            type = self.inputType;

        if (type === "radio") {
            self.initRadioInput();
        }
        else if (type === "checkbox") {
            self.initCheckboxInput();
        }
        else {
            self.initTextInput();
        }

        self._addOrRemoveListeners(addListener, false);

        self.changeInitialized = true;
    },

    initRadioInput: function() {

        var self    = this,
            el      = self.el,
            name    = el.name,
            parent;

        if (isAttached(el)) {
            parent  = el.ownerDocument;
        }
        else {
            parent = el;
            while (parent.parentNode) {
                parent = parent.parentNode;
            }
        }

        self.radio  = select("input[name="+name+"]", parent);

        self.onRadioInputChangeDelegate = bind(self.onRadioInputChange, self);
        self.listeners.push(["click", self.onRadioInputChangeDelegate, false]);
    },

    initCheckboxInput: function() {

        var self    = this;

        self.clicked = false;

        self.onCheckboxInputChangeDelegate = bind(self.onCheckboxInputChange, self);
        self.onCheckboxInputClickDelegate = bind(self.onCheckboxInputClick, self);
        self.listeners.push(["click", self.onCheckboxInputClickDelegate, false]);
        self.listeners.push(["change", self.onCheckboxInputChangeDelegate, false]);
    },

    initTextInput: function() {

        var composing   = false,
            self        = this,
            listeners   = self.listeners,
            timeout;

        // In composition mode, users are still inputing intermediate text buffer,
        // hold the listener until composition is done.
        // More about composition events:
        // https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
        if (!isAndroid()) {

            var compositionStart    = function() {
                composing = true;
            };

            var compositionEnd  = function() {
                composing = false;
                listener();
            };

            listeners.push(["compositionstart", compositionStart, false]);
            listeners.push(["compositionend", compositionEnd, false]);
        }

        var listener = self.onTextInputChangeDelegate = function(ev) {
            if (composing) {
                return;
            }
            self.onTextInputChange(ev);
        };

        var deferListener = function(ev) {
            if (!timeout) {
                timeout = setTimeout(function() {
                    listener(ev);
                    timeout = null;
                }, 0);
            }
        };

        var keydown = function(event) {
            event = event || window.event;
            var key = event.keyCode;

            // ignore
            //    command            modifiers                   arrows
            if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
                return;
            }

            deferListener(event);
        };

        // if the browser does support "input" event, we are fine - except on
        // IE9 which doesn't fire the
        // input event on backspace, delete or cut
        if (browserHasEvent('input')) {

            listeners.push(["input", listener, false]);

        } else {

            listeners.push(["keydown", keydown, false]);

            // if user modifies input value using context menu in IE,
            // we need "paste" and "cut" events to catch it
            if (browserHasEvent('paste')) {
                listeners.push(["paste", deferListener, false]);
                listeners.push(["cut", deferListener, false]);
            }
        }


        // if user paste into input using mouse on older browser
        // or form autocomplete on newer browser, we need "change" event to catch it

        listeners.push(["change", listener, false]);
    },

    processValue: function(val) {

        switch (this.dataType) {
            case "number":
            case "float":
            case "double":
                if (val === "" || isNaN(val = parseFloat(val))) {
                    val = undf;
                }
                break;
            case "int":
            case "integer":
                if (val === "" || isNaN(val = parseInt(val, 10))) {
                    val = undf;
                }
                break;
            case "bool":
            case "boolean":
                return !(val === "false" || val === "0" || val === 0 ||
                        val === "off" || val === false || val === "");

        }

        return val;
    },

    onTextInputChange: function(ev) {

        var self    = this,
            val     = self.getValue();

        self.observable.trigger("change", self.processValue(val));
    },


    _checkboxChange: function() {
        var self    = this,
            node    = self.el;

        self.observable.trigger("change", self.processValue(
            node.checked ? (getAttr(node, "value") || true) : false)
        );
    },

    onCheckboxInputChange: function() {
        if (!this.clicked) {
            this._checkboxChange();
        }
        this.clicked = false;
    },

    onCheckboxInputClick: function() {
        this._checkboxChange();
        this.clicked = true;
    },

    onRadioInputChange: function(e) {

        e = e || window.event;

        var self    = this,
            trg     = e.target || e.srcElement;

        self.observable.trigger("change", self.processValue(trg.value));
    },

    setValue: function(val) {

        var self    = this,
            type    = self.inputType,
            radio,
            i, len;

        val = self.processValue(val);

        if (type === "radio") {

            radio = self.radio;

            for (i = 0, len = radio.length; i < len; i++) {
                radio[i].checked = self.processValue(radio[i].value) == val;
            }
        }
        else if (type === "checkbox") {
            var node        = self.el;
            node.checked    = val === true || val == self.processValue(node.value);
        }
        else {

            if (val === undf) {
                val = "";
            }

            setValue(self.el, val);
        }

        self.triggerChange();
    },

    getValue: function() {

        var self    = this,
            type    = self.inputType,
            radio,
            i, l;

        if (type === "radio") {
            radio = self.radio;
            for (i = 0, l = radio.length; i < l; i++) {
                if (radio[i].checked) {
                    return self.processValue(radio[i].value);
                }
            }
            return null;
        }
        else if (type === "checkbox") {
            return self.processValue(self.el.checked ? (getAttr(self.el, "value") || true) : false);
        }
        else {
            return self.processValue(getValue(self.el));
        }
    },


    onChange: function(fn, context) {
        var self = this;
        if (!self.changeInitialized) {
            self.initInputChange();
        }
        this.observable.on("change", fn, context);
    },

    unChange: function(fn, context) {
        this.observable.un("change", fn, context);
    },


    onKey: function(key, fn, context, args) {

        var self = this;

        if (!self.keydownDelegate) {
            self.keydownDelegate = bind(self.keyHandler, self);
            self.listeners.push(["keydown", self.keydownDelegate, false]);
            addListener(self.el, "keydown", self.keydownDelegate);
            self.observable.createEvent("key", false, false, self.keyEventFilter);
        }

        self.observable.on("key", fn, context, {
            key: key,
            prepend: args
        });
    },

    unKey: function(key, fn, context) {

        var self    = this;
        self.observable.un("key", fn, context);
    },

    keyEventFilter: function(l, args) {

        var key = l.key,
            e = args[0];

        if (typeof key !== "object") {
            return key === e.keyCode;
        }
        else {
            if (key.ctrlKey !== undf && key.ctrlKey !== e.ctrlKey) {
                return false;
            }
            if (key.shiftKey !== undf && key.shiftKey !== e.shiftKey) {
                return false;
            }
            return !(key.keyCode !== undf && key.keyCode !== e.keyCode);
        }
    },

    keyHandler: function(event) {

        var e       = normalizeEvent(event || window.event),
            self    = this;

        self.observable.trigger("key", e);
    },

    triggerChange: function() {
        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", false, true);
            this.el.dispatchEvent(evt);
        }
        else {
            this.el.fireEvent("onchange");
        }
    }


}, true, false);


Input.get = function(node, scope) {
    if (node.$$input) {
        return node.$$input;
    }
    if (scope && !node.type) {
        var cmp = scope.$app.getParentCmp(node, true);
        if (cmp && cmp.getInputInterface) {
            return cmp.getInputInterface();
        }
    }
    return new Input(node);
};

Input.getValue = getValue;
Input.setValue = setValue;








Directive.registerAttribute("bind", 1000, Directive.$extend({

    $class: "Directive.attr.Bind",
    isInput: false,
    input: null,
    lockInput: null,
    recursive: false,
    textRenderer: null,

    $init: function(scope, node, expr, renderer, attr) {

        var self    = this,
            cfg     = attr ? attr.config : {};

        self.isInput    = isField(node);
        self.recursive  = !!cfg.recursive;
        self.locked     = !!cfg.locked;

        if (self.isInput) {
            //self.input  = new Input(node, self.onInputChange, self);
            self.input = Input.get(node);
            self.input.onChange(self.onInputChange, self);
        }

        if (self.recursive) {
            self.scope  = scope;
            self.node   = node;
            self.textRenderer = new TextRenderer(scope, '{{' + expr + '}}', {recursive: true});
            self.textRenderer.subscribe(self.onTextRendererChange, self);
            self.onTextRendererChange();

            if (scope instanceof Scope) {
                scope.$on("destroy", self.onScopeDestroy, self);
            }
        }
        else {
            self.$super(scope, node, expr);
        }
    },

    onInputChange: function(val) {

        var self = this;
        if (self.locked && val != self.watcher.getLastResult()) {
            self.onChange();
        }
    },

    onTextRendererChange: function() {
        var self    = this;
        self.updateElement(self.textRenderer.getString());
    },

    onChange: function() {
        var self    = this,
            val     = self.watcher.getLastResult();

        self.updateElement(val);
    },

    updateElement: function(val) {

        var self = this;

        if (self.isInput) {
            self.input.setValue(val);
        }
        else {
            self.node[typeof self.node.textContent === "string" ? "textContent" : "innerText"] = val;
        }
    },

    destroy: function() {

        var self    = this;

        if (self.textRenderer) {
            self.textRenderer.$destroy();
            self.textRenderer = null;
        }

        if (self.input) {
            self.input.destroy();
            self.input = null;
        }

        self.$super();
    }
}));






Directive.registerAttribute("bind-html", 1000, defineClass({

    $class: "Directive.attr.BindHtml",
    $extends: "Directive.attr.Bind",

    updateElement: function(val) {
        this.node.innerHTML = val;
    }
}));






/*

value is always an object in the end
{class: "condition", class: "condition"}

array turns into _: []
{_: [class, class]}
(which is then turned into {class: true, class: true}


DO NOT put class="{}" when using class.name="{}"

 */


(function(){

    var toggleClass = function(node, cls, toggle, doAnim) {

        var has;

        if (toggle !== null) {
            if (toggle === hasClass(node, cls)) {
                return;
            }
            has = !toggle;
        }
        else {
            has = hasClass(node, cls);
        }

        if (has) {
            if (doAnim) {
                animate(node, [cls + "-remove"]).done(function(){
                    removeClass(node, cls);
                });
            }
            else {
                removeClass(node, cls);
            }
        }
        else {
            if (doAnim) {
                animate(node, [cls + "-add"]).done(function(){
                    addClass(node, cls);
                });
            }
            else {
                addClass(node, cls);
            }
        }
    };

    var flatten = function(obj) {

        var list = {},
            i, j, l;

        if (!obj) {
            return list;
        }

        if (isString(obj)) {
            list[obj] = true;
        }
        else if (isArray(obj)) {
            for (i = -1, l = obj.length; ++i < l; list[obj[i]] = true){}
        }
        else {
            for (i in obj) {
                if (i === '_') {
                    for (j = -1, l = obj._.length; ++j < l;
                         list[obj._[j]] = true){}
                }
                else {
                    list[i] = obj[i];
                }
            }
        }

        return list;
    };

    Directive.registerAttribute("class", 1000, defineClass({

        $class: "Directive.attr.Class",
        $extends: Directive,
        initial: true,
        animate: false,

        $init: function(scope, node, expr, renderer, attr) {

            var self = this, 
                values = attr ? attr.values : null,
                cfg = attr ? attr.config : {},
                k,
                parts;

            self.animate = !!cfg.animate;

            if (values) {
                parts = [];
                if (expr) {
                    if (expr.substr(0,1) != '[') {
                        expr = '[' + expr + ']';
                    }
                    parts.push('_: ' + expr);
                }
                for (k in values) {
                    parts.push("'" + k + "'" + ': ' + values[k]);
                }
                expr = '{' + parts.join(', ') + '}';
            }

            this.$super(scope, node, expr);
        },

        onChange: function() {

            var self    = this,
                node    = self.node,
                clss    = flatten(self.watcher.getLastResult()),
                prev    = flatten(self.watcher.getPrevValue()),
                i;

            stopAnimation(node);

            for (i in prev) {
                if (prev.hasOwnProperty(i)) {
                    if (clss[i] === undf) {
                        toggleClass(node, i, false, false);
                    }
                }
            }

            for (i in clss) {
                if (clss.hasOwnProperty(i)) {
                    toggleClass(node, i, !!clss[i], !self.initial && self.animate);
                }
            }

            self.initial = false;
        }
    }));

}());



(function(){

    var cmpAttr = function(scope, node, cmpName, parentRenderer, attr){

        var constr  = typeof cmpName === "string" ?
                        nsGet(cmpName, true) : cmpName,
            nodecfg = attr ? attr.config : {};

        if (!constr) {
            throw "Component " + cmpName + " not found";
        }

        var sameScope       = nodecfg.sameScope || constr.$sameScope,
            isolateScope    = nodecfg.isolateScope || constr.$isolateScope;

        var newScope = isolateScope ? scope.$newIsolated() : (sameScope ? scope : scope.$new());

        var cfg     = extend({
            scope: newScope,
            node: node,
            parentRenderer: parentRenderer,
            destroyScope: !sameScope
        }, nodecfg, false, false);

        resolveComponent(cmpName, cfg, newScope, node, [cfg])
            .done(function(cmp){
                if (nodecfg.ref) {
                    scope[nodecfg.ref] = cmp;
                }
            });

        return constr.$resumeRenderer || !!constr.$shadow;
    };

    cmpAttr.$breakScope = false;

    Directive.registerAttribute("cmp", 200, cmpAttr);

}());



var evaluate = Watchable.eval;






(function(){

    var types = [];

    function detectModelType(expr, scope) {
        var tmp = expr.split(" in "),
            model = tmp.length === 1 ? expr : tmp[1],
            obj = evaluate(model, scope, {filterLookup: filterLookup}),
            i = 0,
            l = types.length;

        for (; i < l; i++) {
            if (obj instanceof types[i][0]) {
                return types[i][1]
            }
        }

        return null;
    }

    var eachDirective = function eachDirective(scope, node, expr, parentRenderer, attr) {
        var tagMode = node.nodeName.toLowerCase() === "mjs-each";
        if (tagMode) {
            expr = getAttr(node, "value");
        }
        var handler = detectModelType(expr, scope) || ListRenderer;
        return new handler(scope, node, expr, parentRenderer, attr);
    };


    eachDirective.registerType = function(objectClass, handlerClass) {
        types.push([objectClass, handlerClass]);
    };

    eachDirective.$stopRenderer = true;
    eachDirective.$registerBy = "id";

    eachDirective.registerType(Array, ListRenderer);

    Directive.registerAttribute("each", 100, eachDirective);
    Directive.registerTag("each", eachDirective);

}());




var getStyle = function(node, prop, numeric) {

    var style, val;

    if (window.getComputedStyle) {

        if (node === window) {
            return prop? (numeric ? 0 : null) : {};
        }
        style = getComputedStyle(node, null);
        val = prop ? style[prop] : style;
    }
    else {
        style = node.currentStyle || node.style || {};
        val = prop ? style[prop] : style;
    }

    return numeric ? parseFloat(val) || 0 : val;

};



var boxSizingReliable = function() {

    var boxSizingReliableVal;

    var computePixelPositionAndBoxSizingReliable = function() {

        var doc = window.document,
            container = doc.createElement("div"),
            div = doc.createElement("div"),
            body = doc.body;

        if (!div.style || !window.getComputedStyle) {
            return false;
        }

        container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" +
                                  "position:absolute";
        container.appendChild(div);

        div.style.cssText =
            // Support: Firefox<29, Android 2.3
            // Vendor-prefix box-sizing
        "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" +
        "box-sizing:border-box;display:block;margin-top:1%;top:1%;" +
        "border:1px;padding:1px;width:4px;position:absolute";
        div.innerHTML = "";
        body.appendChild(container);

        var divStyle = window.getComputedStyle(div, null),
            ret = divStyle.width === "4px";

        body.removeChild(container);

        return ret;
    };

    return function boxSizingReliable() {
        if (boxSizingReliableVal === undf) {
            boxSizingReliableVal = computePixelPositionAndBoxSizingReliable();
        }

        return boxSizingReliableVal;
    };
}();

// from jQuery



var getDimensions = function(type, name) {

    var rnumnonpx = new RegExp( "^([+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|))(?!px)[a-z%]+$", "i"),
        cssExpand = [ "Top", "Right", "Bottom", "Left" ],
        defaultExtra = !type ? "content" : (type === "inner" ? "padding" : "");

    var augmentWidthOrHeight = function(elem, name, extra, isBorderBox, styles) {
        var i = extra === (isBorderBox ? "border" : "content") ?
                // If we already have the right measurement, avoid augmentation
                4 :
                // Otherwise initialize for horizontal or vertical properties
                name === "width" ? 1 : 0,

            val = 0;

        for (; i < 4; i += 2) {
            // Both box models exclude margin, so add it if we want it
            if (extra === "margin") {
                val += parseFloat(styles[extra + cssExpand[i]]);
            }

            if (isBorderBox) {
                // border-box includes padding, so remove it if we want content
                if (extra === "content") {
                    val -= parseFloat(styles["padding" + cssExpand[i]]);
                }

                // At this point, extra isn't border nor margin, so remove border
                if (extra !== "margin") {
                    val -= parseFloat(styles["border" + cssExpand[i] + "Width"]);
                }
            } else {
                // At this point, extra isn't content, so add padding
                val += parseFloat(styles["padding" + cssExpand[i]]);

                // At this point, extra isn't content nor padding, so add border
                if (extra !== "padding") {
                    val += parseFloat(styles["border" + cssExpand[i] + "Width"]);
                }
            }
        }

        return val;
    };

    var getWidthOrHeight = function(elem, name, extra, styles) {

        // Start with offset property, which is equivalent to the border-box value
        var valueIsBorderBox = true,
            val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
            isBorderBox = styles["boxSizing"] === "border-box";

        // Some non-html elements return undefined for offsetWidth, so check for null/undefined
        // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
        // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
        if ( val <= 0 || val == null ) {
            val = elem.style[name];

            // Computed unit is not pixels. Stop here and return.
            if (rnumnonpx.test(val)) {
                return val;
            }

            // Check for style in case a browser which returns unreliable values
            // for getComputedStyle silently falls back to the reliable elem.style
            valueIsBorderBox = isBorderBox &&
                               (boxSizingReliable() || val === elem.style[name]);

            // Normalize "", auto, and prepare for extra
            val = parseFloat(val) || 0;
        }

        // Use the active box-sizing model to add/subtract irrelevant styles
        return val +
                 augmentWidthOrHeight(
                     elem,
                     name,
                     extra || (isBorderBox ? "border" : "content"),
                     valueIsBorderBox,
                     styles
                 );
    };


    return function getDimensions(elem, margin) {

        if (elem === window) {
            return elem.document.documentElement["client" + name];
        }

        // Get document width or height
        if (elem.nodeType === 9) {
            var doc = elem.documentElement;

            // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
            // whichever is greatest
            return Math.max(
                elem.body["scroll" + name], doc["scroll" + name],
                elem.body["offset" + name], doc["offset" + name],
                doc["client" + name]
            );
        }

        return getWidthOrHeight(
            elem,
            name.toLowerCase(),
            defaultExtra || (margin === true ? "margin" : "border"),
            getStyle(elem)
        );
    };

};



var getWidth = getDimensions("", "Width");


var getHeight = getDimensions("", "Height");



var getScrollTopOrLeft = function(vertical) {

    var defaultST,
        wProp = vertical ? "pageYOffset" : "pageXOffset",
        sProp = vertical ? "scrollTop" : "scrollLeft",
        doc = window.document,
        body = doc.body,
        html = doc.documentElement;

    var ret = function(scroll, allowNegative) {
        if (scroll < 0 && allowNegative === false) {
            return 0;
        }
        return scroll;
    };

    if(window[wProp] !== undf) {
        //most browsers except IE before #9
        defaultST = function(){
            return window[wProp];
        };
    }
    else{
        if (html.clientHeight) {
            defaultST = function() {
                return html[sProp];
            };
        }
        else {
            defaultST = function() {
                return body[sProp];
            };
        }
    }

    return function(node, allowNegative) {
        if (!node || node === window) {
            return ret(defaultST(), allowNegative);
        }
        else if (node && node.nodeType == 1 &&
            node !== body && node !== html) {
            return ret(node[sProp], allowNegative);
        }
        else {
            return ret(defaultST(), allowNegative);
        }
    }

};



var getScrollTop = getScrollTopOrLeft(true);



var getScrollLeft = getScrollTopOrLeft(false);




var EventBuffer = function(){

    var bufferKey = function(event, interval) {
        return '$$' + event + "_" + interval;
    };

    var EventBuffer = defineClass({

        observable: null,
        handlerDelegate: null,
        triggerDelegate: null,
        watchers: null,
        breaks: null,
        running: false,
        lastEvent: null,
        currentEvent: null,
        interval: null,
        id: null,

        $init: function(node, event, interval) {

            var self = this,
                key = bufferKey(event, interval);

            if (node[key]) {
                return node[key];
            }

            node[key] = self;

            self.id = key;
            self.breaks = {};
            self.watchers = {};
            self.node = node;
            self.event = event;
            self.observable = new Observable;
            self.interval = interval || 0;
            self.handlerDelegate = bind(self.handler, self);
            self.triggerDelegate = bind(self.trigger, self);

            self.up();
        },

        handler: function(e) {
            var self = this;
            if (self.running) {
                if (e) {
                    self.lastEvent = e;
                }
            }
            else {
                self.next(e);
            }
        },

        next: function(e) {

            var self = this,
                itv = self.interval;

            e = e || self.lastEvent;

            if (!e) {
                return;
            }

            self.lastEvent = null;
            self.running = true;
            self.currentEvent = e;

            if (itv === "raf") {
                raf(self.triggerDelegate);
            }
            else {
                setTimeout(self.triggerDelegate, itv);
            }
        },

        watchWidth: function() {
            this.addWatcher("width", getWidth);
        },

        watchHeight: function() {
            this.addWatcher("width", getHeight);
        },

        watchScrollTop: function() {
            this.addWatcher("scrollTop", getScrollTop);
        },

        watchScrollLeft: function() {
            this.addWatcher("scrollLeft", getScrollLeft);
        },

        addWatcher: function(name, fn, context) {
            if (!this.watchers[name]) {
                this.watchers[name] = {
                    fn:      fn,
                    context: context,
                    prev:    null,
                    current: parseInt(fn.call(context, this.node), 10)
                };
            }
        },

        removeWatcher: function(name) {
            delete this.watchers[name];
        },

        breakFilter: function(l, args, event) {

            if (!this.watchers[event.watcher]) {
                return false;
            }

            var self        = this,
                breakValue  = l.breakValue,
                luft        = l.breakLuft || 0,
                lowLuft     = l.breakLowLuft || luft,
                highLuft    = l.breakHighLuft || luft,
                lowBreak    = breakValue - lowLuft,
                highBreak   = breakValue + highLuft,
                w           = self.watchers[event.watcher],
                current     = w.current,
                prev        = w.prev,
                min         = Math.min(prev, current),
                max         = Math.max(prev, current);

            if (breakValue === "!=") {
                return prev != current;
            }

            args[0].breakPosition = current < lowBreak ? -1 :  (current >= highBreak ? 1 : 0);

            return (min <= lowBreak && lowBreak <= max) ||
                    (min <= highBreak && highBreak <= max);
        },

        onBreak: function(watcher, breakValue, fn, context, options) {
            var self = this,
                name = watcher + "_" + breakValue;

            options = options || {};
            options.breakValue = breakValue;

            if (!self.breaks[name]) {
                self.breaks[name] = self.observable.createEvent(name, {
                    watcher: watcher,
                    triggerFilter: self.breakFilter,
                    filterContext: self
                });
            }

            self.breaks[name].on(fn, context, options);
        },

        unBreak: function(watcher, breakValue, fn, context, destroy) {
            var self = this,
                name = watcher + "_" + breakValue;
            if (self.breaks[name]) {
                self.breaks[name].un(fn, context);
                if (!self.breaks[name].hasListener()) {
                    self.observable.destroyEvent(name);
                    self.breaks[name] = null;
                    delete self.breaks[name];
                }
            }
            if (destroy) {
                self.destroyIfIdle();
            }
        },

        on: function(fn, context, options) {
            this.observable.on(this.event, fn, context, options);
        },

        un: function(fn, context, destroy) {
            var self = this;
            self.observable.un(self.event, fn, context);
            if (destroy) {
                self.destroyIfIdle();
            }
        },

        trigger: function() {
            var self = this,
                e = self.currentEvent,
                ws = self.watchers,
                bs = self.breaks,
                node = self.node,
                w, b;

            self.observable.trigger(self.event, e);

            for (w in ws) {
                ws[w].prev = ws[w].current;
                ws[w].current = parseInt(ws[w].fn.call(ws[w].context, node, e), 10);
            }

            for (b in bs) {
                bs[b].trigger(e);
            }

            self.running = false;
            self.currentEvent = null;

            self.next();
        },

        up: function() {
            var self = this;
            addListener(self.node, self.event, self.handlerDelegate);
        },

        down: function() {
            var self = this;
            removeListener(self.node, self.event, self.handlerDelegate);
        },

        destroyIfIdle: function() {
            if (this.observable && !this.observable.hasListener()) {
                this.$destroy();
                return true;
            }
        },

        destroy: function() {

            var self = this;

            delete self.node[self.id];

            self.down();
            self.observable.destroy();

        }

    }, {
        get: function(node, event, interval) {
            var key = bufferKey(event, interval);

            if (node[key]) {
                return node[key];
            }

            return node[key] = new EventBuffer(node, event, interval);
        }
    });

    return EventBuffer;

}();





var EventHandler = defineClass({

    cfg: null,
    scope: null,
    node: null,
    listeners: null,
    event: null,
    buffers: null,
    updateRoot: false,
    prevEvent: null,

    $init: function(scope, node, cfg, event, defaults) {

        var self = this;

        self.event = event;
        self.prevEvent = {};

        defaults = defaults || {};

        cfg = cfg || {};

        if (typeof cfg === "string") {

            self.updateRoot = cfg.indexOf('$root') + cfg.indexOf('$parent') !== -2;

            var fc = cfg.substr(0,1);

            if (fc === '{') {
                self.watcher = createWatchable(scope, cfg, self.onConfigChange, self);
                cfg = extend({}, self.watcher.getLastResult(), true, true);
            }
            else if (fc === '=') {
                cfg = cfg.substr(1);
                self.watcher = createWatchable(scope, cfg, self.onConfigChange, self);
                cfg = extend({}, self.watcher.getLastResult(), true, true);
            }
            else {
                var handler = createGetter(cfg);
                cfg = {
                    handler: handler
                };
            }
        }

        self.buffers    = {};
        self.listeners  = [];
        self.scope      = scope;
        self.node       = node;

        self.prepareConfig(cfg, defaults);

        self.up();
    },

    prepareConfig: function(cfg, defaults) {

        var tmp,
            event = this.event;

        extend(cfg, defaults, false, false);

        if (cfg.handler && typeof cfg.handler === "string") {
            cfg.handler = createGetter(cfg.handler);
        }

        if (cfg.event) {
            tmp = {};
            var events = cfg.event.split(","),
                i, l;

            for (i = 0, l = events.length; i < l; i++) {
                tmp[trim(events[i])] = cfg;
            }

            cfg = tmp;
        }
        else if (event) {
            tmp = {};
            tmp[event] = cfg;
            cfg = tmp;
        }

        this.cfg = cfg;
    },

    onConfigChange: function(val) {
        var self = this;
        val = extend({}, val, true, true);
        self.down();
        self.prepareConfig(val);
        self.up();
    },

    createHandler: function(cfg, scope) {

        var self        = this,
            updateRoot  = self.updateRoot;

        var handler = function(e){

            if (self.$destroyed || self.$destroying) {
                return;
            }

            var keyCode,
                preventDefault = false,
                returnValue = undf,
                stopPropagation = false,
                res;

            cfg.preventDefault !== undf && (preventDefault = cfg.preventDefault);
            cfg.stopPropagation !== undf && (stopPropagation = cfg.stopPropagation);
            cfg.returnValue !== undf && (returnValue = cfg.returnValue);
            cfg.keyCode !== undf && (keyCode = cfg.keyCode);

            e = normalizeEvent(e || window.event);

            if (keyCode) {
                if (typeof keyCode === "number" && keyCode !== e.keyCode) {
                    return null;
                }
                else if (keyCode.indexOf(e.keyCode) === -1) {
                    return null;
                }
            }

            scope.$event = e;
            scope.$eventNode = self.node;
            scope.$prevEvent = self.prevEvent[e.type];

            if (cfg.handler) {
                res = cfg.handler.call(cfg.context || null, scope);

                if (res && isPlainObject(res)) {
                    res.preventDefault !== undf && (preventDefault = res.preventDefault);
                    res.stopPropagation !== undf && (stopPropagation = res.stopPropagation);
                    res.returnValue !== undf && (returnValue = res.returnValue);
                }
            }

            stopPropagation && e.stopPropagation();
            preventDefault && e.preventDefault();

            if (self.$destroyed || self.$destroying) {
                return returnValue !== undf ? returnValue : undf;
            }

            scope.$event = null;
            scope.$eventNode = null;

            self.prevEvent[e.type] = e;

            updateRoot ? scope.$root.$check() : scope.$check();

            if (returnValue !== undf) {
                return returnValue;
            }
        };

        if (cfg.async) {
            return function(e) {
                async(handler, null, [e], 
                        typeof cfg.async == "number" ? cfg.async : null);
            };
        }
        else {
            return handler;
        }
    },

    up: function() {

        var self    = this,
            allCfg  = self.cfg,
            ls      = self.listeners,
            bs      = self.buffers,
            node    = self.node,
            scope   = self.scope,
            cfg,
            buffer,
            handler,
            event;

        for (event in allCfg) {
            cfg = allCfg[event];
            buffer = cfg.buffer;

            if (cfg['if'] === undf || cfg['if']) {
                handler = self.createHandler(cfg, scope);
                ls.push([event, handler]);

                if (buffer) {
                    if (!bs[event]) {
                        bs[event] = EventBuffer.get(node, event, buffer);
                        bs[event].on(handler);
                    }
                }
                else {
                    addListener(node, event, handler);
                }
            }
        }
    },

    down: function() {

        var self    = this,
            ls      = self.listeners,
            bs      = self.buffers,
            node    = self.node,
            buffer  = self.cfg.buffer,
            event,
            handler,
            i, l;


        for (i = 0, l = ls.length; i < l; i++) {
            event = ls[i][0];
            handler = ls[i][1];
            if (buffer) {
                bs[event].un(handler);
                if (bs[event].destroyIfIdle() === true) {
                    delete bs[event];
                }
            }
            else {
                removeListener(node, event, handler);
            }
        }

        self.listeners  = [];
    },

    destroy: function() {
        var self = this;
        self.down();
        if (self.watcher) {
            self.watcher.unsubscribeAndDestroy(self.onConfigChange, self);
        }
    }

});



(function(){

    var events = ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover',
                  'mouseout', 'mousemove', 'keydown', 'keyup', 'keypress',
                  'change',
                  'focus', 'blur', 'copy', 'cut', 'paste', 'load', 'mousewheel',
                  'touchstart', 'touchend', 'touchcancel', 'touchleave', 'touchmove'],
        i, len;

    for (i = 0, len = events.length; i < len; i++) {

        (function(name){

            Directive.registerAttribute(name, 1000,
                function(scope, node, expr, renderer, attr){

                var cfg = attr && attr.config ? extend({}, attr.config) : null,
                    keep = false,
                    k;

                if (cfg) {
                    for (k in cfg) {
                        if (cfg.hasOwnProperty(k)) {
                            keep = true;
                            break;
                        }
                    }
                    if (cfg.preventDefault) {
                        cfg.preventDefault = createGetter(cfg.preventDefault)(scope);
                    }
                    if (cfg.stopPropagation) {
                        cfg.stopPropagation = createGetter(cfg.stopPropagation)(scope);
                    }
                    if (cfg.async) {
                        cfg.async = createGetter(cfg.async)(scope);
                    }
                }

                if (!keep) {
                    cfg = null;
                }

                if (cfg) {
                    cfg.handler = expr;
                    expr = cfg;
                }

                var eh = new EventHandler(scope, node, expr, name, {
                    preventDefault: true
                });

                return function(){
                    eh.$destroy();
                    eh = null;
                };
            });

        }(events[i]));
    }

    Directive.registerAttribute("submit", 1000, function(scope, node, expr){

        var fn = createFunc(expr),
            updateRoot = expr.indexOf('$root') + expr.indexOf('$parent') !== -2,
            handler = function(){
                fn(scope);
                updateRoot ? scope.$root.$check() : scope.$check();
            };

        Input.get(node).onKey(13, handler);

        return function() {
            Input.get(node).unKey(13, handler);
            handler = null;
            fn = null;
        };
    });

    events = null;

}());






Directive.registerAttribute("show", 500, defineClass({

    $class: "Directive.attr.Show",
    $extends: Directive,

    animate: false,
    initial: true,
    display: "",

    $init: function(scope, node, expr, renderer, attr) {

        var self    = this,
            cfg     = attr ? attr.config : {};

        self.display = cfg.display || "";
        self.animate = !!cfg.animate;

        self.$super(scope, node, expr, renderer, attr);
    },

    runAnimation: function(show) {

        var self    = this,
            style   = self.node.style,
            done    = function() {
                if (!show) {
                    style.display = "none";
                }
                else {
                    style.display = self.display;
                }
            };

        self.initial || !self.animate ? done() : animate(
            self.node,
            show ? "show" : "hide",
            function() {
                if (show) {
                    var p = new Promise;
                    raf(function(){
                        style.display = self.display;
                        p.resolve();
                    });
                    return p;
                }
            })
            .done(done);
    },

    onChange: function(val) {
        var self    = this;
        self.runAnimation(val);
        self.initial = false;
        self.$super(val);
    }
}));







Directive.registerAttribute("hide", 500, defineClass({

    $class: "Directive.attr.Hide",
    $extends: "Directive.attr.Show",

    $init: function(scope, node, expr, renderer, attr) {

        var self    = this;

        self.$super(scope, node, expr, renderer, attr);
        self.display = null;
    },

    onChange: function() {
        var self    = this,
            val     = self.watcher.getLastResult();

        self.runAnimation(!val);
        self.initial = false;

        self.saveStateOnChange(val);
    }
}));






Directive.registerAttribute("if", 500, Directive.$extend({

    $class: "Directive.attr.If",
    parentEl: null,
    prevEl: null,
    nextEl: null,
    el: null,
    initial: true,
    cfg: null,
    animate: false,

    $init: function(scope, node, expr, renderer, attr) {

        var self    = this;

        self.createCommentHolders(node, this.$class);

        //self.parentEl   = node.parentNode;
        self.cfg        = attr ? attr.config : {};
        self.animate    = !!self.cfg.animate;

        self.$super(scope, node, expr, renderer, attr);
    },

    onScopeDestroy: function() {

        var self    = this;

        self.prevEl = null;
        //self.parentEl = null;
        self.nextEl = null;

        self.$super();
    },

    onChange: function() {
        var self    = this,
            val     = self.watcher.getLastResult(),
            parent  = self.prevEl.parentNode,
            node    = self.node;

        var show    = function(){
            parent.insertBefore(node, self.nextEl);
        };

        var hide    = function() {
            parent.removeChild(node);
        };

        if (val) {
            self.initial || !self.animate ?
                show() : animate(node, "enter", show);
        }
        else {
            if (node.parentNode) {
                self.initial || !self.animate ?
                    hide() : animate(node, "leave").done(hide);
            }
        }

        self.$super(val);

        if (self.initial) {
            self.initial = false;
        }
        else {
            if (self.cfg.once) {
                self.$destroy();
            }
        }
    }

}));






Directive.registerAttribute("in-focus", 500, Directive.$extend({

    $class: "Directive.attr.InFocus",

    onChange: function() {

        var self    = this;

        if (self.watcher.getLastResult()) {
            async(self.node.focus, self.node, [], 300);
        }
    }

}));


var toBool = function(val) {
    if (!val) { // real false, empty string, null, zero
        return false;
    }
    if (typeof val === "string") {
        val = val.toLowerCase();
        if (val === "false" || val === "no" || val === '0') {
            return false;
        }
    }
    return true;
};




Directive.registerAttribute("include", 1100,
    function(scope, node, tplExpr, parentRenderer, attr){

    var cfg = attr ? attr.config : {},
        asis = toBool(cfg.asis),
        html = cfg.html,
        tplCfg = {
            scope: scope,
            node: node,
            parentRenderer: parentRenderer,
            animate: !!cfg.animate,
            ownRenderer: !asis // do not render if asis=true
        };

    if (html) {
        tplCfg['html'] = html;
    }
    else {
        tplCfg['url'] = tplExpr;
    }

    var tpl = new Template(tplCfg);

    return false; // stop renderer
});





Directive.registerAttribute("init", 250, function(scope, node, expr){
    createFunc(expr)(scope);
});



(function(){

var keys = {
    "enter": 13,
    "esc": 27,
    "backspace": 8
};

/*
value is always an array in the end:
[{keyCode: 1, handler: fn}, {...}]

DO NOT MIX {key}="{...}" with  {key.enter}="{...}"

NO:
{key}="{...}"
{key.enter}="{...}"

YES:
{key}="{...}"

or

{key}="[{...}]"
{key.enter}="{...}"

 */

Directive.registerAttribute("key", 1000, function(scope, node, expr, renderer, attr){

    var values = attr ? attr.values : null,
        parts, k, part, i, l;

    if (values) {

        parts = [];

        for (k in values) {
            part = values[k];

            if (keys[k]) {
                k = keys[k];
            }

            if (part.substr(0,1) === '{') {
                parts.push('{keyCode: ' + k + ', ' + part.substr(1));
            }
            else {
                parts.push('{keyCode: ' + k + ', handler: "' + part + '"}');
            }
        }
        expr = '[' + parts.join(',') + ']';
    }

    var allCfg = createGetter(expr)(scope),
        uninstall = [];

    if (!isArray(allCfg)) {
        allCfg = [allCfg];
    }

    var createHandler = function(cfg) {

        var handler = cfg.handler;
        var context = cfg.context || scope;
        var h;

        delete cfg.handler;
        delete cfg.context;

        if (typeof handler === "string") {
            h = createFunc(handler);
            handler = function(){
                return function(e) {
                    scope.$event = e;
                    h(scope);
                    scope.$event = null;
                    scope.$check();
                };
            }(scope);
        }

        Input.get(node).onKey(cfg, handler, context);

        return function() {
            Input.get(node).unKey(cfg, handler, context);
        };
    };

    for (i = 0, l = allCfg.length; i < l; i++) {
        uninstall.push(createHandler(allCfg[i]));
    }

    return function() {
        var i, l;
        for (i = 0, l = uninstall.length; i < l; i++) {
            uninstall[i]();
        }
    };
});

}());








Directive.registerAttribute("model", 1000, Directive.$extend({

    $class: "Directive.attr.Model",
    inProg: false,
    input: null,
    binding: null,
    updateRoot: false,
    changeCb: null,
    initial: false,

    autoOnChange: false,

    $init: function(scope, node, expr, renderer, attr) {

        var self    = this,
            cfg     = attr ? attr.config : {};

        self.node           = node;
        self.input          = Input.get(node, scope);
        self.updateRoot     = expr.indexOf('$root') + expr.indexOf('$parent') !== -2;
        self.binding        = cfg.binding || "both";

        if (cfg.change) {
            self.changeCb   = createFunc(cfg.change);
        }

        self.input.onChange(self.onInputChange, self);

        self.$super(scope, node, expr);

        var inputValue      = self.input.getValue(),
            scopeValue      = self.watcher.getLastResult();

        self.initial = true;

        if (scopeValue !== inputValue) {
            // scope value takes priority
            if (self.binding !== "input" && scopeValue !== undf) {
                self.onChange(scopeValue);
            }
            else if (self.binding !== "scope" && inputValue !== undf) {
                self.onInputChange(inputValue);
            }
        }

        self.initial = false;
    },

    onInputChange: function(val) {

        var self    = this,
            scope   = self.scope;

        if (self.binding !== "scope") {

            if (val && isString(val) && val.indexOf('\\{') !== -1) {
                val = val.replace(/\\{/g, '{');
            }

            if (self.watcher.getLastResult() == val) {
                return;
            }

            self.watcher.setValue(val);

            self.inProg = true;
            if (scope instanceof Scope) {
                self.updateRoot ? scope.$root.$check() : scope.$check();
            }
            else {
                self.watcher.checkAll();
            }
            self.inProg = false;
        }
    },

    destroy: function() {

        var self        = this;
        self.input.destroy();
        self.$super();
    },


    onChange: function() {

        var self    = this,
            val     = self.watcher.getLastResult(),
            binding = self.binding,
            ie;

        if (self.binding !== "input" && !self.inProg) {

            // when scope value changed but this field
            // is not in focus, it should try to
            // change input's value, but not react
            // to input's 'change' and 'input' events --
            // fields like select or radio may not have
            // this value in its options. that will change
            // value to undefined and bubble back to scope
            if (window.document.activeElement !== self.node) {
                self.binding = "scope";
            }

            if ((ie = isIE()) && ie < 8) {
                async(self.input.setValue, self.input, [val]);
            }
            else {
                self.input.setValue(val);
            }

            self.binding = binding;
        }

        if (self.changeCb && !self.initial && val != self.watcher.getPrevValue()) {
            self.changeCb(self.scope);
        }
    }


}));






Directive.registerAttribute("options", 100, defineClass({

    $class: "Directive.attr.Options",
    $extends: Directive,

    model: null,
    store: null,
    getterFn: null,
    defOption: null,
    prevGroup: null,
    groupEl: null,
    fragment: null,

    $init: function(scope, node, expr) {

        var self    = this;

        self.parseExpr(expr);

        self.node       = node;
        self.scope      = scope;
        self.defOption  = node.options.length ? node.options[0] : null;

        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }

        self.defOption && setAttr(self.defOption, "default-option", "");

        try {
            var value = createGetter(self.model)(scope);
            if (cs.isInstanceOf(value, "Store")) {
                self.bindStore(value, "on");
            }
            else {
                self.watcher = createWatchable(scope, self.model, self.onChange, self,
                    {filterLookup: filterLookup});
            }
        }
        catch (thrownError) {
            error(thrownError);
        }

        if (self.watcher) {
            self.renderAll();
        }
        else if (self.store) {
            self.renderStore();
        }
    },

    bindStore: function(store, mode) {
        var self = this;
        store[mode]("update", self.renderStore, self);
        self.store = store;
    },

    renderStore: function() {
        var self = this;
        self.render(self.store.current);
    },

    renderAll: function() {
        this.render(toArray(this.watcher.getValue()));
    },

    onChange: function() {
        this.renderAll();
    },

    renderOption: function(item, index, scope) {

        var self        = this,
            parent      = self.groupEl || self.fragment,
            msie        = isIE(),
            config,
            option;

        scope.item      = item;
        scope.$index    = index;

        if (self.defaultOptionTpl && isPlainObject(item)) {
            config      = item;
        }
        else {
            config      = self.getterFn(scope);
        }

        config.group    !== undf && (config.group = ""+config.group);

        if (config.group !== self.prevGroup) {

            if (config.group){
                self.groupEl = parent = window.document.createElement("optgroup");
                setAttr(parent, "label", config.group);
                if (config.disabledGroup) {
                    setAttr(parent, "disabled", "disabled");
                }
                self.fragment.appendChild(parent);
            }
            else {
                parent = self.fragment;
                self.groupEl = null;
            }
        }
        self.prevGroup  = config.group;

        option  = window.document.createElement("option");
        setAttr(option, "value", config.value || "");
        option.text = config.name;

        if (msie && msie < 9) {
            option.innerHTML = config.name;
        }
        if (config.disabled) {
            setAttr(option, "disabled", "disabled");
        }

        parent.appendChild(option);
    },

    render: function(list) {

        var self        = this,
            node        = self.node,
            value       = getValue(node),
            def         = self.defOption,
            tmpScope    = self.scope.$new(),
            msie        = isIE(),
            parent, next,
            i, len;

        self.fragment   = window.document.createDocumentFragment();
        self.prevGroup  = null;
        self.groupEl    = null;

        while(node.firstChild) {
            node.removeChild(node.firstChild);
        }

        for (i = 0, len = list.length; i < len; i++) {
            self.renderOption(list[i], i, tmpScope);
        }

        if (def) {
            node.insertBefore(def, node.firstChild);
        }

        tmpScope.$destroy();

        // ie6 gives "unspecified error when trying to set option.selected"
        // on node.appendChild(fragment);
        // somehow this get fixed by detaching dom node
        // and attaching it back
        if (msie && msie < 8) {
            next = node.nextSibling;
            parent = node.parentNode;
            parent.removeChild(node);
        }

        node.appendChild(self.fragment);
        self.fragment = null;

        if (msie && msie < 8) {
            parent.insertBefore(node, next);
        }

        setValue(node, value);
    },


    parseExpr: function(expr) {

        var splitIndex  = expr.indexOf(" in "),
            model, item;

        if (splitIndex === -1) {
            model   = expr;
            item    = '{name: .item, value: .$index}';
            this.defaultOptionTpl = true;
        }
        else {
            model   = expr.substr(splitIndex + 4);
            item    = expr.substr(0, splitIndex);
            this.defaultOptionTpl = false;
        }

        this.model = model;
        this.getterFn = createGetter(item);
    },

    destroy: function() {

        var self = this;

        if (self.store){
            self.bindStore(self.store, "un");
        }

        self.$super();

    }

}));







(function(){

    var booleanAttrs = ["selected", "checked", "disabled", "readonly", "open", "required"],
        i, l;

    var PropertyDirective = defineClass({

        $extends: Directive,

        propName: null,

        $init: function(scope, node, expr, propName) {
            this.propName = propName;
            this.$super(scope, node, expr);
        },

        onChange: function(val) {

            var name = this.propName;

            val = !!val;

            if (val) {
                setAttr(this.node, name, name);
            }
            else {
                removeAttr(this.node, name);
            }
        }
    });

    for (i = 0, l = booleanAttrs.length; i < l; i++) {
        (function(name){

            Directive.registerAttribute("" + name, 1000, function(scope, node, expr){
                return new PropertyDirective(scope, node, expr, name);
            });

        }(booleanAttrs[i]));
    }

}());




Directive.registerAttribute("ref", 200, function(scope, node, expr){
    scope[expr] = node;
});




Directive.registerAttribute("source-src", 1000, defineClass({

    $class: "Directive.attr.SourceSrc",
    $extends: Directive,

    usePreload: true,
    noCache: false,
    attr: null,

    lastPromise: null,
    src: null,

    $constructor: function(scope, node, expr, renderer, attr) {

        var self = this,
            cfg = attr ? attr.config : {};

        self.attr = attr;

        if (cfg.deferred) {
            self.$plugins.push("plugin.SrcDeferred");
        }
        /*if (cfg.preloadSize) {
            self.$plugins.push("plugin.SrcSize");
        }*/
        if (cfg.plugin) {
            var tmp = cfg.plugin.split(","),
                i, l;
            for (i = 0, l = tmp.length; i < l; i++) {
                self.$plugins.push(trim(tmp[i]));
            }
        }

        self.$super(scope, node, expr);
    },

    $init: function(scope, node, expr, renderer, attr) {

        var self = this,
            cfg = attr ? attr.config : {};

        if (cfg.noCache) {
            self.noCache = true;
        }
        self.$super(scope, node, expr);
    },

    onChange: function() {
        this.doChange();
    },

    doChange: function() {
        var self = this;
        
        if (self.$destroyed || self.$destroying) {
            return;
        }

        var src = self.watcher.getLastResult();

        if (!src) {
            return;
        }

        self.src = src;

        if (self.noCache) {
            src += (src.indexOf("?") !== -1 ? "&amp;" : "?") + "_" + (new Date).getTime();
        }

        if (self.node) {
            self.doChangeSource(src);
            self.onSrcChanged();
        }
    },

    doChangeSource: function(src) {
        var self = this,
            node = self.node,
            srcs = select("source", node),
            source = window.document.createElement("source"),
            i, l;

        if (srcs.length) {
            for (i  = 0, l = srcs.length; i < l; i++) {
                node.removeChild(srcs[i]);
            }
        }

        setAttr(source, "src", src);
        node.appendChild(source);
    },

    onSrcChanged: function() {

    }
}));




var preloadImage = function() {

    var cache = {},
        loading = {},
        cacheCnt = 0;


    var preloadImage = function preloadImage(src) {

        if (cache[src] !== undefined) {
            if (cache[src] === false) {
                return Promise.reject(src);
            }
            else {
                return Promise.resolve(cache[src]);
            }
        }

        if (loading[src]) {
            return loading[src];
        }

        if (cacheCnt > 1000) {
            cache = {};
            cacheCnt = 0;
        }

        var doc = window.document,
            img = doc.createElement("img"),
            style = img.style,
            deferred = new Promise;

        loading[src] = deferred;

        deferred.always(function(){
            delete loading[src];
        });

        addListener(img, "load", function() {
            if (!cache[src]) {
                cache[src] = {
                    src:    src,
                    width:  img ? img.width : null,
                    height: img ? img.height : null
                };
                cacheCnt++;
            }
            if (deferred) {
                deferred.resolve(cache[src]);
            }
            if (img && img.parentNode) {
                img.parentNode.removeChild(img);
            }
            img = null;
            style = null;
            deferred = null;
        });

        addListener(img, "error", function() {
            cache[src] = false;
            if (img && img.parentNode) {
                img.parentNode.removeChild(img);
            }
            if (deferred) {
                deferred.reject(src);
            }
        });

        deferred.abort = function() {
            if (img && img.parentNode) {
                img.parentNode.removeChild(img);
            }
            if (deferred) {
                deferred.reject(src);
            }
            img = null;
            style = null;
            deferred = null;
        };

        style.position = "absolute";
        style.visibility = "hidden";
        style.left = "-10000px";
        style.top = "0";
        doc.body.appendChild(img);
        img.src = src;

        return deferred;
    };

    preloadImage.check = function(src) {
        if (cache[src] !== undefined) {
            return cache[src];
        }
        return loading[src] || null;
    };

    return preloadImage;

}();




Directive.registerAttribute("src", 1000, defineClass({

    $class: "Directive.attr.Src",
    $extends: Directive,

    queue: null,
    usePreload: true,
    noCache: false,
    attr: null,

    lastPromise: null,
    src: null,

    $constructor: function(scope, node, expr, renderer, attr) {

        var self = this,
            cfg = attr ? attr.config : {};

        self.attr = attr;

        if (cfg.deferred) {
            self.$plugins.push("plugin.SrcDeferred");
        }
        if (cfg.preloadSize) {
            self.$plugins.push("plugin.SrcSize");
        }
        if (cfg.plugin) {
            var tmp = cfg.plugin.split(","),
                i, l;
            for (i = 0, l = tmp.length; i < l; i++) {
                self.$plugins.push(trim(tmp[i]));
            }
        }

        self.$super(scope, node, expr);
    },

    $init: function(scope, node, expr, renderer, attr) {

        var self = this,
            cfg = attr ? attr.config : {};

        if (cfg.noCache) {
            self.noCache = true;
        }

        if (cfg.noPreload) {
            self.usePreload = false;
        }
        else {
            node.style.visibility = "hidden"
        }

        self.queue = new Queue({auto: true, async: true, mode: Queue.REPLACE, thenable: true});
        self.$super(scope, node, expr);
    },


    onChange: function() {
        var self = this;
        self.cancelPrevious();
        if (self.usePreload) {
            self.node.style.visibility = "hidden";
        }
        self.queue.add(self.doChange, self);
    },

    doChange: function() {

        var self = this;

        if (self.$destroyed || self.$destroying) {
            return;
        }

        var src = self.watcher.getLastResult();

        if (!src) {
            return;
        }

        self.src = src;

        if (self.noCache) {
            src += (src.indexOf("?") !== -1 ? "&amp;" : "?") + "_" + (new Date).getTime();
        }

        if (self.usePreload) {
            self.lastPromise = preloadImage(src);
            if (self.lastPromise) {
                self.lastPromise.done(self.onImagePreloaded, self);
            }
        }
        else {
            if (self.node) {
                self.node.src = src;
                setAttr(self.node, "src", src);
                self.onSrcChanged();
            }
        }
    },

    cancelPrevious: function() {
        var self = this;

        if (self.lastPromise) {
            if (self.lastPromise.isPending()) {
                self.lastPromise.abort();
            }
            self.lastPromise = null;
        }
    },

    onImagePreloaded: function() {
        var self = this,
            src = self.src;

        if (self && self.node) {
            raf(function(){
                if (self.node) {
                    self.node.src = src;
                    setAttr(self.node, "src", src);
                    self.onSrcChanged();
                    self.node.style.visibility = "";
                    self.scope.$scheduleCheck(50);
                }
            });
        }
        self.lastPromise = null;
    },

    onSrcChanged: function() {

    },

    onScopeReset: function() {
        this.cancelPrevious();
        this.$super();
    },

    destroy: function() {

        var self = this;

        if (!self.$destroyed) {
            self.cancelPrevious();
            self.queue.destroy();
            self.$super();
        }
    }
}));

var removeStyle = (function() {

    var div = window.document.createElement("div");

    if (div.style.removeProperty) {
        return function(node, name) {
            node.style.removeProperty(name);
        };
    }
    else {
        return function(node, name) {
            node.style.removeAttribute(name);
        };
    }

}());



/*
value is always an object in the end
DO NOT MIX style="{}" with style.prop="expression".
 */


Directive.registerAttribute("style", 1000, Directive.$extend({

    $class: "Directive.attr.Style",
    $init: function(scope, node, expr, renderer, attr) {

        var values = attr ? attr.values : null,
            parts, k;

        if (values) {
            parts = [];
            for (k in values) {
                parts.push("'" + k + "'" + ': ' + values[k]);
            }
            expr = '{' + parts.join(', ') + '}';
        }

        this.$super(scope, node, expr);
    },

    onChange: function() {

        var self    = this,
            node    = self.node,
            style   = node.style,
            props   = self.watcher.getLastResult(),
            prev    = self.watcher.getPrevValue(),
            k, trg;

        for (k in prev) {
            if (!props || props[k] === undf) {
                removeStyle(node, k);
            }
        }

        if (props) {
            for (k in props) {

                trg = toCamelCase(k);

                if (props[k] !== undf && props[k] !== null) {
                    style[trg] = props[k];
                }
                else {
                    removeStyle(node, k);
                }
            }
        }
    }
}));



function parentData(node, key) {

    var val;

    while (node) {
        val = data(node ,key);
        if (val !== undf) {
            return val;
        }
        node  = node.parentNode;
    }

    return undf;
};



function transclude(node, replace) {

    var contents  = parentData(node, 'mjs-transclude');

    if (contents) {

        if (node.firstChild) {
            data(node, "mjs-transclude", toFragment(node.childNodes));
        }

        var parent      = node.parentNode,
            next        = node.nextSibling,
            cloned      = clone(contents),
            children    = toArray(cloned.childNodes);

        if (replace) {
            parent.removeChild(node);
            parent.insertBefore(cloned, next);
        }
        else {
            node.appendChild(cloned);
        }

        return children;
    }

    return null;
};



Directive.registerAttribute("transclude", 1000, function(scope, node) {
    return transclude(node);
});



    /*
        Update scope on given event.
        Not exactly template's business, but still
    */
Directive.registerAttribute("update-on", 1000,
    function(scope, node, expr, renderer, attr){

    var values = attr ? attr.values : null,
        cfg = attr ? attr.config : {},
        parts, k, part,
        execFn;

    if (values) {

        parts = [];

        for (k in values) {
            part = values[k];
            parts.push("['" + k + "', " + part + ']');
        }
        expr = '[' + parts.join(',') + ']';
    }

    var cfgs = createGetter(expr)(scope);

    if (cfg.code) {
        var code = createFunc(cfg.code);
        execFn = function() {
            scope.$event = toArray(arguments);
            code(scope);
            scope.$event = null;
            scope.$check();
        };
    }
    else {
        execFn = scope.$check;
    }

    var toggle = function(mode) {

        var cfg, event, obj, i, l, fn;

        for (i = 0, l = cfgs.length; i < l; i++) {
            cfg = cfgs[i];
            event = cfg[0];
            obj = cfg[1];

            if (obj.$destroyed || obj.$destroying) {
                continue;
            }

            if (obj && event && (fn = (obj[mode] || obj['$' + mode]))) {
                fn.call(obj, event, execFn, scope);
            }
        }
    };

    toggle("on");

    return function() {
        if (toggle) {
            toggle("un");
            cfgs = null;
            toggle = null;
        }
    };
});



Directive.registerAttribute("view", 200, function(scope, node, cls, parentRenderer, attr) {
    var cfg = {scope: scope, node: node};
    resolveComponent(
        cls || "MetaphorJs.View",
        cfg,
        scope, node,
        [cfg, attr]
    );
    return false;
});




Directive.registerTag("transclude", function(scope, node) {
    return transclude(node, true);
});



nsAdd("filter.collect", function(input, scope, prop) {

    var res = [],
        i, l, val;

    if (!input) {
        return res;
    }

    for (i = 0, l = input.length; i < l; i++) {
        val = input[i][prop];
        if (val != undf) {
            res.push(val);
        }
    }

    return res;
});




var filterArray = function(){


    var compareValues = function(value, to, opt) {

            if (isFunction(to)) {
                return to(value, opt);
            }
            else if (to === "" || to === undf) {
                return true;
            }
            else if (value === undf) {
                return false;
            }
            else if (isBool(value)) {
                return value === to;
            }
            else if (to instanceof RegExp) {
                return to.test("" + value);
            }
            else if (opt == "strict") {
                return ""+value === ""+to;
            }
            else if (opt === true || opt === null || opt === undf) {
                return (""+value).toLowerCase().indexOf((""+to).toLowerCase()) != -1;
            }
            else if (opt === false) {
                return (""+value).toLowerCase().indexOf((""+to).toLowerCase()) == -1;
            }
            return false;
        },

        compare = function(value, by, opt) {

            if (isFunction(by)) {
                return by(value, opt);
            }

            if (isPrimitive(value)) {
                if (by.$ === undf) {
                    return true;
                }
                else {
                    return compareValues(value, by.$, opt);
                }
            }

            var k, i;
            for (k in by) {
                if (k == '$') {
                    for (i in value) {
                        if (compareValues(value[i], by.$, opt)) {
                            return true;
                        }
                    }
                }
                else {
                    if (compareValues(value[k], by[k], opt)) {
                        return true;
                    }
                }
            }

            return false;
        };

    var filterArray = function filterArray(a, by, opt) {

        if (!isPlainObject(by) && !isFunction(by)) {
            by = {$: by};
        }

        var ret = [],
            i, l;

        for (i = -1, l = a.length; ++i < l;) {
            if (compare(a[i], by, opt)) {
                ret.push(a[i]);
            }
        }

        return ret;
    };

    filterArray.compare = compare;

    return filterArray;

}();



nsAdd("filter.filter", function(val, scope, by, opt) {
    return filterArray(val, by, opt);
});






nsAdd("filter.get", function(val, scope, prop) {
    var tmp = (""+prop).split("."),
        key;

    while (key = tmp.shift()) {
        val = val[key];
        if (val == undf) {
            return undf;
        }
    }

    return val;
});






nsAdd("filter.join", function(input, scope, separator) {

    separator = separator || ", ";

    if (input && input.length) {
        if (!isArray(input)){
            input = toArray(input);
        }
        return input.join(separator);
    }

    return "";
});



nsAdd("filter.l", function(key, scope) {
    return scope.$app.lang.get(key);
});




nsAdd("filter.limitTo", function(input, scope, limit){

    var isS = isString(input);

    if (!isArray(input) && !isS) {
        return input;
    }

    if (Math.abs(Number(limit)) === Infinity) {
        limit = Number(limit);
    } else {
        limit = parseInt(limit, 10);
    }

    if (isS) {
        //NaN check on limit
        if (limit) {
            return limit >= 0 ? input.slice(0, limit) : input.slice(limit, input.length);
        } else {
            return "";
        }
    }

    var out = [],
        i, n;

    // if abs(limit) exceeds maximum length, trim it
    if (limit > input.length)
        limit = input.length;
    else if (limit < -input.length)
        limit = -input.length;

    if (limit > 0) {
        i = 0;
        n = limit;
    } else {
        i = input.length + limit;
        n = input.length;
    }

    for (; i<n; i++) {
        out.push(input[i]);
    }

    return out;
});




nsAdd("filter.linkify", function(input, scope, target){
    target = target ? ' target="'+target+'"' : "";
    if (input) {
        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return input.replace(exp, '<a href="$1"'+target+'>$1</a>');
    }
    return "";
});




nsAdd("filter.lowercase", function(val){
    return (""+val).toLowerCase();
});



nsAdd("filter.map", function(array, scope, fnName) {

    var i, l,
        fn = nsGet(fnName, true) ||
                window[fnName] ||
                createGetter(fnName)(scope);
    array = array || [];

    if (fn) {
        for (i = 0, l = array.length; i < l; i++) {
            array[i] = fn(array[i]);
        }
    }

    return array;
});

var dateFormats = {};





nsAdd("filter.moment",  function(val, scope, format) {
    format  = dateFormats[format] || format;
    return val ? moment(val).format(format) : "";
});


var numberFormats = {};







nsAdd("filter.numeral",  function(val, scope, format) {
    format  = numberFormats[format] || format;
    return numeral(val).format(format);
});



nsAdd("filter.offset", function(input, scope, offset){

    var isS = isString(input);

    if (!isArray(input) && !isS) {
        return input;
    }

    if (Math.abs(Number(offset)) === Infinity) {
        offset = Number(offset);
    } else {
        offset = parseInt(offset, 10);
    }

    if (isS) {
        return input.substr(offset);
    }
    else {
        return input.slice(offset);
    }
});



nsAdd("filter.p", function(key, scope, number) {
    return scope.$app.lang.plural(key, parseInt(number, 10) || 0);
});
nsAdd("filter.pl", function(number, scope, key) {
    return scope.$app.lang.plural(key, parseInt(number, 10) || 0);
});



(function(){

    var preloaded = nsAdd("filter.preloaded", function(val, scope) {

        if (!val) {
            return false;
        }

        var promise = preloadImage.check(val);

        if (promise === true || !promise) {
            return !!promise;
        }

        if (isThenable(promise)) {
            promise.always(function(){
                scope.$check();
            });
            return false;
        }
        else {
            return true;
        }

    });

    preloaded.$undeterministic = true;

    return preloaded;
}());



function sortArray(arr, by, dir) {

    if (!dir) {
        dir = "asc";
    }

    var ret = arr.slice();

    ret.sort(function(a, b) {
        var typeA = typeof a,
            typeB = typeof b,
            valueA  = a,
            valueB  = b;

        if (typeA != typeB) {
            return 0;
        }

        if (typeA == "object") {
            if (isFunction(by)) {
                valueA = by(a);
                valueB = by(b);
            }
            else {
                valueA = a[by];
                valueB = b[by];
            }
        }

        if (typeof valueA == "number") {
            return valueA - valueB;
        }
        else {
            valueA = ("" + valueA).toLowerCase();
            valueB = ("" + valueB).toLowerCase();

            if (valueA === valueB) return 0;
            return valueA > valueB ? 1 : -1;
        }
    });

    return dir == "desc" ? ret.reverse() : ret;

};



nsAdd("filter.sortBy", function(val, scope, field, dir) {
    return sortArray(val, field, dir);
});




nsAdd("filter.split", function(input, scope, sep, limit) {

    limit       = limit || undf;
    sep         = sep || "/\\n|,/";

    if (!input) {
        return [];
    }

    input       = "" + input;

    if (sep.substr(0,1) == '/' && sep.substr(sep.length - 1) == "/") {
        sep = getRegExp(sep.substring(1, sep.length-1));
    }

    var list = input.split(sep, limit),
        i, l;

    for (i = -1, l = list.length; ++i < l; list[i] = trim(list[i])){}

    return list;
});





nsAdd("filter.toArray", function(input){

    if (isPlainObject(input)) {
        var list = [],
            k;
        for (k in input) {
            if (input.hasOwnProperty(k)) {
                list.push({key: k, value: input[k]});
            }
        }
        return list;
    }

    return toArray(input);
});



nsAdd("filter.ucfirst", function(val){
    return val.substr(0, 1).toUpperCase() + val.substr(1);
});




nsAdd("filter.uppercase", function(val){
    return (""+val).toUpperCase();
});



/**
 * @param {Function} fn
 * @param {Window} w optional window object
 */
function onReady(fn, w) {

    var done    = false,
        top     = true,
        win     = w || window,
        root, doc,

        init    = function(e) {
            if (e.type == 'readystatechange' && doc.readyState != 'complete') {
                return;
            }

            removeListener(e.type == 'load' ? win : doc, e.type, init);

            if (!done && (done = true)) {
                fn.call(win, e.type || e);
            }
        },

        poll = function() {
            try {
                root.doScroll('left');
            } catch(thrownError) {
                setTimeout(poll, 50);
                return;
            }

            init('poll');
        };

    doc     = win.document;
    root    = doc.documentElement;

    if (doc.readyState == 'complete') {
        fn.call(win, 'lazy');
    }
    else {
        if (doc.createEventObject && root.doScroll) {
            try {
                top = !win.frameElement;
            } catch(thrownError) {}

            top && poll();
        }
        addListener(doc, 'DOMContentLoaded', init);
        addListener(doc, 'readystatechange', init);
        addListener(win, 'load', init);
    }
};



function initApp(node, cls, data, autorun) {


    var attrs = getAttrSet(node, function(name) {
        return !!nsGet("directive.attr." + name, true);
    });

    var cfg = attrs.directive.app ? attrs.directive.app.config : {},
        i, l;

    if (attrs.subnames['app']) {
        for (i = 0, l = attrs.subnames['app'].length; i < l; i++) {
            removeAttr(node, attrs.subnames[i]);
        }
    }

    try {
        var p = resolveComponent(cls || "MetaphorJs.App", extend({}, cfg), data, node, [node, data]);

        if (autorun !== false) {
            return p.done(function(app){
                app.run();
            });
        }
        else {
            return p;
        }
    }
    catch (thrownError) {
        error(thrownError);
        return Promise.reject(thrownError);
    }
};



function run(w, appData) {

    var win = w || window;

    if (!win) {
        throw "Window object neither defined nor provided";
    }

    onReady(function() {

        var appNodes    = select("[mjs-app]", win.document),
            i, l, el;

        for (i = -1, l = appNodes.length; ++i < l;){
            el      = appNodes[i];
            initApp(
                el,
                getAttr(el, "mjs-app"),
                appData,
                true
            );
        }
    }, win);

};




run();






Directive.registerAttribute("break-if", 500, function(scope, node, expr){

    var res = !!createGetter(expr)(scope);

    if (res) {
        node.parentNode.removeChild(node);
    }

    return !res;
});




Directive.registerAttribute("cmp-prop", 200,
    ['$parentCmp', '$node', '$attrValue', function(parentCmp, node, expr){

       if (parentCmp) {
            parentCmp[expr] = node;
       }
}]);



(function() {

    Directive.registerAttribute("event", 1000, function(scope, node, expr){

        var eh = new EventHandler(scope, node, expr);

        return function(){
            eh.$destroy();
            eh = null;
        };
    });
}());




Directive.registerAttribute("ignore", 0, returnFalse);




Directive.registerTag("bind-html", function(scope, node) {

    var expr    = getAttr(node, "value"),
        w       = createWatchable(scope, expr, null, null, {filterLookup: filterLookup}),
        text    = w.getLastResult(),
        frg     = toFragment(text),
        nodes   = toArray(frg.childNodes);

    node.parentNode.insertBefore(frg, node);
    node.parentNode.removeChild(node);

    w.unsubscribeAndDestroy();

    return nodes;
});




Directive.registerTag("bind", function(scope, node) {

    var expr    = getAttr(node, "value"),
        text    = createGetter(expr)(scope),
        frg     = window.document.createTextNode(text);

    node.parentNode.insertBefore(frg, node);
    node.parentNode.removeChild(node);

    return [frg];
});



Directive.registerTag("if", defineClass({
    $class: "Directive.tag.If",
    $extends: "Directive.attr.If",
    autoOnChange: false,
    children: null,
    childrenFrag: null,

    $init: function(scope, node, expr, renderer, attr) {

        var self    = this;
        
        self.children = toArray(node.childNodes);
        self.childrenFrag = toFragment(self.children);
        expr = getAttr(node, "value");

        self.$super(scope, node, expr, renderer, attr);   
        
        if (node.parentNode) {
            node.parentNode.removeChild(node); 
        }

        var val = self.watcher.getLastResult();
        self.onChange(val || false, undf);
    },

    getChildren: function() {
        return this.children;
    },

    onChange: function() {
        var self    = this,
            val     = self.watcher.getLastResult(),
            parent  = self.prevEl.parentNode;

        if (val) {
            parent.insertBefore(self.childrenFrag, self.nextEl);
        }
        else if (!self.initial) {
            var prev = self.prevEl, 
                next = self.nextEl, 
                children = [],
                sib;

            self.childrenFrag = window.document.createDocumentFragment();
            while (prev.parentNode && prev.nextSibling && 
                    prev.nextSibling !== next) {
                sib = prev.nextSibling;
                prev.parentNode.removeChild(sib);
                children.push(sib);
                self.childrenFrag.appendChild(sib);
            }
            self.children = children;
        }

        if (self.initial) {
            self.initial = false;
        }
        else {
            if (self.cfg.once) {
                self.$destroy();
            }
        }
    },

    destroy: function() {
        this.children = null;
        this.$super();
    }
}));




Directive.registerTag("include", function(scope, node, value, parentRenderer, attr) {

    var cfg = (attr ? attr.config : {}) || {},
        asis = toBool(cfg.asis);

    var tpl = new Template({
        scope: scope,
        node: node,
        url: getAttr(node, "src"),
        parentRenderer: parentRenderer,
        replace: true,
        ownRenderer: !asis // if asis, do not render stuff
    });

    return false; // stop renderer
});


var getAttrMap = (function(){

return function getAttrMap(node) {
    var map = {},
        i, l, a,
        attrs = node.attributes;

    for (i = 0, l = attrs.length; i < l; i++) {
        a = attrs[i];
        map[a.name] = a.value;
    }

    return map;
};

}());




Directive.registerTag("tag", function(scope, node) {

    var expr = getAttr(node, "value"),
        tag = createGetter(expr)(scope);

    if (!tag) {
        node.parentNode.removeChild(node);
        return false;
    }
    else {
        var el = window.document.createElement(tag),
            next = node.nextSibling,
            attrMap = getAttrMap(node),
            k;

        while (node.firstChild) {
            el.appendChild(node.firstChild);
        }

        delete attrMap['value'];

        for (k in attrMap) {
            setAttr(el, k, attrMap[k]);
        }

        node.parentNode.insertBefore(el, next);
        node.parentNode.removeChild(node);

        return [el];
    }

});



var factory = cs.factory;





var Model = function(){

    
    var instances   = {},
        cache       = {};


    /**
     * @class Model
     */
    return defineClass({

        $class:         "Model",
        $mixins:        ["mixin.Observable"],

        type:           null,
        fields:         null,
        record:         null,
        store:          null,
        plain:          false,

        lastAjaxResponse: null,


        /**
         * @var object {
         *      @type {bool} json send data as json
         *      @type {string} url
         *      @type {string} id Id field
         *      @type {string} data Data field
         *      @type {string} success Success field
         *      @type {object} extra Extra params object
         *      @type {string|int|bool} ... other $.ajax({ properties })
         * }
         * @md-tmp model-atom
         */

        /**
         * @var object {
         *      @type {string|object} load { @md-apply model-atom }
         *      @type {string|object} save { @md-apply model-atom }
         *      @type {string|object} delete { @md-apply model-atom }
         * }
         * @md-apply model-atom
         * @md-tmp model-group
         */

        /**
         * @constructor
         * @param {object} cfg {
         *      @type {string} type Record class
         *      @type {object} fields Fields conf
         *      @type {object} record {
         *          @type {string|object} create { @md-apply model-atom }
         *          @md-apply model-group
         *      }
         *      @type {object} store {
         *          @type {string} total Total field
         *          @type {string} start Start field
         *          @type {string} limit Limit field
         *          @md-apply model-group
         *      }
         *      @md-apply model-atom
         * }
         */
        $init: function(cfg) {

            var self        = this,
                defaults    = {
                    record: {
                        load:       null,
                        save:       null,
                        "delete":   null,
                        id:         null,
                        data:       null,
                        success:    null,
                        extra:      {}
                    },

                    store: {
                        load:       null,
                        save:       null,
                        "delete":   null,
                        id:         null,
                        data:       null,
                        total:      null,
                        start:      null,
                        limit:      null,
                        success:    null,
                        extra:      {}
                    }
                };


            if (!self.fields) {
                self.fields = {};
            }

            extend(self, defaults, false, true);
            extend(self, cfg, true, true);

            self.plain      = !self.type;
        },

        /**
         * Do records within this model have type or they are plain objects
         * @access public
         * @returns bool
         */
        isPlain: function() {
            return this.plain;
        },

        /**
         * @param {string} type load|save|delete
         * @param {string} prop
         * @returns mixed
         */
        getRecordProp: function(type, prop) {
            return this.getProp("record", type, prop);
        },

        /**
         * @param {string} prop
         * @param {string|int|bool} value
         */
        setRecordProp: function(prop, value) {
            this.record[prop] = value;
        },

        /**
         * @param {string} type load|save|delete
         * @param {string} prop
         * @returns mixed
         */
        getStoreProp: function(type, prop) {
            return this.getProp("store", type, prop);
        },

        /**
         * @param {string} prop
         * @param {string|int|bool} value
         */
        setStoreProp: function(prop, value) {
            this.store[prop] = value;
        },


        /**
         * @param {string} what record|store
         * @param {string} type load|save|delete
         * @param {string} prop
         * @returns mixed
         */
        getProp: function(what, type, prop) {
            var profile = this[what];
            return (profile[type] && profile[type][prop]) || profile[prop] || this[prop] || null;
        },

        /**
         * @param {string} prop
         * @param {string|int|bool} value
         */
        setProp: function(prop, value) {
            return this[prop] = value;
        },

        _prepareRequestUrl: function(url, data) {

            url = url.replace(/:([a-z0-9_\-]+)/gi, function(match, name){

                var value = data[name];

                if (value != undefined) {
                    delete data[name];
                    return value;
                }
                else {
                    return match;
                }

            });

            if (/:([a-z0-9_\-]+)/.test(url)) {
                return null;
            }

            return url;
        },

        _makeRequest: function(what, type, id, data) {

            var self        = this,
                profile     = self[what],
                cfg         = extend({},
                                    isString(profile[type]) || isFunction(profile[type]) ?
                                        {url: profile[type]} :
                                        profile[type]
                                    ),
                idProp      = self.getProp(what, type, "id"),
                dataProp    = self.getProp(what, type, "root"),
                url         = self.getProp(what, type, "url"),
                isJson      = self.getProp(what, type, "json"),
                res,
                ajaxCfg     = {};

            if (!cfg) {
                if (url) {
                    cfg     = {url: url};
                }
                else {
                    throw what + "." + type + " not defined";
                }
            }
            if (isString(cfg) || isFunction(cfg)) {
                cfg         = {url: cfg};
            }

            if (!cfg.url) {
                if (!url) {
                    throw what + "." + type + " url not defined";
                }
                cfg.url     = url;
            }

            ajaxCfg.url = cfg.url;

            if (cfg.ajax) {
                extend(ajaxCfg, cfg.ajax, true, false);
            }

            if (cfg.validate) {
                res = cfg.validate.call(self, id, data);
                if (res === false) {
                    return Promise.reject(res);
                }
            }

            if (cfg.resolve) {
                res = cfg.resolve.call(self, id, data);
                if (res && isThenable(res)){
                    return res;
                }
                else if (res) {
                    return Promise.resolve(res);
                }
            }

            ajaxCfg.data        = extend(
                {},
                cfg.data,
                self.extra,
                profile.extra,
                profile[type] ? profile[type].extra : null,
                ajaxCfg.data,
                data,
                true,
                true
            );

            if (isFunction(cfg.url)) {
                var df = cfg.url(ajaxCfg.data),
                    promise = new Promise;

                df.then(function(response){
                    if (what == "record") {
                        self._processRecordResponse(type, response, promise);
                    }
                    else if (what == "store") {
                        self._processStoreResponse(type, response, promise);
                    }
                });

                return promise;
            }

            if (id && idProp) {
                ajaxCfg.data[idProp] = id;
            }

            if (data && dataProp && type != "load") {
                ajaxCfg.data[dataProp] = data;
            }

            ajaxCfg.url = self._prepareRequestUrl(ajaxCfg.url, ajaxCfg.data);

            if (!ajaxCfg.url) {
                return Promise.reject();
            }

            if (!ajaxCfg.method) {
                if (what != "controller") {
                    ajaxCfg.method = type == "load" ? "GET" : "POST";
                }
                else {
                    ajaxCfg.method = "GET";
                }
            }

            if (isJson && ajaxCfg.data && ajaxCfg.method != 'GET') { // && cfg.type != 'GET') {
                ajaxCfg.contentType = "text/plain";
                ajaxCfg.data        = JSON.stringify(ajaxCfg.data);
            }

            ajaxCfg.context = self;

            var returnPromise;

            if (what == "record") {
                ajaxCfg.processResponse = function(response, deferred) {
                    self.lastAjaxResponse = response;
                    self._processRecordResponse(type, response, deferred);
                };
                returnPromise = self._processRecordRequest(ajax(ajaxCfg), type, id, data);
            }
            else if (what == "store") {
                ajaxCfg.processResponse = function(response, deferred) {
                    self.lastAjaxResponse = response;
                    self._processStoreResponse(type, response, deferred);
                };
                returnPromise = self._processStoreRequest(ajax(ajaxCfg), type, id, data);
            }
            else if (what == "controller") {
                ajaxCfg.processResponse = function(response, deferred) {
                    self.lastAjaxResponse = response;
                    self._processControllerResponse(type, response, deferred);
                };
                returnPromise = self._processControllerRequest(ajax(ajaxCfg), type, id, data);
            }

            if (cfg.processRequest) {
                cfg.processRequest.call(self, returnPromise, id, data);
            }

            return returnPromise;
        },

        _processRecordRequest: function(promise, type, id, data) {
            return promise;
        },

        _processRecordResponse: function(type, response, df) {
            var self        = this,
                idProp      = self.getRecordProp(type, "id"),
                dataProp    = self.getRecordProp(type, "root"),
                data        = dataProp ? response[dataProp] : response,
                id          = (data && data[idProp]) || response[idProp];

            if (!self._getSuccess("record", type, response)) {
                df.reject(response);
            }
            else {
                //df.resolve(id, data);
                df.resolve({id: id, data: self.extendPlainRecord(data)});
            }
        },

        _processStoreRequest: function(promise, type, id, data) {
            return promise;
        },

        _processStoreResponse: function(type, response, df) {
            var self        = this,
                dataProp    = self.getStoreProp(type, "root"),
                totalProp   = self.getStoreProp(type, "total"),
                data        = dataProp ? response[dataProp] : response,
                total       = totalProp ? response[totalProp] : null;

            if (!self._getSuccess("store", type, response)) {
                df.reject(response);
            }
            else {
                //df.resolve(data, total);
                df.resolve({data: data, total: total});
            }
        },

        _processControllerRequest: function(promise, type, id, data) {
            return promise;
        },

        _processControllerResponse: function(type, response, df) {

            var self    = this;

            if (!self._getSuccess("controller", type, response)) {
                df.reject(response);
            }
            else {
                df.resolve(response);
            }
        },

        _getSuccess: function(what, type, response) {
            var self    = this,
                sucProp = self.getProp(what, type, "success");

            if (typeof sucProp == "function") {
                return sucProp(response);
            }

            if (sucProp && response[sucProp] != undf) {
                return response[sucProp];
            }
            else {
                return true;
            }
        },

        runController: function(name, id, data) {
            return this._makeRequest("controller", name, id, data);
        },


        /**
         * @access public
         * @param {string|number} id Record id
         * @returns MetaphorJs.lib.Promise
         */
        loadRecord: function(id) {
            return this._makeRequest("record", "load", id);
        },

        /**
         * @access public
         * @param {MetaphorJs.Record} rec
         * @param {array|null} keys
         * @param {object|null} extra
         * @returns MetaphorJs.lib.Promise
         */
        saveRecord: function(rec, keys, extra) {
            return this._makeRequest(
                "record",
                rec.getId() ? "save" : "create",
                rec.getId(),
                extend({}, rec.storeData(rec.getData(keys)), extra)
            );
        },

        /**
         * @access public
         * @param {MetaphorJs.Record} rec
         * @returns MetaphorJs.lib.Promise
         */
        deleteRecord: function(rec) {
            return this._makeRequest("record", "delete", rec.getId());
        },

        /**
         * @access public
         * @param {MetaphorJs.Store} store
         * @param {object} params
         * @returns MetaphorJs.lib.Promise
         */
        loadStore: function(store, params) {
            return this._makeRequest("store", "load", null, params);
        },

        /**
         * @access public
         * @param {MetaphorJs.Store} store
         * @param {object} recordData
         * @returns MetaphorJs.lib.Promise
         */
        saveStore: function(store, recordData) {
            return this._makeRequest("store", "save", null, recordData);
        },

        /**
         * @access public
         * @param {MetaphorJs.Store} store
         * @param {array} ids
         * @returns MetaphorJs.lib.Promise
         */
        deleteRecords: function(store, ids) {
            return this._makeRequest("store", "delete", ids);
        },



        /**
         * @returns object
         */
        extendPlainRecord: function(rec) {
            var self    = this,
                ext     = self.getRecordProp(null, "extend");

            return ext ? extend(rec, ext, false, false) : rec;
        },

        /**
         * @returns object
         */
        getFields: function() {
            return this.fields;
        },

        /**
         * @param {object} rec
         * @returns {*|null}
         */
        getRecordId: function(rec) {
            var idProp = this.getRecordProp("load", "id");
            return rec[idProp] || null;
        },

        /**
         * Convert field's value from database state to app state
         * @param {MetaphorJs.Record} rec
         * @param {string} name
         * @param {string|int|bool|Date} value
         * @returns mixed
         */
        restoreField: function(rec, name, value) {

            var self    = this,
                f       = self.fields[name];

            if (f) {
                var type = isString(f) ? f : f.type;

                switch (type) {
                    case "int": {
                        value   = parseInt(value);
                        break;
                    }
                    case "bool":
                    case "boolean": {
                        if (isString(value)) {
                            value   = value.toLowerCase();
                            value   = !(value === "off" || value === "no" || value === "0" ||
                                        value == "false" || value == "null");
                        }
                        else {
                            value = value ? true : false;
                        }
                        break;
                    }
                    case "double":
                    case "float": {
                        value   = parseFloat(value);
                        break;
                    }
                    case "date": {
                        if (f['parseFn']) {
                            value   = f['parseFn'](value, f.format);
                        }
                        else if (Date['parse']) {
                            value   = Date['parse'](value, f.format);
                        }
                        else {
                            if (f.format == "timestamp") {
                                value   = parseInt(value) * 1000;
                            }
                            value   = new Date(value);
                        }
                        break;
                    }
                }

                if (f.restore) {
                    value   = f.restore.call(rec, value, name);
                }
            }

            return self.onRestoreField(rec, name, value);
        },

        /**
         * @access protected
         * @param {MetaphorJs.Record} rec
         * @param {string} name
         * @param {string|int|bool} value
         * @returns string|int|bool|Date
         */
        onRestoreField: function(rec, name, value) {
            return value;
        },

        /**
         * Convert field's value from app state to database state
         * @param {MetaphorJs.Record} rec
         * @param {string} name
         * @param {string|int|bool|Date} value
         * @returns mixed
         */
        storeField: function(rec, name, value) {

            var self    = this,
                f       = self.fields[name];

            if (f) {
                var type = isString(f) ? f : f.type;

                switch (type) {
                    case "bool":
                    case "boolean": {
                        value   = value ? "1" : "0";
                        break;
                    }
                    case "date": {
                        if (f['formatFn']) {
                            value   = f['formatFn'](value, f.format);
                        }
                        else if (Date.format) {
                            value   = Date.format(value, f.format);
                        }
                        else {
                            if (f.format == "timestamp") {
                                value   = value.getTime() / 1000;
                            }
                            else {
                                value   = value['format'] ? value['format'](f.format) : value.toString();
                            }
                        }
                        break;
                    }
                    default: {
                        value   = value.toString();
                    }
                }

                if (f.store) {
                    value   = f.store.call(rec, value, name);
                }
            }

            return self.onStoreField(rec, name, value);

        },

        /**
         * @access protected
         * @param {MetaphorJs.Record} rec
         * @param {string} name
         * @param {string|int|bool} value
         * @returns string|int
         */
        onStoreField: function(rec, name, value) {
            return value;
        }


    }, {

        /**
         * @static
         * @returns Object
         */
        create: function(model, cfg) {

            if (model === "MetaphorJs.Model") {
                return factory(model, cfg);
            }
            else {
                if (cfg) {
                    return factory(model, cfg);
                }
                else {
                    if (instances[model]) {
                        return instances[model];
                    }
                    else {
                        return instances[model] = factory(model);
                    }
                }
            }
        },

        /**
         * @static
         * @param {MetaphorJs.Record} rec
         */
        addToCache: function(rec) {

            var cls     = rec.$getClass(),
                id      = rec.getId();

            if (cls != "MetaphorJs.Record") {
                if (!cache[cls]) {
                    cache[cls] = {};
                }
                cache[cls][id] = rec;
            }
        },

        /**
         * @static
         * @param {string} type
         * @param {string|int|bool} id
         */
        getFromCache: function(type, id) {

            if (cache[type] && cache[type][id]) {
                return cache[type][id];
            }
            else {
                return null;
            }
        },

        /**
         * @static
         * @param {string} type
         * @param {string|int|bool} id
         */
        removeFromCache: function(type, id) {
            if (cache[type] && cache[type][id]) {
                delete cache[type][id];
            }
        }

    });



}();






/**
 * @namespace MetaphorJs
 * @class Record
 */
var Record = defineClass({

    $class: "Record",
    $mixins: ["mixin.Observable"],

    /**
     * @var mixed
     * @access protected
     */
    id:             null,

    /**
     * @var object
     * @access protected
     */
    data:           null,

    /**
     * @var object
     * @access protected
     */
    orig:           null,

    /**
     * @var object
     * @access protected
     */
    modified:       null,

    /**
     * @var bool
     * @access protected
     */
    loaded:         false,

    /**
     * @var bool
     * @access protected
     */
    loading:        false,

    /**
     * @var bool
     * @access protected
     */
    dirty:          false,

    /**
     * @var MetaphorJs.Model
     * @access protected
     */
    model:          null,

    /**
     * @var bool
     * @access protected
     */
    standalone:     true,

    /**
     * @var array
     * @access protected
     */
    stores:         null,

    /**
     * @var bool
     * @access protected
     */
    importUponSave: false,

    /**
     * @var bool
     * @access protected
     */
    importUponCreate: false,

    /**
     * @constructor
     * @method initialize
     * @param {*} id
     * @param {object} cfg
     */

    /**
     * @constructor
     * @method initialize
     * @param {object} cfg
     */

    /**
     * @constructor
     * @param {string|int|null} id
     * @param {object} data
     * @param {object} cfg
     */
    $init: function(id, data, cfg) {

        var self    = this,
            args    = arguments.length;

        if (args == 1) {
            cfg     = id;
            id      = null;
            data    = null;
        }
        else if (args == 2) {
            cfg     = data;
            data    = null;
        }

        self.data       = {};
        self.orig       = {};
        self.stores     = [];
        self.modified   = {};
        cfg             = cfg || {};
        self.$super(cfg);

        if (isString(self.model)) {
            self.model  = Model.create(self.model);
        }
        else if (!(self.model instanceof Model)) {
            self.model  = new Model(self.model);
        }

        self.id     = id;

        if (data) {
            self.importData(data);
        }
        else if(cfg.autoLoad !== false && id) {
            self.load();
        }

        if (self.$getClass() != "MetaphorJs.Record") {
            Model.addToCache(self);
        }
    },

    /**
     * @returns bool
     */
    isLoaded: function() {
        return this.loaded;
    },

    /**
     * @returns bool
     */
    isLoading: function() {
        return this.loading;
    },

    /**
     * @returns bool
     */
    isStandalone: function() {
        return this.standalone;
    },

    /**
     * @returns bool
     */
    isDirty: function() {
        return this.dirty;
    },

    /**
     * @returns {MetaphorJs.Model}
     */
    getModel: function() {
        return this.model;
    },

    /**
     * @param {MetaphorJs.Store} store
     */
    attachStore: function(store) {
        var self    = this,
            sid     = store.getId();

        if (self.stores.indexOf(sid) == -1) {
            self.stores.push(sid);
        }
    },

    /**
     * @param {MetaphorJs.Store} store
     */
    detachStore: function(store) {
        var self    = this,
            sid     = store.getId(),
            inx;

        if (!self.$destroyed && (inx = self.stores.indexOf(sid)) != -1) {
            self.stores.splice(inx, 1);

            if (self.stores.length == 0 && !self.standalone) {
                self.$destroy();
            }
        }
    },

    /**
     * @param {bool} dirty
     */
    setDirty: function(dirty) {
        var self    = this;
        if (self.dirty != dirty) {
            self.dirty  = !!dirty;
            self.trigger("dirty-change", self, dirty);
        }
    },

    /**
     * @param {object} data
     */
    importData: function(data) {

        var self        = this,
            processed   = {},
            name;

        if (data) {
            for (name in data) {
                processed[name] = self.model.restoreField(self, name, data[name]);
            }

            self.data   = processed;
        }

        self.orig       = extend({}, self.data);
        self.modified   = {};
        self.loaded     = true;
        self.setDirty(false);
    },

    /**
     * @access protected
     * @param {object} data
     * @returns object
     */
    storeData: function(data) {

        var self        = this,
            processed   = {},
            name;

        for (name in data) {
            processed[name] = self.model.storeField(self, name, data[name]);
        }

        return processed;
    },


    /**
     * @returns mixed
     */
    getId: function() {
        return this.id;
    },

    /**
     * @param {[]|null|string} keys
     * @returns object
     */
    getData: function(keys) {

        var data = {},
            i;

        if (keys) {
            var len,
                self    = this;

            keys = isString(keys) ? [keys] : keys;

            for (i = 0, len = keys.length; i < len; i++) {
                data[keys[i]] = self.data[keys[i]];
            }
            return data;
        }
        else {
            var sdata = this.data;

            for (i in sdata) {
                if (i.substr(0, 1) == "$") {
                    continue;
                }
                data[i] = sdata[i];
            }

            return data;
        }
    },

    /**
     * @returns object
     */
    getChanged: function() {
        return extend({}, this.modified);
    },

    /**
     * @param {string} key
     * @returns bool
     */
    isChanged: function(key) {
        return this.modified[key] || false;
    },

    /**
     * @param {string} key
     * @returns *
     */
    get: function(key) {
        return this.data[key];
    },

    /**
     * @param {*} id
     */
    setId: function(id) {
        if (!this.id && id) {
            this.id = id;
        }
    },

    /**
     * @param {string} key
     * @param {*} value
     */
    set: function(key, value) {

        var self    = this,
            prev    = self.data[key];

        value           = self.model.restoreField(self, key, value);
        self.data[key]  = value;

        if (prev != value) {
            self.modified[key]  = true;
            self.setDirty(true);
            self.trigger("change", self, key, value, prev);
            self.trigger("change-"+key, self, key, value, prev);
        }
    },

    /**
     * @method
     */
    revert: function() {
        var self    = this;
        if (self.dirty) {
            self.data       = extend({}, self.orig);
            self.modified   = {};
            self.setDirty(false);
        }
    },

    /**
     * @method
     * @returns {MetaphorJs.lib.Promise}
     */
    load: function() {
        var self    = this;
        self.loading = true;
        self.trigger("before-load", self);
        return self.model.loadRecord(self.id)
            .always(function(){
                self.loading = false;
            })
            .done(function(response) {
                self.setId(response.id);
                self.importData(response.data);
                self.trigger("load", self);
            })
            .fail(function() {
                self.trigger("failed-load", self);
            });
    },

    /**
     * @method
     * @param {array|null|string} keys
     * @param {object|null} extra
     * @returns {MetaphorJs.lib.Promise}
     */
    save: function(keys, extra) {
        var self    = this;
        self.trigger("before-save", self);

        var create  = !self.getId(),
            imprt   = create ? self.importUponCreate : self.importUponSave;

        return self.model.saveRecord(self, keys, extra)
            .done(function(response) {
                if (response.id) {
                    self.setId(response.id);
                }
                if (imprt) {
                    self.importData(response.data);
                }
                self.trigger("save", self);
            })
            .fail(function(response) {
                self.trigger("failed-save", self);
            });
    },

    /**
     * @method
     * @returns {MetaphorJs.lib.Promise}
     */
    "delete": function() {
        var self    = this;
        self.trigger("before-delete", self);
        return self.model.deleteRecord(self)
            .done(function() {
                self.trigger("delete", self);
                self.$destroy();
            }).
            fail(function() {
                self.trigger("failed-delete", self);
            });
    },


    reset: function() {

        var self        = this;

        self.id         = null;
        self.data       = {};
        self.orig       = {};
        self.modified   = {};
        self.loaded     = false;
        self.dirty      = false;

        self.trigger("reset", self);
    },



    destroy: function() {

        var self    = this;
        Model.removeFromCache(self.$getClass(), self.id);
        self.$super();
    }

});








var Store = function(){

    var allStores   = {};



    /**
     * @namespace MetaphorJs
     * @class MetaphorJs.Store
     */
    return defineClass({

            $class:         "Store",
            $mixins:        ["mixin.Observable"],

            /**
             * @var {string}
             * @access protected
             */
            id:             null,
            /**
             * @var {bool}
             * @access protected
             */
            autoLoad:       false,
            /**
             * @var {bool}
             * @access protected
             */
            clearOnLoad:    true,

            /**
             * @var {MetaphorJs.Model}
             * @access protected
             */
            model:          null,

            /**
             * Extra params to pass to Model when loading stuff
             * @var {object}
             * @access protected
             */
            extraParams:    null,

            /**
             * @var {bool}
             * @access protected
             */
            loaded:         false,
            /**
             * @var {bool}
             * @access protected
             */
            loading:        false,
            /**
             * @var {bool}
             * @access protected
             */
            local:          false,

            /**
             * @var {[]}
             * @access protected
             */
            items:          null,

            /**
             * @var {[]}
             * @access protected
             */
            current:        null,

            /**
             * @var {object}
             * @access protected
             */
            map:            null,

            /**
             * @var {object}
             * @access protected
             */
            currentMap:     null,

            /**
             * @var {number}
             * @access protected
             */
            length:         0,

            /**
             * @var {number}
             * @access protected
             */
            currentLength:  0,

            /**
             * @var {number}
             * @access protected
             */
            maxLength:      0,

            /**
             * @var {number}
             * @access protected
             */
            totalLength:    0,

            /**
             * @var {number}
             * @access protected
             */
            start:          0,

            /**
             * @var {number}
             * @access protected
             */
            pageSize:       null,

            /**
             * @var {number}
             * @access protected
             */
            pages:          null,

            /**
             * @var {bool}
             * @access protected
             */
            filtered:       false,

            /**
             * @var {bool}
             * @access protected
             */
            sorted:         false,


            /**
             * @access protected
             * @var {{}|string}
             */
            filterBy:       null,

            /**
             * @var {string|boolean}
             * @access protected
             */
            filterOpt:      null,

            /**
             * @var {string}
             * @access protected
             */
            sortBy:         null,

            /**
             * @var {string}
             * @access protected
             */
            sortDir:        null,

            /**
             * @var {boolean}
             * @access protected
             */
            publicStore: false,

            /**
             * @var {string}
             * @access protected
             */
            idProp: null,

            /**
             * @var {Promise}
             * @access private
             */
            loadingPromise: null,

            /**
             * @constructor
             * @name initialize
             * @param {object} options
             * @param {[]} initialData
             */

            /**
             * @constructor
             * @param {string} url
             * @param {object} options
             * @param {[]} initialData
             */
            $init:     function(url, options, initialData) {

                var self        = this;

                self.items      = [];
                self.current    = [];
                self.map        = {};
                self.currentMap = {};
                self.loaded     = false;
                self.extraParams    = self.extraParams || {};

                if (url && !isString(url)) {
                    initialData = options;
                    options     = url;
                    url         = null;
                }

                options         = options || {};

                if (url) {
                    options.url = url;
                }

                self.$super(options);
                extend(self, options, true, false);

                self.id         = self.id || nextUid();
                
                if (self.publicStore) {
                    allStores[self.id]  = self;
                }

                self.initModel(options);

                self.$$observable.createEvent("beforeload", false);

                if (!self.local && self.autoLoad) {
                    self.load();
                }
                else if (initialData) {
                    if (isArray(initialData)) {
                        self._loadArray(initialData);
                    }
                    else {
                        self._loadAjaxData(initialData);
                    }
                }

                if (self.local) {
                    self.loaded     = true;
                }

                if (self.sourceStore) {
                    self.initSourceStore(self.sourceStore, "on");
                }
            },

            setModel: function(model) {
                this.model = model;
                this.initModel({});
            },

            initModel: function(options) {

                var self = this;

                if (isString(self.model)) {
                    self.model  = Model.create(self.model);
                }
                else if (!(self.model instanceof Model)) {
                    self.model  = new Model(self.model);
                }

                if (options.url) {
                    self.model.store.load    = options.url;
                }

                self.idProp = self.model.getStoreProp("load", "id");
            },


            initSourceStore: function(sourceStore, mode) {

                var self = this;
                sourceStore[mode]("update", self.onSourceStoreUpdate, self);

            },

            onSourceStoreUpdate: function() {

                var self    = this;
                self.$$observable.suspendAllEvents();

                self.clear();
                self.addMany(self.sourceStore.toArray());

                self.$$observable.resumeAllEvents();
                self.trigger("update", self);
            },

            /**
             * @returns string
             */
            getId: function() {
                return this.id;
            },

            /**
             * @returns bool
             */
            isLoaded: function() {
                return this.loaded;
            },

            /**
             * @returns bool
             */
            isLocal: function() {
                return this.local;
            },

            /**
             * @param {bool} state
             */
            setLocal: function(state) {
                this.local  = !!state;
            },

            /**
             * @returns bool
             */
            isLoading: function() {
                return this.loading;
            },

            /**
             * @returns bool
             */
            isFiltered: function() {
                return this.filtered;
            },

            /**
             * @returns bool
             */
            isSorted: function() {
                return this.sorted;
            },

            /**
             * @param {boolean} unfiltered
             * @returns number
             */
            getLength: function(unfiltered) {
                return unfiltered ? this.length : this.currentLength;
            },

            /**
             * @returns number
             */
            getTotalLength: function() {
                return this.totalLength || this.currentLength;
            },

            /**
             * @returns {boolean}
             */
            isEmpty: function() {
                return this.length === 0;
            },

            /**
             * @returns number
             */
            getPagesCount: function() {

                var self    = this;

                if (self.pageSize !== null) {
                    return parseInt(self.totalLength / self.pageSize);
                }
                else {
                    return 1;
                }
            },

            /**
             * @param {string} k
             * @param {string|int|null} v
             */
            setParam: function(k, v) {
                if (v === null) {
                    delete this.extraParams[k];
                }
                else {
                    this.extraParams[k] = v;
                }
            },

            /**
             * @param {string} k
             * @returns mixed
             */
            getParam: function(k) {
                return this.extraParams[k];
            },

            /**
             * @returns object
             */
            getParams: function() {
                return extend({}, this.extraParams);
            },

            /**
             * @returns void
             */
            clearParams: function() {
                this.extraParams = {};
            },

            /**
             * @param {number} val
             */
            setStart: function(val) {
                this.start = val;
            },

            /**
             * @param {number} val
             */
            setPageSize: function(val) {
                this.pageSize = val;
            },

            /**
             * @returns {object}
             */
            getAjaxData: function() {
                return this.ajaxData;
            },

            /**
             * @param {boolean} unfiltered
             * @returns bool
             */
            hasDirty: function(unfiltered) {
                if (this.model.isPlain()) {
                    return false;
                }
                var ret = false;
                this.each(function(rec){
                    if (rec.isDirty()) {
                        ret = true;
                        return false;
                    }
                    return true;
                }, null, unfiltered);
                return ret;
            },

            /**
             * @param {boolean} unfiltered
             * @returns []
             */
            getDirty: function(unfiltered) {
                var recs    = [];
                if (this.model.isPlain()) {
                    return recs;
                }
                this.each(function(rec){
                    if (rec.isDirty()) {
                        recs.push(rec);
                    }
                }, null, unfiltered);
                return recs;
            },

            /**
             * @returns MetaphorJs.Model
             */
            getModel: function() {
                return this.model;
            },


            /**
             * @returns []
             */
            toArray: function() {
                return this.current;
            },



            /**
             * initialize store with data from remote sever
             * @param {object} data
             */
            _loadAjaxData: function(data, options) {

                var self    = this;

                options = options || {};

                if (!options.silent && self.trigger("before-load", self) === false) {
                    return;
                }

                self.ajaxData = data;

                self.model._processStoreResponse("load", data, {
                    resolve: function(response) {
                        self._onModelLoadSuccess(response, options);
                    },
                    reject: function(reason) {
                        self._onModelLoadFail(reason, options);
                    }
                });
            },

            /**
             * initialize store with local data
             * @param {[]} recs
             * @param {{}} options
             */
            _loadArray: function(recs, options) {

                var self    = this;

                options = options || {};

                if (!options.silent && self.trigger("before-load", self) === false) {
                    return;
                }

                if (isArray(recs)) {
                    self._load(recs, options);
                    self.totalLength    = self.length;
                }
            },



            /**
             * load records no matter where they came from
             * @param {[]} recs
             * @param {{}} options
             */
            _load: function(recs, options) {

                var self    = this,
                    prepend = options.prepend;

                options = options || {};
                recs = recs || [];

                if (prepend) {
                    self.insertMany(0, recs, true, true)
                }
                else {
                    self.addMany(recs, true, true);
                }

                /*for (var i = 0; i < recs.length; i++) {
                    if (prepend) {
                        self.insert(i, recs[i], true, true);
                    }
                    else {
                        self.add(recs[i], true, true);
                    }
                }*/

                self.loaded     = true;
                self.loading    = false;

                self.trigger("loading-end", self);
                self.onLoad();

                if (!options.skipUpdate) {
                    self.update();
                }

                if (!options.silent) {
                    self.trigger("load", self);
                }
            },

            /**
             * @param {object} params optional
             * @param {object} options optional
             * @returns MetaphorJs.lib.Promise
             */
            load: function(params, options) {

                var self    = this,
                    ms      = self.model.store,
                    sp      = ms.start,
                    lp      = ms.limit,
                    ps      = self.pageSize;

                if (self.loadingPromise && self.loadingPromise.abort) {
                    self.loadingPromise.abort();
                }

                options     = options || {};

                if (self.local) {
                    return null;
                }

                params      = extend({}, self.extraParams, params || {});

                if (ps !== null && !params[sp] && !params[lp]) {
                    if (sp) {
                        params[sp]    = self.start;
                    }
                    if (lp) {
                        params[lp]    = ps;
                    }
                }

                if (!options.silent && self.trigger("before-load", self) === false) {
                    return null;
                }

                self.loading = true;

                self.trigger("loading-start", self);

                return self.loadingPromise = self.model.loadStore(self, params)
                    .done(function(response) {
                        if (self.$destroyed) {
                            return;
                        }
                        self.loadingPromise = null;
                        self.ajaxData = self.model.lastAjaxResponse;
                        self._onModelLoadSuccess(response, options);
                    })
                    .fail(function(reason){
                        if (self.$destroyed) {
                            return;
                        }
                        self.loadingPromise = null;
                        self.ajaxData = self.model.lastAjaxResponse;
                        self._onModelLoadFail(reason, options);
                    });
            },

            _onModelLoadSuccess: function(response, options) {

                var self = this;
                options = options || {};

                if (options.noopOnEmpty && !response.data.length) {
                    return;
                }

                if ((!options.prepend && !options.append) && self.clearOnLoad && self.length > 0) {
                    self.clear(true);
                }

                self.totalLength = parseInt(response.total);
                self._load(response.data, options);
            },

            _onModelLoadFail: function(reason, options) {
                var self = this;
                self.onFailedLoad();
                if (!options.silent) {
                    self.trigger("failed-load", self, reason);
                }
            },

            onLoad: emptyFn,
            onFailedLoad: emptyFn,

            /**
             * @returns MetaphorJs.lib.Promise
             */
            save: function(silent) {

                var self    = this,
                    recs    = {},
                    cnt     = 0;

                if (self.local) {
                    return null;
                }

                if (self.model.isPlain()) {
                    throw new Error("Cannot save plain store");
                }

                self.each(function(rec) {
                    if (rec.isDirty()) {
                        recs[rec.getId()] = rec.storeData(rec.getData());
                        cnt++;
                    }
                });

                if (!cnt) {
                    throw new Error("Nothing to save");
                }

                if (!silent && self.trigger("before-save", self, recs) === false) {
                    return null;
                }

                return self.model.saveStore(self, recs)
                    .done(function(response){
                        self._onModelSaveSuccess(response, silent);
                    })
                    .fail(function(reason){
                        self._onModelSaveFail(reason, silent);
                    });

            },

            _onModelSaveSuccess: function(response, silent) {

                var self = this,
                    i, len,
                    id, rec,
                    data = response.data;

                if (data && data.length) {
                    for (i = 0, len = data.length; i < len; i++) {

                        id      = self.getRecordId(data[i]);
                        rec     = self.getById(id);

                        if (rec) {
                            rec.importData(data[i]);
                        }
                    }
                }

                self.onSave();
                if (!silent) {
                    self.trigger("save", self);
                }
            },

            _onModelSaveFail: function(reason, silent) {
                var self = this;
                self.onFailedSave(reason);
                if (!silent) {
                    self.trigger("failed-save", self);
                }
            },

            onSave: emptyFn,
            onFailedSave: emptyFn,


            /**
             * @param {[]} ids
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.lib.Promise
             */
            deleteById: function(ids, silent, skipUpdate) {

                var self    = this,
                    i, len, rec;

                if (self.local) {
                    return null;
                }

                if (!ids || (isArray(ids) && !ids.length)) {
                    throw new Error("Record id required");
                }

                if (!isArray(ids)) {
                    ids = [ids];
                }

                for (i = 0, len = ids.length; i < len; i++){
                    rec = self.getById(ids[i]);
                    self.remove(rec, silent, skipUpdate);
                    if (rec instanceof Record) {
                        rec.$destroy();
                    }
                }

                if (!silent && self.trigger("before-delete", self, ids) === false) {
                    return null;
                }

                return self.model.deleteRecords(self, ids)
                    .done(function() {
                        self.totalLength -= ids.length;
                        self.onDelete();
                        if (!silent) {
                            self.trigger("delete", self, ids);
                        }
                    })
                    .fail(function() {
                        self.onFailedDelete();
                        if (!silent) {
                            self.trigger("failed-delete", self, ids);
                        }
                    });
            },


            onDelete: emptyFn,
            onFailedDelete: emptyFn,

            /**
             * @param {number} inx
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.lib.Promise
             */
            deleteAt: function(inx, silent, skipUpdate) {
                var self    = this,
                    rec     = self.getAt(inx);

                if (!rec) {
                    throw new Error("Record not found at " + inx);
                }
                return self["delete"](rec, silent, skipUpdate);
            },

            /**
             * @param {MetaphorJs.Record} rec
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.lib.Promise
             */
            "delete": function(rec, silent, skipUpdate) {
                var self    = this;
                return self.deleteById(self.getRecordId(rec), silent, skipUpdate);
            },

            /**
             * @param {MetaphorJs.Record[]} recs
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.lib.Promise
             */
            deleteRecords: function(recs, silent, skipUpdate) {
                var ids     = [],
                    self    = this,
                    i, len;

                for (i = 0, len = recs.length; i < len; i++) {
                    ids.push(self.getRecordId(recs[i]));
                }

                return self.deleteById(ids, silent, skipUpdate);
            },


            /**
             * Load store if not loaded or call provided callback
             * @param {function} cb
             * @param {object} cbScope
             * @param {object} options
             */
            loadOr: function(cb, cbScope, options) {

                var self    = this;

                if (self.local) {
                    return;
                }

                if (!self.isLoading()) {
                    if (!self.isLoaded()) {
                        self.load(null, options);
                    }
                    else if (cb) {
                        cb.call(cbScope || self);
                    }
                }
            },

            addPrevPage: function(options) {
                var self    = this;

                options = options || {};
                options.append = false;
                options.prepend = true;
                options.noopOnEmpty = true;

                return self.loadPrevPage(options);
            },

            /**
             * @method
             */
            addNextPage: function(options) {

                var self    = this;

                options = options || {};
                options.append = true;
                options.prepend = false;
                options.noopOnEmpty = true;

                if (!self.local && (!self.totalLength || self.length < self.totalLength)) {
                    return self.load({
                        start:      self.length,
                        limit:      self.pageSize
                    }, options);
                }
            },

            /**
             * @method
             */
            loadNextPage: function(options) {

                var self    = this;

                if (!self.local && (!self.totalLength || self.length < self.totalLength)) {
                    self.start += self.pageSize;
                    return self.load(null, options);
                }
            },

            /**
             * @method
             */
            loadPrevPage: function(options) {

                var self    = this;

                if (!self.local && self.start > 0) {
                    self.start -= self.pageSize;
                    if (self.start < 0) {
                        self.start = 0;
                    }
                    return self.load(null, options);
                }
            },

            /**
             * @method
             */
            loadPage: function(start, options) {
                var self = this;
                if (!self.local) {
                    self.start = parseInt(start, 10);
                    if (self.start < 0) {
                        self.start = 0;
                    }
                    return self.load(null, options);
                }
            },


            /**
             * @param {MetaphorJs.Record|Object} rec
             */
            getRecordId: function(rec) {
                if (rec instanceof Record) {
                    return rec.getId();
                }
                else if (this.model) {
                    return this.model.getRecordId(rec) || rec[this.idProp] || null;
                }
                else {
                    return rec[this.idProp] || null;
                }
            },

            getRecordData: function(rec) {
                return this.model.isPlain() ? rec : rec.data;
            },

            /**
             * @access protected
             * @param {MetaphorJs.Record|Object} item
             * @returns MetaphorJs.Record|Object
             */
            processRawDataItem: function(item) {

                var self    = this;

                if (item instanceof Record) {
                    return item;
                }

                if (self.model.isPlain()) {
                    return self.model.extendPlainRecord(item);
                }
                else {

                    var type    = self.model.type,
                        id      = self.getRecordId(item),
                        r;

                    if (id) {
                        r       = Model.getFromCache(type, id);
                    }

                    if (!r) {
                        r       = factory(type, id, item, {
                                    model:      self.model,
                                    standalone: false
                        });
                    }

                    return r;
                }
            },

            bindRecord: function(mode, rec) {
                var self = this;
                rec[mode]("change", self.onRecordChange, self);
                rec[mode]("destroy", self.onRecordDestroy, self);
                rec[mode]("dirty-change", self.onRecordDirtyChange, self);
                return rec;
            },

            /**
             * @access protected
             * @param {MetaphorJs.Record|Object} rec
             */
            onRecordDirtyChange: function(rec) {
                this.trigger("update", this, rec);
            },

            /**
             * @access protected
             * @param {MetaphorJs.Record|Object} rec
             * @param {string} k
             * @param {string|int|bool} v
             * @param {string|int|bool} prev
             */
            onRecordChange: function(rec, k, v, prev) {
                this.trigger("update", this, rec);
            },

            /**
             * @access protected
             * @param {MetaphorJs.Record|Object} rec
             */
            onRecordDestroy: function(rec) {
                this.remove(rec);
            },





            /**
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @param {boolean} unfiltered
             * @returns {MetaphorJs.Record|Object|null}
             */
            shift: function(silent, skipUpdate, unfiltered) {
                return this.removeAt(0, 1, silent, skipUpdate, unfiltered);
            },

            /**
             * Works with unfiltered data
             * @param {{}|MetaphorJs.Record} rec
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns {MetaphorJs.Record|Object}
             */
            unshift: function(rec, silent, skipUpdate) {
                return this.insert(0, rec, silent, skipUpdate);
            },

            /**
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @param {boolean} unfiltered
             * @returns {MetaphorJs.Record|Object|null}
             */
            pop: function(silent, skipUpdate, unfiltered) {
                return this.removeAt(this.length - 1, 1, silent, skipUpdate, unfiltered);
            },

            /**
             * Works with unfiltered data
             * @param {[]} recs
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             */
            addMany: function(recs, silent, skipUpdate) {
                var i, l, self = this, start = self.length;

                for (i = 0, l = recs.length; i < l; i++) {
                    self.insert(start + i, recs[i], true, true);
                }

                if (!skipUpdate) {
                    self.update();
                }

                if (l > 0 && !silent) {
                    self.trigger("add", recs);
                }
            },

            /**
             * Works with unfiltered data
             * @param {MetaphorJs.Record|Object} rec
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             */
            add: function(rec, silent, skipUpdate) {
                return this.insert(this.length, rec, silent, skipUpdate);
            },

            onAdd: emptyFn,

            /**
             * Works with both filtered and unfiltered
             * @param {number} index
             * @param {number} length = 1
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @param {boolean} unfiltered -- index from unfiltered item list
             * @returns MetaphorJs.Record|Object|null
             */
            removeAt: function(index, length, silent, skipUpdate, unfiltered) {

                var self    = this,
                    i       = 0,
                    l       = self.length;

                if (l === 0) {
                    return;
                }

                if (index == null) {
                    //index   = 0; ??
                    return;
                }
                while (index < 0) {
                    index   = l + index;
                }

                if (length == null) {
                    length = 1;
                }

                if (!unfiltered) {
                    index   = self.items.indexOf(self.current[index]);
                }

                while (index < self.length && index >= 0 && i < length) {

                    self.length--;
                    var rec     = self.items[index];
                    self.items.splice(index, 1);

                    var id      = self.getRecordId(rec);

                    if (id !== undf){
                        delete self.map[id];
                        delete self.currentMap[id];
                    }

                    self.onRemove(rec, id);

                    if (!skipUpdate) {
                        self.update();
                    }

                    if (!silent) {
                        self.trigger('remove', rec, id);
                    }

                    if (rec instanceof Record) {
                        self.bindRecord("un", rec);
                        rec.detachStore(self);

                        if (length === 1) {
                            return rec.$destroyed ? undf : rec;
                        }
                    }
                    else {
                        if (length === 1) {
                            return rec;
                        }
                    }

                    i++;
                }

                return undf;
            },

            /**
             * @param {int} start
             * @param {int} end
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @param {boolean} unfiltered
             */
            removeRange: function(start, end, silent, skipUpdate, unfiltered) {
                var l       = this.length;

                if (l === 0) {
                    return;
                }

                if (start == null && end == null) {
                    return this.clear(silent);
                }

                if (start == null) {
                    start   = 0;
                }
                while (start < 0) {
                    start   = l + start;
                }
                if (end == null) {
                    end     = l - 1;
                }
                while (end < 0) {
                    end     = l + start;
                }

                return this.removeAt(start, (end - start) + 1, silent, skipUpdate, unfiltered);
            },

            onRemove: emptyFn,

            /**
             * Works with unfiltered items
             * @param {number} index
             * @param {[]} recs
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             */
            insertMany: function(index, recs, silent, skipUpdate) {
                var i, l, self = this;
                for (i = 0, l = recs.length; i < l; i++) {
                    self.insert(index + i, recs[i], true, true);
                }
                if (l > 0 && !skipUpdate) {
                    self.update();
                }
                if (l > 0 && !silent) {
                    self.trigger("add", recs);
                }
            },

            /**
             * Works with unfiltered items
             * @param {number} index
             * @param {MetaphorJs.Record|Object} rec
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.Record|Object
             */
            insert: function(index, rec, silent, skipUpdate) {

                var self = this,
                    id,
                    last = false;

                rec     = self.processRawDataItem(rec);
                id      = self.getRecordId(rec);

                if(self.map[id]){
                    self.$$observable.suspendAllEvents();
                    self.removeId(id);
                    self.$$observable.resumeAllEvents();
                }

                if(index >= self.length){
                    self.items.push(rec);
                    last = true;
                }
                else {
                    self.items.splice(index, 0, rec);
                }

                self.length++;

                if (self.maxLength && self.length > self.maxLength) {
                    if (last) {
                        self.pop(silent, true);
                    }
                    else {
                        self.shift(silent, true);
                    }
                }

                if(id !== undf){
                    self.map[id] = rec;
                }

                if (rec instanceof Record) {
                    rec.attachStore(self);
                    self.bindRecord("on", rec);
                }

                self.onAdd(index, rec);

                if (!skipUpdate) {
                    self.update();
                }

                if (!silent) {
                    self.trigger('add', [rec]);
                }

                return rec;
            },

            /**
             * @param {MetaphorJs.Record|Object} old
             * @param {MetaphorJs.Record|Object} rec
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.Record|Object
             */
            replace: function(old, rec, silent, skipUpdate) {
                var self    = this,
                    index;

                index   = self.items.indexOf(old);

                self.removeAt(index, 1, true, true, true);
                self.insert(index, rec, true, true);

                if (!skipUpdate) {
                    self.update();
                }

                if (!silent) {
                    self.trigger('replace', old, rec);
                }

                return rec;
            },


            replaceId: function(id, rec, silent, skipUpdate) {
                var self    = this,
                    index;

                index = self.indexOfId(id);

                return self.replace(self.getAt(index), rec);
            },

            onReplace: emptyFn,

            /**
             * @param {MetaphorJs.Record|Object} rec
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.Record|Object|null
             */
            remove: function(rec, silent, skipUpdate) {
                var inx = this.indexOf(rec, true);
                if (inx !== -1) {
                    return this.removeAt(inx, 1, silent, skipUpdate, true);
                }
                return null;
            },

            /**
             * @param {string|int} id
             * @param {boolean} silent
             * @param {boolean} skipUpdate
             * @returns MetaphorJs.Record|Object|null
             */
            removeId: function(id, silent, skipUpdate) {
                var inx = this.indexOfId(id, true);
                if (inx !== -1) {
                    return this.removeAt(inx, 1, silent, skipUpdate, true);
                }
            },



            /**
             * @param {MetaphorJs.Record|Object} rec
             * @param {boolean} unfiltered
             * @returns boolean
             */
            contains: function(rec, unfiltered) {
                return this.indexOf(rec, unfiltered) !== -1;
            },

            /**
             * @param {string|int} id
             * @param {boolean} unfiltered
             * @returns boolean
             */
            containsId: function(id, unfiltered) {
                if (unfiltered) {
                    return this.map[id] !== undf;
                }
                else {
                    return this.currentMap[id] !== undf;
                }
            },

            /**
             * @method
             */
            clear: function(silent) {

                var self    = this,
                    recs    = self.getRange();

                self._reset();
                self.onClear();

                if (!silent) {
                    self.trigger('clear', recs);
                }
            },

            onClear: emptyFn,

            /**
             * @method
             */
            reset: function() {
                this._reset();
                this.start = 0;
            },

            _reset: function(keepRecords) {
                var self    = this,
                i, len, rec;

                if (!keepRecords) {
                    for (i = 0, len = self.items.length; i < len; i++) {
                        rec = self.items[i];
                        if (rec instanceof Record) {
                            self.bindRecord("un", rec);
                            rec.detachStore(self);
                        }
                    }
                }

                self.length         = 0;
                self.currentLength  = 0;
                self.totalLength    = 0;
                self.items          = [];
                self.current        = [];
                self.map            = {};
                self.currentMap     = {};
                self.loaded         = self.local;
            },


            /**
             * @param {number} index
             * @param {boolean} unfiltered
             * @returns MetaphorJs.Record|Object|null
             */
            getAt: function(index, unfiltered) {
                return unfiltered ?
                       (this.items[index] || undf) :
                       (this.current[index] || undf);
            },

            /**
             * @param {string|int} id
             * @param {boolean} unfiltered
             * @returns MetaphorJs.Record|Object|null
             */
            getById: function(id, unfiltered) {
                return unfiltered ?
                       (this.map[id] || undf) :
                       (this.currentMap[id] || undf);
            },

            /**
             * Works with filtered list unless fromOriginal = true
             * @param {MetaphorJs.Record|Object} rec
             * @param {boolean} unfiltered
             * @returns Number
             */
            indexOf: function(rec, unfiltered) {
                return unfiltered ?
                       this.items.indexOf(rec) :
                       this.current.indexOf(rec);
            },

            /**
             * @param {string|int} id
             * @param {boolean} unfiltered
             * @returns Number
             */
            indexOfId: function(id, unfiltered) {
                return this.indexOf(this.getById(id, unfiltered), unfiltered);
            },

            /**
             * @param {function} fn {
             *      @param {MetaphorJs.Record|Object} rec
             *      @param {number} index
             *      @param {number} length
             * }
             * @param {object} context
             * @param {boolean} unfiltered
             */
            each: function(fn, context, unfiltered) {
                var items = unfiltered ?
                            this.items.slice() :
                            this.current.slice();

                for(var i = 0, len = items.length; i < len; i++){
                    if(fn.call(context, items[i], i, len) === false){
                        break;
                    }
                }
            },

            /**
             * @param {function} fn {
             *      @param {string|number} id
             *      @param {number} index
             *      @param {number} length
             * }
             * @param {object} context
             * @param {boolean} unfiltered
             */
            eachId: function(fn, context, unfiltered) {

                var self    = this;

                self.each(function(rec, i, len){
                    return fn.call(context, self.getRecordId(rec), i, len);
                }, null, unfiltered);
            },

            /**
             * @param {string} f Field name
             * @param {boolean} unfiltered
             * @returns []
             */
            collect: function(f, unfiltered) {

                var coll    = [],
                    self    = this,
                    rt      = !self.model.isPlain();

                self.each(function(rec){

                    var val = rt ? rec.get(f) : rec[f];

                    if (val) {
                        coll.push(val);
                    }
                }, null, unfiltered);

                return coll;
            },

            /**
             * @param {boolean} unfiltered
             * @returns MetaphorJs.Record|Object
             */
            first : function(unfiltered){
                return unfiltered ? this.items[0] : this.current[0];
            },

            /**
             * @param {boolean} unfiltered
             * @returns MetaphorJs.Record|Object
             */
            last : function(unfiltered){
                return unfiltered ? this.items[this.length-1] : this.current[this.current-1];
            },

            /**
             *
             * @param {number} start Optional
             * @param {number} end Optional
             * @param {boolean} unfiltered
             * @returns MetaphorJs.Record[]|Object[]
             */
            getRange : function(start, end, unfiltered){
                var self    = this,
                    items   = unfiltered ? self.items : self.current,
                    r       = [],
                    i;

                if(items.length < 1){
                    return r;
                }

                start   = start || 0;
                end     = Math.min(end == undf ? self.length-1 : end, self.length-1);

                if(start <= end){
                    for(i = start; i <= end; i++) {
                        r.push(items[i]);
                    }
                }else{
                    for(i = start; i >= end; i--) {
                        r.push(items[i]);
                    }
                }
                return r;
            },

            /**
             *
             * @param {function} fn {
             *      @param {MetaphorJs.Record|Object} rec
             *      @param {string|int} id
             * }
             * @param {object} context
             * @param {number} start { @default 0 }
             * @param {boolean} unfiltered
             * @returns MetaphorJs.Record|Object|null
             */
            findBy: function(fn, context, start, unfiltered) {
                var inx = this.findIndexBy(fn, context, start, unfiltered);
                return inx === -1 ? undf : this.getAt(inx, unfiltered);
            },

            /**
             *
             * @param {function} fn {
             *      @param {MetaphorJs.Record|Object} rec
             *      @param {string|int} id
             * }
             * @param {object} context
             * @param {number} start { @default 0 }
             * @param {boolean} unfiltered
             * @returns Number
             */
            findIndexBy : function(fn, context, start, unfiltered) {

                var self = this,
                    it  = unfiltered ? self.items : self.current;

                for(var i = (start||0), len = it.length; i < len; i++){
                    if(fn.call(context, it[i], self.getRecordId(it[i]))){
                        return i;
                    }
                }

                return -1;
            },

            /**
             * @param {string} property
             * @param {string|int|bool} value
             * @param {bool} exact
             * @param {boolean} unfiltered
             * @returns Number
             */
            find: function(property, value, exact, unfiltered) {

                var self    = this,
                    rt      = !self.model.isPlain(),
                    v;

                var inx = self.findIndexBy(function(rec) {

                    v = rt ? rec.get(property) : rec[property];

                    if (exact) {
                        return v === value;
                    }
                    else {
                        return v == value;
                    }

                }, self, 0, unfiltered);

                return inx !== -1 ? self.getAt(inx, unfiltered) : null;
            },

            /**
             * @param {string} property
             * @param {string|int|bool} value
             * @param {boolean} unfiltered
             * @returns number
             */
            findExact: function(property, value, unfiltered) {
                return this.find(property, value, true, unfiltered);
            },

            /**
             * @param {object} props
             * @param {boolean} unfiltered
             * @returns MetaphorJs.Record|Object|null
             */
            findBySet: function(props, unfiltered) {

                var found   = null,
                    match,
                    i;

                this.each(function(rec){

                    match   = true;

                    for (i in props) {
                        if (props[i] != rec[i]) {
                            match   = false;
                            break;
                        }
                    }

                    if (match) {
                        found   = rec;
                        return false;
                    }

                    return true;
                }, null, unfiltered);

                return found;
            },





            update: function() {

                var self        = this,
                    filtered    = self.filtered,
                    sorted      = self.sorted,
                    isPlain     = self.model.isPlain();

                self.currentLength  = self.length;
                self.currentMap     = self.map;
                self.current        = self.items;

                if (filtered) {

                    var by              = self.filterBy,
                        opt             = self.filterOpt,
                        current,
                        map;

                    self.current        = current = [];
                    self.currentMap     = map = {};

                    self.each(function(rec){
                        if (filterArray.compare(isPlain ? rec : rec.data, by, opt)) {
                            current.push(rec);
                            map[self.getRecordId(rec)] = rec;
                        }
                    }, null, true);

                    self.currentLength  = self.current.length;
                }

                if (sorted) {
                    var sortBy          = self.sortBy,
                        rt              = !self.model.isPlain(),
                        getterFn        = function(item) {
                            return rt ? item.get(sortBy) : item[sortBy];
                        };
                    self.current        = sortArray(self.current, getterFn, self.sortDir);
                }

                self.trigger("update", self);
            },


            /**
             * @param {{}|string} by
             * @param {string|boolean} opt
             */
            filter: function(by, opt) {

                var self    = this;

                self.filtered       = true;
                self.filterBy       = by;
                self.filterOpt      = opt;

                self.update();
            },

            clearFilter: function() {

                var self    = this;

                if (!self.filtered) {
                    return;
                }

                self.filterBy = null;
                self.filterOpt = null;

                self.update();
            },

            /**
             * @param {string} by
             * @param {string} dir
             */
            sort: function(by, dir) {
                var self = this;
                self.sorted = true;
                self.sortBy = by;
                self.sortDir = dir;
                self.update();
            },

            clearSorting: function() {
                var self = this;
                self.sorted = false;
                self.sortBy = null;
                self.sortDir = null;
                self.update();
            },


            destroy: function() {

                var self    = this;

                delete allStores[self.id];

                if (self.sourceStore) {
                    self.initSourceStore(self.sourceStore, "un");
                }

                self.clear();

                self.trigger("destroy", self);

                self.$super();
            }

        },

        {
            /**
             * @static
             * @param {string} id
             * @returns MetaphorJs.Store|null
             */
            lookupStore: function(id) {
                return allStores[id] || null;
            },


            eachStore: function(fn, fnScope) {

                var id;

                for (id in allStores) {
                    if (fn.call(fnScope, allStores[id]) === false) {
                        break;
                    }
                }
            }
        }
    );


}();




var StoreRenderer = ListRenderer.$extend({

    $class: "StoreRenderer",
    store: null,


    $constructor: function(scope, node, expr, parentRenderer, attr) {

        var cfg = attr ? attr.config : {};

        if (cfg.pullNext) {
            if (cfg.buffered) {
                cfg.bufferedPullNext = true;
                cfg.buffered = false;
            }

            this.$plugins.push(
                typeof cfg.pullNext === "string" ?
                    cfg.pullNext : "plugin.ListPullNext");
        }

        this.$super(scope, node, expr, parentRenderer, attr);
    },

    afterInit: function(scope, node, expr, parentRenderer, attr) {

        var self            = this,
            store;

        self.store          = store = createGetter(self.model)(scope);
        self.watcher        = createWatchable(store, ".current", self.onChange, self, {filterLookup: filterLookup});
        
        if (self.trackByFn !== false) {
            self.trackByFn      = bind(store.getRecordId, store);
        }
        
        self.griDelegate    = bind(store.indexOfId, store);
        self.bindStore(store, "on");
    },

    bindStore: function(store, fn) {

        var self    = this;

        store[fn]("update", self.onStoreUpdate, self);
        store[fn]("clear", self.onStoreUpdate, self);
        store[fn]("destroy", self.onStoreDestroy, self);
    },

    onStoreUpdate: function() {
        this.watcher.check();
    },

    getListItem: function(list, index) {
        return this.store.getRecordData(list[index]);
    },

    onStoreDestroy: function() {
        var self = this;
        if (self.watcher) {
            self.onStoreUpdate();
            self.watcher.unsubscribeAndDestroy(self.onChange, self);
            self.watcher = null;
        }
    },

    destroy: function() {
        var self = this;
        if (!self.store.$destroyed) {
            self.bindStore(self.store, "un");
        }
        self.$super();
    }

},
{
    $stopRenderer: true,
    $registerBy: "id"
}
);









Directive.getDirective("attr", "each")
    .registerType(Store, StoreRenderer);




function setStyle(el, name, value) {

    if (!el || !el.style) {
        return;
    }

    var props,
        style = el.style,
        k;

    if (typeof name === "string") {
        props = {};
        props[name] = value;
    }
    else {
        props = name;
    }

    for (k in props) {
        style[k] = props[k];
    }
};
/**
 * @param {Element} el
 * @returns {boolean}
 */
function isVisible(el) {
    return el && !(el.offsetWidth <= 0 || el.offsetHeight <= 0);
};



/**
 * @param {Element} el
 * @param {String} selector
 * @returns {boolean}
 */
var is = select.is;

function ucfirst(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
};



var getOuterWidth = getDimensions("outer", "Width");



var getOuterHeight = getDimensions("outer", "Height");

var delegates = {};




function delegate(el, selector, event, fn) {

    var key = selector + "-" + event,
        listener    = function(e) {
            e = normalizeEvent(e);
            var trg = e.target;
            while (trg) {
                if (is(trg, selector)) {
                    return fn(e);
                }
                trg = trg.parentNode;
            }
            return null;
        };

    if (!delegates[key]) {
        delegates[key] = [];
    }

    delegates[key].push({el: el, ls: listener, fn: fn});

    addListener(el, event, listener);
};



function undelegate(el, selector, event, fn) {

    var key = selector + "-" + event,
        i, l,
        ds;

    if (ds = delegates[key]) {
        for (i = -1, l = ds.length; ++i < l;) {
            if (ds[i].el === el && ds[i].fn === fn) {
                removeListener(el, event, ds[i].ls);
            }
        }
    }
};



defineClass({

    $class: "dialog.position.Abstract",
    dialog: null,
    positionBase: null,
    correct: "solid",

    $init: function(dialog) {
        var self = this;
        self.dialog = dialog;
        extend(self, dialog.getCfg().position, true, false);

        self.onWindowResizeDelegate = bind(self.onWindowResize, self);
        self.onWindowScrollDelegate = bind(self.onWindowScroll, self);

        var pt = self.preferredType || self.type;
        if (typeof pt == "string") {
            var pts = self.getAllPositions(),
                inx;
            if ((inx = pts.indexOf(pt)) != -1) {
                pts.splice(inx, 1);
                pts.unshift(pt);
            }
            self.preferredType = pts;
        }
        else if (!pt) {
            self.preferredType = self.getAllPositions();
        }

        dialog.on("reposition", self.onReposition, self);
        dialog.on("show-after-delay", self.onShowAfterDelay, self);
        dialog.on("hide-after-delay", self.onHideAfterDelay, self);

        if (dialog.isVisible()) {
            self.onShowAfterDelay();
        }

    },


    getPositionBase: function() {

        var self = this,
            dlg = self.dialog;

        if (self.positionBase) {
            return self.positionBase;
        }
        var b;
        if (b = dlg.getCfg().position.base) {
            if (typeof b == "string") {
                self.positionBase = select(b).shift();
            }
            else {
                self.positionBase = b;
            }
            return self.positionBase;
        }
        return null;
    },

    getBoundary: function() {

        var self    = this,
            base    = self.getPositionBase(),
            sx      = self.screenX || 0,
            sy      = self.screenY || 0,
            w, h,
            st, sl,
            ofs;

        if (base) {
            ofs = getOffset(base);
            w = getOuterWidth(base);
            h = getOuterHeight(base);
            return {
                x: ofs.left + sx,
                y: ofs.top + sy,
                x1: ofs.left + w - sx,
                y1: ofs.top + h - sy,
                w: w,
                h: h
            };
        }
        else {
            w = getWidth(window);
            h = getHeight(window);
            st = getScrollTop(window);
            sl = getScrollLeft(window);
            return {
                x: sl + sx,
                y: st + sy,
                x1: sl + w - sx,
                y1: st + h - sy,
                w: w,
                h: h
            };
        }
    },


    getPrimaryPosition: function(pos) {
        return false;
    },
    getSecondaryPosition: function(pos) {
        return false;
    },

    getAllPositions: function() {
        return [];
    },

    correctPosition: function(e) {

        var self        = this,
            pri         = self.getPrimaryPosition(),
            strategy    = self.correct;

        if (!pri || !strategy) {
            return;
        }

        var dlg         = self.dialog,
            boundary    = self.getBoundary(),
            size        = dlg.getDialogSize(),
            pts         = self.preferredType,
            pt          = pts[0],
            i, l;

        if (strategy && strategy != "solid") {
            if (self.type != pt && self.checkIfFits(e, pt, boundary, size, false)) {
                self.changeType(pt);
                return self.fitToBoundary(self.getCoords(e), boundary, size);
            }

            if (self.checkIfFits(e, self.type, boundary, size, false)) {
                return self.fitToBoundary(self.getCoords(e), boundary, size);
            }
        }
        if (strategy && strategy != "position-only") {
            for (i = 0, l = pts.length; i < l; i++) {
                if (self.checkIfFits(e, pts[i], boundary, size, true)) {
                    self.changeType(pts[i]);
                    return self.getCoords(e);
                }
            }
        }

        return self.getCoords(e);
    },

    checkIfFits: function(e, position, boundary, size, fully) {

        var self    = this,
            coords  = self.getCoords(e, position, true);

        // leave only basic positions here
        if (!fully && self.getSecondaryPosition(position)) {
            return false;
        }

        if (fully) {
            return !(coords.x < boundary.x ||
                     coords.y < boundary.y ||
                     coords.x + size.width > boundary.x1 ||
                     coords.y + size.height > boundary.y1);
        }
        else {
            var pri = self.getPrimaryPosition(position);
            switch (pri) {
                case "t":
                    return coords.y >= boundary.y;
                case "r":
                    return coords.x + size.width <= boundary.x1;
                case "b":
                    return coords.y + size.height <= boundary.y1;
                case "l":
                    return coords.x >= boundary.x;
            }
        }
    },

    fitToBoundary: function(coords, boundary, size) {

        var self = this,
            base = self.getPositionBase(),
            x = base ? 0 : boundary.x,
            y = base ? 0 : boundary.y,
            x1 = base ? boundary.w : boundary.x1,
            y1 = base ? boundary.h : boundary.y1,
            xDiff = 0,
            yDiff = 0,
            pointer = self.dialog.getPointer();

        if (coords.x < x) {
            xDiff = coords.x - x;
            coords.x = x;
        }
        if (coords.y < y) {
            yDiff = coords.y - y;
            coords.y = y;
        }
        if (coords.x + size.width > x1) {
            xDiff = (coords.x + size.width) - x1;
            coords.x -= xDiff;
        }
        if (coords.y + size.height > y1) {
            yDiff = (coords.y + size.height) - y1;
            coords.y -= yDiff;
        }

        pointer.setCorrectionOffset(xDiff, yDiff);
        pointer.reposition();

        return coords;
    },

    changeType: function(type) {
        var self = this,
            dlg = self.dialog,
            pointer = dlg.getPointer();

        self.type = type;
        pointer.setType(null, null);
    },

    onReposition: function(dlg, e) {

        var self    = this,
            coords;

        if (self.screenX !== false || self.screenY !== false) {
            coords  = self.correctPosition(e);
        }
        else {
            coords  = self.getCoords(e);
        }

        self.apply(coords);
    },

    getCoords: function(e){
        return {
            left: 0,
            top: 0
        }
    },

    apply: function(coords) {

        if (!coords) {
            return;
        }

        if (isNaN(coords.x) || isNaN(coords.y)) {
            return;
        }

        var self    = this,
            dlg     = self.dialog,
            axis    = dlg.getCfg().position.axis,
            pos     = {};

        axis != "y" && (pos.left = coords.x + "px");
        axis != "x" && (pos.top = coords.y + "px");

        setStyle(dlg.getElem(), pos);
    },

    onWindowResize: function(e) {
        this.dialog.reposition(normalizeEvent(e));
    },

    onWindowScroll: function(e) {
        this.dialog.reposition(normalizeEvent(e));
    },

    onShowAfterDelay: function() {
        var self = this;

        if (self.resize || self.screenX || self.screenY) {
            addListener(window, "resize", self.onWindowResizeDelegate);
        }

        if (self.scroll || self.screenX || self.screenY) {
            addListener(self.dialog.getScrollEl(self.scroll), "scroll", self.onWindowScrollDelegate);
        }
    },

    onHideAfterDelay: function() {

        var self = this;

        if (self.resize || self.screenX || self.screenY) {
            removeListener(window, "resize", self.onWindowResizeDelegate);
        }

        if (self.scroll || self.screenX || self.screenY) {
            removeListener(self.dialog.getScrollEl(self.scroll), "scroll", self.onWindowScrollDelegate);
        }
    },

    destroy: function() {

        var self = this,
            dlg = self.dialog;

        removeListener(window, "resize", self.onWindowResizeDelegate);
        removeListener(dlg.getScrollEl(self.scroll), "scroll", self.onWindowScrollDelegate);

        dlg.un("reposition", self.onReposition, self);
        dlg.un("show-after-delay", self.onShowAfterDelay, self);
        dlg.un("hide-after-delay", self.onHideAfterDelay, self);

        if (dlg.isVisible()) {
            self.onHideAfterDelay();
        }
    }



});






function getOffsetParent(node) {

    var html = window.document.documentElement,
        offsetParent = node.offsetParent || html;

    while (offsetParent && (offsetParent != html &&
                              getStyle(offsetParent, "position") == "static")) {
        offsetParent = offsetParent.offsetParent;
    }

    return offsetParent || html;

};



function getOffset(node) {

    var box = {top: 0, left: 0},
        html = window.document.documentElement;

    // Make sure it's not a disconnected DOM node
    if (!isAttached(node) || node === window) {
        return box;
    }

    // Support: BlackBerry 5, iOS 3 (original iPhone)
    // If we don't have gBCR, just use 0,0 rather than error
    if (node.getBoundingClientRect ) {
        box = node.getBoundingClientRect();
    }

    return {
        top: box.top + getScrollTop() - html.clientTop,
        left: box.left + getScrollLeft() - html.clientLeft
    };
};



function getPosition(node, to) {

    var offsetParent, offset,
        parentOffset = {top: 0, left: 0},
        html = window.document.documentElement;

    if (node === window || node === html) {
        return parentOffset;
    }

    // Fixed elements are offset from window (parentOffset = {top:0, left: 0},
    // because it is its only offset parent
    if (getStyle(node, "position" ) == "fixed") {
        // Assume getBoundingClientRect is there when computed position is fixed
        offset = node.getBoundingClientRect();
    }
    else if (to) {
        var thisOffset = getOffset(node),
            toOffset = getOffset(to),
            position = {
                left: thisOffset.left - toOffset.left,
                top: thisOffset.top - toOffset.top
            };

        if (position.left < 0) {
            position.left = 0;
        }
        if (position.top < 0) {
            position.top = 0;
        }
        return position;
    }
    else {
        // Get *real* offsetParent
        offsetParent = getOffsetParent(node);

        // Get correct offsets
        offset = getOffset(node);

        if (offsetParent !== html) {
            parentOffset = getOffset(offsetParent);
        }

        // Add offsetParent borders
        parentOffset.top += getStyle(offsetParent, "borderTopWidth", true);
        parentOffset.left += getStyle(offsetParent, "borderLeftWidth", true);
    }

    // Subtract parent offsets and element margins
    return {
        top: offset.top - parentOffset.top - getStyle(node, "marginTop", true),
        left: offset.left - parentOffset.left - getStyle(node, "marginLeft", true)
    };
};





defineClass({

    $class: "dialog.position.Target",
    $extends: "dialog.position.Abstract",

    getCoords: function(e, type, absolute) {

        var self    = this,
            dlg     = self.dialog,
            cfg     = dlg.getCfg(),
            target  = dlg.getTarget();

        if (!target) {
            return null;
        }

        type    = type || self.type;

        var pBase   = self.getPositionBase(),
            size    = dlg.getDialogSize(),
            offset  = pBase && !absolute ?
                        getPosition(target, pBase) :
                            getOffset(target),
            tsize   = dlg.getTargetSize(),
            pos     = {},
            pri     = type.substr(0, 1),
            sec     = type.substr(1),
            offsetX = cfg.position.offsetX,
            offsetY = cfg.position.offsetY,
            pntOfs  = dlg.pointer.getDialogPositionOffset(type);

        switch (pri) {
            case "t": {
                pos.y   = offset.top - size.height - offsetY;
                break;
            }
            case "r": {
                pos.x   = offset.left + tsize.width + offsetX;
                break;
            }
            case "b": {
                pos.y   = offset.top + tsize.height + offsetY;
                break;
            }
            case "l": {
                pos.x   = offset.left - size.width - offsetX;
                break;
            }
        }

        switch (sec) {
            case "t": {
                pos.y   = offset.top + offsetY;
                break;
            }
            case "r": {
                pos.x   = offset.left + tsize.width - size.width - offsetX;
                break;
            }
            case "b": {
                pos.y   = offset.top + tsize.height - size.height - offsetY;
                break;
            }
            case "l": {
                pos.x   = offset.left + offsetX;
                break;
            }
            case "rc": {
                pos.x   = offset.left + tsize.width + offsetX;
                break;
            }
            case "lc": {
                pos.x   = offset.left - size.width - offsetX;
                break;
            }
            case "": {
                switch (pri) {
                    case "t":
                    case "b": {
                        pos.x   = offset.left + (tsize.width / 2) -
                                    (size.width / 2);
                        break;
                    }
                    case "r":
                    case "l": {
                        pos.y   = offset.top + (tsize.height / 2) -
                                    (size.height / 2);
                        break;
                    }
                }
                break;
            }
        }

        if (pntOfs) {
            pos.x += pntOfs.x;
            pos.y += pntOfs.y;
        }

        return pos;
    },

    getPrimaryPosition: function(pos) {
        return (pos || this.type).substr(0, 1);
    },

    getSecondaryPosition: function(pos) {
        return (pos || this.type).substr(1);
    },

    getAllPositions: function() {
        return ["t", "r", "b", "l", "tl", "tr", "rt", "rb",
                "br", "bl", "lb", "lt", "tlc", "trc", "brc", "blc"];
    }

});









defineClass({

    $class: "dialog.position.Mouse",
    $extends: "dialog.position.Target",
    correct: "position",

    $init: function(dialog) {

        var self = this;

        self.onMouseMoveDelegate = bind(self.onMouseMove, self);
        self.$super(dialog);
    },

    getCoords: function(e, type, absolute) {

        if (!e) {
            return null;
        }

        var self    = this,
            origType= type || self.type,
            dlg     = self.dialog,
            cfg     = dlg.getCfg(),
            size    = dlg.getDialogSize(),
            base    = self.getPositionBase(),
            pos     = {},
            type    = (type || self.type).substr(1),
            offsetX = cfg.position.offsetX,
            offsetY = cfg.position.offsetY,
            axis    = cfg.position.axis,
            pntOfs  = dlg.getPointer().getDialogPositionOffset(origType),
            absOfs  = {x: 0, y: 0};

        if (!absolute && base) {
            var baseOfs = getOffset(base);
            absOfs.x = baseOfs.left;
            absOfs.y = baseOfs.top;
        }

        switch (type) {
            case "": {
                pos     = self.get.call(dlg.$$callbackContext, dlg, e, type, absolute);
                break;
            }
            case "c": {
                pos.y   = e.pageY - absOfs.y - (size.height / 2);
                pos.x   = e.pageX - absOfs.x - (size.width / 2);
                break;
            }
            case "t": {
                pos.y   = e.pageY - absOfs.y - size.height - offsetY;
                pos.x   = e.pageX - absOfs.x - (size.width / 2);
                break;
            }
            case "r": {
                pos.y   = e.pageY - absOfs.y - (size.height / 2);
                pos.x   = e.pageX - absOfs.x + offsetX;
                break;
            }
            case "b": {
                pos.y   = e.pageY - absOfs.y + offsetY;
                pos.x   = e.pageX - absOfs.x - (size.width / 2);
                break;
            }
            case "l": {
                pos.y   = e.pageY - absOfs.y - (size.height / 2);
                pos.x   = e.pageX - absOfs.x - size.width - offsetX;
                break;
            }
            case "rt": {
                pos.y   = e.pageY - absOfs.y - size.height - offsetY;
                pos.x   = e.pageX - absOfs.x + offsetX;
                break;
            }
            case "rb": {
                pos.y   = e.pageY - absOfs.y + offsetY;
                pos.x   = e.pageX - absOfs.x + offsetX;
                break;
            }
            case "lt": {
                pos.y   = e.pageY - absOfs.y - size.height - offsetY;
                pos.x   = e.pageX - absOfs.x - size.width - offsetX;
                break;
            }
            case "lb": {
                pos.y   = e.pageY - absOfs.y + offsetY;
                pos.x   = e.pageX - absOfs.x - size.width - offsetX;
                break;
            }
        }

        if (pntOfs) {
            pos.x += pntOfs.x;
            pos.y += pntOfs.y;
        }

        if (axis) {
            var tp = self.$super(e, type);
            if (tp) {
                if (axis == "x") {
                    pos.y = tp.y;
                }
                else {
                    pos.x = tp.x;
                }
            }
        }

        return pos;
    },

    onShowAfterDelay: function() {
        var self = this;
        self.$super();
        addListener(window.document.documentElement, "mousemove", self.onMouseMoveDelegate);
    },

    onHideAfterDelay: function() {
        var self = this;
        self.$super();
        removeListener(window.document.documentElement, "mousemove", self.onMouseMoveDelegate);
    },

    onMouseMove: function(e) {
        this.dialog.reposition(normalizeEvent(e));
    },

    getPrimaryPosition: function(pos) {
        return (pos || this.type).substr(1, 1);
    },

    getSecondaryPosition: function(pos) {
        return (pos || this.type).substr(2);
    },

    getAllPositions: function() {
        return ["mt", "mr", "mb", "ml", "mrt", "mrb", "mlb", "mlt"];
    }
});







defineClass({

    $class: "dialog.position.Window",
    $extends: "dialog.position.Abstract",


    getCoords: function(e, type) {

        var self    = this,
            dlg     = self.dialog,
            pBase   = self.getPositionBase() || window,
            size    = dlg.getDialogSize(),
            pos     = {},
            type    = (type || self.type).substr(1),
            offsetX = self.offsetX,
            offsetY = self.offsetY,
            st      = getScrollTop(pBase),
            sl      = getScrollLeft(pBase),
            ww      = getOuterWidth(pBase),
            wh      = getOuterHeight(pBase);

        switch (type) {
            case "c": {
                pos.y   = (wh / 2) - (size.height / 2) + st;
                pos.x   = (ww / 2) - (size.width / 2) + sl;
                break;
            }
            case "t": {
                pos.y   = st + offsetY;
                pos.x   = (ww / 2) - (size.width / 2) + sl;
                break;
            }
            case "r": {
                pos.y   = (wh / 2) - (size.height / 2) + st;
                pos.x   = ww - size.width + sl - offsetX;
                break;
            }
            case "b": {
                pos.y   = wh - size.height + st - offsetY;
                pos.x   = (ww / 2) - (size.width / 2) + sl;
                break;
            }
            case "l": {
                pos.y   = (wh / 2) - (size.height / 2) + st;
                pos.x   = sl + offsetX;
                break;
            }
            case "rt": {
                pos.y   = st + offsetY;
                pos.x   = ww - size.width + sl - offsetX;
                break;
            }
            case "rb": {
                pos.y   = wh - size.height + st - offsetY;
                pos.x   = ww - size.width + sl - offsetX;
                break;
            }
            case "lt": {
                pos.y   = st + offsetY;
                pos.x   = sl + offsetX;
                break;
            }
            case "lb": {
                pos.y   = wh - size.height + st - offsetY;
                pos.x   = sl + offsetX;
                break;
            }
        }

        return pos;
    },

    getPrimaryPosition: function(type) {
        return (type || this.type).substr(1, 1);
    },

    getSecondaryPosition: function(type) {
        return (type || this.type).substr(2);
    },


    getAllPositions: function() {
        return ["wt", "wr", "wb", "wl", "wrt", "wrb", "wlb", "wlt", "wc"];
    },

    correctPosition: function(e) {
        return this.getCoords(e);
    }

});







defineClass({

    $class: "dialog.position.Custom",
    $extends: "dialog.position.Abstract",

    getCoords: function(e) {

        var dlg = this.dialog;
        return this.get.call(dlg.$$callbackContext, dlg, e);
    }
});





defineClass({

    $class: "dialog.pointer.Abstract",
    enabled: null,
    node: null,
    correctX: 0,
    correctY: 0,

    $init: function(dialog, cfg) {

        var self = this;

        extend(self, cfg, true, false);

        self.origCfg    = cfg;
        self.dialog     = dialog;
        self.opposite   = {t: "b", r: "l", b: "t", l: "r"};
        self.names      = {t: 'top', r: 'right', b: 'bottom', l: 'left'};
        self.sides      = {t: ['l','r'], r: ['t','b'], b: ['r','l'], l: ['b','t']};

        if (self.enabled !== false && cfg.size) {
            self.enabled = true;
        }
        else {
            self.enabled = false;
        }
    },

    enable: function() {
        var self = this;
        if (!self.enabled) {
            self.enabled = true;
            self.render();
            if (self.dialog.isVisible()) {
                self.dialog.reposition();
            }
        }
    },

    disable: function() {
        var self = this;
        if (self.enabled) {
            self.remove();
            self.enabled = false;
            if (self.dialog.isVisible()) {
                self.dialog.reposition();
            }
        }
    },

    getElem: function() {
        return this.node;
    },

    getSize: function() {
        return this.enabled ? this.size : 0;
    },

    setCorrectionOffset: function(x, y) {
        this.correctX = x;
        this.correctY = y;
    },

    getCorrectionValue: function(type, value, position) {

        if (!value) {
            return 0;
        }

        var self    = this,
            pri     = position.substr(0,1),
            sec     = position.substr(1,1),
            tsize   = self.dialog.getDialogSize(),
            width   = self.width,
            sprop   = pri == "t" || pri == "b" ? "width" : "height",
            min,
            max;

        switch (sec) {
            case "":
                max = (tsize[sprop] / 2) - (width / 2);
                min = -max;
                break;
            case "l":
                min = 0;
                max = tsize[sprop] - (width / 2);
                break;
            case "r":
                min = -(tsize[sprop] - (width / 2));
                max = 0;
                break;
        }

        value = value < 0 ? Math.max(min, value) : Math.min(max, value);

        if ((pri == "t" || pri == "b") && type == "x") {
            return value;
        }
        if ((pri == "l" || pri == "r") && type == "y") {
            return value;
        }

        return 0;
    },

    getDialogPositionOffset: function(position) {
        var self    = this,
            pp      = (self.detectPointerPosition(position) || "").substr(0,1),
            dp      = self.dialog.getPosition().getPrimaryPosition(position),
            ofs     = {x: 0, y: 0};

        if (!self.enabled) {
            return ofs;
        }

        if (pp == self.opposite[dp]) {
            ofs[pp == "t" || pp == "b" ? "y" : "x"] =
                pp == "b" || pp == "r" ? -self.size : self.size;
        }

        return ofs;
    },

    detectPointerPosition: function(dialogPosition) {

        var self = this,
            pri, sec, thr;

        if (self.position && !dialogPosition) {
            if (isFunction(self.position)) {
                return self.position.call(self.dialog.$$callbackContext, self.dialog, self.origCfg);
            }
            return self.position;
        }

        pri = self.dialog.getPosition().getPrimaryPosition(dialogPosition);
        sec = self.dialog.getPosition().getSecondaryPosition(dialogPosition);
        thr = sec.substr(1, 1);

        if (!pri) {
            return null;
        }

        var position = self.opposite[pri];

        if (sec) {
            sec = sec.substr(0, 1);
            if (thr == "c") {
                position += self.opposite[sec];
            }
            else {
                position += sec;
            }
        }

        return position;
    },

    detectPointerDirection: function(position) {

        var self = this;

        if (self.direction) {
            if (isFunction(self.direction)) {
                return self.direction.call(self.dialog.$$callbackContext, self.dialog, position, self.origCfg);
            }
            return self.direction;
        }
        return position;
    },

    update: function(){
        var self = this;
        self.remove();
        self.render();
        self.append();
        if (self.dialog.isVisible()) {
            self.dialog.reposition();
        }
    },



    setType: function(position, direction) {
        var self = this;
        self.position = position;
        self.direction = direction;
        self.update();
        self.reposition();
    },


    render: function() {},

    destroy: function() {
        var self = this;
        self.remove();
    },

    reposition: function() {

    },

    append: function() {

        var self = this;
        if (!self.enabled) {
            return;
        }
        if (!self.node) {
            self.render();
        }
        if (!self.node) {
            return;
        }

        self.reposition();

        var parent = self.dialog.getElem();
        if (parent) {
            parent.appendChild(self.node);
        }
    },

    remove: function(){

        var self = this,
            node = self.node;

        if (node) {

            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }

            self.node = null;
        }
    }
});






(function(){

    var ie6             = null,
        defaultProps    = {
            backgroundColor: 'transparent',
            width: 			'0px',
            height: 		'0px',
            position: 		'absolute',
            fontSize: 	    '0px', // ie6
            lineHeight:     '0px' // ie6
        };


    return defineClass({

        $class: "dialog.pointer.Html",
        $extends: "dialog.pointer.Abstract",

        node: null,
        sub: null,

        $init: function(dialog, cfg) {

            if (ie6 === null) {
                ie6 = window.document.all && !window.XMLHttpRequest
            }

            var self = this;

            self.$super(dialog, cfg);

            self.width = self.width || self.size * 2;

            if (self.inner) {
                self.enabled = true;
            }
        },



        createInner: function() {
            var self        = this,
                newcfg 		= extend({}, self.origCfg);

            newcfg.size 	= self.size - (self.border * 2);
            newcfg.width	= self.width - (self.border * 4);

            newcfg.border = 0;
            newcfg.borderColor = null;
            newcfg.borderCls = null;
            newcfg.offset = 0;
            newcfg.inner = self.border;

            self.sub = factory("dialog.pointer.Html", self.dialog, newcfg);
        },


        getBorders: function(position, direction, color) {

            var self        = this,
                borders 	= {},
                pri 		= position.substr(0,1),
                dpri        = direction.substr(0,1),
                dsec        = direction.substr(1),
                style       = ie6 ? "dotted" : "solid",
                names       = self.names,
                sides       = self.sides,
                opposite    = self.opposite;

            // in ie6 "solid" wouldn't make transparency :(

            // this is always height : border which is opposite to direction
            borders['border'+ucfirst(names[opposite[pri]])] = self.size + "px solid "+color;
            // border which is similar to direction is always 0
            borders['border'+ucfirst(names[pri])] = "0 "+style+" transparent";

            if (!dsec) {
                // if pointer's direction matches pointer primary position (p: l|lt|lb, d: l)
                // then we set both side borders to a half of the width;
                var side = Math.floor(self.width / 2);
                borders['border' + ucfirst(names[sides[dpri][0]])] = side + "px "+style+" transparent";
                borders['border' + ucfirst(names[sides[dpri][1]])] = side + "px "+style+" transparent";
            }
            else {
                // if pointer's direction doesn't match with primary position (p: l|lt|lb, d: t|b)
                // we set the border opposite to direction to the full width;
                borders['border'+ucfirst(names[dsec])] = "0 solid transparent";
                borders['border'+ucfirst(names[opposite[dsec]])] = self.width + "px "+style+" transparent";
            }

            return borders;
        },

        getOffsets: function(position, direction) {

            var self    = this,
                offsets = {},
                names   = self.names,
                opposite= self.opposite,
                pri		= position.substr(0,1),
                auto 	= (pri == 't' || pri == 'b') ? "r" : "b";

            offsets[names[pri]] = self.inner ? 'auto' : -self.size+"px";
            offsets[names[auto]] = "auto";

            if (!self.inner) {

                var margin;

                switch (position) {
                    case 't': case 'r': case 'b': case 'l':
                        if (direction != position) {
                            if (direction == 'l' || direction == 't') {
                                margin = self.offset;
                            }
                            else {
                                margin = -self.width + self.offset;
                            }
                        }
                        else {
                            margin = -self.width/2 + self.offset;
                        }
                        break;

                    case 'bl': case 'tl': case 'lt': case 'rt':
                        margin = self.offset;
                        break;

                    default:
                        margin = -self.width - self.offset;
                        break;
                }

                offsets['margin' + ucfirst(names[opposite[auto]])] = margin + "px";

                var positionOffset;

                switch (position) {
                    case 't': case 'r': case 'b': case 'l':
                        positionOffset = '50%';
                        break;

                    case 'tr': case 'rb': case 'br': case 'lb':
                        positionOffset = '100%';
                        break;

                    default:
                        positionOffset = 0;
                        break;
                }

                offsets[names[opposite[auto]]]  = positionOffset;

                var pfxs = getAnimationPrefixes(),
                    transformPfx = pfxs.transform,
                    transform = "",
                    cx = self.correctX,
                    cy = self.correctY;

                if (transformPfx) {

                    if (cx) {
                        transform += " translateX(" + self.getCorrectionValue("x", cx, position) + "px)";
                    }
                    if (cy) {
                        transform += " translateY(" + self.getCorrectionValue("y", cy, position) + "px)";
                    }

                    offsets[transformPfx] = transform;
                }
            }
            else {

                var innerOffset,
                    dpri    = direction.substr(0, 1),
                    dsec    = direction.substr(1);

                if (dsec) {
                    if (dsec == 'l' || dsec == 't') {
                        innerOffset = self.inner + 'px';
                    }
                    else {
                        innerOffset = -self.width - self.inner + 'px';
                    }
                }
                else {
                    innerOffset = Math.floor(-self.width / 2) + 'px';
                }

                offsets[names[opposite[auto]]]  = innerOffset;
                offsets[names[opposite[dpri]]] = -(self.size + (self.inner * 2)) + 'px';
            }


            return offsets;
        },

        render: function() {

            var self = this;

            if (!self.enabled) {
                return;
            }

            if (self.node) {
                return;
            }

            var position    = self.detectPointerPosition();
            if (!position) {
                return;
            }

            if (self.border && !self.sub) {
                self.createInner();
            }

            self.node   = window.document.createElement('div');
            var cmt     = window.document.createComment(" ");

            self.node.appendChild(cmt);

            setStyle(self.node, defaultProps);
            addClass(self.node, self.borderCls || self.cls);

            if (self.sub) {
                self.sub.render();
                self.node.appendChild(self.sub.getElem());
            }
        },

        reposition: function() {

            var self        = this,
                position    = self.detectPointerPosition(),
                direction   = self.detectPointerDirection(position);

            if (!self.node) {
                return;
            }

            setStyle(self.node, self.getBorders(position, direction, self.borderColor || self.color));
            setStyle(self.node, self.getOffsets(position, direction));

            if (self.sub) {
                self.sub.reposition();
            }
        },

        update: function() {
            var self = this;
            if (self.sub) {
                self.sub.$destroy();
                self.sub = null;
            }
            self.remove();
            self.node = null;
            self.render();
            self.append();

            if (self.dialog.isVisible()) {
                self.dialog.reposition();
            }
        },

        destroy: function() {

            var self = this;

            if (self.sub) {
                self.sub.$destroy();
                self.sub = null;
            }

            self.$super();
        },

        remove: function() {

            var self = this;

            if (self.sub) {
                self.sub.remove();
            }

            self.$super();
        }
    });
}());









defineClass({

    $class:         "dialog.Overlay",
    dialog:         null,
    enabled:		false,
    color:			'#000',
    opacity:		.5,
    cls:			null,
    animateShow:	false,
    animateHide:	false,

    $mixins:        ["mixin.Observable"],

    $init: function(dialog) {

        var self = this;

        self.dialog = dialog;
        self.onClickDelegate = bind(self.onClick, self);
        extend(self, dialog.getCfg().overlay, true, false);

        self.$$observable.createEvent("click", false);

        if (self.enabled) {
            self.enabled = false;
            self.enable();
        }
    },

    getElem: function() {
        var self = this;
        if (self.enabled && !self.node) {
            self.render();
        }
        return self.node;
    },

    enable: function() {
        var self = this;
        if (!self.enabled) {
            self.enabled = true;
        }
    },

    disable: function() {
        var self = this;
        if (self.enabled) {
            self.remove();
            self.enabled = false;
        }
    },

    show: function(e) {
        var self = this;

        if (!self.enabled) {
            return;
        }

        if (self.animateShow) {
            self.animate("show", e);
        }
        else {
            self.node.style.display = "block";
        }
    },

    hide: function(e) {
        var self = this;
        if (self.node) {
            if (self.animateHide) {
                self.animate("hide", e);
            }
            else {
                self.node.style.display = "none";
            }
        }
    },

    render: function() {

        var self = this;

        if (!self.enabled) {
            return;
        }

        var node = window.document.createElement("div"),
            cfg = self.dialog.getCfg();

        setStyle(node, {
            display:            "none",
            position: 			"fixed",
            left:				0,
            top:				0,
            right:              0,
            bottom:             0,
            opacity:			self.opacity,
            backgroundColor: 	self.color
        });

        addListener(node, "click", self.onClickDelegate);

        if (cfg.render.zIndex) {
            setStyle(node, "zIndex", cfg.render.zIndex);
        }
        if (self.cls) {
            addClass(node, self.cls);
        }

        self.node = node;
    },

    remove: function() {
        var self = this,
            dialog = self.dialog,
            node = self.node;

        if (node) {
            raf(function() {
                //if (!dialog.isVisible() && node.parentNode) {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
        }
    },

    append: function() {
        var self = this,
            cfg = self.dialog.getCfg(),
            to = cfg.render.appendTo || window.document.body;

        if (!self.enabled) {
            return;
        }

        if (!self.node) {
            self.render();
        }

        to.appendChild(self.node);
    },

    animate: function(type, e) {
        var self = this,
            node = self.node,
            a;

        a = type == "show" ? self.animateShow : self.animateHide;

        if (isFunction(a)) {
            a   = a(self, e);
        }

        if (isBool(a)) {
            a = type;
        }
        else if (isString(a)) {
            a = [a];
        }

        return animate(node, a, function(){
            if (type == "show") {

                var p = new Promise;

                raf(function(){
                    node.style.display = "";
                    p.resolve();
                });

                return p;
            }
        }, false);
    },

    onClick: function(e) {

        var self = this;

        var res = self.trigger("click", self.dialog, self, e);

        if (res === false) {
            return null;
        }

        if (self.modal) {
            e = normalizeEvent(e);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return null;
    },

    destroy: function() {

        var self = this;
        self.remove();

    }
});



defineClass({
    $class: "dialog.Manager",
    all: null,
    groups: null,

    $init: function() {
        this.all = {};
        this.groups = {};
    },

    register: function(dialog) {

        var id      = dialog.getInstanceId(),
            grps    = dialog.getGroup(),
            self    = this,
            all     = self.all,
            groups  = self.groups,
            i, len,
            g;

        all[id]     = dialog;

        for (i = 0, len = grps.length; i < len; i++) {
            g   = grps[i];
            if (!groups[g]) {
                groups[g]   = {};
            }
            groups[g][id] = true;
        }

        dialog.on("destroy", this.unregister, this);
    },

    unregister: function(dialog) {

        var id  = dialog.getInstanceId();
        delete this.all[id];
    },

    hideAll: function(dialog) {

        var id      = dialog.getInstanceId(),
            grps    = dialog.getGroup(),
            self    = this,
            all     = self.all,
            groups  = self.groups,
            i, len, gid,
            ds, did;

        for (i = 0, len = grps.length; i < len; i++) {
            gid     = grps[i];
            ds      = groups[gid];
            for (did in ds) {
                if (!all[did]) {
                    delete ds[did];
                }
                else if (did != id && !all[did].isHideAllIgnored()) {
                    all[did].hide(null, true, true);
                }
            }
        }
    }

});


















var Dialog = (function(){

    var manager = factory("dialog.Manager");

    var defaultEventProcessor = function(dlg, e, type, returnMode){
        if (type === "show" || !returnMode) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    var getEventConfig = function(e, action, dlgEl) {

        var type    = e.type,
            trg     = e.target,
            cfg     = null,
            data;

        while (trg && trg !== dlgEl) {

            data    = getAttr(trg, "data-" + action + "-" + type);

            if (data) {
                cfg = createGetter(data)({});
                break;
            }

            trg     = trg.parentNode;
        }

        return cfg;
    };

    /*
     * Shorthands
     */

    var fixShorthand = function(options, level1, level2, type) {
        var value   = options[level1],
            yes     = false;

        if (value === undf) {
            return;
        }

        switch (type) {
            case "string": {
                yes     = isString(value);
                break;
            }
            case "function": {
                yes     = isFunction(value);
                break;
            }
            case "number": {
                yes     = isNumber(value) || value == parseInt(value);
                break;
            }
            case "dom": {
                yes     = value && (value.tagName || value.nodeName) ? true : false;
                break;
            }
            case "jquery": {
                yes     = value && value.jquery ? true : false;
                if (yes) {
                    value = value.get(0);
                }
                break;
            }
            case "boolean": {
                if (value === true || value === false) {
                    yes = true;
                }
                break;
            }
            default: {
                if (type === true && value === true) {
                    yes = true;
                }
                if (type === false && value === false) {
                    yes = true;
                }
            }
        }
        if (yes) {
            options[level1] = {};
            options[level1][level2] = value;
        }
    };

    var fixShorthands   = function(options) {

        if (!options) {
            return {};
        }

        fixShorthand(options, "content", "value", "string");
        fixShorthand(options, "content", "value", "boolean");
        fixShorthand(options, "content", "fn", "function");
        fixShorthand(options, "ajax", "url", "string");
        fixShorthand(options, "cls", "dialog", "string");
        fixShorthand(options, "render", "tpl", "string");
        fixShorthand(options, "render", "fn", "function");
        fixShorthand(options, "render", "el", "dom");
        fixShorthand(options, "render", "el", "jquery");
        fixShorthand(options, "show", "events", false);
        fixShorthand(options, "show", "events", "string");
        fixShorthand(options, "hide", "events", false);
        fixShorthand(options, "hide", "events", "string");
        fixShorthand(options, "toggle", "events", false);
        fixShorthand(options, "toggle", "events", "string");
        fixShorthand(options, "position", "type", "string");
        fixShorthand(options, "position", "type", false);
        fixShorthand(options, "position", "get", "function");
        fixShorthand(options, "overlay", "enabled", "boolean");
        fixShorthand(options, "pointer", "position", "string");
        fixShorthand(options, "pointer", "size", "number");

        return options;
    };


    /**
     * @type {object}
     * @md-tmp defaults
     * @md-stack add
     */
    var defaults    = {

        /**
         * Target element(s) which trigger dialog's show and hide.<br>
         * If {Element}: will be used as a single target,<br>
         * if selector: will be used as dynamic target.<br>
         * Dynamic targets work like this:<br>
         * you provide delegates: {someElem: {click: someClass}} -- see "show" function<br>
         * when show() is called, target will be determined from the event using
         * the selector.
         * @type {string|Element}
         */
        target:         null,

        /**
         * One or more group names.
         * @type {string|array}
         */
        group:          null,

        /**
         * If dialog is modal, overlay will be forcefully enabled.
         * @type {bool}
         */
        modal:			false,

        /**
         * Use link's href attribute as ajax.url or as render.el
         * @type {bool}
         */
        useHref:        false,


        /**
         * If neither content value nor ajax url are provided,
         * plugin will try to read target's attribute values: 'tooltip', 'title' and 'alt'.
         * (unless attr is specified).<br>
         * <em>shorthand</em>: string -> content.value<br>
         * <em>shorthand</em>: false -> content.value<br>
         * <em>shorthand</em>: function -> content.fn<br>
         * @type {object|string|function}
         * @md-stack add
         */
        content: {

            /**
             * Dialog's text content. Has priority before readContent/loadContent.
             * If set to false, no content will be automatically set whether via fn() or attributes.
             * @type {string|boolean}
             */
            value: 			'',

            /**
             * Must return content value
             * @function
             * @param {Element} target
             * @param {MetaphorJs.lib.Dialog} dialog
             * @returns string
             */
            fn:				null,

            /**
             * This function receives new content and returns string value (processed content).
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {string} mode
             *      empty string - content has come from content.value or setContent()<br>
             *      'attribute' - content has been read from target attributes<br>
             *      'ajax' - data returned by ajax request
             *      @default '' | 'attribute' | 'ajax'
             *
             * @param {string} content
             * @returns string
             */
            prepare:		null,

            /**
             * Get content from this attribute (belongs to target)
             * @type {string}
             * @md-stack remove
             */
            attr:           null
        },


        /**
         * All these options are passed to $.ajax().
         * You can provide more options in this section
         * but 'success' will be overriden (use content.prepare for data processing).<br>
         * <em>shorthand</em>: string -> ajax.url
         * @type {string|object}
         * @md-stack add
         */
        ajax: {

            /**
             * Url to load content from.
             * @type {string}
             */
            url: 			null,

            /**
             * Pass this data along with xhr.
             * @type {object}
             */
            data: 			null,

            /**
             * @type {string}
             */
            dataType: 		'text',

            /**
             * @type {string}
             * @md-stack remove
             */
            method: 		'GET'
        },

        /**
         * Classes to apply to the dialog.
         * <em>shorthand</em>: string -> cls.dialog
         * @type {string|object}
         * @md-stack add
         */
        cls: {
            /**
             * Base class.
             * @type {string}
             */
            dialog:         null,
            /**
             * Only applied when dialog is visible.
             * @type {string}
             */
            visible:        null,
            /**
             * Only applied when dialog is hidden.
             * @type {string}
             */
            hidden:         null,
            /**
             * Only applied when dialog is performing ajax request.
             * @type {string}
             * @md-stack remove
             */
            loading:        null
        },

        /**
         * <p>Selector is used when dialog has inner structure and you
         * want to change its content.</p>
         * <pre><code class="language-javascript">
         * {
         *      render: {
         *          tpl: '&lt;div&gt;&lt;div class=&quot;content&quot;&gt;&lt;/div&gt;&lt;/div&gt;'
         *      },
         *      selector: {
         *          content: '.content'
         *      }
         * }
         * </code></pre>
         * <p>If no selector provided, setContent will replace all inner html.
         * Another thing relates to structurally complex content:</p>
         *
         * <pre><code class="language-javascript">
         * setContent({title: "...", body: "..."});
         * selector: {
         *      title:  ".title",
         *      body:   ".body"
         * }
         * </code></pre>
         * @type {object}
         * @md-stack add
         */
        selector:           {
            /**
             * Dialog's content selector.
             * @type {string}
             * @md-stack remove
             */
            content:        null
        },

        /**
         * Object {buttonId: selector}
         * @type {object|null}
         */
        buttons: null,


        /**
         * <p><em>shorthand</em>: string -> render.tpl<br>
         * <em>shorthand</em>: function -> render.fn<br>
         * <em>shorthand</em>: dom element -> render.el<br>
         * @type {object|string|function|Element}
         * @md-stack add
         */
        render: {
            /**
             * Dialog's template
             * @type {string}
             */
            tpl: 			'<div></div>',

            /**
             * Call this function to get dialog's template.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @returns {string|Element}
             */
            fn: 			null,

            /**
             * Selector or existing element instead of template.
             * @type {string|Element}
             */
            el: 			null,

            /**
             * Apply this zIndex.
             * @type {number}
             */
            zIndex:			null,

            /**
             * false - render immediately, true - wait for the first event.
             * @type {bool}
             */
            lazy: 			true,

            /**
             * Object to pass to elem.css()
             * @type {object}
             */
            style:          null,

            /**
             * If set, the element will be appended to specified container.<br>
             * If set to false, element will not be appended anywhere (works with "el").
             * @type {string|Element|bool}
             */
            appendTo:		null,

            /**
             * Dialog's id attribute.
             * @type {string}
             */
            id:				null,

            /**
             * If set to true, element's show() and hide() will never be called. Use
             * "visible" and "hidden" classes instead.
             * @type {boolean}
             */
            keepVisible:    false,

            /**
             * When destroying dialog's elem, keep it in DOM.
             * Useful when you return it in fn() on every show()
             * and have lifetime = 0.
             * @type {boolean}
             */
            keepInDOM:      false,

            /**
             * Number of ms for the rendered object to live
             * after its been hidden. 0 to destroy elem immediately.
             * @type {number}
             * @md-stack remove
             */
            lifetime:       null
        },

        /**
         * Event actions.
         * @type {object}
         * @md-stack add
         */
        events: {

            /**
             * @type {object}
             * @md-stack add
             */
            show: {

                /**
                 * You can also add any event you use to show/hide dialog.
                 * @type {object}
                 * @md-stack add
                 */
                "*": {

                    /**
                     * @type {function}
                     * @md-stack remove 2
                     */
                    process: defaultEventProcessor
                }
            },

            /**
             * @type {object}
             * @md-stack add
             */
            hide: {

                /**
                 * You can also add any event you use to show/hide dialog.
                 * @type {object}
                 * @md-stack add
                 */
                "*": {

                    /**
                     * Must return "returnValue" which will be in its turn
                     * returned from event handler. If you provide this function
                     * preventDefault and stopPropagation options are ignored.
                     * @function
                     * @param {Dialog} dialog
                     * @param {Event} event
                     * @md-stack remove 3
                     */
                    process: defaultEventProcessor
                }
            }
        },

        /**
         * <p><em>shorthand</em>: false -> show.events<br>
         * <em>shorthand</em>: string -> show.events._target</p>
         * @type {string|bool|object}
         * @md-stack add
         */
        show: {
            /**
             * Delay dialog's appearance. Milliseconds.
             * @type {number}
             */
            delay: 			null,

            /**
             * True to hide all other tooltips.
             * If "group" specified, will hide only
             * those dialogs that belong to that group.
             * @type {bool}
             */
            single:			false,

            /**
             * Works for show, hide and toggle
             * <pre><code class="language-javascript">
             * events: false // disable all
             *
             * events: eventName || [eventName, eventName, ...]
             * // same as events: {"_target": ...}
             *
             * events: {
             *  "body":         eventName || [eventName, eventName, ...],
             *  "_self":        same, // dialog itself
             *  "_target":      same, // target element
             *  "_document":    same,
             *  "_window":      same,
             *  "_html":        same,
             *  "_overlay":     same, // overlay element (works with hiding)
             *  ">.selector":   same // selector inside dialog
             * }
             *
             * events: {
             *  "(body|_self|_target|...)": {
             *      eventName: ".selector"
             *  }
             *  // $("body|_self|_target|...").delegate(".selector", eventName)
             *  // this one is for dynamic targets
             * }
             * </code></pre>
             * @type {string|bool|object}
             */
            events:			null,

            /**
             * <p>true -- ["mjs-show"] or ["mjs-hide"]<br>
             * string -- class name -> [class]<br>
             * array -- [{properties before}, {properties after}]<br>
             * array -- [class, class]<br>
             * object --
             * .fn -- string: "fadeIn", "fadeOut", etc. (optional) requires jQuery<br>
             * .fn -- function(Element, completeCallback)
             * .stages -- [class, class] (optional)
             * .before -- {} apply css properties before animation (optional)
             * .after -- {} animate these properties (optional) requires jQuery
             * .options - {} jQuery's .animate() options
             * .context -- fn's this object
             * .duration -- used when .fn is string
             * .skipDisplayChange -- do not set style.display = "" on start
             * function(){}<br>
             * function must return any of the above:</p>
             * <pre><code class="language-javascript">
             * animate: function(dlg, e) {
             *      return {
             *          before: {
             *             width: '200px'
             *          },
             *          after: {
             *              width: '400px'
             *          },
             *          options: {
             *             step: function() {
             *               dlg.reposition();
             *             }
             *          }
             *      };
             * }
             * </code></pre>
             * @type {bool|string|array|function}
             */
            animate:		false,

            /**
             * Ignore {show: {single: true}} on other dialogs.
             * @type {bool}
             */
            ignoreHideAll:	false,

            /**
             * true - automatically set focus on input fields on buttons;
             * string - selector
             * @type {bool|string}
             */
            focus:          false,

            /**
             * Prevent scrolling
             * true = "body"
             * @type {bool|string|Element}
             */
            preventScroll:  false,

            /**
             * When showing, set css display to this value
             * @type {string}
             * @md-stack remove
             */
            display: "block"
        },


        /**
         * <p><em>shorthand</em>: false -> hide.events<br>
         * <em>shorthand</em>: string -> hide.events._target</p>
         * @type {bool|string|object}
         * @md-stack add
         */
        hide: {
            /**
             * Milliseconds. Delay hiding for this amount of time.
             * @type {number}
             */
            delay:			null,

            /**
             * Milliseconds. Dialog will be shown no longer than for that time.
             * @type {number}
             */
            timeout: 		null,

            /**
             * See show.events
             * @type {string|bool|object}
             */
            events: 		null,

            /**
             * Destroy dialog after hide.
             * @type {bool}
             */
            destroy:        false,

            /**
             * Remove element from DOM after hide
             * @type {bool}
             */
            remove:         false,

            /**
             * See show.animate
             * @type {bool|string|array|function}
             */
            animate:		false,

            /**
             * true: hide anyway even if showing is delayed,<br>
             * false: ignore hide events until tooltip is shown.
             * @type {bool}
             * @md-stack remove
             */
            cancelShowDelay:true
        },

        /**
         * This option is required when you want to show and hide on the same event.<br>
         * <em>shorthand</em>: false -> toggle.events<br>
         * <em>shorthand</em>: string -> toggle.events._target
         * @type {bool|string|object}
         * @md-stack add
         */
        toggle: {
            /**
             * See show.events
             * @type {string|bool|object}
             * @md-stack remove
             */
            events: 		null
        },

        /**
         * <p><em>shorthand</em>: false -> position.type<br>
         * <em>shorthand</em>: string -> position.type<br>
         * <em>shorthand</em>: function -> position.get
         * @type {bool|string|function|object}
         * @md-stack add
         */
        position: {

            /**
             * false -- do not apply position<br>
             * function(api) - must return one of the following:<br>
             * "auto" - detect position automatically<br>
             *
             * <b>relative to target:</b><br>
             * t | r | b | l -- simple positions aligned by center<br>
             * tr | rt | rb | br | bl | lb | lt | tl -- aligned by side<br>
             * trc | brc | blc | tlc -- corner positions<br>
             *
             * <b>relative to mouse:</b><br>
             * m -- works only with get(). get() function will be called on mousemove<br>
             * mt | mr | mb | ml -- following the mouse, aligned by center<br>
             * mrt | mrb | mlb | mlt -- following the mouse, corner positions<br>
             *
             * <b>window positions:</b><br>
             * wc | wt | wr | wb | wl<br>
             * wrt | wrb | wlt | wlb
             *
             * Defaults to 't'
             * @type {bool|string}
             */
            type:			't',

            /**
             * @type {string}
             */
            preferredType:  null,

            /**
             * Add this offset to dialog's x position
             * @type {number}
             */
            offsetX: 		0,

            /**
             * Add this offset to dialog's y position
             * @type {number}
             */
            offsetY:		0,

            /**
             * Follow the mouse only by this axis;
             * second coordinate will be relative to target
             * @type {string}
             */
            axis: 			null,

            /**
             * Overrides position.type<br>
             * If this function is provided, offsets are not applied.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {Event} event
             * @returns {object} {
             *      @type {number} x If object contains only one coordinate - x or y -
             *                       the other one will not be updated.
             *      @type {number} y
             *      @type {number} top If object does not contain x and y, it will be applied
             *                          as is.
             *      @type {number} right
             *      @type {number} bottom
             *      @type {number} left
             * }
             */
            get:			null,

            /**
             * Prevent from rendering off the screen.<br>
             * Set to maximum distance between tooltip and window edge.
             * @type {number|bool}
             */
            screenX:		false,

            /**
             * Prevent from rendering off the screen.<br>
             * Set to maximum distance between tooltip and window edge.
             * @type {number|bool}
             */
            screenY:		false,

            /**
             * Calculate position relative to this element (defaults to window)
             * @type {string|Element}
             */
            base:           null,

            /**
             * Monitor window/selector/element scroll.
             * @type {bool|string|Element}
             */
            scroll:         false,

            /**
             * Monitor window resize.
             * @type {bool}
             * @md-stack remove
             */
            resize:         true
        },

        /**
         * Pointer will only work if size > 0 or el is not null<br>
         * <em>shorthand</em>: string -> pointer.position<br>
         * <em>shorthand</em>: number -> pointer.size
         * @type {object|string|number}
         * @md-stack add
         */
        pointer: {

            /**
             * t / r / b / l<br>
             * tr / lt / lb / br / bl / lb / lt<br>
             * null - opposite to dialog's position
             * @type {string}
             */
            position: 		null,

            /**
             * t / r / b / l<br>
             * null - opposite to primary position
             * @type {string}
             */
            direction: 		null,

            /**
             * Number of pixels (triangle's height)
             * @type {number}
             */
            size: 			0,

            /**
             * Number of pixels (triangle's width), by default equals to size.
             * @type {number}
             */
            width:			null,

            /**
             * '#xxxxxx'
             * @type {string}
             */
            color: 			null,

            /**
             * Shift pointer's position by this number of pixels.
             * Shift direction will depend on position:<br>
             * t / tl / b / bl - right shift<br>
             * tr / br - left shift<br>
             * r / l / rt / lt - top shift<br>
             * rb / lb - bottom shift
             * @type {number}
             */
            offset: 		0,

            /**
             * Number of pixels.
             * @type {number}
             */
            border:			0,

            /**
             * '#xxxxxx'
             * @type {string}
             */
            borderColor:	null,

            /**
             * Custom pointer.<br>
             * If you provide custom pointer el,
             * border, direction and color will not be applied.<br>
             * pointer.cls will be applied.
             * @type {string|Element}
             */
            el:             null,

            /**
             * Apply this class to pointer.
             * @type {string}
             */
            cls:            null,

            /**
             * Apply this class to pointerBorder element.
             * @type {string}
             * @md-stack remove
             */
            borderCls:      null
        },

        /**
         * <p><em>shorthand</em>: boolean -> overlay.enabled<br></p>
         * @type {bool|object}
         * @md-stack add
         */
        overlay:			{

            /**
             * Enable overlay.
             * @type {bool}
             */
            enabled:		false,

            /**
             * @type {string}
             */
            color:			'#000',

            /**
             * @type {number}
             */
            opacity:		.5,

            /**
             * @type {string}
             */
            cls:			null,

            /**
             * Same animation rules as in show.animate.
             * @type {bool}
             */
            animateShow:	false,

            /**
             * Same animation rules as in show.animate.
             * @type {bool}
             * @md-stack remove
             */
            animateHide:	false
        },

        /**
         * Callbacks are case insensitive.<br>
         * You can use camel case if you like.
         * @type {object}
         * @md-stack add
         */
        callback: {

            /**
             * 'this' object for all callbacks, including render.fn, position.get, etc.
             * @type {object}
             */
            context:			null,

            /**
             * When content has changed.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {string} content
             */
            "content-change": 	null,

            /**
             * Before dialog appeared.<br>
             * Return false to cancel showing.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {Event} event
             */
            "before-show": 		null,

            /**
             * Immediately after dialog appeared.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {Event} event
             */
            show: 				null,

            /**
             * Before dialog disappears.<br>
             * Return false to cancel hiding.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {Event} event
             */
            "before-hide": 		null,

            /**
             * Immediately after dialog has been hidden.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {Event} event
             */
            hide: 				null,

            /**
             * After dialog has been rendered.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             */
            render: 			null,

            /**
             * After dialog's html element has been removed.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             */
            lifetime:           null,

            /**
             * Called when dynamic target changes (on hide it always changes to null).
             * Also called from setTarget().
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {Element} newTarget
             * @param {Element|null} prevTarget
             */
            "target-change":       null,

            /**
             * One handler for all configured buttons. Called on click, enter and space.
             * @function
             * @param {MetaphorJs.lib.Dialog} dialog
             * @param {string} buttonId
             * @param {Event} event
             * @md-stack finish
             */
            button:             null
        }

    };




    var Dialog = defineClass({

        $class:             "Dialog",
        $mixins:            ["mixin.Observable"],

        id:                 null,
        node:               null,
        overlay:            null,
        pointer:            null,
        cfg:                null,
        position:           null,

        target:             null,
        dynamicTarget:      false,
        dynamicTargetEl:    null,

        visible:            false,
        enabled:            true,
        frozen:             false,
        rendered:           false,

        bindSelfOnRender:   false,

        hideTimeout:        null,
        hideDelay:          null,
        showDelay:          null,
        destroyDelay:       null,

        images:             0,

        positionGetType:    null,
        positionClass:      null,
        positionAttempt:    0,

        $constructor: function() {

            this.$$events = {
                "before-show": {
                    returnResult: false
                },
                "before-hide": {
                    returnResult: false
                }
            };

            this.$super.apply(this, arguments);

        },

        $init: function(cfg) {

            cfg = cfg || {};
            var preset  = cfg.preset,
                self    = this;

            cfg.preset  = null;
            cfg         = extend({}, defaults,
                                fixShorthands(Dialog.defaults),
                                fixShorthands(Dialog[preset]),
                                fixShorthands(cfg),
                                    true, true);

            self.cfg    = cfg;
            self.id     = nextUid();

            self.onPreventScrollDelegate = bind(self.onPreventScroll, self);
            self.onButtonClickDelegate = bind(self.onButtonClick, self);
            self.onButtonKeyupDelegate = bind(self.onButtonKeyup, self);
            self.showDelegate = bind(self.show, self);
            self.hideDelegate = bind(self.hide, self);
            self.toggleDelegate = bind(self.toggle, self);
            self.onImageLoadDelegate = bind(self.onImageLoad, self);

            manager.register(self);

            if (cfg.modal) {
                cfg.overlay.enabled = true;
            }
            self.overlay    = factory("dialog.Overlay", self);

            var pointerCls = ucfirst(cfg.pointer.$class || "Html");
            self.pointer    = factory("dialog.pointer." + pointerCls, self, cfg.pointer);

            if (isFunction(cfg.position.type)) {
                self.positionGetType = cfg.position.type;
            }

            self.setTarget(cfg.target);

            if (cfg.target && cfg.useHref) {
                var href = getAttr(self.getTarget(), "href");
                if (href.substr(0, 1) === "#") {
                    cfg.render.el = href;
                }
                else {
                    cfg.ajax.url = href;
                }
            }

            if (!cfg.render.lazy) {
                self.render();
            }

            self.trigger("init", self);
            self.setHandlers("bind");
        },


        /* **** General api **** */


        /**
         * @returns {Element}
         */
        getElem: function() {
            return this.node;
        },

        /**
         * @returns {string}
         */
        getInstanceId: function() {
            return this.id;
        },

        /**
         * Get dialog's config.
         * @access public
         * @return {object}
         */
        getCfg: function() {
            return this.cfg;
        },

        /**
         * Get dialog's pointer object
         * @returns {dialog.pointer.Abstract}
         */
        getPointer: function() {
            return this.pointer;
        },


        /**
         * Get dialog's overlay object
         * @returns {dialog.Overlay}
         */
        getOverlay: function() {
            return this.overlay;
        },


        /**
         * @access public
         * @return {boolean}
         */
        isEnabled: function() {
            return this.enabled;
        },

        /**
         * @access public
         * @return {boolean}
         */
        isVisible: function() {
            return this.visible;
        },

        /**
         * @access public
         * @returns {boolean}
         */
        isHideAllIgnored: function() {
            return this.cfg.show.ignoreHideAll;
        },

        /**
         * @access public
         * @return {boolean}
         */
        isFrozen: function() {
            return this.frozen;
        },

        /**
         * @returns {boolean}
         */
        isRendered: function() {
            return this.rendered;
        },

        /**
         * Enable dialog
         * @access public
         * @method
         */
        enable: function() {
            this.enabled = true;
        },

        /**
         * Disable dialog
         * @access public
         * @method
         */
        disable: function() {
            this.hide();
            this.enabled = false;
        },

        /**
         * The difference between freeze and disable is that
         * disable always hides dialog and freeze makes current
         * state permanent (if it was shown, it will stay shown
         * until unfreeze() is called).
         * @access public
         * @method
         */
        freeze: function() {
            this.frozen   = true;
        },

        /**
         * Unfreeze dialog
         * @access public
         * @method
         */
        unfreeze: function() {
            this.frozen   = false;
        },

        /**
         * Get groups.
         * @access public
         * @return {[]}
         */
        getGroup: function() {
            var cfg = this.cfg;
            if (!cfg.group) {
                return [""];
            }
            else {
                return isString(cfg.group) ?
                       [cfg.group] : cfg.group;
            }
        },

        /**
         * Show/hide
         * @access public
         * @param {Event} e Optional
         * @param {bool} immediately Optional
         */
        toggle: function(e, immediately) {

            var self = this;

            // if switching between dynamic targets
            // we need not to hide tooltip
            if (e && e.stopPropagation && self.dynamicTarget) {

                if (self.visible && self.isDynamicTargetChanged(e)) {
                    return self.show(e);
                }
            }

            return self[self.visible ? 'hide' : 'show'](e, immediately);
        },


        /* **** Events **** */

        resetHandlers: function(fn, context) {

            var self = this;
            self.setHandlers("unbind");
            self.bindSelfOnRender = false;

            if (fn) {
                fn.call(context, self, self.getCfg());
            }

            self.setHandlers("bind");
        },

        setHandlers: function(mode, only) {

            var self    = this,
                cfg     = self.cfg,
                fns     = ["show", "hide", "toggle"],
                lfn     = mode === "bind" ? addListener : removeListener,
                dfn     = mode === "bind" ? delegate : undelegate,
                fn,
                fnCfg,
                selector,
                e, i, len,
                evs, el,
                j, jl;

            while (fn = fns.shift()) {

                fnCfg   = cfg[fn].events;

                if (fnCfg === false) {
                    continue;
                }

                if (isString(fnCfg) || isArray(fnCfg)) {
                    if (self.dynamicTarget) {
                        var tmp     = {};
                        tmp[fnCfg]  = cfg.target;
                        fnCfg       = {
                            "_html": tmp
                        }
                    }
                    else {
                        fnCfg   = {"_target": fnCfg};
                    }
                }

                for (selector in fnCfg) {

                    if (only) {
                        if (only === '_self') {
                            if (selector !== '_self' &&
                                selector !== "_overlay" &&
                                selector.substr(0,1) !== '>') {
                                continue;
                            }
                        }
                        else if (selector !== only) {
                            continue;
                        }
                    }

                    if ((selector === '_self' ||
                            selector === '_overlay' ||
                            selector.substr(0,1) === '>')
                        && !self.node) {

                        self.bindSelfOnRender = true;
                        continue;
                    }

                    evs         = fnCfg[selector];

                    if (!evs) {
                        continue;
                    }

                    switch (selector) {
                        case "_target":
                            el  = [self.getTarget()];
                            break;

                        case "_self":
                            el  = [self.node];
                            break;

                        case "_window":
                            el  = [window];
                            break;

                        case "_document":
                            el  = [window.document];
                            break;

                        case "_html":
                            el  = [window.document.documentElement];
                            break;

                        case "_overlay":
                            el  = [self.overlay.getElem()];
                            break;

                        default:
                            el  = selector.substr(0,1) === '>' ?
                                  select(selector.substr(1), self.node) :
                                  select(selector);

                    }

                    if (!el || !el.length) {
                        continue;
                    }

                    if (isString(evs)) {
                        evs     = [evs];
                    }

                    if (isArray(evs)) {
                        for (i = 0, len = evs.length; i < len; i++) {
                            for (j = -1, jl = el.length; ++j < jl; lfn(el[j], evs[i], self[fn+"Delegate"])){}
                        }
                    }
                    else {
                        for (e in evs) {
                            for (j = -1, jl = el.length; ++j < jl; dfn(el[j], evs[e], e, self[fn+"Delegate"])){}
                        }
                    }
                }
            }
        },




        onPreventScroll: function(e) {
            normalizeEvent(e).preventDefault();
        },

        onButtonClick: function(e) {

            var target  = normalizeEvent(e).target,
                btnId   = data(target, "metaphorjsTooltip-button-id");

            if (btnId) {
                this.trigger("button", this, btnId, e);
            }
        },

        onButtonKeyup: function(e) {
            if (e.keyCode === 13 || e.keyCode === 32) {
                var target  = e.target,
                    btnId   = data(target, "metaphorjsTooltip-button-id");

                if (btnId) {
                    this.trigger("button", this, btnId, normalizeEvent(e));
                }
            }
        },

        getEventConfig: function(e, action) {

            var self    = this,
                ecfg    = getEventConfig(e, action, self.node),
                cfg     = self.cfg;

            if (!ecfg && cfg.events[action]) {
                ecfg   = cfg.events[action][e.type] || cfg.events[action]['*'];
            }

            return ecfg;
        },


        /* **** Show **** */

        /**
         * Show dialog
         * @access public
         * @param {Event} e Optional. True to skip delay.
         * @param {bool} immediately Optional
         */
        show: function(e, immediately) {

            // if called as an event handler, we do not return api
            var self        = this,
                cfg         = self.cfg,
                returnValue	= null,
                scfg        = cfg.show,
                returnMode  = null;

            if (e) {
                e = normalizeEvent(e);
            }

            // if tooltip is disabled, we do not stop propagation and do not return false.s
            if (!self.isEnabled()) {
                returnMode = "disabled";
            }

            // if tooltip is already shown
            // and hide timeout was set.
            // we need to restart timer
            if (!returnMode && self.visible && self.hideTimeout) {

                window.clearTimeout(self.hideTimeout);
                self.hideTimeout = async(self.hide, self, null, cfg.hide.timeout);

                returnMode = "hidetimeout";
            }

            // if tooltip was delayed to hide
            // we cancel it.
            if (!returnMode && self.hideDelay) {

                window.clearTimeout(self.hideDelay);
                self.hideDelay     = null;
                self.visible       = true;

                returnMode = "hidedelay";
            }


            // various checks: tooltip should be enabled,
            // should not be already shown, it should
            // have some content, or empty content is allowed.
            // also if beforeShow() returns false, we can't proceed
            // if tooltip was frozen, we do not show or hide
            if (!returnMode && self.frozen) {
                returnMode = "frozen";
            }

            // cancel delayed destroy
            // so that we don't have to re-render dialog
            if (self.destroyDelay) {
                window.clearTimeout(self.destroyDelay);
                self.destroyDelay = null;
            }


            var dtChanged   = false;

            // if we have a dynamicTarget
            if (e && self.dynamicTarget) {
                dtChanged = self.changeDynamicTarget(e);
            }

            if (self.visible) {
                if (!dtChanged) {
                    returnMode = returnMode || "visible";
                }
                else {
                    self.reposition(e);
                    returnMode = "reposition";
                }
            }

            if (!returnMode || dtChanged) {
                // if tooltip is not rendered yet we render it
                if (!self.node) {
                    self.render();
                }
                else if (dtChanged) {
                    self.changeDynamicContent();
                }
            }


            // if beforeShow callback returns false we stop.
            if (!returnMode && self.trigger('before-show', self, e) === false) {
                returnMode = "beforeshow";
            }

            var ecfg;

            if (e && (ecfg = self.getEventConfig(e, "show"))) {

                if (ecfg.process) {
                    returnValue	= ecfg.process(self, e, "show", returnMode);
                }
                else {
                    ecfg.stopPropagation && e.stopPropagation();
                    ecfg.preventDefault && e.preventDefault();
                    returnValue = ecfg.returnValue;
                }
            }

            if (returnMode) {
                return returnValue;
            }

            // first, we stop all current animations
            stopAnimation(self.node);

            // as of this moment we mark dialog as visible so that hide() were able
            // to work. also, all next steps should check for this state
            // in case if tooltip case hidden back during the process
            self.visible = true;

            if (scfg.single) {
                manager.hideAll(self);
            }

            self.toggleTitleAttribute(false);

            if (scfg.delay && !immediately) {
                self.showDelay = async(self.showAfterDelay, self, [e], scfg.delay);
            }
            else {
                self.showAfterDelay(e, immediately);
            }

            return returnValue;
        },


        showAfterDelay: function(e, immediately) {

            var self = this,
                cfg = self.cfg;

            self.showDelay = null;

            // if tooltip was already hidden, we can't proceed
            if (!self.visible) {
                return;
            }

            self.trigger('show-after-delay', self, e);

            if (cfg.hide.remove) {
                self.appendElem();
            }

            self.reposition(e);


            if (cfg.show.preventScroll) {
                var ps = cfg.show.preventScroll,
                    i, l;
                if (ps === true) {
                    ps = "body";
                }
                ps = select(ps);
                for (i = -1, l = ps.length; ++i < l;
                     addListener(ps[i], "mousewheel", self.onPreventScrollDelegate) &&
                     addListener(ps[i], "touchmove", self.onPreventScrollDelegate)
                ){}
            }

            self.overlay.show();

            if (cfg.show.animate && !immediately) {
                self.animate("show").done(function() {
                    self.showAfterAnimation(e);
                });
            }
            else {
                raf(function(){
                    self.showAfterAnimation(e);
                });
            }
        },

        showAfterAnimation: function(e) {

            var self = this,
                cfg = self.cfg,
                node = self.node;

            // if tooltip was already hidden, we can't proceed
            if (!self.visible) {
                return;
            }

            // now we can finally show the dialog (if it wasn't shown already
            // during the animation
            removeClass(node, cfg.cls.hidden);
            addClass(node, cfg.cls.visible);

            if (!cfg.render.keepVisible) {
                node.style.display = cfg.show.display || "block";
            }


            // if it has to be shown only for a limited amount of time,
            // we set timeout.
            if (cfg.hide.timeout) {
                self.hideTimeout = async(self.hide, self, null, cfg.hide.timeout);
            }

            if (cfg.show.focus) {
                async(self.setFocus, self, null, 20);
            }

            self.trigger('show', self, e);
        },





        /* **** Hide **** */


        /**
         * Hide dialog
         * @access public
         * @param {Event} e Optional.
         * @param {bool} immediately Optional. True to skip delay.
         * @param {bool} cancelShowDelay Optional. If showing already started but was delayed -
         * cancel that delay.
         */
        hide: function(e, immediately, cancelShowDelay) {

            var self            = this,
                returnValue	    = null,
                returnMode      = null,
                cfg             = self.cfg;

            self.hideTimeout    = null;

            // if the timer was set to hide the tooltip
            // but then we needed to close tooltip immediately
            if (!self.visible && self.hideDelay && immediately) {
                window.clearTimeout(self.hideDelay);
                self.hideDelay     = null;
                self.visible       = true;
            }

            // various checks
            if (!self.node || !self.visible || !self.isEnabled()) {
                returnMode = !self.node ? "noelem" : (!self.visible ? "hidden" : "disabled");
            }

            // if tooltip is still waiting to be shown after delay timeout,
            // we cancel this timeout and return.
            if (self.showDelay && !returnMode) {

                if (cfg.hide.cancelShowDelay || cancelShowDelay) {
                    window.clearTimeout(self.showDelay);
                    self.showDelay     = null;
                    self.visible       = false;

                    returnMode = "cancel";
                }
                else {
                    returnMode = "delay";
                }
            }

            // if tooltip was frozen, we do not show or hide
            if (self.frozen && !returnMode) {
                returnMode = "frozen";
            }

            // lets see what the callback will tell us
            if (!returnMode && self.trigger('before-hide', self, e) === false) {
                returnMode = "beforehide";
            }

            var ecfg;
            if (e && e.stopPropagation && (ecfg = self.getEventConfig(e, "hide"))) {

                if (ecfg.process) {
                    returnValue = ecfg.process(self, e, "hide", returnMode);
                }
                else {
                    if (ecfg.stopPropagation) e.stopPropagation();
                    if (ecfg.preventDefault) e.preventDefault();
                    returnValue = ecfg.returnValue;
                }
            }

            if (returnMode) {
                return returnValue;
            }

            // now we can stop all current animations
            stopAnimation(self.node);

            // and change the state
            self.visible = false;

            self.toggleTitleAttribute(true);

            if (self.dynamicTarget) {
                self.resetDynamicTarget();
            }

            if (cfg.hide.delay && !immediately) {
                self.hideDelay = async(self.hideAfterDelay, self, [e], cfg.hide.delay);
            }
            else {
                self.hideAfterDelay(e, immediately);
            }

            return returnValue;
        },


        hideAfterDelay: function(e, immediately) {

            var self = this,
                cfg = self.cfg;

            self.hideDelay = null;

            if (self.visible) {
                return;
            }

            self.trigger('hide-after-delay', self, e);


            if (cfg.show.preventScroll) {
                var ps = cfg.show.preventScroll,
                    i, l;
                if (ps === true) {
                    ps = "body";
                }
                ps = select(ps);
                for (i = -1, l = ps.length; ++i < l;
                     removeListener(ps[i], "mousewheel", self.onPreventScrollDelegate) &&
                     removeListener(ps[i], "touchmove", self.onPreventScrollDelegate)
                ){}
            }

            self.overlay.hide();

            if (cfg.hide.animate && !immediately) {
                self.animate("hide").done(function() {
                    self.hideAfterAnimation(e);
                });
            }
            else {
                raf(function(){
                    self.hideAfterAnimation(e);
                });
            }
        },

        hideAfterAnimation: function(e) {

            var self = this,
                cfg = self.cfg,
                node = self.node;

            // we need to check if the tooltip was returned to visible state
            // while hiding animation
            if (self.visible) {
                return;
            }

            removeClass(node, cfg.cls.visible);
            addClass(node, cfg.cls.hidden);

            if (!cfg.render.keepVisible) {
                node.style.display = "none";
            }

            self.trigger('hide', self, e);

            var lt = cfg.render.lifetime;

            if (lt !== null) {
                if (lt === 0) {
                    self.destroyElem();
                }
                else {
                    self.destroyDelay = async(self.destroyElem, self, null, lt);
                }
            }

            if (node && cfg.hide.destroy) {
                raf(function(){
                    data(node, cfg.instanceName, null);
                    self.$destroy();
                });
            }
            else if (node && cfg.hide.remove) {
                raf(function(){
                    self.removeElem();
                });
            }
        },



        /* **** Render **** */




        render: function() {

            var self = this,
                cfg = self.cfg,
                elem;

            // if already rendered, we return
            if (self.node) {
                return;
            }


            var rnd	    = cfg.render,
                cls     = cfg.cls;


            // custom rendering function
            if (rnd.fn) {
                var res = rnd.fn.call(self.$$callbackContext, self);
                rnd[isString(res) ? 'tpl' : 'el'] = res;
            }


            if (rnd.el) {
                if (isString(rnd.el)) {
                    elem = select(rnd.el).shift();
                    rnd.keepInDOM = true;
                }
                else {
                    elem = rnd.el;
                }
            }
            else {
                var tmp = window.document.createElement("div");
                tmp.innerHTML = rnd.tpl;
                elem = tmp.firstChild;
            }


            if (!elem) {
                elem = window.document.createElement("div");
            }

            self.node = elem;

            if (rnd.id) {
                setAttr(elem, 'id', rnd.id);
            }

            if (!cfg.render.keepVisible) {
                elem.style.display = "none";
            }

            addClass(elem, cls.dialog);
            addClass(elem, cls.hidden);

            if (rnd.style) {
                setStyle(elem, rnd.style);
            }


            self.overlay.render();


            if (!cfg.hide.remove) {
                self.appendElem();
            }
            else {
                if (elem.parentNode) {
                    elem.parentNode.removeChild(elem);
                }
            }

            if (rnd.zIndex) {
                setStyle(elem, {zIndex: rnd.zIndex});
            }

            var cnt = cfg.content;

            if (cnt.value !== false) {
                if (cnt.value) {
                    self.setContent(cnt.value);
                }
                else {
                    if (cnt.fn) {
                        self.setContent(cnt.fn.call(self.$$callbackContext, self));
                    }
                    else {
                        self[cfg.ajax.url ? 'loadContent' : 'readContent']();
                    }
                }
            }

            self.pointer.render();
            self.pointer.append();

            if (cfg.buttons) {
                var btnId, btn;
                for (btnId in cfg.buttons) {
                    btn = select(cfg.buttons[btnId], elem).shift();
                    if (btn) {
                        data(btn, "metaphorjsTooltip-button-id", btnId);
                        addListener(btn, "click", self.onButtonClickDelegate);
                        addListener(btn, "keyup", self.onButtonKeyupDelegate);
                    }
                }
            }

            if (self.bindSelfOnRender) {
                self.setHandlers('bind', '_self');
                self.bindSelfOnRender = false;
            }

            self.rendered = true;

            self.trigger('render', self);
        },








        /* **** Position **** */

        setPositionType: function(type) {
            var self    = this,
                cls     = self.getPositionClass(type);

            self.cfg.position.type = type;

            if (self.positionClass !== cls || !self.position) {
                if (self.position) {
                    self.position.$destroy();
                    self.position = null;
                }
                if (cls) {
                    self.position = factory(cls, self);
                }
            }
            else {
                self.position.type = type;
            }

            if (self.isVisible()) {
                self.reposition();
            }
        },

        getPosition: function(e) {

            var self = this,
                cfgPos = self.cfg.position;

            if (!self.position) {

                if (!self.positionGetType && cfgPos.type !== "custom") {
                    if (isFunction(cfgPos.get) && cfgPos.type !== "m") {
                        cfgPos.type = "custom";
                    }
                }

                var type    = self.positionGetType ?
                                self.positionGetType.call(self.$$callbackContext, self, e) :
                                cfgPos.type,
                    cls     = self.getPositionClass(type);



                cfgPos.type     = type;

                if (cls === false) {
                    return;
                }

                if (self.positionClass !== cls) {
                    self.position   = factory(self.getPositionClass(type), self);
                }
                else {
                    self.position.type = type;
                }
            }

            return self.position;
        },

        getPositionClass: function(type) {

            if (!type) {
                return false;
            }

            if (isFunction(type) || type === "custom") {
                return "dialog.position.Custom";
            }

            var fc = type.substr(0, 1);

            if (!fc) {
                return false;
            }
            else if (fc === "w") {
                return "dialog.position.Window";
            }
            else if (fc === "m") {
                return "dialog.position.Mouse";
            }
            else {
                return "dialog.position.Target";
            }
        },


        /**
         * Usually called internally from show().
         * @access public
         * @param {Event} e Optional.
         */
        reposition: function(e) {
            var self = this;

            if (self.repositioning) {
                return;
            }

            self.repositioning = true;

            e && (e = normalizeEvent(e));

            self.getPosition(e);
            self.trigger("before-reposition", self, e);
            self.getPosition(e);
            self.trigger("reposition", self, e);

            self.repositioning = false;
        },



        /* **** Target **** */

        /**
         * Get dialog's target.
         * @access public
         * @return {Element}
         */
        getTarget: function() {
            return this.dynamicTarget ? this.dynamicTargetEl : this.target;
        },


        /**
         * Set new dialog's target.
         * @access public
         * @param newTarget Element {
             *     @required
         * }
         */
        setTarget: function(newTarget) {

            if (!newTarget) {
                return;
            }

            var self    = this,
                change  = false,
                prev    = self.target;

            if (self.target) {
                self.setHandlers('unbind', '_target');
                change = true;
            }
            else if (self.dynamicTarget) {
                change = true;
            }

            var isStr = isString(newTarget);

            if (isStr && newTarget.substr(0,1) !== "#") {
                self.dynamicTarget = true;
                self.target        = null;
            }
            else {
                if (isStr) {
                    newTarget       = select(newTarget).shift();
                }
                self.dynamicTarget = false;
                self.target        = newTarget;
            }

            if (change) {
                self.setHandlers('bind', '_target');
                self.trigger("target-change", self, newTarget, prev);
            }
        },


        resetDynamicTarget: function() {
            var self = this,
                curr = self.dynamicTargetEl;
            if (curr) {
                self.setHandlers("unbind", "_target");
                self.trigger("target-change", self, null, curr);
            }
        },

        isDynamicTargetChanged: function(e) {

            var self    = this,
                cfg     = self.cfg,
                dt	    = cfg.target,
                t	    = e.target,
                curr    = self.dynamicTargetEl;

            while (t && !is(t, dt)) {
                t   = t.parentNode;
            }

            if (!t) {
                return false;
            }

            return !curr || curr !== t;
        },

        changeDynamicTarget: function(e) {

            var self    = this,
                cfg     = self.cfg,
                dt	    = cfg.target,
                t	    = e.target,
                curr    = self.dynamicTargetEl;

            while (t && !is(t, dt)) {
                t   = t.parentNode;
            }

            if (!t) {
                return false;
            }

            if (!curr || curr !== t) {

                if (curr) {
                    self.setHandlers("unbind", "_target");
                }

                self.dynamicTargetEl = t;

                self.setHandlers("bind", "_target");
                self.trigger("target-change", self, t, curr);
                return true;
            }
            else {
                return false;
            }
        },









        /* **** Content **** */

        /**
         * @access public
         * @return {Element}
         */
        getContentElem: function() {
            var self = this,
                node = self.node;

            if (!node) {
                return null;
            }

            if (self.cfg.selector.content) {
                var el = select(self.cfg.selector.content, node).shift();
                return el || node;
            }
            else {
                return node;
            }
        },


        /**
         * Set new content.
         * @access public
         * @param {string|object} content {
             *      See "selector" option
             *      @required
         * }
         * @param {string} mode "", "attribute", "ajax" -- optional (used internally). See
         * content.prepare option.
         */
        setContent: function(content, mode) {

            mode = mode || '';

            var self    = this,
                node    = self.node,
                cfg     = self.cfg,
                pnt     = self.pointer;

            if (!node) {
                cfg.content.value = content;
                return self;
            }

            if (cfg.content.prepare) {
                content = cfg.content.prepare.call(self.$$callbackContext, self, mode, content);
            }

            var contentElem = self.getContentElem(),
                fixPointer  = self.rendered && !cfg.selector.content && pnt,
                pntEl       = fixPointer && pnt.getElem();

            if (fixPointer && pntEl) {
                try {
                    node.removeChild(pntEl);
                }
                catch (thrownError) {}
            }

            if (!isString(content)) {
                for (var i in content) {
                    var sel     = cfg.selector[i];
                    if (sel) {
                        var cel = select(sel, contentElem).shift();
                        if (cel) {
                            cel.innerHTML = content[i];
                        }
                    }
                }
            }
            else {
                contentElem.innerHTML = content;
            }

            // if there a pointer, and this is not initial content set,
            // and there is no selector for content
            // we must restore pointer after dialog's inner html
            // has been replaced with new content
            if (fixPointer && pntEl) {
                try {
                    node.appendChild(pntEl);
                }
                catch (thrownError){}
            }

            var imgs = select("img", contentElem),
                l;

            self.images = imgs.length;

            for (i = -1, l = imgs.length; ++i < l; addListener(imgs[i], "load", self.onImageLoadDelegate)){}

            self.trigger('content-change', self, content, mode);
            self.onContentChange();
        },

        /**
         * Force dialog to re-read content from attributes.
         * @access public
         * @method
         */
        readContent: function() {

            var self        = this,
                cfg         = self.cfg,
                el 			= self.getTarget(),
                content;

            if (el) {
                if (cfg.content.attr) {
                    content = getAttr(el, cfg.content.attr);
                }
                else {
                    content = getAttr(el, 'tooltip') ||
                              getAttr(el, 'title') ||
                              getAttr(el, 'alt');
                }
            }

            if (content) {
                self.setContent(content, 'attribute');
            }
        },

        /**
         * Load content via ajax.
         * @access public
         * @param {object} options Merged with cfg.ajax
         */
        loadContent: function(options) {

            var self = this,
                cfg = self.cfg;

            addClass(self.node, cfg.cls.loading);
            var opt = extend({}, cfg.ajax, options, true, true);
            self.trigger('before-ajax', self, opt);
            return ajax(opt).done(self.onAjaxLoad, self);
        },

        onAjaxLoad: function(data) {
            var self = this;
            removeClass(self.node, self.cfg.cls.loading);
            self.setContent(data, 'ajax');
        },

        onImageLoad: function() {
            this.images--;
            this.onContentChange();
        },

        onContentChange: function() {
            if (this.visible) {
                this.reposition();
            }
        },

        changeDynamicContent: function() {
            var self = this,
                cfg = self.cfg;
            if (cfg.content.fn) {
                self.setContent(cfg.content.fn.call(self.$$callbackContext, self));
            }
            else if (cfg.content.attr) {
                self.readContent();
            }
        },

        toggleTitleAttribute: function(state) {

            var self = this,
                trg = self.getTarget(),
                title;

            if (trg) {
                if (state === false) {
                    data(trg, "tmp-title", getAttr(trg, "title"));
                    removeAttr(trg, 'title');
                }
                else if (title = data(trg, "tmp-title")) {
                    setAttr(trg, "title", title);
                }
            }
        },

        /* **** Dimension **** */


        getDialogSize: function() {

            var self    = this;

            if (!self.rendered) {
                self.render();
            }

            var cfg     = self.cfg,
                node    = self.node,
                hidden  = cfg.cls.hidden ? hasClass(node, cfg.cls.hidden) : !isVisible(node),
                size,
                left    = node.style.left;

            if (hidden) {
                setStyle(node, {left: "-1000px"});
                node.style.display = cfg.show.display;
            }

            size    = {
                width:      getOuterWidth(node),
                height:     getOuterHeight(node)
            };

            if (hidden) {
                setStyle(node, {left: left});
                node.style.display = "none";
            }

            return size;
        },

        getTargetSize: function() {

            var self    = this,
                target  = self.getTarget();

            if (!target) {
                return null;
            }

            return {
                width:      getOuterWidth(target),
                height:     getOuterHeight(target)
            };
        },


        /* **** Misc **** */


        /**
         * Set focus based on focus setting.
         * @access public
         * @method
         */
        setFocus: function() {

            var self    = this,
                cfg     = self.cfg,
                af      = cfg.show.focus,
                node    = self.node,
                i,
                input;

            if (af === true) {
                input   = select("input", node).concat(select("textarea", node));
                if (input.length > 0) {
                    input[0].focus();
                }
                else if (cfg.buttons) {
                    for (i in cfg.buttons) {
                        var btn = select(cfg.buttons[i], node).shift();
                        btn && btn.focus();
                        break;
                    }
                }
            }
            else {
                var el = select(af, node).shift();
                el && el.focus();
            }
        },

        getScrollEl: function(cfgScroll) {
            if (cfgScroll === true || cfgScroll === false) {
                return window;
            }
            else if (typeof cfgScroll === "string") {
                return select(cfgScroll).shift();
            }
            else {
                return cfgScroll;
            }
        },


        animate: function(section, e) {

            var self = this,
                cfg = self.cfg,
                node = self.node,
                a,
                skipDisplay;

            a 	= cfg[section].animate;

            if (isFunction(a)) {
                a   = a(self, e);
            }

            skipDisplay = a.skipDisplayChange || false;

            if (isBool(a)) {
                a = section;
            }
            else if (isString(a)) {
                a = [a];
            }

            return animate(node, a, function(){
                if (section === "show" && !skipDisplay) {

                    var p = new Promise;

                    raf(function(){
                        node.style.display = cfg.show.display || "block";
                        p.resolve();
                    });

                    return p;
                }
            }, false);
        },

        removeElem: function() {

            var self = this,
                node = self.node;

            self.overlay.remove();

            if (node && node.parentNode) {
                raf(function(){
                    if (!self.visible) {
                        node.parentNode.removeChild(node);
                    }
                });
            }
        },

        appendElem: function() {



            var self    = this,
                cfg     = self.cfg,
                body    = window.document.body,
                rnd	    = cfg.render,
                to      = rnd.appendTo || body;

            self.overlay.append();

            if (self.node && cfg.render.appendTo !== false) {
                to.appendChild(self.node);
            }
        },


        /* **** Destroy **** */

        destroyElem: function() {

            var self = this,
                node = self.node;

            self.setHandlers("unbind", "_self");
            self.bindSelfOnRender = true;

            self.pointer.remove();
            self.overlay.remove();

            if (node) {
                if (!self.cfg.render.keepInDOM) {
                    node.parentNode && node.parentNode.removeChild(node);
                }
                self.node = null;
            }

            self.trigger("lifetime", self);
        },

        /**
         * Destroy dialog.
         * @access public
         * @method
         */
        destroy: function() {

            var self = this;

            self.setHandlers("unbind");

            self.trigger("destroy", self);
            self.destroyElem();


            self.overlay && self.overlay.$destroy();
            self.pointer && self.pointer.$destroy();
            self.position && self.position.$destroy();
        }

    }, {
        defaults: null
    });



    return Dialog;

}());



Component.$extend({

    $class: "dialog.Component",

    dialog: null,
    dialogPreset: null,
    dialogCfg: null,

    dialogNode: null,

    hidden: true,

    target: null,
    isTooltip: false,

    $init: function(cfg) {

        var self = this;

        if (self.isTooltip) {
            self.target = cfg.node;
            cfg.node = null;
        }

        self.$super(cfg);
    },

    initComponent: function() {

        var self    = this;

        self.$super();
        self._createDialog();
    },

    _getDialogCfg: function() {

        var self    = this;

        return extend({}, self.dialogCfg, {
            preset: self.dialogPreset,
            render: {
                el: self.dialogNode || self.node,
                keepInDOM: true
            }
        }, true, true);
    },

    _createDialog: function() {

        var self    = this;
        self.dialog = new Dialog(self._getDialogCfg());
        self.dialog.on("show", self.onDialogShow, self);
        self.dialog.on("hide", self.onDialogHide, self);
        self.dialog.on("before-show", self.onBeforeDialogShow, self);
        self.dialog.on("before-hide", self.onBeforeDialogHide, self);
        self.dialog.on("destroy", self.onDialogDestroy, self);
    },

    getDialog: function() {
        return this.dialog;
    },

    // skips the append part
    onRenderingFinished: function() {
        var self = this;
        self.rendered   = true;
        self.afterRender();
        self.trigger('after-render', self);
    },

    show: function(e) {
        if (e && !(e instanceof DomEvent)) {
            e = null;
        }

        this.dialog.show(e);
    },

    hide: function(e) {

        if (e && !(e instanceof DomEvent)) {
            e = null;
        }

        this.dialog.hide(e);
    },

    onBeforeDialogShow: function() {

        var self = this;
        if (!self.rendered) {
            self.render();
        }

        self.template.setAnimation(true);
        self.hidden = false;
    },

    onDialogShow: function() {
        var self = this;
        self.onShow();
        self.trigger("show", self);
    },

    onBeforeDialogHide: function() {

    },

    onDialogHide: function() {
        var self = this;
        if (!self.$destroyed) {
            self.template.setAnimation(false);
            self.hidden = true;
            self.onHide();
            self.trigger("hide", self);
        }
    },

    onDialogDestroy: function() {
        var self    = this;

        if (!self.$destroying) {
            self.dialog = null;
            self.$destroy();
        }
    },

    destroy: function() {

        var self    = this;

        if (self.dialog) {
            self.dialog.destroy();
        }

        self.$super();

    }

});


var isBrowser = new Function("try {return this===window;}catch(e){ return false;}");

var generateTemplateNames = function(name){

    var list        = [],
        path        = name.split("."),
        //max         = path.length - 3,
        //last        = path.length - 1,
        exts        = [path[0], '*'],
        tmp, i, j, ext, e;

    for (e = 0; e < 2; e++) {

        ext = exts[e];
        tmp = path.slice();
        tmp[0] = ext;
        list.push(tmp.join("."));
        tmp[2] = "*";
        list.push(tmp.join("."));

        /*for (j = 1; j <= max; j++) {
            for (i = last; i > last - j; i--) {
                tmp[i] = "*";
                list.push(tmp.join("."));
            }
        }*/
    }

    return list.filter(function(value, index, self){
        return self.indexOf(value) === index;
    });
};


App.$extend({
    $class: "DocsApp",
    loading: 0,

    $init: function() {
        var self = this;

        self.$super.apply(self, arguments);

        self.scope.loading = false;

        //initMetaphorTemplates(Template);
        Template.cache.addFinder(function(id){

            var names = generateTemplateNames(id),
            i, l,
            tplNode;

            for (i = 0, l = names.length; i < l; i++) {
                tplNode = window.document.getElementById(names[i]);
                if (tplNode) {
                    return tplNode.innerHTML;
                }
            }
        });

        var data = window.docsData;

        if (data) {
            var k;
            for (k in data) {
                self.scope[k] = data[k];
            }
        }

        self.makeItemMap();

        if (isBrowser()) {
            mhistory.init();
        }
    },

    makeItemMap: function() {
        var map = {},
            contentMap = {},
            self = this;

        var flattenItem = function(item) {
            if (item.isApiGroup) {
                item.items.forEach(flattenItem);
            }
            if (item.isApiItem) {
                map[item.fullName] = item;
            }
            if (item.isContentItem) {
                contentMap[item.id] = item;
            }
        };

        if (self.scope.sourceTree.items) {
            self.scope.sourceTree.items.forEach(flattenItem);
        }
        if (self.scope.sourceTree.content) {
            self.scope.sourceTree.content.forEach(flattenItem);
        }
        self.itemMap = map;
        self.contentMap = contentMap;
    },

    getItem: function(id) {
        return this.itemMap[id];
    },

    getContentItem: function(id) {
        return this.contentMap[id];
    },

    hasNav: function(where) {
        var k;
        for (k in this.scope.sourceTree.structure) {
            if (this.scope.sourceTree.structure[k].where == where) {
                return true;
            }
        }
        return false;
    },

    getItemUrl: function(item) {
        if (item.isGroup) {
            return '#';
        }
        if (this.scope.multipage) {
            return '/' + item.pathPrefix +'/'+ item.id;
        }
        else {
            return '#' + item.id;
        }
    },

    setLoading: function(state, ifNot) {
        if (state) {
            if (ifNot && this.loading > 0) {
                return;
            }
            this.loading++;
            if (this.loading > 1) {
                return;
            }
            this.scope.$set("loading", true);
        }
        else if (this.loading > 0) {
            this.loading--;
            if (this.loading === 0) {
                this.scope.$set("loading", false);
            }
        }
    },

    highlightAllUnprocessed: function() {

        var p = new Promise,
            pres = select("pre"),
            counter = 0,
            i, l,
            j, jl,
            pre, code;

        try {
            for (i = 0, l = pres.length; i < l; i++) {

                pre = pres[i];

                for (j = 0, jl = pre.childNodes.length; j < jl; j++) {
                    code = pre.childNodes[j];
                    if (code.nodeType && 
                        code.tagName.toLowerCase() === "code" && 
                        !getAttr(code, "prism-processed")) 
                    {
                        counter++;
                        setAttr(code, "prism-processed", "true");
                        window.Prism.highlightElement(code, true, function(){
                            counter--;
                            if (counter === 0) {
                                p.resolve();
                            }
                        });
                    }
                }
            }
        }
        catch (ex) {
            console.log(ex);
            counter = 0;
        }

        if (counter === 0) {
            p.resolve();
        }

        setTimeout(function(){
            p.resolve();
        }, 1000);

        return p;
    },


    initMenuItem: function() {
        return nextUid();
    },

    toggleMenuItem: function(open, id) {
        var self = this;
        async(function(){
            self.trigger("menu-toggle", id, !open)
        });
        
        return !open;
    },

    goto: function(url) {
        if (url.substr(0,1) === '#') {
            window.location.hash = url;
        }
        else {
            mhistory.push(url);
        }
    }
});



Component.$extend({
    $class: "DocsContent",
    template: ".content.template",

    initComponent: function() {
        var self = this;
        self.scope.content = {
            template: null
        };

        self.contentId.on("change", self.onContentIdChange, self);
        self.onContentIdChange(self.contentId.getValue() || self.findFirstItem());
    },

    onContentIdChange: function(contentId) {
        var self = this;

        if (!contentId) {
            return;
        }

        return new Promise(function(resolve){
            async(function(){
                self.scope.$app.setLoading(true, true);
                resolve();
            }, null, [], 100);
        })
        .then(function(){
            return new Promise(function(resolve){
                raf(function(){
                    self.scope.content = self.scope.$app.getContentItem(contentId);
                    self.scope.$check();
                    resolve();
                });
            });
        })
        .then(function(){
            return self.scope.$app.highlightAllUnprocessed();
        })
        .then(function(){
            return new Promise(function(resolve) {
                raf(function(){
                    self.scope.$app.setLoading(false);
                    resolve();
                });
            });
        });
    }  
});




Component.$extend({
    $class: "DocsItem",
    template: "item-component",

    initComponent: function() {
        var self = this;
        self.scope.tpl = '';

        self.itemId.on("change", self.onItemIdChange, self);
        self.onItemIdChange(self.itemId.getValue() || self.findFirstItem());
    },

    findFirstItem: function() {
        var a = select(".bd-toc-sublink");
        if (a.length) {
            a = a[0];
            if (a.href) {
                var itemId = a.href.split("/item/");
                if (itemId.length) {
                    return itemId[1];
                }
            }
        }
    },

    onItemIdChange: function(itemId) {
        var self = this;

        if (!itemId) {
            return;
        }

        return new Promise(function(resolve){
            async(function(){
                self.scope.$app.setLoading(true, true);
                resolve();
            }, null, [], 100);
        })
        .then(function(){
            return new Promise(function(resolve){
                raf(function(){
                    self.scope.item = self.scope.$app.getItem(itemId);
                    self.scope.$check();
                    resolve();
                    console.log(1)
                });
            });
        })
        .then(function(){
            try {
                return self.scope.$app.highlightAllUnprocessed();
            }
            catch (ex) {
                return Promise.resolve();
            }
        })
        .then(function(){
            return new Promise(function(resolve) {
                raf(function(){
                    self.scope.$app.setLoading(false);
                    resolve();
                });
            });
        });
    }  
});




View.$extend({
    $class: "DocsView",
    
    initView: function() {

        var self    = this;

        self.route = [
            {
                regexp: /\/item\//,
                cmp: "DocsItem",
                id: "item",
                default: true,
                params: [
                    {
                        name: "itemId",
                        regexp: /item\/(.+)/
                    }
                ]
            },
            {
                regexp: /\/content\//,
                cmp: "DocsContent",
                id: "content",
                default: true,
                params: [
                    {
                        name: "contentId",
                        regexp: /content\/(.+)/
                    }
                ]
            }
        ];
    }
});


nsAdd("filter.getChildren", function(item, scope, type) {
    var i, l;
    for (i = 0, l = item.children.length; i < l; i++) {
        if (item.children[i].type == type) {
            return item.children[i].items;
        }
    }
    return [];
});


nsAdd("filter.highlightJson", function(input, scope, prop) {
    
    var hl = Prism.highlight(input, Prism.languages.javascript),
        r = /\/\*fold-start ([^*]+)\*\//,
        startSpan, endSpan, startReg, endReg,
        start, end, key,
        match;

    while ((match = hl.match(r)) !== null) {
        key = match[1];
        startSpan = '<span class="token comment">/*fold-start '+key+'*/</span>';
        endSpan = '<span class="token comment">/*fold-end '+key+'*/</span>';
        startReg = new RegExp('<span class="token comment">/\\*fold-start '+key+'\\*/</span>[\\r\\n]');
        endReg = new RegExp('([\\r\\n\\s]*)</div><span class="token comment">/\\*fold-end '+key+'\\*/</span>');
        start = hl.indexOf(startSpan);
        end = hl.indexOf(endSpan);

        hl = hl.substring(0, start + startSpan.length + 1) + 
            '<div {show}="this.show_'+key+'">' +
            hl.substring(start + startSpan.length + 1, end) +
            '</div>' +
            hl.substr(end);

        hl = hl.replace(
            startReg, 
            '<a class="code-fold-expander" '+
                '{init}="this.show_'+key+' = false" '+
                '(click)="this.show_'+key+' = !this.show_'+key+'"' +
                '{class.collapsed}="!this.show_'+key+'"' +
                '{class.expanded}="this.show_'+key+'"' +
                'href="#">'+
                '<span class="cfe-expand">+</span>'+
                '<span class="cfe-collapse">-</span>'+
            '</a>'
        );

        hl = hl.replace(endReg, function(match, space){
            space = space.replace(/[\r\n]/g, '');
            return '</div><span {show}="this.show_'+key+'">'+space+'</span>';
        });
    }

    return hl;
});


nsAdd("filter.navFilter", function(input, scope, where) {
    if (isArray(input)) {
        return input.filter(function(nav){
            return nav.value.where == where;
        });
    }
    return [];
});



var globalCache = Cache.global();



/**
 * @group hook
 * @function 
 * Extract part of comment between curly brakets
 * @param {string} content Full comment
 * @param {int} start Start position
 * @param {bool} backwards Backward lookup
 * @param {bool} returnIndexes Return array with start and last index
 * @param {string|array} brakets {
 *  @default '{}'
 * }
 */
var getCurly = globalCache.add("file.*.comment.getCurly", 
    function(content, start, backwards, returnIndexes, brakets) {

    var left, right,
        i, l,
        first, last,
        char,
        openChar = brakets ? brakets[0] : '{',
        closeChar = brakets ? brakets[1] : '}';

    if (!backwards) {

        left    = 0;
        right   = 0;
        i       = start || 0;
        l       = content.length;
        first   = null;

        for (; i < l; i++) {

            char = content.charAt(i);

            if (char === openChar) {
                left++;
                if (first === null) {
                    first = i + 1;
                }
            }
            else if (char === closeChar && first !== null) {
                right++;
            }

            if (left > 0 && left == right) {
                last = i;
                break;
            }
        }
    }
    else {

        left    = 0;
        right   = 0;
        i       = start || content.length - 1;
        last    = null;

        for (; i >= 0; i--) {

            char = content.charAt(i);

            if (char === closeChar) {
                right++;
                if (last === null) {
                    last = i;
                }
            }
            else if (char === openChar && last !== null) {
                left++;
            }

            if (left > 0 && left == right) {
                first = i + 1;
                break;
            }
        }
    }

    if (first && last) {
        if (returnIndexes) {
            return [first, last];
        }
        else {
            return content.substring(first, last);
        }
    }

    return null;
});



var toJsonTemplate = (function() {

    var LINE_SIZE = 80;

    var defaults = {
        "int": 1,
        "string": "",
        "object": {},
        "array": [],
        "bool": true,
        "boolean": true,
        "float": 0.5,
        "datetime": "0000-00-00T00:00:00+00:00"
    };

    var childrenToObject = function(o, item, cache) {
        item.children.forEach(function(grp){
            grp.items.forEach(function(child){

                var name = child.name,
                    type = child.plainFlags.type,
                    val = child.plainFlags.value || 
                            child.plainFlags.default,
                    key, descr,
                    id;
                
                if (!name) {
                    return;
                }

                type && (type = type[0]);
                val && (val = val[0]);

                if (!type) {
                    return;
                }

                id = nextUid();
                key = name +"_"+ id;

                if (!val) {
                    val = defaults[type];   
                }
                
                switch (type) {
                    case "bool":
                    case "boolean": {
                        val = toBool(val);
                        break;
                    }
                    case "int": {
                        val = parseInt(val);
                        break;
                    }
                    case "float": {
                        val = parseFloat(val);
                        break;
                    }
                }

                o[key] = val;

                cache[key] = {
                    id: id,
                    name: name,
                    type: type,
                    descr: null
                };

                if (child.hasOwnProperty("description")) {
                    cache[key].descr = child.description;
                }

                if (child.children.length) {
                    if (type === "object") {
                        o[key] = {};
                        childrenToObject(o[key], child, cache);
                    }
                    else if (type === "array") {
                        o[key] = [{}];
                        childrenToObject(o[key][0], child, cache);
                    }
                }
            });
        });
    };

    var buildComment = function(item, offset, lineSize) {
        var lines = [],
            d, line, w, descr, descrContent,
            pad = " ".repeat(offset);

        if (!item.descr || !item.descr.length) {
            
        }
        else {
            
            descr = item.descr;
            line = "";

            while (descr.length > 0) {
                descrContent = descr.shift().content.split(/[\r\n]/);
                while (descrContent.length > 0) {
                    d = descrContent.shift();
                    d = d.split(" ");

                    while (d.length > 0) {
                        w = d.shift();
                        if (offset + 3 + w.length + 1 <= lineSize) {
                            line += w + " ";
                        }
                        else {
                            lines.push(pad + '// ' + line);
                            line = "";
                        }
                    }

                    if (line.length > 0) {
                        lines.push(pad + '// ' + line);
                        line = "";

                    }
                }
            }
        }

        return lines.join("\n");
    };

    var putComments = function(json, o, cache, lineSize, withFolding) {
        var key, item, r, comment, type, fold;

        if (!json) {
            return "";
        }

        for (key in cache) {
            item = cache[key];
            type = item.type;

            r = new RegExp('^(\\s+)"' + key + '":\\s(.+)$', 'im');

            json = json.replace(r, function(match, pref, rest) {
                var comment = buildComment(
                    item, 
                    //match.length - item.id.length - 1, 
                    pref.length,
                    lineSize
                );
                if (comment) {
                    comment += "\n";
                }
                return comment + pref +'"'+ key +'": '+ rest;
            });

            fold = null;

            if (type === "array" || type === "object") {
                json = json.replace(r, function(match, pref, rest) {

                    var inx = json.indexOf(key) + key.length,
                        brakets = type === "array" ? "[]" : "{}",
                        inxs = getCurly(json, inx, false, true, brakets),
                        part = json.substring(inxs[0], inxs[1]);

                    if (trim(part).length > 50) {
                        fold = {
                            inxs: inxs,
                            part: part
                        };
                    }

                    return pref +'"'+ key +'": '+ rest;
                });
            }

            if (withFolding && fold) {
                json = json.substring(0, fold.inxs[0]) + 
                         '/*fold-start '+key+'*/' +
                            fold.part + 
                        '/*fold-end '+key+'*/' +
                        json.substr(fold.inxs[1]);
            }
            
            json = json.replace(key, item.name);
        }

        return json;
    };

    return function(item, opt) {

        if (item.$$jsonPresentation) {
            return item.$$jsonPresentation;
        }

        var type = item.plainFlags.type,
            o = {},
            cache = {};

        opt = opt || {};
        type && (type = type[0]);

        if (type === "array") {
            o = [{}];
            childrenToObject(o[0], item, cache);
        }
        else {
            childrenToObject(o, item, cache);
        }

        var json = JSON.stringify(o, null, 2);

        json = putComments(json, o, cache, LINE_SIZE, opt.withFolding);

        item.$$jsonPresentation = json;
        return json;
    };
}());


nsAdd("filter.presentAsJson", function(input, scope, withFolding) {
    return toJsonTemplate(input, {
        withFolding: withFolding || false
    });
});

var prismClass = function(fileType){

    fileType = fileType.replace("language-", "");

    if (fileType.indexOf('txt-') === 0) {
        fileType = fileType.split('-')[1];
    }

    switch (fileType) {
        case "js":
        case "json":
            return "language-javascript";
        default:
            return "language-" + fileType;
    }
};



nsAdd("filter.prismClass", function(input, scope, where) {
    return prismClass(input);
});
var MetaphorJsExports = {};
MetaphorJsExports['MetaphorJs'] = MetaphorJs;
MetaphorJsExports['isFunction'] = isFunction;
MetaphorJsExports['undf'] = undf;
MetaphorJsExports['varType'] = varType;
MetaphorJsExports['isString'] = isString;
MetaphorJsExports['isArray'] = isArray;
MetaphorJsExports['strUndef'] = strUndef;
MetaphorJsExports['isObject'] = isObject;
MetaphorJsExports['Cache'] = Cache;
MetaphorJsExports['Namespace'] = Namespace;
MetaphorJsExports['slice'] = slice;
MetaphorJsExports['isPlainObject'] = isPlainObject;
MetaphorJsExports['isBool'] = isBool;
MetaphorJsExports['extend'] = extend;
MetaphorJsExports['emptyFn'] = emptyFn;
MetaphorJsExports['instantiate'] = instantiate;
MetaphorJsExports['intercept'] = intercept;
MetaphorJsExports['Class'] = Class;
MetaphorJsExports['ns'] = ns;
MetaphorJsExports['cs'] = cs;
MetaphorJsExports['defineClass'] = defineClass;
MetaphorJsExports['getAttr'] = getAttr;
MetaphorJsExports['bind'] = bind;
MetaphorJsExports['nextUid'] = nextUid;
MetaphorJsExports['async'] = async;
MetaphorJsExports['ObservableEvent'] = ObservableEvent;
MetaphorJsExports['Observable'] = Observable;
MetaphorJsExports['toArray'] = toArray;
MetaphorJsExports['trim'] = trim;
MetaphorJsExports['split'] = split;
MetaphorJsExports['isDate'] = isDate;
MetaphorJsExports['isRegExp'] = isRegExp;
MetaphorJsExports['isWindow'] = isWindow;
MetaphorJsExports['equals'] = equals;
MetaphorJsExports['copy'] = copy;
MetaphorJsExports['isPrimitive'] = isPrimitive;
MetaphorJsExports['returnFalse'] = returnFalse;
MetaphorJsExports['levenshteinArray'] = levenshteinArray;
MetaphorJsExports['error'] = error;
MetaphorJsExports['functionFactory'] = functionFactory;
MetaphorJsExports['createGetter'] = createGetter;
MetaphorJsExports['createSetter'] = createSetter;
MetaphorJsExports['Watchable'] = Watchable;
MetaphorJsExports['createFunc'] = createFunc;
MetaphorJsExports['Scope'] = Scope;
MetaphorJsExports['isThenable'] = isThenable;
MetaphorJsExports['createWatchable'] = createWatchable;
MetaphorJsExports['nsGet'] = nsGet;
MetaphorJsExports['filterLookup'] = filterLookup;
MetaphorJsExports['nsAdd'] = nsAdd;
MetaphorJsExports['Directive'] = Directive;
MetaphorJsExports['isNull'] = isNull;
MetaphorJsExports['TextRenderer'] = TextRenderer;
MetaphorJsExports['setAttr'] = setAttr;
MetaphorJsExports['removeAttr'] = removeAttr;
MetaphorJsExports['toCamelCase'] = toCamelCase;
MetaphorJsExports['getAttrSet'] = getAttrSet;
MetaphorJsExports['Promise'] = Promise;
MetaphorJsExports['aIndexOf'] = aIndexOf;
MetaphorJsExports['Renderer'] = Renderer;
MetaphorJsExports['Text'] = Text;
MetaphorJsExports['destroy'] = destroy;
MetaphorJsExports['Provider'] = Provider;
MetaphorJsExports['App'] = App;
MetaphorJsExports['isAttached'] = isAttached;
MetaphorJsExports['data'] = data;
MetaphorJsExports['toFragment'] = toFragment;
MetaphorJsExports['clone'] = clone;
MetaphorJsExports['getAnimationPrefixes'] = getAnimationPrefixes;
MetaphorJsExports['getAnimationDuration'] = getAnimationDuration;
MetaphorJsExports['getRegExp'] = getRegExp;
MetaphorJsExports['getClsReg'] = getClsReg;
MetaphorJsExports['removeClass'] = removeClass;
MetaphorJsExports['stopAnimation'] = stopAnimation;
MetaphorJsExports['hasClass'] = hasClass;
MetaphorJsExports['addClass'] = addClass;
MetaphorJsExports['raf'] = raf;
MetaphorJsExports['animate'] = animate;
MetaphorJsExports['parseJSON'] = parseJSON;
MetaphorJsExports['parseXML'] = parseXML;
MetaphorJsExports['select'] = select;
MetaphorJsExports['serializeParam'] = serializeParam;
MetaphorJsExports['returnTrue'] = returnTrue;
MetaphorJsExports['DomEvent'] = DomEvent;
MetaphorJsExports['normalizeEvent'] = normalizeEvent;
MetaphorJsExports['mousewheelHandler'] = mousewheelHandler;
MetaphorJsExports['addListener'] = addListener;
MetaphorJsExports['ajax'] = ajax;
MetaphorJsExports['Template'] = Template;
MetaphorJsExports['inArray'] = inArray;
MetaphorJsExports['htmlTags'] = htmlTags;
MetaphorJsExports['Component'] = Component;
MetaphorJsExports['isNumber'] = isNumber;
MetaphorJsExports['Queue'] = Queue;
MetaphorJsExports['ListRenderer'] = ListRenderer;
MetaphorJsExports['rParseLocation'] = rParseLocation;
MetaphorJsExports['parseLocation'] = parseLocation;
MetaphorJsExports['joinLocation'] = joinLocation;
MetaphorJsExports['mhistory'] = mhistory;
MetaphorJsExports['currentUrl'] = currentUrl;
MetaphorJsExports['UrlParam'] = UrlParam;
MetaphorJsExports['resolveComponent'] = resolveComponent;
MetaphorJsExports['View'] = View;
MetaphorJsExports['isField'] = isField;
MetaphorJsExports['getValue'] = getValue;
MetaphorJsExports['setValue'] = setValue;
MetaphorJsExports['removeListener'] = removeListener;
MetaphorJsExports['isAndroid'] = isAndroid;
MetaphorJsExports['isIE'] = isIE;
MetaphorJsExports['browserHasEvent'] = browserHasEvent;
MetaphorJsExports['Input'] = Input;
MetaphorJsExports['evaluate'] = evaluate;
MetaphorJsExports['getStyle'] = getStyle;
MetaphorJsExports['boxSizingReliable'] = boxSizingReliable;
MetaphorJsExports['getDimensions'] = getDimensions;
MetaphorJsExports['getWidth'] = getWidth;
MetaphorJsExports['getHeight'] = getHeight;
MetaphorJsExports['getScrollTopOrLeft'] = getScrollTopOrLeft;
MetaphorJsExports['getScrollTop'] = getScrollTop;
MetaphorJsExports['getScrollLeft'] = getScrollLeft;
MetaphorJsExports['EventBuffer'] = EventBuffer;
MetaphorJsExports['EventHandler'] = EventHandler;
MetaphorJsExports['toBool'] = toBool;
MetaphorJsExports['preloadImage'] = preloadImage;
MetaphorJsExports['removeStyle'] = removeStyle;
MetaphorJsExports['parentData'] = parentData;
MetaphorJsExports['transclude'] = transclude;
MetaphorJsExports['filterArray'] = filterArray;
MetaphorJsExports['dateFormats'] = dateFormats;
MetaphorJsExports['numberFormats'] = numberFormats;
MetaphorJsExports['sortArray'] = sortArray;
MetaphorJsExports['onReady'] = onReady;
MetaphorJsExports['initApp'] = initApp;
MetaphorJsExports['run'] = run;
MetaphorJsExports['getAttrMap'] = getAttrMap;
MetaphorJsExports['factory'] = factory;
MetaphorJsExports['Model'] = Model;
MetaphorJsExports['Record'] = Record;
MetaphorJsExports['Store'] = Store;
MetaphorJsExports['StoreRenderer'] = StoreRenderer;
MetaphorJsExports['setStyle'] = setStyle;
MetaphorJsExports['isVisible'] = isVisible;
MetaphorJsExports['is'] = is;
MetaphorJsExports['ucfirst'] = ucfirst;
MetaphorJsExports['getOuterWidth'] = getOuterWidth;
MetaphorJsExports['getOuterHeight'] = getOuterHeight;
MetaphorJsExports['delegates'] = delegates;
MetaphorJsExports['delegate'] = delegate;
MetaphorJsExports['undelegate'] = undelegate;
MetaphorJsExports['getOffsetParent'] = getOffsetParent;
MetaphorJsExports['getOffset'] = getOffset;
MetaphorJsExports['getPosition'] = getPosition;
MetaphorJsExports['Dialog'] = Dialog;
MetaphorJsExports['isBrowser'] = isBrowser;
MetaphorJsExports['generateTemplateNames'] = generateTemplateNames;
MetaphorJsExports['globalCache'] = globalCache;
MetaphorJsExports['getCurly'] = getCurly;
MetaphorJsExports['toJsonTemplate'] = toJsonTemplate;
MetaphorJsExports['prismClass'] = prismClass;

}());