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
	window.jQuery.featherUi.DropList = factory(window.jQuery || window.$, window.jQuery.featherUi.Class);
}
})(window, function($, Class){

var DropList = Class.$factory('droplist', {
	initialize: function(opt){
		this.options = $.extend({
			items: {},
			list: null,
			dom: null,
			container: document.body,
			width: false,
			height: false,
			hover: true,
			defaultValue: null,
			selectedClassName: ''
		}, opt || {});

		this.init();
	},

	init: function(){
		var self = this, opts = self.options;

		self.value = '';

		self.wraper = $('<div class="ui2-droplist"><i class="ui2-droplist-arrow"></i></div>').appendTo(opts.container);
		self.select = $('<span class="ui2-droplist-select"></span>').appendTo(self.wraper);
		self.list = $('<ul class="ui2-droplist-list"></ul>').appendTo(self.wraper);

		self.dom = opts.dom ? $(opts.dom) : null;
		self.setList(opts.dom || opts.list || opts.items, opts.defaultValue);
		self.eid = $.now();
		self.isHide = true;

		self.initSize();
		self.initEvent();
	},

	initEvent: function(){
		var self = this, opts = self.options;

		if(self.options.hover){
			self.wraper.hover($.proxy(self.open, self), $.proxy(self.close, self));
		}else{
			self.select.click(function(){
				self.isHide ? self.open() : self.close();
			});
			self.wraper.click(function(e){
				e.stopPropagation();
			});

			$(document).on('click.' + self.eid, function(){
				!self.isHide && self.close();
			});
		}

		self.list.delegate('.ui2-droplist-item', 'click', function(){
			var $this = $(this);
			var key = $this.attr('data-droplist-key'), value = $this.attr('data-droplist-value');

			self.close();
			self.trigger('select', [key, value]);
			self.setValue(value, key);
		});
	},

	open: function(){
		var self = this;

		if(!self.wraper.hasClass('ui2-droplist-disabled')){
			self.wraper.addClass('ui2-droplist-open');
			self.resetWidth();
			self.isHide = false;
			self.trigger('open');
		}
	},

	close: function(){
		var self = this;

		if(!self.wraper.hasClass('ui2-droplist-disabled')){
			self.wraper.removeClass('ui2-droplist-open');
			self.isHide = true;
			self.trigger('close');
		}
	},

	setList: function(list, defaultValue, defaultKey){
		var self = this, $dom;

		if(list.nodeType || list instanceof $ || typeof list == 'string'){
			$dom = $(list);
			list = self.dom2list(list);
		}

		self.list.html(DropList.createListHtml(list));
		self.initSize();

		self.dom && (!$dom || $dom[0] !== self.dom[0]) && self.resetDom(list);

		if(defaultValue){
			self.setValue(defaultValue, defaultKey);
		}else{
			var $first = $('.ui2-droplist-item:first', self.list);
			self.setValue($first.attr('data-droplist-value'), $first.attr('data-droplist-key'));
		}
	},

	resetDom: function(list){
		this.dom.html(DropList.createDomHtml(list));
	},

	resetWidth: function(){
		var self = this;

		self.list.css('width', 'auto');
		self.wraper.add(self.list).css('width', self.options.width || self.list.width());
	},

	initSize: function(){
		var self = this, height = self.options.height;

		self.resetWidth();

		if(!height) return;

		height = parseInt(height);
		self.wraper.find('.ui2-droplist-arrow').css('top', parseInt((height - DropList.ARROW_WIDTH)/2));
		self.wraper.css('height', height);
		self.wraper.find('.ui2-droplist-select, .ui2-droplist-group-label, .ui2-droplist-item-txt').css('line-height', height + 'px');
		self.list.css('top', height);
	},

	setValue: function(value, key){
		var self = this;

		var $dom = self.list.find('[data-droplist-value="' + value + '"]');

		if($dom.length){
			var cn = self.options.selectedClassName;

			if(cn){
				self.list.find('.ui2-droplist-item-txt').removeClass(cn);
				$dom.find('.ui2-droplist-item-txt').addClass(cn);
			}
			
			if(!key){
				key = $dom.attr('data-droplist-key');
			}	
		}

		self.select.html(key);
		self.value = value;
		self.dom && self.dom.val(value);
	},

	getValue: function(){
		return this.value;
	},

	dom2list: function(dom, ungroup){
		var obj = {}, self = this;

		if(!ungroup){
			$('> optgroup', dom).each(function(){
				obj[$(this).attr('label')] = self.dom2list(this, true);
			});
		}

		$('> option', dom).each(function(){
			obj[$(this).html()] = this.value;
		});

		return obj;
	},

	disable: function(){
		var self = this;

		self.wraper.addClass('ui2-droplist-disabled');
		self.dom && self.dom.attr('disabled', true);
	},

	enable: function(){
		var self = this;

		self.wraper.addClass('ui2-droplist-disabled');
		self.dom && self.dom.removeAttr('disabled');
	},

	destroy: function(){
		var self = this;

		self.wraper.remove();
		$(document).off('click.' + self.eid);
		self.dom && (self.dom = null);
	}
});

DropList.createListHtml = function(list){
	var html = [];

	$.each(list, function(key, item){
		if(typeof item == 'object' && item){
			html.push('\
				<li class="ui2-droplist-group">\
					<span href="javascript:;" class="ui2-droplist-group-label">' + key + '</span>\
					<ul>' + DropList.createListHtml(item) + '</ul>\
				</li>'
			);
		}else{
			html.push('<li class="ui2-droplist-item" data-droplist-key="' + key + '" data-droplist-value="' + item + '"><a href="javascript:;" class="ui2-droplist-item-txt">' + key + '</a></li>');
		}
	});

	return html.join('');
};

DropList.createDomHtml = function(list){
	var html = [];

	$.each(list, function(key, item){
		if(typeof item == 'object' && item){
			html.push('<optgroup label="' + key + '">' + DropList.createDomHtml(item) + '</optgroup>');
		}else{
			html.push('<option value="' + item + '">' + key + '</option>');
		}
	});

	return html.join('');
};

DropList.ARROW_WIDTH = 5;

return DropList;

});