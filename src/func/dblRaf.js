
var raf = require("./raf.js");

module.exports = function(fn, context, args) {

    return raf(function(){
        raf(fn, context, args);
    });
};