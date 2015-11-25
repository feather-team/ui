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
	window.jQuery.featherUi.Tooltip = factory(
		window.jQuery || window.$, 
		window.jQuery.featherUi.Class
	);
}
})(window, function($, Class){
var proxy = $.proxy, doc = document;

var Tooltip = Class.$factory('tooltip', {
	initialize: function(opt){
		this.options = $.extend({
			dom : null,
			content: null,
			contentAttr: 'data-tooltip',
			hover: true,
			theme: 'orange',
			pos: '',
			offset: 0, 
			className : ''
		}, opt || {});

		this.init();
	},

	init: function(){
		var self = this;

		self.dom = $(this.options.dom);
		self.tip = null;
		self.isHide = true;

		self.createTip();
		self.initEvent();
	},

	initEvent: function(){
		var self = this;

		if(self.options.hover){
			self.o2s(self.dom, 'mouseenter', proxy(self.show, self));
			self.o2s(self.dom, 'mouseleave', proxy(self.hide, self));
		}

		self.o2s(window, 'resize', proxy(self.hide, self));
	},

	createTip: function(){
		var self = this, opts = self.options, $dom = self.dom, content = opts.content;

		self.tip = $('<div class="ui2-tooltip-wrap"><div class="ui2-tooltip-content"></div><i class="ui2-tooltip-arrow"></i></div>').addClass('ui2-tooltip-theme-' + opts.theme);
		
		opts.className && self.tip.addClass(opts.className);

		if(content == null){
			var attr = opts.contentAttr || 'title';

			content = $dom.attr(attr) || '';
			attr == 'title' && $dom.removeAttr('title');
		}

		self.setContent(content);	
	},

	setContent: function(content){
		var self = this;

		self.tip.find('.ui2-tooltip-content').html(content);
		self.setPos();
	},

	show: function(){
		var self = this;

		self.isHide = false;
		self.tip.appendTo(doc.body);
		self.setPos();
		self.tip.show();
	},

	hide: function(){
		var self = this;

		self.isHide = true;
		self.tip.hide().remove();
	},

	toggle: function(){
		var self = this;

		self.isHide ? self.show() : self.hide();
	},

	setPos: function(pos){
		var self = this;
		var pos = (pos || self.options.pos).split(/\s+|-/), pos1 = pos[0], pos2 = pos[1], result, className;
		
		if(!pos2 || pos1 && pos2 == 'center'){
			/*
			left -> left center
			top -> top center
			left center -> left center
			center-center -> top center
			*/
			result = self.getPos(className = Tooltip.getPosName(pos1), true);
		}else if(pos1 == 'center'){
			/*
			center right -> right center
			center -> top center
			*/
			result = self.getPos(className = Tooltip.getPosName(pos2), true);
		}else{
			pos1 = Tooltip.getPosName(pos1);
			pos2 = Tooltip.getPosName(pos2);
			className = pos1 + '-' + pos2;

			result = $.extend(self.getPos(pos1), self.getPos(pos2));
		}

		self.tip.css(result).addClass('ui2-tooltip-' + className);
	},

	getPos: function(pos, center){
		var self = this, opts = self.options, offset = opts.offset, result = {}, $tip = self.tip, $dom = self.dom;
		var dOffset = $dom.offset(), 
			dTop = dOffset.top, 
			dLeft = dOffset.left, 
			dWidth = $dom.outerWidth(), 
			dHeight = $dom.outerHeight(),
			tWidth = $tip.outerWidth(), 
			tHeight = $tip.outerHeight();

		switch(pos){
			case 'left':
				result.left = dLeft - tWidth - offset + (center ? -Tooltip.ARROW_WIDTH : Tooltip.NOT_CENTER_OFFSET);
				break;

			case 'right':
				result.left = dLeft + dWidth + offset +  (center ? Tooltip.ARROW_WIDTH : -Tooltip.NOT_CENTER_OFFSET);
				break;

			case 'bottom': 
				result.top = dTop + dHeight + offset + Tooltip.ARROW_WIDTH;
				break;

			default: 
				result.top = dTop - tHeight - offset - Tooltip.ARROW_WIDTH;
		};

		if(center){
			if(pos == 'left' || pos == 'right'){
				result.top = dTop + dHeight/2 - tHeight/2;
			}else{
				result.left = dLeft + dWidth/2 - tWidth/2;
			}
		}

		return result;
	},

	destroy: function(){
		var self = this;

		self.ofs(self.dom, 'mouseleave mouseenter');
		self.ofs(window, 'resize');
		self.tip.remove();
		self.tip = null;
	}
});


Tooltip.ARROW_WIDTH = 7;
Tooltip.NOT_CENTER_OFFSET = 25 + Tooltip.ARROW_WIDTH;

Tooltip.getPosName = function(pos){
	return /^(?:left|bottom|right)$/.test(pos) ? pos : 'top';
};

return Tooltip;

});