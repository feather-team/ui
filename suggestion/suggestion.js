;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory(
			require('../jquery/jquery.js'),
			require('../class/class.js'),
			require('../util/util.js')
		);
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.Suggestion = factory(
		window.jQuery || window.$, 
		window.jQuery.featherUi.Class,
		window.jQuery.featherUi.Util
	);
}
})(window, function($, Class, Util){
var Suggestion = Class.$factory('suggestion', {
	initialize: function(opts){
		this.options = $.extend({
			dom: null,
			width: false,
			max: 10,
			caching: true,
			url: null,
			data: null,
			delay: 300,
			empty2close: true,
			emptyNoCache: false,
			kw: 'kw',
			requestParams: {},
			dataField: '',
			matchKwField: '',
			match: null,
			format: null
		}, opts || {});

		this.init();
	},

	init: function(){
		var self = this, opts = self.options;

		self.dom = $(opts.dom).attr('autocomplete', 'off');
		self.parent = self.dom.parent();

		!/fixed|absolute/.test(self.parent.css('position')) && self.parent.css('position', 'relative');

		self.suggest = $('<ul class="ui2-suggestion"><li class="ui2-suggestion-header"></li><li class="ui2-suggestion-footer"></li></ul>').appendTo(self.parent);
		self.xhr = null;
		self.tid = null;
		self.index = null;

		self.setData(opts.data);
		self.initEvent();
	},

	initEvent: function(){
		var self = this, opts = self.options, over = false;

		self.dom.on('keyup paste cut', function(e){
			if(e.keyCode == 13){
				var $current = self.suggest.find('.ui2-suggestion-active');

				if($current.length){
					self.setKw($current.attr('data-suggestion-kw'), $current, true);
				}

				return self.close();
			}else{
				!Suggestion.isUDEvent(e) && self.match();
			}
		}).focus(function(){
			self.match();
		}).keydown(function(e){
			Suggestion.isUDEvent(e) && self.switchKw(e);
		}).blur(function(e){
			if(!over){
				self.close();
				self.trigger('cancel');
			}
		});

		self.suggest.delegate('.ui2-suggestion-item', 'click', function(){
			self.setKw($(this).attr('data-suggestion-kw'), $(this).attr('data-suggestion-index'), true);
			self.close();
		}).hover(function(){
			over = true;
		}, function(){
			over = false;
		});

		self.suggest.find('.ui2-suggestion-header, .ui2-suggestion-footer').click(function(){
			self.dom.focus();
		});
	},

	setKw: function(value, index, execCallback){
		var self = this;

		self.dom.val(value);
		execCallback && self.trigger('select', [value, self.finalData[index]]);
	},

	switchKw: function(e){
		var self = this;

		if(!self.items) return;

		var code = e.keyCode, max = self.items.length - 1, index = self.index == null ? -1 : self.index;

		if(code == 38){
			index--;
		}else{
			index++;
		}

		if(index < 0){
			index = max;
		}else if(index > max){
			index = 0;
		}

		self.index = index;
		
		self.items.removeClass('ui2-suggestion-active');

		var $item = self.items.eq(index).addClass('ui2-suggestion-active');
		var kw = $item.attr('data-suggestion-kw');

		self.setKw(kw);
		self.trigger('switch', [kw]);
		
		e.preventDefault();
	},

	setData: function(data){
		this.data = data;
	},

	setHeader: function(header){
		var $header = this.suggest.find('.ui2-suggestion-header');

		if(!header){
			$header.hide();
		}else{
			$header.html(header).show();
		}
	},

	setFooter: function(footer){
		var $footer = this.suggest.find('.ui2-suggestion-footer');

		if(!footer){
			$footer.hide();
		}else{
			$footer.html(footer).show();
		}
	},

	setRequestParams: function(params){
		this.options.requestParams = params;
	},

	match: function(){
		var self = this, opts = self.options;

		self.cancelMatch();

		//request remote data
		self.tid = setTimeout(function(){
			var kw = self.dom.val();

			if(!$.trim(kw) && opts.empty2close){
				self.close();
				return;
			}

			var data = self.data, cache = opts.caching && !(!$.trim(kw) && opts.emptyNoCache) ? Suggestion.cache[kw] : false;
			
			if(data && (data = self._match.call(self, data, kw)).length){
				//if kw can be find in local data
				self.build(data, kw);
			}else if(cache){
				//if kw in cache
				self.build(cache, kw);
			}else if(opts.url){
				var params = $.extend({}, opts.requestParams);
				params[opts.kw] = kw;

				self.xhr = $.getJSON(opts.url, params, function(data){
					if(opts.dataField){
						data = Util.object.get(data, opts.dataField) || [];
					}
					
					data = Suggestion.cache[kw] = self._match.call(self, data, kw);
					self.build(data, kw);
				});
			}
		}, opts.delay);	
	},

	cancelMatch: function(){
		var self = this;

		self.xhr && self.xhr.abort();
		self.tid && clearTimeout(self.tid);
	},

	_match: function(data, kw){
		var self = this, opts = self.options;

		if(opts.match){
			data = opts.match.call(self, data, kw);
		}

		return data.slice(0, opts.max);
	},

	build: function(data, kw){
		var self = this, opts = self.options;

		self.index = null;
		self.suggest.find('.ui2-suggestion-item').remove();
		self.finalData = data;
		
		if(!data.length){
			self.items = null;
			self.close();
		}else{
			var html = '';

			$.each(data, function(key, item){
				var txt = typeof item == 'string' ? item : item[opts.matchKwField];
				html += '<li class="ui2-suggestion-item" data-suggestion-index="' + key + '" data-suggestion-kw="' + txt + '">' + String(self.format(item, kw)) + '</li>';
			});

			self.items = $(html);
			self.suggest.find('.ui2-suggestion-header').after(self.items);
			self.open();
			self.trigger('build');
		}
	},

	open: function(){
		var self = this;
		
		if(!self.items) return;

		var $dom = self.dom;
		var position = $dom.position();

		self.suggest.show().css({
			left: position.left,
			top: position.top + $dom.outerHeight(),
			width: self.options.width || ($dom.outerWidth() - 2)
		});
	},

	close: function(){
		var self = this;

		self.suggest.hide();
	},

	format: function(item, kw){
		var self = this, opts = self.options;

		if(opts.format){
			return opts.format.call(self, item, kw);
		}

		return typeof item == 'string' ? item : item[opts.matchKwField];
	}
});

Suggestion.cache = {};

Suggestion.isUDEvent = function(e){
	return e.keyCode == 38 || e.keyCode == 40;
};

return Suggestion;

});