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
	window.jQuery.featherUi.Dialog = factory(window.jQuery || window.$, window.jQuery.featherUi.Class, window.jQuery.featherUi.Mask);
}
})(window, function($, Class, Mask){
var doc = document;

return Class.$factory('dialog', {
	initialize: function(opt){
		this.options = $.extend({
			title: '',
			container: doc.body,
			dom: null,
			width: 400,
			height: false,
			content: '',
			url: '',
			esc: false,	//ESC是否开启，ESC按下自动关闭
			mask: true,					//蒙版
			autoOpen: false,
			buttons: {},
			handle: null,				//指定打开和关闭dialog的元素
			className: '',
			customWraper: false
		}, opt || {});

		this.init();
	},

	init: function(){
		var self = this;

		self.firstOpenStatus = false;
		self.dom = null;

		var container = self.container = $(self.options.container);

		if(container[0] != doc.body){
			!/fixed|absolute/.test(container.css('position')) && container.css('position', 'relative');
		}

		self.create();
		self.options.autoOpen && setTimeout(function(){
			self.open();
		}, 0);
	},

	create: function(){
		var self = this;

		self.createMask();
		self.createWraper();
		self.initEvent();
	},

	initEvent: function(){
		var self = this, options = self.options;

		self.o2s(window, 'resize', function(){
			self.resetPosition();
		});

		if(options.handle){
			self.o2s(options.handle, 'click', function(){
				self.open();
			});
		}

		self.wraper.find('.ui2-dialog-close').click(function(){
			self.close();
		});

		if(self.options.esc){
			self.o2s(doc, 'keyup', function(e){
				//esc关闭
				if(e.keyCode == 27){
					self.close();
				}
			})
		}
	},

	//创建遮罩
	createMask: function(){
		if(!this.options.mask) return;

		this.mask = new Mask({autoOpen: false, container: this.container});
	},

	//创建内容部分
	//包括创建内容　按钮
	createWraper: function(){
		var self = this, options = self.options, $wraper;

		if(options.customWraper && options.dom){
			self.wraper = $(options.dom).addClass('ui2-dialog-wraper-custom ui2-dialog-wraper');
			self.content = self.wraper.find('.ui2-dialog-content');
		}else{
			$wraper = self.wraper = $('<div class="ui2-dialog-wraper ui2-dialog-wraper-uncustom">');
			$wraper.html([
				'<strong class="ui2-dialog-header">',
		    		'<a href="javascript:void(0);" class="ui2-dialog-close">&times;</a>',
		    		'<span class="ui2-dialog-title"></span>',
		    	'</strong>'
		    ].join(''));

			self.setTitle(options.title);

			$wraper.css('width', options.width);

			self.content = $('<div class="ui2-dialog-content"></div>').css({
				height: options.height
			}).appendTo($wraper);

			self.initContent();
		}

		self.wraper.appendTo(options.container).addClass(options.className);
		self.createButtons();
	},

	initContent: function(){
		var self = this, options = self.options;

		if(options.content){
			self.setContent(options.content);
		}else if(options.dom){
			self.setDom(options.dom);
		}else if(options.url){
			self.load(options.url);
		}
	},

	setContent: function(content){
		var self = this;

		self.releaseDom();
		self.content.html(content);
		self.resetPosition();
	},

	setDom: function(dom){
		var self = this;

		self.releaseDom();
		self.dom = $(dom).show();
		self.content.empty().append(self.dom);
		self.resetPosition();
	},

	load: function(url){
		var self = this;

		self.content.load(url, function(){
			self.trigger('contentLoaded');
			self.resetPosition();
		});
	},

	//释放dom
	releaseDom: function(dom){
		var self = this;

		if(!dom && !(dom = self.dom)){
			return ;
		}

		self.container.append(dom);

		if(self.options.customWraper){
			dom.removeClass('ui2-dialog-wraper-custom ui2-dialog-wraper').removeClass(self.options.className);
		}

		if(self.dom){
			self.dom = null;
		}
	},

	createButtons: function(){
		var self = this;

		if($.isEmptyObject(self.options.buttons)) return;

		self.buttons = $('<div class="ui2-dialog-buttons">').appendTo(self.wraper);
		self.setButtons(self.options.buttons);
	},

	/**
	 *设置buttons组
     *buttons:
     	{
			'确定': function(){
 				alert('点击了确定');
 			},
 
 			'取消': {
 				//设置className
 			className: 'cancel',
			events: {
 					click: function(){
 						alert('点击了取消按钮');
 					},
 
 					mouseover: function(){
 						alert('鼠标划过按钮');
 					}
 				}
 			}
     	}
	 */
	setButtons: function(buttons){
		var self = this;

		self.buttons.empty();
		
		$.each(buttons, function(index, item){
			if($.isFunction(item)){
				item = {
					events: {
						click: item
					},

					className: ''
				};	
			}

			var $button = $('<a href="javascript:void(0);" class="ui2-dialog-button" data-dialog-button-name="' + index + '" />').text(index).addClass(item.className).appendTo(self.buttons);

			$.each(item.events, function(event, callback){
				$button.on(event, function(){
					callback.call(self, $button);
				});
			});
		});
	},

	getButton: function(name){
		var $buttons = this.buttons.find('.ui2-dialog-button');

		return typeof name == 'number' ? $buttons.eq(name) : $buttons.filter('[data-dialog-button-name="' + name + '"]');
	},

	//设置title，为false时，则头部会被隐藏掉
	setTitle: function(title){
		var $header = this.wraper.find('.ui2-dialog-header');
		$header.removeClass('ui2-dialog-header-nob');

		if(title === false){
			$header.hide();
		}else if(title == ''){
			$header.addClass('ui2-dialog-header-nob').css('display', 'block');
		}

		$header.find('.ui2-dialog-title').html(title);
	},

	resetPosition: function(){
		var self = this;

		self.mask && self.mask.resetPosition();

		var container = self.container[0], position;

		if(container === doc.body){
			position = 'fixed';
			container = window;
		}else{
			position = 'absolute';
		}

		self.wraper.css({
			left: parseInt(($(container).outerWidth() - self.wraper.outerWidth())/2),
			top: parseInt(($(container).outerHeight() - self.wraper.outerHeight())/2),
			position: position
		});
	},

	open: function(){
		var self = this, options = self.options;

		self.mask && self.mask.open();
		self.wraper.show();
		self.resetPosition();

		if(!self.firstOpenStatus){
			self.firstOpenStatus = true;
			self.trigger('firstOpen');
		}

		self.trigger('open');
	},

	close: function(){
		var self = this, options = self.options;

		self.mask && self.mask.close();
		self.wraper.hide();
		self.trigger('close');
	},

	destroy: function(){
		var self = this, options = self.options;

		self.mask && self.mask.destroy();
		self.mask = null;
		
		if(!options.customWraper){
			self.wraper.remove();
			self.releaseDom();
		}else{
			self.releaseDom(self.wraper);
		}

		self.wraper = null;
		self.ofs(window, 'resize');
		options.handle && self.ofs(options.handle, 'click');
		self.ofs(doc, 'keyup');
		
	}
});
});