;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory(
			require('./string.js')
		);
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.Util = window.jQuery.featherUi.Util || {};
	window.jQuery.featherUi.Util.number = factory(window.jQuery.featherUi.Util.string);
}
})(window, function(string){

return {
	//给数字加千分位XX
	format: function(num){
		if(!num) return 0;
		return string.reverse(string.reverse(num).replace(/\d{3}/g, '$&,')).replace(/^,/, '');
	},

	toInt: function(number){
		number = parseInt(number);
		return isNaN(number) ? 0 : number;
	}
};

});