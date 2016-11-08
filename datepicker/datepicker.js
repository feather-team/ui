;(function(factory){
if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = require('../calendar/calendar');
}else{
    window.jQuery.fn.datepicker = window.jQuery.fn.calendar;
}
})();