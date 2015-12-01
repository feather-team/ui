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
	window.jQuery.featherUi.Util.date = factory(window.jQuery.featherUi.Util.string);
}
})(window, function(string){

var toPad = string.toPad;

return {
	//获取当前时间戳
	time: function(){
		return (new Date).getTime();	
	},

	//返回和php一样的时间格式
	//如Date.date('Y-m-d H:i:s'); 2012-09-10 11:10:00
	//Y 4位年
	//y 2位年
	//m 2位月
	//n 不加0的月
	//d 2位 当前多少日
	//j 不加0的日
	//D 星期几
	//h 不加0的小时
	//H 2位小时
	//i 2位分
	//s 2位秒
	//a am或者pm
	//A AM或者PM
	//t 当前月有多少天
	date: function(str, time){
		if( !str ) return ;

		var date = new Date, temp = [];

		if(time) date.setTime(time);

		for(var i = 0, j = str.length; i < j; i++){
			var value = str.charAt(i);

			switch(value){
				case 'Y': value = date.getFullYear(); break;
				case 'y': value = String(date.getFullYear()).substring(0, 2); break;
				case 'm': value = toPad(date.getMonth() + 1, 0, 2, true); break;
				case 'n': value = date.getMonth() + 1; break;	
				case 'd': value = toPad(date.getDate(), 0, 2, true); break;
				case 'j': value = date.getDate(); break;
				case 'D': value = date.getDay() + 1; break;
				case 'h': value = toPad(date.getHours() % 12, 0, 2, true); break;
				case 'H': value = toPad(date.getHours(), 0, 2, true); break;
				case 'i': value = toPad(date.getMinutes(), 0, 2, true); break;
				case 's': value = toPad(date.getSeconds(), 0, 2, true); break;
				case 'a': value = date.getHours() - 12 < 0 ? 'am' : 'pm'; break;
				case 'A': value = date.getHours() - 12 < 0 ? 'AM' : 'PM'; break;
				case 't': value = (new Date(date.getFullYear(), date.getMonth() + 1, 0)).getDate(); break;

				default: ;
			};

			temp.push(value);
		}

		return temp.join('');
	}	
};

});