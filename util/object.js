;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory(
			require('./lib/json2.js')
		);
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.Util = window.jQuery.featherUi.Util || {};
	window.jQuery.featherUi.Util.object = factory(window.JSON);
}
})(window, function(json2){

return {
	get: function(data, name){
		if(data[name]){
			return data[name];
		}

		name = name.split('.');

		var i = 0, len = name.length, tmp = data;

		for(; i < len; i++){
			tmp = tmp[name[i]];

			if(tmp == null) return null;
		}

		return tmp;
	},

	set: function(data, name, value){
		if(typeof value == 'undefined'){
			data = name;
		}else{
			name = name.split('.');

			var i = 0, len = name.length - 1, tmp = data;

			for(; i < len; i++){
				var tmpName = name[i];

				if(typeof tmp[tmpName] != 'object' || !tmp[tmpName]){
					tmp[tmpName] = {};
				}

				tmp = tmp[tmpName];
			}

			tmp[name[i]] = value;
		}
	},

	toJSONString: function(obj){
		return json2.stringify(obj);
	},

	jsonEncode: function(obj){
		return this.toJSONString(obj);
	},

	parseJSON: function(str){
		return json2.parse(str);
	},

	jsonDecode: function(str){
		return this.parseJSON(str);
	}
};

});