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
	window.jQuery.featherUi.FormValid = factory(window.jQuery || window.$, window.jQuery.featherUi.Class);
}
})(window, function($, Class){
var FormValid = Class.$factory('formValid', {
	initialize: function(opt){
		this.options = $.extend({
			dom: null,
			rules: {},
			showSuccessStatus: false,
			showErrorStatus: true,
			errorStop: false,
			skipHidden: false
		}, opt || {});

		this.init();
	},

	init: function(){
		this.dom = $(this.options.dom);
		this.rules = {};
		this.setRules();
		this.reset();
	},

	setRules: function(rules){
		var self = this,
			dRules = FormValid.DEFAULT_RULES, prefix = FormValid.ATTRIBUTE_PREFIX,
			aLen = FormValid.ATTIBUTE_LENGTH, aRule = FormValid.ATTRIBUTE_RULE;

		if(rules){
			self.options.rules = rules;
		}

		self.removeRule();
		self.getElement().each(function(){
			var name = this.name;

			if(!name) return;

			var $element = $(this);

			$.each(dRules, function(key, value){
				var attr = prefix + key;

				if($element.attr(attr) !== undefined){
					var rule = {
						errorText: $element.attr(attr + '-error') || value.errorText,
						successText: $element.attr(attr + '-success') || value.successText,
						standard: $element.attr(attr)
					};

					rule[key] = $element.attr(attr);
					self.addRule(name, rule);
				}
			});
		});

		self.addRule(self.options.rules);
	},

	check: function(name){
		var self = this, status = true, rules = self.rules, errorStop = self.options.errorStop, skipHidden = self.options.skipHidden, tmpRules;

		self.reset(name, false);

        if(name){
            tmpRules = {};
            tmpRules[name] = rules[name] || {};
        }else{
            tmpRules = rules;
        }

        for(var index in tmpRules){
        	var $tmp = self.getElement(index);

			if(!$tmp.length || $tmp.is(':disabled') || $tmp.is(':hidden') && skipHidden) continue;
			
			var item = tmpRules[index],
				value = FormValid.isCheckBtn($tmp) ? $tmp.filter(':checked').val() : $tmp.val(),
        		tmpStatus = true;

        	if(value == null){
        		value = '';
        	}

			if(!$.isArray(item)){
				item = [item];
			}

			var tmp;

			for(var i = 0; i < item.length; i++){
				tmp = item[i];

				if(typeof tmp.rule == 'function' && !tmp.rule.call(this, value, index, tmp.standard)){
					status = false; tmpStatus = false;
				}else if(tmp.rule.constructor == RegExp && !tmp.rule.test(value)){
					status = false; tmpStatus = false;
				}

				if(!tmpStatus){
					self.error(index, tmp.errorText);
					
					if(errorStop){
						return status;
					}

					break;
				}	
			} 

			tmpStatus && self.success(index, tmp.successText, tmp.showSuccessStatus);
        }

		return status;
	},

	error: function(name, text){
    	if(text != null || this.options.showErrorStatus){
    		text = text || '';
			this.setText(name, text || '', 'ui2-formvalid-field-error');   
    	} 

    	this.trigger('error', [name, text]);
    },

	success: function(name, text, showSuccessStatus){
		if(text != null || this.options.showSuccessStatus || showSuccessStatus){
			text = text || '';
			this.setText(name, text, 'ui2-formvalid-field-success');	
		}

		this.trigger('success', [name, text]);
	},

	setText: function(name, text, classname){
		var $parent = this.getElement(name).parent();

		$parent.find('.ui2-formvalid-field[data-formvalid-target="' + name + '"]').remove();

		if(text != null){
			$parent.append('<span class="ui2-formvalid-field ' + classname + '" data-formvalid-target="' + name + '">' + (text || '&nbsp;') + '</span>');
		}
	},

	reset: function(name, _default){
		var self = this;

		if(name){
			var text; 

			if(_default == null || _default){
				text = self.getElement(name).attr(FormValid.ATTRIBUTE_DEFAULT);
			}
            
            self.setText(name, text, 'ui2-formvalid-field-default');
        }else{
            self.getElement().each(function(){
            	var name = this.name;

            	if(!name) return;

				if(_default == null || _default){
					text = $(this).attr(FormValid.ATTRIBUTE_DEFAULT);
				}

				self.setText(name, text, 'ui2-formvalid-field-default');
        	});
        }
	},

	addRule: function(name, rule){
		var self = this;

		if(typeof name == 'object'){
			$.each(name, function(k, rules){
				self.addRule(k, rules);
			});
		}else{
			var rules = self.rules[name] || [];

			if(!$.isArray(rules)){
				rules = [rules];
			}

			var _rules = [];

			$.each($.makeArray(rule), function(k, r){
				var s = r.rule;

				if(!s){
					$.each(FormValid.DEFAULT_RULES, function(dk, dv){
						if(dk in r){
							_rules.push($.extend({}, r, {
								rule: dv.rule,
								errorText: r.errorText || dv.errorText,
								standard: r[dk]
							}));
						}
					});
				}else{
					_rules.push(r);
				}
			});

			rules.push.apply(rules, _rules);
			self.rules[name] = rules;
		}
	},

	removeRule: function(name){
		if(name){
			delete this.rules[name];
		}else{
			this.rules = {};
		}
	},

	getElement: function(name){
		return name ? this.dom.find('[name="' + name + '"]') : this.dom.find('[name]');
	}
});

$.extend(FormValid, {
	ATTRIBUTE_PREFIX: 'data-formvalid-',

	DEFAULT_RULES: {
		required: {
			rule: /\S+/,
			errorText: '该字段必填'
		},

		email: {
			rule: /^(?:\w[\w_-]*@[\w_-]+(?:\.[\w_-]+)+|\S+)$/i,
			errorText: '邮箱地址格式错误'
		},

		mobile: {
			rule: /^\d{11}$/,
			errorText: '手机号码格式错误'
		},

		idcard: {
			rule: /^(?:\d{14}|\d{17})[\dx]$/i,
			errorText: '身份证格式错误'
		},

		number: {
			rule: /^(?:\d+(?:\.\d+)?)$/,
			errorText: '该字段必须为数字'
		},

		range: {
			rule: function(value, name, r){
				if($.trim(value) == '') return true;

				r = r.replace(/\s+/g, '').split(',');

				if(r[0] && value < r[0]){
					return false; 
				}

				if(r[1] && value > r[1]){
					return false;
				}

				return true;
			},
			errorText: '字段输入范围错误'
		},

		length: {
			rule: function(value, name, r){
				if($.trim(value) == '') return true;

				r = r.replace(/\s+/g, '').split(',');
				
				var l = String(value).length;

				if(r[0] && l < r[0]){
					return false;
				}

				if(r[1] == null){
					return l == r[0];
				}

				if(r[1] && l > r[1]){
					return false;
				}

				return true;
			},
			errorText: '字段输入长度错误'
		}
	}
});

FormValid.ATTRIBUTE_DEFAULT = FormValid.ATTRIBUTE_PREFIX + 'default';

FormValid.isCheckBtn = function($ele){
	return $ele.length && /checkbox|radio/i.test($ele.attr('type'));
};

return FormValid;
});