;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory(
			require('../jquery/jquery.js'),
			require('../class/class.js'),
			require('../dialog/dialog.js')
		);
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.Tips = factory(window.jQuery || window.$, window.jQuery.featherUi.Class, window.jQuery.featherUi.Dialog);
}
})(window, function($, Class, Dialog){
var Tips = Class.extend('Event', {
	initialize: function(opt){
		this.options = $.extend({
			content: '',
			timeout: 3000,
			mask: false
		}, opt || {});

		this.init();
	},

	init: function(){
		var self = this, opt = self.options;

		Tips.destroy(); Tips.instance = self;

		self.$ = new Dialog({
			autoOpen: true,
			mask: opt.mask,
			title: false,
			width: false,
			content: opt.content
		});

		self.$.wraper.addClass('ui2-tips');

		if(typeof opt.timeout == 'number'){
			self.id = setTimeout(function(){
				self.destroy();
			}, opt.timeout);
		}
	},

	destroy: function(){
		this.$.destroy();
		this.$ = null;
		clearTimeout(this.id);
		Tips.instance = null;
	}
});

Tips.instance = null;

Tips.destroy = function(){
	if(Tips.instance){
		Tips.instance.destroy();
	}
};

Tips.show = function(content, timeout, mask, classname){
	var tips = new Tips({
		content: content,
		timeout: timeout,
		mask: mask
	});

	if(classname) tips.$.wraper.find('.ui2-dialog-content').addClass(classname);

	return tips;
};

$.each(['success', 'error', 'warn', 'loading'], function(index, item){
	Tips[item] = function(content, timeout, mask){
		return Tips.show(content, timeout, mask, 'ui2-tips-' + item);
	};
});

return Tips;

});