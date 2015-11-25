;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory();
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
    window.jQuery.featherUi.Template = factory();
}
})(window, function(){

return {
	REG: /(')|([\r\n]+)|<%(=?)([\s\S]*?)%>/g,

	fetch: function(id, data){
		var elem = document.getElementById(id);
		return this.parse(elem.value || elem.innerHTML, data);
	},

	parse: function(content, data){
		try{
			var tmp = this.parseSyntax(content);
			return (new Function('__d__', '__r__', tmp))(data, []);
		}catch(e){
			console && console.log(content, tmp);
			throw new Error(e.message);
		}
	},

	parseSyntax: function(content){
		return "with(__d__){__r__.push('" 
                + 
                content.replace(this.REG, function(_0, _1, _2, _3, _4){
                    return _1 ? "\\'" : _2 ? "" : _3 ? "'," + _4 + ",'" : "'); \r\n" + _4 + "; \r\n__r__.push('";
                }) 
                + 
                "');}return __r__.join('');";
	}
};

});