;(function(factory){
if(typeof define == 'function' && define.amd){
    //seajs or requirejs environment
    define(['./object', './number', './string', './date'], factory);
}else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = factory(
        require('./object'),
        require('./number'),
        require('./string'),
        require('./date')
    );
}else if(typeof jQuery != 'undefined'){
    jQuery.util = this.util;
}
})(function(Object, Number, String, Date){
    return {
        object: Object,
        number: Number,
        string: String,
        date: Date
    };
});