;(function(window, factory){
if(typeof define == 'function'){
    //seajs or requirejs environment
    define(function(require, exports, module){
        return factory(
            require('../jquery/jquery.js')
        );
    });
}else{
    window.jQuery.featherUi = window.jQuery.featherUi || {};
    window.jQuery.featherUi.Cookie = factory(window.jQuery || window.$);
}
})(window, function($){

var pluses = /\+/g;

function read(s) {
	if (s.indexOf('"') === 0) {
		// This is a quoted cookie as according to RFC2068, unescape...
		s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}

	try {
		// Replace server-side written pluses with spaces.
		// If we can't decode the cookie, ignore it, it's unusable.
		// If we can't parse the cookie, ignore it, it's unusable.
		return decodeURIComponent(s.replace(pluses, ' '));
	} catch(e) {}
}

return {
	config: {},

	set: function(key, value, options){
		options = $.extend({}, this.config, options);

		if (typeof options.expires === 'number') {
			var days = options.expires, t = options.expires = new Date();
			t.setTime(+t + days * 864e+5);
		}

		return (document.cookie = [
			encodeURIComponent(key), '=', encodeURIComponent(value),
			options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
			options.path    ? '; path=' + options.path : '',
			options.domain  ? '; domain=' + options.domain : '',
			options.secure  ? '; secure' : ''
		].join(''));
	},

	get: function(key, _default){
		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decodeURIComponent(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result || _default;
	},

	remove: function(key, options){
		this.set(key, '', $.extend({}, options, { expires: -1 }));
	}
};

});