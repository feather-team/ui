;(function(window, factory){
if(typeof define == 'function'){
    //seajs or requirejs environment
    define(function(require, exports, module){
        return factory(
            require('../jquery/jquery.js'),
            require('../class/class.js'),
            require('../mask/mask.js')
        );
    });
}else{
    window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.LightBox = factory(window.jQuery || window.$, window.jQuery.featherUi.Class, window.jQuery.featherUi.Mask);
}
})(window, function($, Class, Mask){
var doc = document, Math = window.Math;

var Lightbox = Class.$factory('lightbox', {
	initialize: function(opt){
		this.options = $.extend({
			dom: null,
			selecter: '> img',
			srcAttr: 'data-lightbox-url'
		}, opt || {});

		this.init();
	},

	init: function(){
		var self = this;

		self.doms = $(this.options.selecter, this.options.dom);
		self.mask = new Mask({autoOpen: false});
		self.index = 0;
		self.container = $([
			'<div class="ui2-lightbox-container">',
				'<div class="ui2-lightbox-content">',
					'<a href="javascript:void(0);" class="ui2-lightbox-prev"></a>',
					'<a href="javascript:void(0);" class="ui2-lightbox-next"></a>',
				'</div>',
				'<div class="ui2-lightbox-bottom">',
					'<a href="javascript:void(0);" class="ui2-lightbox-close">&times;</a>',
					'<span class="ui2-lightbox-alt"></span>',
				'</div>',
			'</div>'
		].join('')).appendTo(doc.body);
		self.content = self.container.find('.ui2-lightbox-content');
		self.bottom = self.container.find('.ui2-lightbox-bottom');
		self.prev = self.container.find('.ui2-lightbox-prev');
		self.next = self.container.find('.ui2-lightbox-next');

		self.items = $.map(self.doms, function(item, k){
			return {
				alt: item.alt,
				src: $(item).attr(self.options.srcAttr)
			};
		});

		self.initEvent();
	},

	initEvent: function(){
		var self = this; 

		self.doms.each(function(index){
			self.o2s(this, 'click', function(){
				self.open($(this).index());
				return false;
			});
		});

		self.o2s(window, 'resize', function(){
			self.resetPosition();
		});

		self.bottom.find('.ui2-lightbox-close').click(function(){
			self.close();
		});

		self.prev.click(function(){
			self.open(--self.index);
		});

		self.next.click(function(){
			self.open(++self.index);
		});
	},

	refresh: function(){
		this.destroy();
		this.init();
	},

	resetPosition: function(){
		this.container.css('left', parseInt(($(window).width() - this.container.outerWidth())/2));
	},

	load: function(index){
		var self = this, $item = self.getItem(index), item = self.items[index];

		self.content.find('img').hide();
		self.bottom.hide().find('.ui2-lightbox-alt').html(item.alt);
		self.prev.hide();
		self.next.hide();

		if(!$item.length){
			var $img = $('<img />').attr({
				src: item.src + '?lightbox-random=' + Math.random(),
				alt: item.alt,
				'data-lightbox-index': index
			}).hide().bind('load error', function(){
				self.loadComplete($(this));
			}).appendTo(self.content);
		}else{
			self.loadComplete($item);
		}
	},

	loadComplete: function($item){
		var self = this, $content = self.content.css('opacity', 0);
		var width = $item.width(), height = $item.height(), _width = self.container.width(), _height = $content.height();
		var abs = Math.abs, max = Math.max, time = Lightbox.DEFAULT_TIME;

		$item.show();

		self.container.animate({
			width: width,
			left: '-=' + (width - _width)/2
		}, time * abs(width - _width)/max(width, _width), function(){
			self.resetPosition();
			$content
				.animate({height: height}, time2 = time * abs(height - _height)/max(height, _height))
				.animate({opacity: 1}, time, function(){
					self.index && self.prev.show();
					(self.index < self.items.length - 1) && self.next.show();
					self.bottom.slideDown();
				});
		});
	},

	getItem: function(index){
		return this.content.find('[data-lightbox-index=' + index + ']');
	},

	open: function(index){
		var self = this;

		if(!self.items.length) return;

		self.mask.open();
		self.container.show();
		self.resetPosition();
		self.load(self.index = index == null ? self.index : index);
	},

	close: function(){
		this.mask.close();
		this.container.hide();
	},

	destroy: function(){
		var self = this;

		self.mask.destroy();
		self.mask = null;
		self.container.remove();
		self.container = null;
		self.items.length = 0;
		self.ofs(self.doms, 'click');
		self.ofs(window, 'resize');
	}
});


Lightbox.DEFAULT_TIME = 1000;

return Lightbox;

});