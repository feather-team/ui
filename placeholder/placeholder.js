;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory(
			require('../jquery/jquery.js'),
			require('../class/class.js')
		);
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.PlaceHolder = factory(
		window.jQuery || window.$, 
		window.jQuery.featherUi.Class
	);
}
})(window, function($, Class){
var PlaceHolder = Class.$factory('placeholder', {
	initialize: function(opt){
		var self = this;

		self.options = $.extend({
			dom: null,
			text: ''
		}, opt || {});

		self.placeholder = null;
		self.initEvent();
		self.setPlaceHolder();
	},

	initEvent: function(){
		var self = this, $dom = self.dom = $(self.options.dom);
		
		if(!PlaceHolder.isSupport){
			$dom.blur($.proxy(self.empty2show, self)).focus(function(){
				self.placeholder.hide();
			});
		}
	},

	setPlaceHolder: function(text){
		var self = this, $dom = self.dom = $(self.options.dom);
		text = text || self.options.text || $dom.attr('placeholder') || $dom.attr('data-placeholder');

		$dom.attr('placeholder', text);

		if(!PlaceHolder.isSupport){
			if(!self.placeholder){
				

				if(!/fixed|absolute/.test($dom.parent().css('position'))){
					$dom.parent().css('position', 'relative');
				}

				self.placeholder = $('<span>').css({
					width: $dom.innerWidth(),
					height: $dom.innerHeight(),
					lineHeight: $dom.innerHeight() + 'px'
				}).insertAfter($dom).addClass('ui2-placeholder').click(function(){
					$(this).hide();
					$dom.focus();
				});
			}

			self.placeholder.css({
				top: $dom.position().top + parseInt($dom.css('border-top-width')),
				left: $dom.position().left + parseInt($dom.css('border-left-width'))
			}).html(text);
		}
	},

	empty2show: function(){
		var self = this;
		self.placeholder && self.dom.val() == '' && self.placeholder.show();
	}
});

PlaceHolder.isSupport = 'placeholder' in document.createElement('input');

return PlaceHolder;
});