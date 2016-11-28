;(function(factory){
if(typeof define == 'function' && define.amd){
    define(['../calendar/calendar'], function(Calendar){
        return Calendar;
    });
}else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = require('../calendar/calendar');
}else{
    window.jQuery.fn.datepicker = window.jQuery.fn.calendar;
}
})();