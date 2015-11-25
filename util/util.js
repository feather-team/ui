;(function(window){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return {
			object: require('./object.js'),
			number: require('./number.js'),
			string: require('./string.js'),
			date: require('./date.js')
		};
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.Util = window.jQuery.featherUi.Util || {};
}
})(window);