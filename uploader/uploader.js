/**
<input type="file" id="upload" />
<script>
require.async('upload', function(Upload){
    new Upload({
        dom: '#upload',
        uploader: '/test/1.json',
        width: 100,
        height: 100,
        buttonText: '编辑头像',
        swf: '/js/web/common/mod/upload/upload.swf',
        fileTypeExts: '*.jpg;*.jpeg;*.png;*.JPG;*.JPEG;*.PNG',
        onUploadSuccess: function(){
            console.log(arguments);
        }
    });
});
</script>
*/

//自动获取swf的地址
(function(){
var doc = document, currentScript;

//获取upoader.js的url
if(doc.currentScript){
	currentScript = doc.currentScript.src;
}else{
	var scripts = doc.getElementsByTagName("script");

	for(var i = scripts.length - 1; i >= 0; i--){
		var script = scripts[i];

		if(script.readyState === "interactive"){
			currentScript = script.src;
			break;
		}
	}
}

//如果未使用编译工具，则直接返回
function __uri(url){
	return url;
}

var prefix = currentScript.replace(/[^\/]+$/, '');
var swfUrl = __uri("./uploader.swf", true, false).split('/').pop();

window.__featherUiUploaderSwfUrl__ = prefix + swfUrl;
})();

;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory(
			require('../jquery/jquery.js'),
			require('../class/class.js'),
			require('../cookie/cookie.js'),
			require('./lib/uploadify.js')
		);
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.Uploader = factory(
		window.jQuery || window.$, 
		window.jQuery.featherUi.Class,
		window.jQuery.featherUi.Cookie
	);
}
})(window, function($, Class, Cookie){
var DATANAME = Class.NAMESPACE + '.uploader';

var prototype = {
	initialize: function(opt){
		var self = this;

		self.dom = $(opt.dom);
		self.options = $.extend({
			swf: window.__featherUiUploaderSwfUrl__,
			debug: false,
			width: self.dom.width(),
			height: self.dom.height(),
			buttonText: '上传',
			fixedCookie: false
		}, opt || {});

		self.init();
	},

	init: function(){
		var self = this, options = self.options;

		if(options.fixedCookie){
			options.formData = $.extend(options.formData || {}, Cookie.get() || {});
		}

		if(!options.queueID){
			options.overrideEvents = ['onUploadProgress', 'onUploadComplete', 'onUploadSuccess', 'onUploadStart', 'onUploadError', 'onSelect'];
		}

		$.each('cancel clearQueue destroy dialogOpen dialogClose select selectError queueComplete uploadComplete uploadError uploadProgress uploadStart uploadSuccess'.split(' '), function(key, event){
			var fullName = 'on' + event.replace(/^\w/, function(first){
				return first.toUpperCase();
			});
			
			options[fullName] && self.on(event, options[fullName]);

			options[fullName] = function(){
				self.trigger(event, arguments);
			};
		});

		if(!self.dom.attr('id')){
			self.dom.attr('id', 'ui2-uploader-' + $.now);
		}

		self.dom.uploadify(options);
		//hack uploadify plugin
		//uploadify会重新创建一个同名的dom，所以再次通过jquery获取upload对象时，会为空，所以，直接将值同样赋值给新创建的元素的data中
		var id = options.id ? options.id : self.dom.attr('id');
		self.uploader = $('#' + id).data(DATANAME, self);
	}
};

$.each('cancel destroy disable settings stop upload'.split(' '), function(key, method){
	prototype[method] = function(){
		var self = this, args = Array.prototype.slice.call(arguments);
		args.unshift(method);

		self.dom.uploadify.apply(self.dom, args);
		self.dom.removeData(DATANAME);
		/ui2-uploader-\d+/.test(self.dom.attr('id')) && self.dom.removeAttr('id');
		self.uploader.removeData(DATANAME);
		self.dom = null;
		self.uploader = null;
	};
});

return Class.$factory('uploader', prototype);
});