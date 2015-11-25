;(function(window, factory){
if(typeof define == 'function'){
	//seajs or requirejs environment
	define(function(require, exports, module){
		return factory(
			require('../jquery/jquery.js'),
			require('../class/class.js'),
			require('../util/util.js'),
			require('../droplist/droplist.js')
		);
	});
}else{
	window.jQuery.featherUi = window.jQuery.featherUi || {};
	window.jQuery.featherUi.Calendar = factory(
		window.jQuery || window.$, 
		window.jQuery.featherUi.Class,
		window.jQuery.featherUi.Util,
		window.jQuery.featherUi.DropList
	);
}
})(window, function($, Class, Util, DropList){

var toPad = Util.string.toPad, doc = document;

var Calendar = Class.$factory('calendar', {
	initialize: function(options){
		this.options = $.extend({
			container: doc.body,
			target: null,
			dom: null,
			maxDate: null,
			minDate: null,
			yearRange: null,
			dateFormat: 'Y-m-d'
		}, options || {});

		this.init();
	},

	init: function(){
		var self = this, opt = self.options;

		self.target = opt.dom ? $(opt.dom) : $(opt.target);
		self.wraper = $('<div class="ui2-calendar"></div>');
		self.container = $(opt.container).append(self.wraper);

		self.initCalendar();

		if(self.container[0] == doc.body){
			self.wraper.css('position', 'absolute');
		}
		
		if(opt.minDate){
			self.minDate = typeof opt.minDate == 'string' ? opt.minDate : self.getDate(opt.minDate);
		}

		if(opt.maxDate){
			self.maxDate = typeof opt.maxDate == 'string' ? opt.maxDate : self.getDate(opt.maxDate);
		}

		self.toMonth();
		self.initEvent();
		self.close();
	},

	initCalendar: function(){
		var self = this;

		self.calendar = $('<table class="ui2-calendar-container" />').appendTo(self.wraper);

		var yearRange = self.options.yearRange, weekTpl = [];

		$.each(Calendar.WEEKNAME, function(index, name){
			weekTpl.push('<th>' + name + '</th>');
		});

		var $header = $([
			'<thead>', 
				'<tr class="ui2-calendar-title">',
					'<th colspan="7">',
						yearRange ? '' : '<a href="javascript:" class="ui2-calendar-next"></a>',
						yearRange ? '' : '<a href="javascript:" class="ui2-calendar-prev"></a>',
						'<div class="ui2-calendar-date"></div>',
					'</th>',
				'</tr>',
				'<tr>' + weekTpl.join('') + '</tr>',
			'</thead>'
		].join('')).appendTo(self.calendar);

		if(yearRange){
			yearRange = yearRange.split(':');

			var years = {}, months = {}, ym = Calendar.getYM();

			for(var start = Math.min(ym.year, yearRange[0]), end = Math.max(ym.year, yearRange[1]); start <= end; start++){
				years[start] = start;
			}

			for(var i = 1; i <= 12; i++){
				months[' ' + toPad(i, 0, 2, true)] = i;
			}

			var $year = $('<div class="ui2-calendar-year-range"></div>'), $month = $('<div class="ui2-calendar-month-range"></div>');
			$header.find('.ui2-calendar-date').append($year, $month);

			self.yearSelecter = new DropList({
				container: $year,
				height: 18,
				width: 58,
				list: years,
				defaultValue: ym.year
			});

			self.monthSelecter = new DropList({
				container: $month,
				height: 18,
				width: 42,
				list: months,
				defaultValue: ym.month
			});
		}

		self.on('select', self.close);
	},

	initEvent: function(){
		var self = this, opt = self.options;

		self.o2s(self.target, 'click', function(){
			self.open();
			self.resetPosition();
		});

		self.o2s(window, 'resize scroll', function(){
			self.resetPosition();
		});

		self.o2s(document, 'click', function(e){
			e.target != self.target[0] && self.close();
		});

		self.wraper.click(function(e){
			var $item = $(e.target);

			if($item.hasClass('ui2-calendar-item') && !$item.hasClass('ui2-calendar-item-disable')){
				var date = $item.attr('data-calendar-date');

				self.trigger('select', date);

				if(self.target){
					if('value' in self.target[0]){
						self.target.val(date);
					}else{
						self.target.html(date);
					}
				}
			}

			e.stopPropagation();
		});

		if(opt.yearRange){
			self.yearSelecter.on('select', function(v){
				self.toMonth(v);
			});

			self.monthSelecter.on('select', function(v){
				self.toMonth(self.year, v);
			});
		}else{
			self.wraper.delegate('.ui2-calendar-prev', 'click', function(e){
				self.prevMonth();
				e.stopPropagation();
			});

			self.wraper.delegate('.ui2-calendar-next', 'click', function(e){
				self.nextMonth();
				e.stopPropagation();
			});
		}
	},

	prevMonth: function(){
		this.toMonth(this.year, this.month - 1);
	},

	nextMonth: function(){
		this.toMonth(this.year, this.month + 1);
	},

	toMonth: function(year, month){
		var self = this, ym = Calendar.getYM(year, month);

		self.year = ym.year;
		self.month = ym.month;

		if(self.options.yearRange){
			self.yearSelecter.setValue(year);
			self.monthSelecter.setValue(month);
		}else{
			self.calendar.find('.ui2-calendar-date').text(self.year + '.' + toPad(self.month, 0, 2, true));
		}

		self.renderItems();
		self.trigger('switch', [self.year, self.month]);
		self.resetPosition();
	},

	renderItems: function(){
		var self = this, opt = self.options;
		var month = self.month - 1, year = self.year, startDate = new Date(year, month, 1), endDate = new Date(year, month + 1, 0);
		var today = self.getDate(new Date), 
			start = startDate.getDay(), 
			max = endDate.getDate(), 
			line = Math.ceil((start + max)/7),
			html = [], index = 1;

		for(var i = 0; i < line; i++){
			var x = [];

			for(var j = 0; j < 7; j++){
				if(j < start && i == 0 || index > max){
					x.push('<td>&nbsp;</td>');
				}else if(index <= max){
					var d = self.getDate(new Date(year, month, index)), cn = 'ui2-calendar-item';

					if(today == d){
						cn += ' ui2-calendar-item-today';
					}

					if(self.minDate && d < self.minDate || self.maxDate && d > self.maxDate){
						cn += ' ui2-calendar-item-disable';
					}

					x.push('<td><a href="javascript:" data-calendar-date="' + d + '" class="' + cn + '" title="' + d + '">' + index++ + '</a></td>');
				}
			}

			html.push('<tr>' + x.join('') + '</tr>');
		}

		self.calendar.find('tbody').remove();
		self.calendar.append('<tbody>' + html.join('') + '</tbody>');
	},

	open: function(){
		this.wraper.show();
		this.resetPosition();
		this.trigger('open');
	},

	close: function(){
		this.wraper.hide();
		this.trigger('close');
	},

	resetPosition: function(){
		if(!this.target.length) return;

		var self = this, offset = self.target.offset(), scrollTop = doc.body.scrollTop || doc.documentElement.scrollTop, top;

		if(scrollTop + $(window).height() < offset.top + self.wraper.outerHeight()){
			top = offset.top - self.wraper.outerHeight() - 1;
		}else{
			top = offset.top + self.target.outerHeight() + 1;
		}

		self.wraper.css({
			left: offset.left,
			top: top
		});
	},

	getDate: function(date){
		return Util.date.date(this.options.dateFormat, date.getTime());
	}
});

Calendar.WEEKNAME = ['日', '一', '二', '三', '四', '五', '六'];
Calendar.getYM = function(year, month){
	var date = new Date;
	year && date.setFullYear(year);

	if(month != null){
		date.setMonth(month - 1);
		date.setDate(1);
	}

	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1
	}
};

return Calendar;

});