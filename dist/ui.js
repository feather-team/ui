;(function(factory){
	window.jQuery.klass = factory(window.jQuery);
})(function($){
var NAMESPACE = 'featherUi', NAMESPACE_EXTENSTION = NAMESPACE + '.';
var slice = Array.prototype.slice;

//abstract class
var Abstract = {
    Event: {
        getEventName: function(event, unSelf){
            event = event.split(/\s+/);
            var oid = unSelf ? this._oid : false;

            return $.map(event, function(v){
                if(oid){
                    return v + '.' + oid;
                }else{
                    return NAMESPACE_EXTENSTION + v;
                }
            }).join(' ');
        },

        /**
         * 为当前对象绑定事件，删除jquery回调函数的第一个参数event
         * event: 事件名
         * callback: 回调函数
         */
        on: function(event, callback){
            $.event.add(this, this.getEventName(event), function(){
                return callback.apply(this, arguments);
            });

            return this;
        },

        off: function(event){
            $.event.remove(this, this.getEventName(event));
            return this;
        },

        trigger: function(event, data){
            $.event.trigger(this.getEventName(event), data, this);
            return this;
        },

        /**
         * on2self 为jquery对象绑定当前对象的事件  事件名的格式为 js事件 + '.' + 当前对象的_oid属性
         * obj: jquery或dom元素
         * event: 事件名
         * callback: 回调函数
         */
        o2s: function(obj, event, callback){
            $(obj).on(this.getEventName(event, true), callback);
            return this;
        },

        /**
         * off for self 从jquery对象上解绑当前对象的事件
         * obj: jquery或dom元素
         * event: 事件名
         * callback: 回调函数
         */
        ofs: function(obj, event){
            $(obj).off(this.getEventName(event, true));
            return this;
        },

        //trigger
        t2s: function(obj, event, data){
            $(obj).trigger(this.getEventName(event, true), data);
            return this;
        }
    }
};

return {
    NAMESPACE: NAMESPACE,

    create: function(prototype){
        var klass = function(){
            this._oid = $.now();
            this.initialize && this.initialize.apply(this, arguments);
        };

        klass.prototype = prototype;
        klass.prototype.constructor = klass;

        return klass;
    },

    extend: function(parent, prototype){
        var _super;

        if(typeof parent == 'string'){
            _super = Abstract[parent] || {};
        }else if(typeof parent == 'function'){
            //support parent is function
            _super = parent.prototype;
        }else{
            //parent is object
            _super = parent;
        }

        //set prototype, _super's prototype and overrewrite self _super
        var klass = this.create($.extend({}, _super, prototype));
        klass._super = _super;
        //call parent construct
        //example
        /*
        Class.extend(A, {
            initialize: function(){
                //call parent construct
                this._super();
                this._super.setName.call(this);
            }
        });
        */
        klass.prototype._super = function(){
            //store self _super
            var sup = klass._super;

            //set self._super = super klass._super, prevent call this._super in super's initialize method cause endless loop;
            klass._super = sup.constructor._super;
            //call super's initialize
            sup && sup.initialize.apply(this, arguments);
            //set back until the end
            klass._super = sup;
        };

        return klass;
    },

    /**
     * 插件工厂方法
     * 此方法产生一个类的同时，会向$.fn上扩展一个插件，jquery对象以options.dom传入。
     * 在摧毁对象的同时，会自动进行一些垃圾回收操作
     *
     * name: $.fn绑定的插件名
     * parent: 继承类，非必选，如果不填，则自动继承Event
     * prototype：prototype
     */
    $factory: function(name, parent, prototype){
        var klass;

        //prototype => empty
        if(!prototype){
            //parent => prototype
            prototype = parent;
            parent = 'Event';
        }

        if(!prototype.widget){
            prototype.widget = function(){
                return this.$element_;
            };
        }

        klass = this.extend(parent, prototype);

        var DATANAME = NAMESPACE_EXTENSTION + name, destroy;

        //如果自己存在destroy方法，则重写，并在destroy帮助其进行一系列解绑操作，以便内存释放
        if(destroy = klass.prototype.destroy){
            klass.prototype.destroy = function(){
                destroy.apply(this, arguments);
                //memory release
                this.trigger('release');
                this.off(NAMESPACE);
            };
        }

        //插件触发trigger事件时，自动触发绑定在元素上的自定义事件
        var trigger = klass.prototype.trigger;

        klass.prototype.trigger = function(event, data){
            trigger.apply(this, arguments);

            var element;

            if(element = this.widget()){
                $(element).trigger(name + ':' + event, data);
            }
        };
        
        /*
        调用示例：
        //初始化：
        var obj = $('#droplist').droplist({
            list: {...}
        });
        console.log(obj) //droplist对象，非jquery对象

        //调用插件对象方法
        $('#droplist').droplist().on('select', function(value){
            console.log(value);
        });

        //调用插件对象方法，并返回jquery对象，适合
        $('#droplist').droplist('on', 'select', function(value){
            console.log(value);
        });
        */
        $.fn[name] = function(options){
            if(!(this instanceof $)){
                return new klass(options);
            }

            var action, args;

            if(typeof options == 'string'){
                //当第一个参数为instance时，返回组件实例对象
                if(options == 'instance'){
                    return this.eq(0).data(DATANAME);
                }

                action = options;
                args = slice.call(arguments, 1);
                options = {};
            }else{
                options = options || {};
            }

            this.each(function(){
                var $this = $(this), instance = $this.data(DATANAME), opts = {};

                if(!instance){
                    opts = $.extend({
                        dom: this
                    }, options);

                    $this.data(DATANAME, instance = new klass(opts));

                    instance.$element_ = $this;
                    //listen memory release
                    instance.on('release', function(){
                        $this.removeData(DATANAME);
                        instance.$element_ = null;
                        instance = null;
                    });
                }

                if(action){
                    if(!instance[action]){
                        throw new Error('method ' + action + ' is not exists!');
                    }

                    instance[action].apply(instance, args);
                }
            });

            return this;
        };

        return klass;
    }
};
});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){
var doc = document;

return Class.$factory('mask', {
    initialize: function(opt){
        this.options = $.extend({
            autoOpen: true,
            dom: doc.body,
            color: '#000',
            opacity: 0.6
        }, opt || {});

        this.init();
    },

    init: function(){
        var self = this, container = self.container = $(self.options.dom);

        if(container[0] != doc.body){
            !/fixed|absolute/.test(container.css('position')) && container.css('position', 'relative');
        }
        
        self.mask = $('<div class="ui2-mask">').hide().css({
            backgroundColor: self.options.color,
            opacity: self.options.opacity
        }).appendTo(self.container);

        self.o2s(window, 'resize', function(){
            self.resetPosition();
        });

        self.options.autoOpen && self.open();
    },

    open: function(){
        this.resetPosition();
        this.mask.show();
        this.trigger('open');
    },

    close: function(){
        this.mask.hide();
        this.trigger('close');
    },

    resetPosition: function(){
        var container = this.container[0];

        this.mask.css({
            width: container.scrollWidth || doc.documentElement.scrollWidth,
            height: container.scrollHeight || doc.documentElement.scrollHeight
        });
    },

    destroy: function(){
        this.mask.remove();    
        this.mask = null;
        this.ofs(window, 'resize');
    }
});
});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass, window.jQuery.fn.mask);
})(function($, Class, Mask){
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
            esc: false,    //ESC是否开启，ESC按下自动关闭
            mask: true,                    //蒙版
            autoOpen: false,
            buttons: {},
            handle: null,                //指定打开和关闭dialog的元素
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
        self.options.autoOpen && self.open();
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
        self.setButtons();
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

        if(!buttons){
            buttons = self.options.buttons;
        }

        if($.isEmptyObject(buttons)) return;

        if(self.buttons){
            self.buttons.empty();
        }else{
            var $buttons = self.wraper.find('.ui2-dialog-buttons');
            if($buttons.length == 0){
                $buttons = $('<div class="ui2-dialog-buttons">').appendTo(self.wraper);
            }
            self.buttons = $buttons;
        }

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
});;;(function(factory){
	factory(window.jQuery, window.jQuery.fn.dialog);
})(function($, Dialog){
return $.alert = {
    alert: function(content, callback, unclose, opt){
        return new Dialog($.extend({
            title: '提示',
            width: 400,
            content: '<div class="ui2-alert">' + content + '</div>',
            autoOpen: true,
            buttons: {
                '确定': {
                    events: {
                        click: function(){
                            callback && callback();
                            !unclose && this.destroy();
                        }
                    },

                    className: 'ui2-alert-button-confirm'
                }
            }
        }, opt || {}));
    },

    warn: function(content, callback, unclose, opt){
        return this.alert('<div class="ui2-alert-warn">' + content + '</div>', callback, unclose, opt);
    },

    error: function(content, callback, unclose, opt){
        return this.alert('<div class="ui2-alert-error">' + content + '</div>', callback, unclose, $.extend({
            title: '错误'
        }, opt || {}));
    },

    success: function(content, callback, unclose, opt){
        return this.alert('<div class="ui2-alert-success">' + content + '</div>', callback, unclose, $.extend({
            title: '操作成功'
        }, opt || {}));
    },
    /**
     * 同浏览器默认的confirm 
     * content：显示内容
     * callback：确认后执行的函数
     * unclose：点击确认后不关闭
     * 
     * 当unclose为true时 可手动执行close或者destory方法关闭弹窗
     */
    confirm: function(content, callback, unclose, opt){
        return new Dialog($.extend({
            title: '提示',
            width: 400,
            content: '<div class="ui2-alert">' + content + '</div>',
            autoOpen: true,
            buttons: {
                '确定': {
                    events: {
                        click: function(){
                            callback();
                            !unclose && this.destroy();
                        }
                    },

                    className: 'ui2-alert-button-confirm'
                },

                '取消': {
                    events: {
                        click: function(){
                            this.destroy();
                        }
                    },

                    className: 'ui2-alert-button-cancel'
                }
            }
        }, opt || {}));
    }
};

});;/*
    json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

if(typeof define == 'function' && define.amd){
    //seajs or requirejs environment
    define(function(){
        return JSON;
    });
}else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = JSON;
}else if(!JSON){
    this.JSON = JSON;
}
;;(function(factory){
	this.util = this.util || {};
    this.util.object = factory(JSON);
})(function(json2){

return {
    get: function(data, name){
        if(data[name]){
            return data[name];
        }

        name = name.split('.');

        var i = 0, len = name.length, tmp = data;

        for(; i < len; i++){
            tmp = tmp[name[i]];

            if(tmp == null) return null;
        }

        return tmp;
    },

    set: function(data, name, value){
        if(typeof value == 'undefined'){
            data = name;
        }else{
            name = name.split('.');

            var i = 0, len = name.length - 1, tmp = data;

            for(; i < len; i++){
                var tmpName = name[i];

                if(typeof tmp[tmpName] != 'object' || !tmp[tmpName]){
                    tmp[tmpName] = {};
                }

                tmp = tmp[tmpName];
            }

            tmp[name[i]] = value;
        }
    },

    toJSONString: function(obj){
        return json2.stringify(obj);
    },

    jsonEncode: function(obj){
        return this.toJSONString(obj);
    },

    parseJSON: function(str){
        return json2.parse(str);
    },

    jsonDecode: function(str){
        return this.parseJSON(str);
    }
};

});;/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(s,p){var m={},l=m.lib={},n=function(){},r=l.Base={extend:function(b){n.prototype=this;var h=new n;b&&h.mixIn(b);h.hasOwnProperty("init")||(h.init=function(){h.$super.init.apply(this,arguments)});h.init.prototype=h;h.$super=this;return h},create:function(){var b=this.extend();b.init.apply(b,arguments);return b},init:function(){},mixIn:function(b){for(var h in b)b.hasOwnProperty(h)&&(this[h]=b[h]);b.hasOwnProperty("toString")&&(this.toString=b.toString)},clone:function(){return this.init.prototype.extend(this)}},
q=l.WordArray=r.extend({init:function(b,h){b=this.words=b||[];this.sigBytes=h!=p?h:4*b.length},toString:function(b){return(b||t).stringify(this)},concat:function(b){var h=this.words,a=b.words,j=this.sigBytes;b=b.sigBytes;this.clamp();if(j%4)for(var g=0;g<b;g++)h[j+g>>>2]|=(a[g>>>2]>>>24-8*(g%4)&255)<<24-8*((j+g)%4);else if(65535<a.length)for(g=0;g<b;g+=4)h[j+g>>>2]=a[g>>>2];else h.push.apply(h,a);this.sigBytes+=b;return this},clamp:function(){var b=this.words,h=this.sigBytes;b[h>>>2]&=4294967295<<
32-8*(h%4);b.length=s.ceil(h/4)},clone:function(){var b=r.clone.call(this);b.words=this.words.slice(0);return b},random:function(b){for(var h=[],a=0;a<b;a+=4)h.push(4294967296*s.random()|0);return new q.init(h,b)}}),v=m.enc={},t=v.Hex={stringify:function(b){var a=b.words;b=b.sigBytes;for(var g=[],j=0;j<b;j++){var k=a[j>>>2]>>>24-8*(j%4)&255;g.push((k>>>4).toString(16));g.push((k&15).toString(16))}return g.join("")},parse:function(b){for(var a=b.length,g=[],j=0;j<a;j+=2)g[j>>>3]|=parseInt(b.substr(j,
2),16)<<24-4*(j%8);return new q.init(g,a/2)}},a=v.Latin1={stringify:function(b){var a=b.words;b=b.sigBytes;for(var g=[],j=0;j<b;j++)g.push(String.fromCharCode(a[j>>>2]>>>24-8*(j%4)&255));return g.join("")},parse:function(b){for(var a=b.length,g=[],j=0;j<a;j++)g[j>>>2]|=(b.charCodeAt(j)&255)<<24-8*(j%4);return new q.init(g,a)}},u=v.Utf8={stringify:function(b){try{return decodeURIComponent(escape(a.stringify(b)))}catch(g){throw Error("Malformed UTF-8 data");}},parse:function(b){return a.parse(unescape(encodeURIComponent(b)))}},
g=l.BufferedBlockAlgorithm=r.extend({reset:function(){this._data=new q.init;this._nDataBytes=0},_append:function(b){"string"==typeof b&&(b=u.parse(b));this._data.concat(b);this._nDataBytes+=b.sigBytes},_process:function(b){var a=this._data,g=a.words,j=a.sigBytes,k=this.blockSize,m=j/(4*k),m=b?s.ceil(m):s.max((m|0)-this._minBufferSize,0);b=m*k;j=s.min(4*b,j);if(b){for(var l=0;l<b;l+=k)this._doProcessBlock(g,l);l=g.splice(0,b);a.sigBytes-=j}return new q.init(l,j)},clone:function(){var b=r.clone.call(this);
b._data=this._data.clone();return b},_minBufferSize:0});l.Hasher=g.extend({cfg:r.extend(),init:function(b){this.cfg=this.cfg.extend(b);this.reset()},reset:function(){g.reset.call(this);this._doReset()},update:function(b){this._append(b);this._process();return this},finalize:function(b){b&&this._append(b);return this._doFinalize()},blockSize:16,_createHelper:function(b){return function(a,g){return(new b.init(g)).finalize(a)}},_createHmacHelper:function(b){return function(a,g){return(new k.HMAC.init(b,
g)).finalize(a)}}});var k=m.algo={};return m}(Math);
(function(s){function p(a,k,b,h,l,j,m){a=a+(k&b|~k&h)+l+m;return(a<<j|a>>>32-j)+k}function m(a,k,b,h,l,j,m){a=a+(k&h|b&~h)+l+m;return(a<<j|a>>>32-j)+k}function l(a,k,b,h,l,j,m){a=a+(k^b^h)+l+m;return(a<<j|a>>>32-j)+k}function n(a,k,b,h,l,j,m){a=a+(b^(k|~h))+l+m;return(a<<j|a>>>32-j)+k}for(var r=CryptoJS,q=r.lib,v=q.WordArray,t=q.Hasher,q=r.algo,a=[],u=0;64>u;u++)a[u]=4294967296*s.abs(s.sin(u+1))|0;q=q.MD5=t.extend({_doReset:function(){this._hash=new v.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(g,k){for(var b=0;16>b;b++){var h=k+b,w=g[h];g[h]=(w<<8|w>>>24)&16711935|(w<<24|w>>>8)&4278255360}var b=this._hash.words,h=g[k+0],w=g[k+1],j=g[k+2],q=g[k+3],r=g[k+4],s=g[k+5],t=g[k+6],u=g[k+7],v=g[k+8],x=g[k+9],y=g[k+10],z=g[k+11],A=g[k+12],B=g[k+13],C=g[k+14],D=g[k+15],c=b[0],d=b[1],e=b[2],f=b[3],c=p(c,d,e,f,h,7,a[0]),f=p(f,c,d,e,w,12,a[1]),e=p(e,f,c,d,j,17,a[2]),d=p(d,e,f,c,q,22,a[3]),c=p(c,d,e,f,r,7,a[4]),f=p(f,c,d,e,s,12,a[5]),e=p(e,f,c,d,t,17,a[6]),d=p(d,e,f,c,u,22,a[7]),
c=p(c,d,e,f,v,7,a[8]),f=p(f,c,d,e,x,12,a[9]),e=p(e,f,c,d,y,17,a[10]),d=p(d,e,f,c,z,22,a[11]),c=p(c,d,e,f,A,7,a[12]),f=p(f,c,d,e,B,12,a[13]),e=p(e,f,c,d,C,17,a[14]),d=p(d,e,f,c,D,22,a[15]),c=m(c,d,e,f,w,5,a[16]),f=m(f,c,d,e,t,9,a[17]),e=m(e,f,c,d,z,14,a[18]),d=m(d,e,f,c,h,20,a[19]),c=m(c,d,e,f,s,5,a[20]),f=m(f,c,d,e,y,9,a[21]),e=m(e,f,c,d,D,14,a[22]),d=m(d,e,f,c,r,20,a[23]),c=m(c,d,e,f,x,5,a[24]),f=m(f,c,d,e,C,9,a[25]),e=m(e,f,c,d,q,14,a[26]),d=m(d,e,f,c,v,20,a[27]),c=m(c,d,e,f,B,5,a[28]),f=m(f,c,
d,e,j,9,a[29]),e=m(e,f,c,d,u,14,a[30]),d=m(d,e,f,c,A,20,a[31]),c=l(c,d,e,f,s,4,a[32]),f=l(f,c,d,e,v,11,a[33]),e=l(e,f,c,d,z,16,a[34]),d=l(d,e,f,c,C,23,a[35]),c=l(c,d,e,f,w,4,a[36]),f=l(f,c,d,e,r,11,a[37]),e=l(e,f,c,d,u,16,a[38]),d=l(d,e,f,c,y,23,a[39]),c=l(c,d,e,f,B,4,a[40]),f=l(f,c,d,e,h,11,a[41]),e=l(e,f,c,d,q,16,a[42]),d=l(d,e,f,c,t,23,a[43]),c=l(c,d,e,f,x,4,a[44]),f=l(f,c,d,e,A,11,a[45]),e=l(e,f,c,d,D,16,a[46]),d=l(d,e,f,c,j,23,a[47]),c=n(c,d,e,f,h,6,a[48]),f=n(f,c,d,e,u,10,a[49]),e=n(e,f,c,d,
C,15,a[50]),d=n(d,e,f,c,s,21,a[51]),c=n(c,d,e,f,A,6,a[52]),f=n(f,c,d,e,q,10,a[53]),e=n(e,f,c,d,y,15,a[54]),d=n(d,e,f,c,w,21,a[55]),c=n(c,d,e,f,v,6,a[56]),f=n(f,c,d,e,D,10,a[57]),e=n(e,f,c,d,t,15,a[58]),d=n(d,e,f,c,B,21,a[59]),c=n(c,d,e,f,r,6,a[60]),f=n(f,c,d,e,z,10,a[61]),e=n(e,f,c,d,j,15,a[62]),d=n(d,e,f,c,x,21,a[63]);b[0]=b[0]+c|0;b[1]=b[1]+d|0;b[2]=b[2]+e|0;b[3]=b[3]+f|0},_doFinalize:function(){var a=this._data,k=a.words,b=8*this._nDataBytes,h=8*a.sigBytes;k[h>>>5]|=128<<24-h%32;var l=s.floor(b/
4294967296);k[(h+64>>>9<<4)+15]=(l<<8|l>>>24)&16711935|(l<<24|l>>>8)&4278255360;k[(h+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;a.sigBytes=4*(k.length+1);this._process();a=this._hash;k=a.words;for(b=0;4>b;b++)h=k[b],k[b]=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;return a},clone:function(){var a=t.clone.call(this);a._hash=this._hash.clone();return a}});r.MD5=t._createHelper(q);r.HmacMD5=t._createHmacHelper(q)})(Math);

	this.CryptoJS = CryptoJS;
;;(function () {
  var object = {};

  //var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    var str = String(input);
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next str index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      str.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = str.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    var str = String(input).replace(/=+$/, '');
    if (str.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = str.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

  if(typeof define == 'function' && define.amd){
    //seajs or requirejs environment
    define(function(){
      return object;
    });
  }else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = object;
  }else{
    this.btoa = object.btoa;
    this.atob = object.atob;
  }
}());;;(function(factory){
	this.util = this.util || {};
    this.util.string = factory(CryptoJS, {
        atob: this.atob,
        btoa: this.btoa
    }, this.util.object);
})(function(CryptoJS, base64, object){
return  {
    /**
     * 将一个string 进行左右补全
     * @param str
     * @param pad  补全的字符
     * @param length  补全的长度
     * @param leftmode  是否左边补全
     * @returns
     */
    toPad: function(str, pad, length, leftmode){
        var temp = '';

        str = String(str);

        pad = String(pad);

        length = length - str.length;

        while(length-- > 0){
            temp += pad;
        }

        return leftmode == true ? (temp + str) : (str + temp);
    },

    pad: function(str, pad, length, leftmode){
        return this.toPad(str, pad, length, leftmode);
    },
    
    /**
     * 将string中的换行符替换为 html换行
     */
    nl2br: function(str){
        return String(str || '').replace(/[\r\n]/g, '<br />');
    },
    
    /**
     * 检查一个字符串是否为空
     */
    empty: function(str){
        return /^\s*$/.test(str);
    },

    reverse: function(string){
        return String(string).split('').reverse().join('');
    },

    md5: function(string, pad){
        string = CryptoJS.MD5(String(string)).toString();

        if(pad){
            return this.md5(this.reverse(string) + pad);
        }

        return string;
    },

    base64Encode: function(str){
        return base64.btoa(str);
    },

    base64Decode: function(str){
        return base64.atob(str);
    },

    crypto: CryptoJS,

    toJSONString: object.toJSONString,
    jsonEncode: object.toJSONString,
    parseJSON: object.parseJSON,
    jsonDecode: object.parseJSON
};

});;;(function(factory){
	this.util = this.util || {};
    this.util.number = factory(this.util.string);
})(function(string){

return {
    //给数字加千分位XX
    format: function(num){
        if(!num) return 0;
        return string.reverse(string.reverse(num).replace(/\d{3}/g, '$&,')).replace(/^,/, '');
    },

    toInt: function(number){
        number = parseInt(number);
        return isNaN(number) ? 0 : number;
    }
};

});;;(function(factory){
	this.util = this.util || {};
    this.util.date = factory(this.util.string);
})(function(string){
var toPad = string.toPad;

return {
    //获取当前时间戳
    time: function(){
        return (new Date).getTime();
    },

    //返回和php一样的时间格式
    //如Date.date('Y-m-d H:i:s'); 2012-09-10 11:10:00
    //Y 4位年
    //y 2位年
    //m 2位月
    //n 不加0的月
    //d 2位 当前多少日
    //j 不加0的日
    //D 星期几
    //h 不加0的小时
    //H 2位小时
    //i 2位分
    //s 2位秒
    //a am或者pm
    //A AM或者PM
    //t 当前月有多少天
    date: function(str, time){
        if(!str) return;

        var date = new Date,
            temp = [];

        if(time) date.setTime(time);

        for (var i = 0, j = str.length; i < j; i++){
            var value = str.charAt(i);

            switch (value){
                case 'Y':
                    value = date.getFullYear();
                    break;
                case 'y':
                    value = String(date.getFullYear()).substring(0, 2);
                    break;
                case 'm':
                    value = toPad(date.getMonth() + 1, 0, 2, true);
                    break;
                case 'n':
                    value = date.getMonth() + 1;
                    break;
                case 'd':
                    value = toPad(date.getDate(), 0, 2, true);
                    break;
                case 'j':
                    value = date.getDate();
                    break;
                case 'D':
                    value = date.getDay();
                    break;
                case 'h':
                    value = toPad(date.getHours() % 12, 0, 2, true);
                    break;
                case 'H':
                    value = toPad(date.getHours(), 0, 2, true);
                    break;
                case 'i':
                    value = toPad(date.getMinutes(), 0, 2, true);
                    break;
                case 's':
                    value = toPad(date.getSeconds(), 0, 2, true);
                    break;
                case 'a':
                    value = date.getHours() - 12 < 0 ? 'am' : 'pm';
                    break;
                case 'A':
                    value = date.getHours() - 12 < 0 ? 'AM' : 'PM';
                    break;
                case 't':
                    value = (new Date(date.getFullYear(), date.getMonth() + 1, 0)).getDate();
                    break;

                default:
                    ;
            };

            temp.push(value);
        }

        return temp.join('');
    },
    
    compareDate: function(a, b){
        //input a&b in date format,see Date.parse()
        var MS_PER_DAY = 24 * 60 * 60 * 1000,
            offset;
        var timea = Date.parse(a),
            timeb = Date.parse(b);

        if(isNaN(timea) || isNaN(timeb)) return;
        offset = (timea - timeb) / MS_PER_DAY;

        return Math.floor(offset);
    }
};
});
;;(function(factory){
if(typeof define == 'function' && define.amd){
    //seajs or requirejs environment
    define(['./object', './number', './string', './date'], factory);
}else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = factory(
        require('./object'),
        require('./number'),
        require('./string'),
        require('./date')
    );
}else if(typeof jQuery != 'undefined'){
    jQuery.util = this.util;
}
})(function(Object, Number, String, Date){
    return {
        object: Object,
        number: Number,
        string: String,
        date: Date
    };
});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){

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

            self.o2s(document, 'click', function(){
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
        self.ofs(document, 'click');
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

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass, window.jQuery.util, window.jQuery.fn.droplist);
})(function($, Class, Util, DropList){

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
            dateFormat: 'Y-m-d',
            selectedClassName: ''
        }, options || {});

        this.init();
    },

    init: function(){
        var self = this, opt = self.options;

        self.target = $(opt.dom || opt.target);

        if(!self.target.length){
            self.target = null;
        }
        
        self.wraper = $('<div class="ui2-calendar"></div>');
        self.container = $(opt.container).append(self.wraper);
        self.date = null;

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
        !self.target && self.open();
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
    },

    initEvent: function(){
        var self = this, opt = self.options;

        if(self.target){
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

            self.on('select', function(e, date, $item){
                if('value' in self.target[0]){
                    self.target.val(date);
                }else{
                    self.target.html(date);
                }

                self.close();
            });
        }

        self.wraper.click(function(e){
            var $item = $(e.target);

            if($item.hasClass('ui2-calendar-item') && !$item.hasClass('ui2-calendar-item-disable')){
                if(opt.selectedClassName){
                    self.cleanSelected();
                    $item.addClass(opt.selectedClassName);
                }
                
                self.date = $item.attr('data-calendar-date');
                self.trigger('select', self.date, $item);
            }

            e.stopPropagation();
        });

        if(opt.yearRange){
            self.yearSelecter.on('select', function(event, v){
                self.toMonth(v);
            });

            self.monthSelecter.on('select', function(event, v){
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

                    if(self.date == d){
                        cn += ' ' + opt.selectedClassName;
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
        if(!this.target) return;

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
    },

    destroy: function(){
        var self = this;

        self.yearSelecter && self.yearSelecter.destroy();
        self.yearSelecter = null;
        self.monthSelecter && self.monthSelecter.destroy();
        self.monthSelecter = null;
        self.wraper.remove();
        self.wraper = null;
        self.container = null;
        self.target && self.ofs(self.target, 'click');
        self.ofs(window, 'resize scroll');
        self.ofs(document, 'click');
    },

    cleanSelected: function(){
        var self = this, selectedClassName = self.options.selectedClassName;

        if(selectedClassName){
            self.date = null;
            self.calendar.find('.ui2-calendar-item').removeClass(selectedClassName);
        }
    }
});

Calendar.WEEKNAME = ['日', '一', '二', '三', '四', '五', '六'];
Calendar.getYM = function(year, month){
    var date = new Date;
    year && date.setFullYear(year);

    if(month != null){
        date.setDate(1);
        date.setMonth(month - 1);
    }

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1
    }
};

return Calendar;

});;;(function(factory){
	window.jQuery.cookie = factory(window.jQuery);
})(function($){

var pluses = /\+/g;

function read(s) {
    if (s.indexOf('"') === 0) {
        // This is a quoted cookie as according to RFC2068, unescape...
        s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    try {
        // Replace server-side written pluses with spaces.
        // If we can't decode the cookie, ignore it, it's unusable.
        // If we can't parse the cookie, ignore it, it's unusable.
        return decodeURIComponent(s.replace(pluses, ' '));
    } catch(e) {}
}

return $.cookie = {
    config: {},

    set: function(key, value, options){
        options = $.extend({}, this.config, options);

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setTime(+t + days * 864e+5);
        }

        return (document.cookie = [
            encodeURIComponent(key), '=', encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path    ? '; path=' + options.path : '',
            options.domain  ? '; domain=' + options.domain : '',
            options.secure  ? '; secure' : ''
        ].join(''));
    },

    get: function(key, _default){
        var result = key ? undefined : {};

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all. Also prevents odd result when
        // calling $.cookie().
        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decodeURIComponent(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                // If second argument (value) is a function it's a converter...
                result = read(cookie);
                break;
            }

            // Prevent storing a cookie that we couldn't decode.
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }

        return result || _default;
    },

    remove: function(key, options){
        this.set(key, '', $.extend({}, options, { expires: -1 }));
    }
};

});;;(function(factory){
	window.jQuery.fn.datepicker = window.jQuery.fn.calendar;
})();;;(function(factory){
	factory(window.jQuery, window.jQuery.klass, window.jQuery.util);
})(function($, Class, Util){

var toInt = Util.number.toInt;

return Class.$factory('draggable', {
    initialize: function(opt){
        this.options = $.extend({
            dom: null,
            handle: null,   //触发事件的dom
            axis: null  //x, y
        }, opt || {});
        
        this.init();   
    },

    init: function(){
        var self = this, opt = self.options;
        var $dom = self.dom = $(opt.dom);
        self.handle = $(opt.handle || opt.dom);
        
        !/fixed|absolute/.test($dom.css('position')) && $dom.css('position', 'relative');
        
        self.eid = $.now();

        //坐标差距
        self.range = {};
        self.initEvent();
    },
    
    initEvent: function(){
        var self = this;
        
        self.o2s(self.handle, 'mousedown', function(e){
            document.selection && document.selection.empty();
            self.dragStart(e);
            
            return false;
        });

        self.o2s(self.handle, 'selectstart drag', function(){
            return false;
        });
    },
    
    dragStart: function(e){
        //获取坐标差距
        var self = this, left = toInt(self.dom.css('left')), top = toInt(self.dom.css('top'));

        self.range = {
            x: e.pageX - left,
            y: e.pageY - top
        };

        self.o2s(document, 'mousemove', $.proxy(self.drag, self));
        self.o2s(document, 'mouseup', $.proxy(self.dragStop, self));
        
        self.trigger('start', [left, top, e]);
    },
    
    drag: function(e){
        var self = this, left = e.pageX - self.range.x, top = e.pageY - self.range.y, obj = {left: left, top: top}, axis = self.options.axis;

        axis == 'x' && (obj.top = 0);
        axis == 'y' && (obj.left = 0);

        self.dom.css(obj);
        self.trigger('drag', [obj.left, obj.top, e]);
    },
    
    dragStop: function(e){
        var self = this;

        self.ofs(document, 'mousemove mouseup');
        self.trigger('stop', [self.dom.css('left'), self.dom.css('top'), e]);
    }
});

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){
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

                if($element.attr(attr) != null){
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
                    self.error(index, tmp.errorText, tmp.showErrorStatus || self.options.showErrorStatus);
                    
                    if(errorStop){
                        return status;
                    }

                    break;
                }    
            } 

            tmpStatus && self.success(index, tmp.successText, tmp.showSuccessStatus || self.options.showSuccessStatus);
        }

        return status;
    },

    error: function(name, text, showErrorStatus){
        if(text != null && showErrorStatus !== false){
            text = text || '';
            this.setText(name, text || '', 'ui2-formvalid-field-error');   
        } 

        this.trigger('error', [name, text]);
    },

    success: function(name, text, showSuccessStatus){
        if(text != null && showSuccessStatus !== false){
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
            rule: /^\w[\._\-\w]*@[\w_-]+(?:\.[\w_-]+)+$/i,
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
});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass, window.jQuery.fn.mask);
})(function($, Class, Mask){
var doc = document, Math = window.Math;

var Lightbox = Class.$factory('lightbox', {
    initialize: function(opt){
        this.options = $.extend({
            dom: null,
            selecter: '> img',
            srcAttr: 'data-lightbox-url',
            altAttr: 'alt'
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
                alt: $(item).attr(self.options.altAttr),
                src: $(item).attr(self.options.srcAttr)
            };
        });

        self.initEvent();
    },

    initEvent: function(){
        var self = this; 

        self.doms.each(function(index){
            self.o2s(this, 'click', function(){
                self.open(index);
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
            var imgLink;
        
            if(/\?/.test(item.src)){
                imgLink = item.src + '&lightbox-random=' + Math.random();
            }else{
                imgLink = item.src + '?lightbox-random=' + Math.random();
            }

            var $img = $('<img />').attr({
                src: imgLink,
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

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){

return Class.$factory('pager', {
    initialize: function(opt){
        this.options = $.extend({
            dom: null,
            pageTotal: 0,    //整页数
            perPage: 10,    //显示几页
            url: '',        //url不为空，可直接跳转，而非调用callback
            showFirst: true,    //显示首页
            showLast: true,        //显示最后一页
            currentPage: 1,    //当前页码
            currentPageClassName: 'ui2-pager-current',    //当前页class
            className: '',
            pageClassName: ''    //页码class
        }, opt || {});

        this.init();
    },

    init: function(){
        var self = this, opt = self.options;

        if(opt.pageTotal == 0) return; 
        
        self.container = $('<ul class="ui2-pager">').addClass(opt.className);
        self.dom = $(opt.dom).empty().append(self.container);
        
        self.index = parseInt(opt.currentPage);
        self.createPage();
        self.initEvent();
    },

    initEvent: function(){
        var self = this;

        self.container.delegate('a', 'click', function(){
            self.to($(this).attr('data-page'));
        });
    },

    to: function(i){
        var self = this, opt = self.options;

        self.index = i ? parseInt(i < 1 ? 1 : i > opt.pageTotal ? opt.pageTotal : i ) : self.index;
        self.createPage();
        self.trigger('switch', self.index);
    },

    createPage: function(){
        var self = this, res = self.getPageResult(), opt = self.options;

        self.container.empty();

        $.each(res, function(key, value){
            var _0 = value[0], _1 = value[1], $html;

            if(!_1){
                $html = $('<li>' + _0 + '</li>').addClass('ui2-pager-point');
            }else if(_1 != self.index){
                $html = $('<li><a href="' + (opt.url ? opt.url + _1 : 'javascript:void(0);') + '" data-page="' + _1 + '">' + _0 + '</a></li>').addClass(value[2]);
            }else{  
                $html = $('<li>' + _1 + '</li>').addClass(opt.currentPageClassName);
            }

            $html.addClass(opt.pageClassName).appendTo(self.container);
        });
    },

    getPageResult: function(){
        var self = this, opt = self.options;
        var total = parseInt(opt.pageTotal), per = opt.perPage, index = this.index, start = 0, end = 0, middle = Math.ceil(per / 2), m = parseInt(per / 2);

        if(total < per){
            start = 1;
            end = total;
        }else{
            if(index <= middle){
                start = 1;
                end = per;
            }else if(index > middle){
                if(index + middle <= total){
                    start = index - middle + 1;
                    end = index + m;
                }else{
                    start = total - per + 1;
                    end = total;
                }
            }
        }

        var arr = [];

        if(index > 1){
            arr.push([opt.previous || '&lt;', index - 1, 'ui2-pager-previous']);
        }

        if(opt.showFirst){
            if(start > 2){
                arr.push(['1', 1]);
                arr.push(['&middot;&middot;&middot;']);
            }else if(start == 2){
                arr.push(['1', 1]);
            }
        }
        
        var i = start;

        while(i <= end) arr.push([i, i++]);

        if(opt.showLast){
            if(end < total - 1){
                arr.push(['&middot;&middot;&middot;']);
                arr.push([total, total]);
            }else if(end == total - 1){
                arr.push([total, total]);
            }
        }

        if(index < total){
            arr.push([opt.next || '&gt;', index + 1, 'ui2-pager-next']);
        }

        return arr;
    },

    destroy: function(){
        this.container.remove();
        this.container = null;
        this.dom = null;
    }
});

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){
var PlaceHolder = Class.$factory('placeholder', {
    initialize: function(opt){
        var self = this;

        self.options = $.extend({
            dom: null,
            text: ''
        }, opt || {});

        self.placeholder = null;
        self.dom = $(self.options.dom);
        self.initEvent();
        self.setPlaceHolder();
    },

    initEvent: function(){
        var self = this;
        
        if(!PlaceHolder.isSupport){
            self.o2s(self.dom, 'blur', function(){
                self.empty2show();
            });

            self.o2s(self.dom, 'focus', function(){
                self.placeholder.hide();
            });
        }
    },

    setPlaceHolder: function(text){
        var self = this, $dom = self.dom;
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
    },

    destroy: function(){
        var self = this;
        
        self.placeholder.remove();
        self.ofs(self.dom, 'blur focus');
        self.dom = null;
    }
});

PlaceHolder.isSupport = 'placeholder' in document.createElement('input');

return PlaceHolder;
});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){
var now = $.now;
//, Draggable = require('draggable');
var Slider = Class.$factory('slider', {
    initialize: function(opt) {
        this.options = $.extend({
            time: 1000,
            dom: null,
            cps: 1,
            maxIndex: 0,
            noGap: false,
            easing: null,
            mode: 'horizontal'
        }, opt || {});

        this.init();
    },

    init: function(){
        var self = this;
        self.index = 0;
        self.isRuning = false;
        self._start = 0;    //为了兼容日后的一个问题
        self.mode = Slider.getMode(self.options.mode);
        self.dom = $(self.options.dom);
        
        !/absolute|fixed/.test(self.dom.css('position')) && self.dom.css('position', 'relative');

        this.refresh();
    },

    refresh: function(){
        var self = this, opt = self.options, attr = Slider.DATA_CLONE;
        self.children = self.dom.children().filter(function(){
            return this.getAttribute(attr) == null;
        });

        if(opt.noGap){
            self.dom.children('[' +  attr + ']').remove();

            var $clone = self.children.clone().prependTo(self.dom).attr(attr, '');
            $clone.clone().appendTo(self.dom);

            self._start = self.children.length;
        }

        self.max = self.getMaxIndex();
        self.count = self.max + 1;
        self.all = self.dom.children();
        self._startPosition = self.getTargetValue(0, true);
        self.dom.css(self.mode, self.getTargetValue(self.index));
    },

    to: function(index, time, uncheck){
        var self = this;

        if(self.isRuning || !uncheck && self.index == index) return;

        if(!self.options.noGap){
            if(index < 0 || index > self.max) return;

            self.start(self.index = index, time);
        }else{
            self._index = index;
            self.index = index % self.count;

            if(self.index < 0){
                self.index = self.count + index;
            }

            self.start(index, time);
        }
    },

    start: function(index, time){
        var self = this, opt = self.options, obj = {};

        obj[self.mode] = self.getTargetValue(index);

        self.isRuning = true;
        self.trigger('before');

        self._duration = time || opt.time;
        self._startTime = now();
        self.dom.animate(obj, self._duration, opt.easing, function(){
            if(index != self.index){
                self.dom.css(self.mode, self.getTargetValue(self.index));
            }
            
            self.isRuning = false;
            self.trigger('after');
        });
    },

    stop: function(){
        this.dom.stop();
        this.isRuning = false;
    },

    pause: function(){
        this._endTime = now();
        this.stop();
    },

    resume: function(){
        var self = this, time;

        time = Math.max(1, self._duration - (self._endTime - self._startTime));
        self.start(self.options.noGap ? self._index : self.index, time);
    },

    toNext: function(){
        this.to(this.index + 1);
    },

    toPrev: function(){
        this.to(this.index - 1);
    },

    toFirst: function(){
        this.to(0);
    },

    toLast: function(){
        this.to(this.max);
    },

    isFirst: function(){
        return this.index == 0;
    },

    isLast: function(){
        return this.index == this.max;
    },

    getMaxIndex: function(){
        var self = this, opts = self.options;

        return !opts.noGap && opts.maxIndex ? opts.maxIndex : Math.ceil(self.children.length / self.options.cps) - 1;
    },

    getChildren: function(index, noGap){
        var self = this;
        return self.all.eq((noGap ? 0 : self._start) + index * self.options.cps);
    },

    getTargetValue: function(index, noGap){
        var self = this;
        return -self.getChildren(index, noGap).position()[self.mode] - (self._startPosition || 0);
    }
});

$.extend(Slider, {
    DATA_CLONE: 'data-slider-clone',

    getMode: function(mode){
        return mode == 'horizontal' ? 'left' : 'top';
    }
});

return Slider;

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass, window.jQuery.util);
})(function($, Class, Util){
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
        self.cache = {};
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

            var data = self.data, cache = opts.caching && !(!$.trim(kw) && opts.emptyNoCache) ? self.cache[kw] : false;
            
            if(data){
                if(opts.dataField){
                    data = Util.object.get(data, opts.dataField) || [];
                }

                if((data = self._match.call(self, data, kw)).length){
                    //if kw can be find in local data
                    self.build(data, kw);
                }
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
                    
                    data = self.cache[kw] = self._match.call(self, data, kw);
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

// Suggestion.cache = {};

Suggestion.isUDEvent = function(e){
    return e.keyCode == 38 || e.keyCode == 40;
};

return Suggestion;

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){
return Class.$factory('tabs', {
    initialize: function(opt){
        this.options = $.extend({
            dom: null,
            selecter: '> *',
            targetAttr: 'data-target',
            currentClass: '',
            currentIndex: 0,
            event: 'click'
        }, opt || {});

        this.init();
    },

    init: function(){
        var self = this, opts = self.options;

        self.doms = $(opts.selecter, opts.dom);
        self.initTargets();
        self.initEvent();
        self.to(opts.currentIndex);
    },

    refresh: function(){
        this.releaseDoms();
        this.init();
    },

    releaseDoms: function(){
        var self = this;

        self.doms && self.ofs(self.doms, self.options.event);
        self.targets.length = 0;
    },

    initTargets: function(){
        var self = this, attr = self.options.targetAttr;

        self.targets = [];

        self.doms.each(function(){
            self.targets.push(document.getElementById($(this).attr(attr)));
        });
    },
    
    initEvent: function(){
        var self = this, opts = self.options, currentClass = opts.currentClass;

        self.doms.each(function(index, item){
            self.o2s(this, opts.event, function(){
                $.each(self.targets, function(){
                    $(this).hide();
                });

                self.targets[index] && $(self.targets[index]).show();

                if(currentClass){
                    self.doms.removeClass(currentClass);
                    $(this).addClass(currentClass);
                }

                self.trigger('switch', index);

                return false;
            });
        });
    },
    
    to: function(index){
        var self = this, index = index || 0;

        if(index > self.doms.length - 1) return false;
        
        self.t2s(self.doms.eq(index), self.options.event);
    }
});
});
;;(function(factory){
	this.template = factory();

    if(typeof jQuery != 'undefined'){
        jQuery.template = this.template;
    }
})(function(){

return {
    REG: /(')|([\r\n]+)|<%(=?)([\s\S]*?)%>/g,

    fetch: function(id, data){
        var elem = document.getElementById(id);
        return this.parse(elem.value || elem.innerHTML, data);
    },

    parse: function(content, data){
        try{
            var tmp = this.parseSyntax(content);
            return (new Function('__d__', '__r__', tmp))(data, []);
        }catch(e){
            console && console.log(content, tmp);
            throw new Error(e.message);
        }
    },

    parseSyntax: function(content){
        return "with(__d__){__r__.push('" 
                + 
                content.replace(this.REG, function(_0, _1, _2, _3, _4){
                    return _1 ? "\\'" : _2 ? "" : _3 ? "'," + _4 + ",'" : "'); \r\n" + _4 + "; \r\n__r__.push('";
                }) 
                + 
                "');}return __r__.join('');";
    }
};

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass, window.jQuery.fn.dialog);
})(function($, Class, Dialog){
var Tips = $.tips = Class.extend('Event', {
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

});;;(function(factory){
	factory(window.jQuery, window.jQuery.klass);
})(function($, Class){
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

});;/*
SWFObject v2.2 <http://code.google.com/p/swfobject/> 
is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/


;var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;
if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;
X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);
ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0;}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");
if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)];}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac};
}(),k=function(){if(!M.w3){return;}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f();
}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false);}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);
f();}});if(O==top){(function(){if(J){return;}try{j.documentElement.doScroll("left");}catch(X){setTimeout(arguments.callee,0);return;}f();})();}}if(M.wk){(function(){if(J){return;
}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return;}f();})();}s(f);}}();function f(){if(J){return;}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));
Z.parentNode.removeChild(Z);}catch(aa){return;}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]();}}function K(X){if(J){X();}else{U[U.length]=X;}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false);
}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false);}else{if(typeof O.attachEvent!=D){i(O,"onload",Y);}else{if(typeof O.onload=="function"){var X=O.onload;
O.onload=function(){X();Y();};}else{O.onload=Y;}}}}}function h(){if(T){V();}else{H();}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);
aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");
M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)];}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return;}}X.removeChild(aa);Z=null;H();
})();}else{H();}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);
if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa);}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;
ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class");}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align");
}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value");
}}P(ai,ah,Y,ab);}else{p(ae);if(ab){ab(aa);}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z;}ab(aa);}}}}}function z(aa){var X=null;
var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y;}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z;}}}return X;}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312);
}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null;}else{l=ae;Q=X;}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310";
}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137";}j.title=j.title.slice(0,47)+" - Flash Player Installation";
var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac;
}else{ab.flashvars=ac;}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";
(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae);}else{setTimeout(arguments.callee,10);}})();}u(aa,ab,X);}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");
Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y);}else{setTimeout(arguments.callee,10);
}})();}else{Y.parentNode.replaceChild(g(Y),Y);}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML;}else{var Y=ab.getElementsByTagName(r)[0];
if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true));
}}}}}return aa;}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X;}if(aa){if(typeof ai.id==D){ai.id=Y;}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae];
}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"';}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"';}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />';
}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id);}else{var Z=C(r);Z.setAttribute("type",q);
for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac]);}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac]);
}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab]);}}aa.parentNode.replaceChild(Z,aa);X=Z;}}return X;}function e(Z,X,Y){var aa=C("param");
aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa);}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";
(function(){if(X.readyState==4){b(Y);}else{setTimeout(arguments.callee,10);}})();}else{X.parentNode.removeChild(X);}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null;
}}Y.parentNode.removeChild(Y);}}function c(Z){var X=null;try{X=j.getElementById(Z);}catch(Y){}return X;}function C(X){return j.createElement(X);}function i(Z,X,Y){Z.attachEvent(X,Y);
I[I.length]=[Z,X,Y];}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false;
}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return;}var aa=j.getElementsByTagName("head")[0];if(!aa){return;}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;
G=null;}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1];
}G=X;}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y);}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"));
}}}function w(Z,X){if(!m){return;}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y;}else{v("#"+Z,"visibility:"+Y);}}function L(Y){var Z=/[\\\"<>\.;]/;
var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y;}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;
for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2]);}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa]);}for(var Y in M){M[Y]=null;}M=null;for(var X in swfobject){swfobject[X]=null;
}swfobject=null;});}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;
w(ab,false);}else{if(Z){Z({success:false,id:ab});}}},getObjectById:function(X){if(M.w3){return z(X);}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};
if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al];}}aj.data=ab;
aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak];}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai];
}else{am.flashvars=ai+"="+Z[ai];}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true);}X.success=true;X.ref=an;}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);
return;}else{w(ah,true);}}if(ac){ac(X);}});}else{if(ac){ac(X);}}},switchOffAutoHideShow:function(){m=false;},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]};
},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X);}else{return undefined;}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y);
}},removeSWF:function(X){if(M.w3){y(X);}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X);}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;
if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1];}if(aa==null){return L(Z);}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)));
}}}return"";},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block";
}}if(E){E(B);}}a=false;}}};}();

/*
SWFUpload: http://www.swfupload.org, http://swfupload.googlecode.com

mmSWFUpload 1.0: Flash upload dialog - http://profandesign.se/swfupload/,  http://www.vinterwebb.se/

SWFUpload is (c) 2006-2007 Lars Huring, Olov Nilzén and Mammon Media and is released under the MIT License:
http://www.opensource.org/licenses/mit-license.php
 
SWFUpload 2 is (c) 2007-2008 Jake Roberts and is released under the MIT License:
http://www.opensource.org/licenses/mit-license.php
*/
/*
        [Leo.C, Studio] (C)2004 - 2008
        
           $Hanization: LeoChung $
           $E-Mail: who@imll.net $
           $HomePage: http://imll.net $
           $Date: 2008/11/8 18:02 $
*/
/**
 * SWFUpload: http://www.swfupload.org, http://swfupload.googlecode.com
 *
 * mmSWFUpload 1.0: Flash upload dialog - http://profandesign.se/swfupload/,  http://www.vinterwebb.se/
 *
 * SWFUpload is (c) 2006-2007 Lars Huring, Olov Nilzén and Mammon Media and is released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * SWFUpload 2 is (c) 2007-2008 Jake Roberts and is released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */


/* ******************* */
/* Constructor & Init  */
/* ******************* */
var SWFUpload;

if (SWFUpload == undefined) {
    SWFUpload = function (settings) {
        this.initSWFUpload(settings);
    };
}

SWFUpload.prototype.initSWFUpload = function (settings) {
    try {
        this.customSettings = {};    // A container where developers can place their own settings associated with this instance.
        this.settings = settings;
        this.eventQueue = [];
        this.movieName = "SWFUpload_" + SWFUpload.movieCount++;
        this.movieElement = null;

        // Setup global control tracking
        SWFUpload.instances[this.movieName] = this;

        // Load the settings.  Load the Flash movie.
        this.initSettings();
        this.loadFlash();
        this.displayDebugInfo();
    } catch (ex) {
        delete SWFUpload.instances[this.movieName];
        throw ex;
    }
};

/* *************** */
/* Static Members  */
/* *************** */
SWFUpload.instances = {};
SWFUpload.movieCount = 0;
SWFUpload.version = "2.2.0 Beta 2";
SWFUpload.QUEUE_ERROR = {
    QUEUE_LIMIT_EXCEEDED              : -100,
    FILE_EXCEEDS_SIZE_LIMIT          : -110,
    ZERO_BYTE_FILE                      : -120,
    INVALID_FILETYPE                  : -130
};
SWFUpload.UPLOAD_ERROR = {
    HTTP_ERROR                          : -200,
    MISSING_UPLOAD_URL                  : -210,
    IO_ERROR                          : -220,
    SECURITY_ERROR                      : -230,
    UPLOAD_LIMIT_EXCEEDED              : -240,
    UPLOAD_FAILED                      : -250,
    SPECIFIED_FILE_ID_NOT_FOUND        : -260,
    FILE_VALIDATION_FAILED              : -270,
    FILE_CANCELLED                      : -280,
    UPLOAD_STOPPED                    : -290
};
SWFUpload.FILE_STATUS = {
    QUEUED         : -1,
    IN_PROGRESS     : -2,
    ERROR         : -3,
    COMPLETE     : -4,
    CANCELLED     : -5
};
SWFUpload.BUTTON_ACTION = {
    SELECT_FILE  : -100,
    SELECT_FILES : -110,
    START_UPLOAD : -120
};
SWFUpload.CURSOR = {
    ARROW : -1,
    HAND : -2
};
SWFUpload.WINDOW_MODE = {
    WINDOW : "window",
    TRANSPARENT : "transparent",
    OPAQUE : "opaque"
};

/* ******************** */
/* Instance Members  */
/* ******************** */

// Private: initSettings ensures that all the
// settings are set, getting a default value if one was not assigned.
SWFUpload.prototype.initSettings = function () {
    this.ensureDefault = function (settingName, defaultValue) {
        this.settings[settingName] = (this.settings[settingName] == undefined) ? defaultValue : this.settings[settingName];
    };
    
    // Upload backend settings
    this.ensureDefault("upload_url", "");
    this.ensureDefault("file_post_name", "Filedata");
    this.ensureDefault("post_params", {});
    this.ensureDefault("use_query_string", false);
    this.ensureDefault("requeue_on_error", false);
    this.ensureDefault("http_success", []);
    
    // File Settings
    this.ensureDefault("file_types", "*.*");
    this.ensureDefault("file_types_description", "All Files");
    this.ensureDefault("file_size_limit", 0);    // Default zero means "unlimited"
    this.ensureDefault("file_upload_limit", 0);
    this.ensureDefault("file_queue_limit", 0);

    // Flash Settings
    this.ensureDefault("flash_url", "swfupload.swf");
    this.ensureDefault("prevent_swf_caching", true);
    
    // Button Settings
    this.ensureDefault("button_image_url", "");
    this.ensureDefault("button_width", 1);
    this.ensureDefault("button_height", 1);
    this.ensureDefault("button_text", "");
    this.ensureDefault("button_text_style", "color: #000000; font-size: 16pt;");
    this.ensureDefault("button_text_top_padding", 0);
    this.ensureDefault("button_text_left_padding", 0);
    this.ensureDefault("button_action", SWFUpload.BUTTON_ACTION.SELECT_FILES);
    this.ensureDefault("button_disabled", false);
    this.ensureDefault("button_placeholder_id", null);
    this.ensureDefault("button_cursor", SWFUpload.CURSOR.ARROW);
    this.ensureDefault("button_window_mode", SWFUpload.WINDOW_MODE.WINDOW);
    
    // Debug Settings
    this.ensureDefault("debug", false);
    this.settings.debug_enabled = this.settings.debug;    // Here to maintain v2 API
    
    // Event Handlers
    this.settings.return_upload_start_handler = this.returnUploadStart;
    this.ensureDefault("swfupload_loaded_handler", null);
    this.ensureDefault("file_dialog_start_handler", null);
    this.ensureDefault("file_queued_handler", null);
    this.ensureDefault("file_queue_error_handler", null);
    this.ensureDefault("file_dialog_complete_handler", null);
    
    this.ensureDefault("upload_start_handler", null);
    this.ensureDefault("upload_progress_handler", null);
    this.ensureDefault("upload_error_handler", null);
    this.ensureDefault("upload_success_handler", null);
    this.ensureDefault("upload_complete_handler", null);
    
    this.ensureDefault("debug_handler", this.debugMessage);

    this.ensureDefault("custom_settings", {});

    // Other settings
    this.customSettings = this.settings.custom_settings;
    
    // Update the flash url if needed
    if (this.settings.prevent_swf_caching) {
        this.settings.flash_url = this.settings.flash_url + "?swfuploadrnd=" + Math.floor(Math.random() * 999999999);
    }
    
    delete this.ensureDefault;
};

SWFUpload.prototype.loadFlash = function () {
    if (this.settings.button_placeholder_id !== "") {
        this.replaceWithFlash();
    } else {
        this.appendFlash();
    }
};

// Private: appendFlash gets the HTML tag for the Flash
// It then appends the flash to the body
SWFUpload.prototype.appendFlash = function () {
    var targetElement, container;

    // Make sure an element with the ID we are going to use doesn't already exist
    if (document.getElementById(this.movieName) !== null) {
        throw "ID " + this.movieName + " is already in use. The Flash Object could not be added";
    }

    // Get the body tag where we will be adding the flash movie
    targetElement = document.getElementsByTagName("body")[0];

    if (targetElement == undefined) {
        throw "Could not find the 'body' element.";
    }

    // Append the container and load the flash
    container = document.createElement("div");
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.overflow = "hidden";

    targetElement.appendChild(container);
    container.innerHTML = this.getFlashHTML();    // Using innerHTML is non-standard but the only sensible way to dynamically add Flash in IE (and maybe other browsers)
};

// Private: replaceWithFlash replaces the button_placeholder element with the flash movie.
SWFUpload.prototype.replaceWithFlash = function () {
    var targetElement, tempParent;

    // Make sure an element with the ID we are going to use doesn't already exist
    if (document.getElementById(this.movieName) !== null) {
        throw "ID " + this.movieName + " is already in use. The Flash Object could not be added";
    }

    // Get the element where we will be placing the flash movie
    targetElement = document.getElementById(this.settings.button_placeholder_id);

    if (targetElement == undefined) {
        throw "Could not find the placeholder element.";
    }

    // Append the container and load the flash
    tempParent = document.createElement("div");
    tempParent.innerHTML = this.getFlashHTML();    // Using innerHTML is non-standard but the only sensible way to dynamically add Flash in IE (and maybe other browsers)
    targetElement.parentNode.replaceChild(tempParent.firstChild, targetElement);

};

// Private: getFlashHTML generates the object tag needed to embed the flash in to the document
SWFUpload.prototype.getFlashHTML = function () {
    // Flash Satay object syntax: http://www.alistapart.com/articles/flashsatay
    return ['<object id="', this.movieName, '" type="application/x-shockwave-flash" data="', this.settings.flash_url, '" width="', this.settings.button_width, '" height="', this.settings.button_height, '" class="swfupload">',
                '<param name="wmode" value="', this.settings.button_window_mode , '" />',
                '<param name="movie" value="', this.settings.flash_url, '" />',
                '<param name="quality" value="high" />',
                '<param name="menu" value="false" />',
                '<param name="allowScriptAccess" value="always" />',
                '<param name="flashvars" value="' + this.getFlashVars() + '" />',
                '</object>'].join("");
};

// Private: getFlashVars builds the parameter string that will be passed
// to flash in the flashvars param.
SWFUpload.prototype.getFlashVars = function () {
    // Build a string from the post param object
    var paramString = this.buildParamString();
    var httpSuccessString = this.settings.http_success.join(",");
    
    // Build the parameter string
    return ["movieName=", encodeURIComponent(this.movieName),
            "&amp;uploadURL=", encodeURIComponent(this.settings.upload_url),
            "&amp;useQueryString=", encodeURIComponent(this.settings.use_query_string),
            "&amp;requeueOnError=", encodeURIComponent(this.settings.requeue_on_error),
            "&amp;httpSuccess=", encodeURIComponent(httpSuccessString),
            "&amp;params=", encodeURIComponent(paramString),
            "&amp;filePostName=", encodeURIComponent(this.settings.file_post_name),
            "&amp;fileTypes=", encodeURIComponent(this.settings.file_types),
            "&amp;fileTypesDescription=", encodeURIComponent(this.settings.file_types_description),
            "&amp;fileSizeLimit=", encodeURIComponent(this.settings.file_size_limit),
            "&amp;fileUploadLimit=", encodeURIComponent(this.settings.file_upload_limit),
            "&amp;fileQueueLimit=", encodeURIComponent(this.settings.file_queue_limit),
            "&amp;debugEnabled=", encodeURIComponent(this.settings.debug_enabled),
            "&amp;buttonImageURL=", encodeURIComponent(this.settings.button_image_url),
            "&amp;buttonWidth=", encodeURIComponent(this.settings.button_width),
            "&amp;buttonHeight=", encodeURIComponent(this.settings.button_height),
            "&amp;buttonText=", encodeURIComponent(this.settings.button_text),
            "&amp;buttonTextTopPadding=", encodeURIComponent(this.settings.button_text_top_padding),
            "&amp;buttonTextLeftPadding=", encodeURIComponent(this.settings.button_text_left_padding),
            "&amp;buttonTextStyle=", encodeURIComponent(this.settings.button_text_style),
            "&amp;buttonAction=", encodeURIComponent(this.settings.button_action),
            "&amp;buttonDisabled=", encodeURIComponent(this.settings.button_disabled),
            "&amp;buttonCursor=", encodeURIComponent(this.settings.button_cursor)
        ].join("");
};

// Public: getMovieElement retrieves the DOM reference to the Flash element added by SWFUpload
// The element is cached after the first lookup
SWFUpload.prototype.getMovieElement = function () {
    if (this.movieElement == undefined) {
        this.movieElement = document.getElementById(this.movieName);
    }

    if (this.movieElement === null) {
        throw "Could not find Flash element";
    }
    
    return this.movieElement;
};

// Private: buildParamString takes the name/value pairs in the post_params setting object
// and joins them up in to a string formatted "name=value&amp;name=value"
SWFUpload.prototype.buildParamString = function () {
    var postParams = this.settings.post_params; 
    var paramStringPairs = [];

    if (typeof(postParams) === "object") {
        for (var name in postParams) {
            if (postParams.hasOwnProperty(name)) {
                paramStringPairs.push(encodeURIComponent(name.toString()) + "=" + encodeURIComponent(postParams[name].toString()));
            }
        }
    }

    return paramStringPairs.join("&amp;");
};

// Public: Used to remove a SWFUpload instance from the page. This method strives to remove
// all references to the SWF, and other objects so memory is properly freed.
// Returns true if everything was destroyed. Returns a false if a failure occurs leaving SWFUpload in an inconsistant state.
SWFUpload.prototype.destroy = function () {
    try {
        // Make sure Flash is done before we try to remove it
        this.stopUpload();
        
        // Remove the SWFUpload DOM nodes
        var movieElement = null;
        try {
            movieElement = this.getMovieElement();
        } catch (ex) {
        }
        
        if (movieElement != undefined && movieElement.parentNode != undefined && typeof movieElement.parentNode.removeChild === "function") {
            var container = movieElement.parentNode;
            if (container != undefined) {
                container.removeChild(movieElement);
                if (container.parentNode != undefined && typeof container.parentNode.removeChild === "function") {
                    container.parentNode.removeChild(container);
                }
            }
        }
        
        // Destroy references
        SWFUpload.instances[this.movieName] = null;
        delete SWFUpload.instances[this.movieName];

        delete this.movieElement;
        delete this.settings;
        delete this.customSettings;
        delete this.eventQueue;
        delete this.movieName;
        
        delete window[this.movieName];
        
        return true;
    } catch (ex1) {
        return false;
    }
};

// Public: displayDebugInfo prints out settings and configuration
// information about this SWFUpload instance.
// This function (and any references to it) can be deleted when placing
// SWFUpload in production.
SWFUpload.prototype.displayDebugInfo = function () {
    this.debug(
        [
            "---SWFUpload Instance Info---\n",
            "Version: ", SWFUpload.version, "\n",
            "Movie Name: ", this.movieName, "\n",
            "Settings:\n",
            "\t", "upload_url:               ", this.settings.upload_url, "\n",
            "\t", "flash_url:                ", this.settings.flash_url, "\n",
            "\t", "use_query_string:         ", this.settings.use_query_string.toString(), "\n",
            "\t", "requeue_on_error:         ", this.settings.requeue_on_error.toString(), "\n",
            "\t", "http_success:             ", this.settings.http_success.join(", "), "\n",
            "\t", "file_post_name:           ", this.settings.file_post_name, "\n",
            "\t", "post_params:              ", this.settings.post_params.toString(), "\n",
            "\t", "file_types:               ", this.settings.file_types, "\n",
            "\t", "file_types_description:   ", this.settings.file_types_description, "\n",
            "\t", "file_size_limit:          ", this.settings.file_size_limit, "\n",
            "\t", "file_upload_limit:        ", this.settings.file_upload_limit, "\n",
            "\t", "file_queue_limit:         ", this.settings.file_queue_limit, "\n",
            "\t", "debug:                    ", this.settings.debug.toString(), "\n",

            "\t", "prevent_swf_caching:      ", this.settings.prevent_swf_caching.toString(), "\n",

            "\t", "button_placeholder_id:    ", this.settings.button_placeholder_id.toString(), "\n",
            "\t", "button_image_url:         ", this.settings.button_image_url.toString(), "\n",
            "\t", "button_width:             ", this.settings.button_width.toString(), "\n",
            "\t", "button_height:            ", this.settings.button_height.toString(), "\n",
            "\t", "button_text:              ", this.settings.button_text.toString(), "\n",
            "\t", "button_text_style:        ", this.settings.button_text_style.toString(), "\n",
            "\t", "button_text_top_padding:  ", this.settings.button_text_top_padding.toString(), "\n",
            "\t", "button_text_left_padding: ", this.settings.button_text_left_padding.toString(), "\n",
            "\t", "button_action:            ", this.settings.button_action.toString(), "\n",
            "\t", "button_disabled:          ", this.settings.button_disabled.toString(), "\n",

            "\t", "custom_settings:          ", this.settings.custom_settings.toString(), "\n",
            "Event Handlers:\n",
            "\t", "swfupload_loaded_handler assigned:  ", (typeof this.settings.swfupload_loaded_handler === "function").toString(), "\n",
            "\t", "file_dialog_start_handler assigned: ", (typeof this.settings.file_dialog_start_handler === "function").toString(), "\n",
            "\t", "file_queued_handler assigned:       ", (typeof this.settings.file_queued_handler === "function").toString(), "\n",
            "\t", "file_queue_error_handler assigned:  ", (typeof this.settings.file_queue_error_handler === "function").toString(), "\n",
            "\t", "upload_start_handler assigned:      ", (typeof this.settings.upload_start_handler === "function").toString(), "\n",
            "\t", "upload_progress_handler assigned:   ", (typeof this.settings.upload_progress_handler === "function").toString(), "\n",
            "\t", "upload_error_handler assigned:      ", (typeof this.settings.upload_error_handler === "function").toString(), "\n",
            "\t", "upload_success_handler assigned:    ", (typeof this.settings.upload_success_handler === "function").toString(), "\n",
            "\t", "upload_complete_handler assigned:   ", (typeof this.settings.upload_complete_handler === "function").toString(), "\n",
            "\t", "debug_handler assigned:             ", (typeof this.settings.debug_handler === "function").toString(), "\n"
        ].join("")
    );
};

/* Note: addSetting and getSetting are no longer used by SWFUpload but are included
    the maintain v2 API compatibility
*/
// Public: (Deprecated) addSetting adds a setting value. If the value given is undefined or null then the default_value is used.
SWFUpload.prototype.addSetting = function (name, value, default_value) {
    if (value == undefined) {
        return (this.settings[name] = default_value);
    } else {
        return (this.settings[name] = value);
    }
};

// Public: (Deprecated) getSetting gets a setting. Returns an empty string if the setting was not found.
SWFUpload.prototype.getSetting = function (name) {
    if (this.settings[name] != undefined) {
        return this.settings[name];
    }

    return "";
};



// Private: callFlash handles function calls made to the Flash element.
// Calls are made with a setTimeout for some functions to work around
// bugs in the ExternalInterface library.
SWFUpload.prototype.callFlash = function (functionName, argumentArray) {
    argumentArray = argumentArray || [];
    
    var movieElement = this.getMovieElement();
    var returnValue;

    if (typeof movieElement[functionName] === "function") {
        // We have to go through all this if/else stuff because the Flash functions don't have apply() and only accept the exact number of arguments.
        if (argumentArray.length === 0) {
            returnValue = movieElement[functionName]();
        } else if (argumentArray.length === 1) {
            returnValue = movieElement[functionName](argumentArray[0]);
        } else if (argumentArray.length === 2) {
            returnValue = movieElement[functionName](argumentArray[0], argumentArray[1]);
        } else if (argumentArray.length === 3) {
            returnValue = movieElement[functionName](argumentArray[0], argumentArray[1], argumentArray[2]);
        } else {
            throw "Too many arguments";
        }
        
        // Unescape file post param values
        if (returnValue != undefined && typeof returnValue.post === "object") {
            returnValue = this.unescapeFilePostParams(returnValue);
        }
        
        return returnValue;
    } else {
        throw "Invalid function name: " + functionName;
    }
};


/* *****************************
    -- Flash control methods --
    Your UI should use these
    to operate SWFUpload
   ***************************** */

// Public: selectFile causes a File Selection Dialog window to appear.  This
// dialog only allows 1 file to be selected. WARNING: this function does not work in Flash Player 10
SWFUpload.prototype.selectFile = function () {
    this.callFlash("SelectFile");
};

// Public: selectFiles causes a File Selection Dialog window to appear/ This
// dialog allows the user to select any number of files
// Flash Bug Warning: Flash limits the number of selectable files based on the combined length of the file names.
// If the selection name length is too long the dialog will fail in an unpredictable manner.  There is no work-around
// for this bug.  WARNING: this function does not work in Flash Player 10
SWFUpload.prototype.selectFiles = function () {
    this.callFlash("SelectFiles");
};


// Public: startUpload starts uploading the first file in the queue unless
// the optional parameter 'fileID' specifies the ID 
SWFUpload.prototype.startUpload = function (fileID) {
    this.callFlash("StartUpload", [fileID]);
};

// Public: cancelUpload cancels any queued file.  The fileID parameter may be the file ID or index.
// If you do not specify a fileID the current uploading file or first file in the queue is cancelled.
// If you do not want the uploadError event to trigger you can specify false for the triggerErrorEvent parameter.
SWFUpload.prototype.cancelUpload = function (fileID, triggerErrorEvent) {
    if (triggerErrorEvent !== false) {
        triggerErrorEvent = true;
    }
    this.callFlash("CancelUpload", [fileID, triggerErrorEvent]);
};

// Public: stopUpload stops the current upload and requeues the file at the beginning of the queue.
// If nothing is currently uploading then nothing happens.
SWFUpload.prototype.stopUpload = function () {
    this.callFlash("StopUpload");
};

/* ************************
 * Settings methods
 *   These methods change the SWFUpload settings.
 *   SWFUpload settings should not be changed directly on the settings object
 *   since many of the settings need to be passed to Flash in order to take
 *   effect.
 * *********************** */

// Public: getStats gets the file statistics object.
SWFUpload.prototype.getStats = function () {
    return this.callFlash("GetStats");
};

// Public: setStats changes the SWFUpload statistics.  You shouldn't need to 
// change the statistics but you can.  Changing the statistics does not
// affect SWFUpload accept for the successful_uploads count which is used
// by the upload_limit setting to determine how many files the user may upload.
SWFUpload.prototype.setStats = function (statsObject) {
    this.callFlash("SetStats", [statsObject]);
};

// Public: getFile retrieves a File object by ID or Index.  If the file is
// not found then 'null' is returned.
SWFUpload.prototype.getFile = function (fileID) {
    if (typeof(fileID) === "number") {
        return this.callFlash("GetFileByIndex", [fileID]);
    } else {
        return this.callFlash("GetFile", [fileID]);
    }
};

// Public: addFileParam sets a name/value pair that will be posted with the
// file specified by the Files ID.  If the name already exists then the
// exiting value will be overwritten.
SWFUpload.prototype.addFileParam = function (fileID, name, value) {
    return this.callFlash("AddFileParam", [fileID, name, value]);
};

// Public: removeFileParam removes a previously set (by addFileParam) name/value
// pair from the specified file.
SWFUpload.prototype.removeFileParam = function (fileID, name) {
    this.callFlash("RemoveFileParam", [fileID, name]);
};

// Public: setUploadUrl changes the upload_url setting.
SWFUpload.prototype.setUploadURL = function (url) {
    this.settings.upload_url = url.toString();
    this.callFlash("SetUploadURL", [url]);
};

// Public: setPostParams changes the post_params setting
SWFUpload.prototype.setPostParams = function (paramsObject) {
    this.settings.post_params = paramsObject;
    this.callFlash("SetPostParams", [paramsObject]);
};

// Public: addPostParam adds post name/value pair.  Each name can have only one value.
SWFUpload.prototype.addPostParam = function (name, value) {
    this.settings.post_params[name] = value;
    this.callFlash("SetPostParams", [this.settings.post_params]);
};

// Public: removePostParam deletes post name/value pair.
SWFUpload.prototype.removePostParam = function (name) {
    delete this.settings.post_params[name];
    this.callFlash("SetPostParams", [this.settings.post_params]);
};

// Public: setFileTypes changes the file_types setting and the file_types_description setting
SWFUpload.prototype.setFileTypes = function (types, description) {
    this.settings.file_types = types;
    this.settings.file_types_description = description;
    this.callFlash("SetFileTypes", [types, description]);
};

// Public: setFileSizeLimit changes the file_size_limit setting
SWFUpload.prototype.setFileSizeLimit = function (fileSizeLimit) {
    this.settings.file_size_limit = fileSizeLimit;
    this.callFlash("SetFileSizeLimit", [fileSizeLimit]);
};

// Public: setFileUploadLimit changes the file_upload_limit setting
SWFUpload.prototype.setFileUploadLimit = function (fileUploadLimit) {
    this.settings.file_upload_limit = fileUploadLimit;
    this.callFlash("SetFileUploadLimit", [fileUploadLimit]);
};

// Public: setFileQueueLimit changes the file_queue_limit setting
SWFUpload.prototype.setFileQueueLimit = function (fileQueueLimit) {
    this.settings.file_queue_limit = fileQueueLimit;
    this.callFlash("SetFileQueueLimit", [fileQueueLimit]);
};

// Public: setFilePostName changes the file_post_name setting
SWFUpload.prototype.setFilePostName = function (filePostName) {
    this.settings.file_post_name = filePostName;
    this.callFlash("SetFilePostName", [filePostName]);
};

// Public: setUseQueryString changes the use_query_string setting
SWFUpload.prototype.setUseQueryString = function (useQueryString) {
    this.settings.use_query_string = useQueryString;
    this.callFlash("SetUseQueryString", [useQueryString]);
};

// Public: setRequeueOnError changes the requeue_on_error setting
SWFUpload.prototype.setRequeueOnError = function (requeueOnError) {
    this.settings.requeue_on_error = requeueOnError;
    this.callFlash("SetRequeueOnError", [requeueOnError]);
};

// Public: setHTTPSuccess changes the http_success setting
SWFUpload.prototype.setHTTPSuccess = function (http_status_codes) {
    if (typeof http_status_codes === "string") {
        http_status_codes = http_status_codes.replace(" ", "").split(",");
    }
    
    this.settings.http_success = http_status_codes;
    this.callFlash("SetHTTPSuccess", [http_status_codes]);
};


// Public: setDebugEnabled changes the debug_enabled setting
SWFUpload.prototype.setDebugEnabled = function (debugEnabled) {
    this.settings.debug_enabled = debugEnabled;
    this.callFlash("SetDebugEnabled", [debugEnabled]);
};

// Public: setButtonImageURL loads a button image sprite
SWFUpload.prototype.setButtonImageURL = function (buttonImageURL) {
    if (buttonImageURL == undefined) {
        buttonImageURL = "";
    }
    
    this.settings.button_image_url = buttonImageURL;
    this.callFlash("SetButtonImageURL", [buttonImageURL]);
};

// Public: setButtonDimensions resizes the Flash Movie and button
SWFUpload.prototype.setButtonDimensions = function (width, height) {
    this.settings.button_width = width;
    this.settings.button_height = height;
    
    var movie = this.getMovieElement();
    if (movie != undefined) {
        movie.style.width = width + "px";
        movie.style.height = height + "px";
    }
    
    this.callFlash("SetButtonDimensions", [width, height]);
};
// Public: setButtonText Changes the text overlaid on the button
SWFUpload.prototype.setButtonText = function (html) {
    this.settings.button_text = html;
    this.callFlash("SetButtonText", [html]);
};
// Public: setButtonTextPadding changes the top and left padding of the text overlay
SWFUpload.prototype.setButtonTextPadding = function (left, top) {
    this.settings.button_text_top_padding = top;
    this.settings.button_text_left_padding = left;
    this.callFlash("SetButtonTextPadding", [left, top]);
};

// Public: setButtonTextStyle changes the CSS used to style the HTML/Text overlaid on the button
SWFUpload.prototype.setButtonTextStyle = function (css) {
    this.settings.button_text_style = css;
    this.callFlash("SetButtonTextStyle", [css]);
};
// Public: setButtonDisabled disables/enables the button
SWFUpload.prototype.setButtonDisabled = function (isDisabled) {
    this.settings.button_disabled = isDisabled;
    this.callFlash("SetButtonDisabled", [isDisabled]);
};
// Public: setButtonAction sets the action that occurs when the button is clicked
SWFUpload.prototype.setButtonAction = function (buttonAction) {
    this.settings.button_action = buttonAction;
    this.callFlash("SetButtonAction", [buttonAction]);
};

// Public: setButtonCursor changes the mouse cursor displayed when hovering over the button
SWFUpload.prototype.setButtonCursor = function (cursor) {
    this.settings.button_cursor = cursor;
    this.callFlash("SetButtonCursor", [cursor]);
};

/* *******************************
    Flash Event Interfaces
    These functions are used by Flash to trigger the various
    events.
    
    All these functions a Private.
    
    Because the ExternalInterface library is buggy the event calls
    are added to a queue and the queue then executed by a setTimeout.
    This ensures that events are executed in a determinate order and that
    the ExternalInterface bugs are avoided.
******************************* */

SWFUpload.prototype.queueEvent = function (handlerName, argumentArray) {
    // Warning: Don't call this.debug inside here or you'll create an infinite loop
    
    if (argumentArray == undefined) {
        argumentArray = [];
    } else if (!(argumentArray instanceof Array)) {
        argumentArray = [argumentArray];
    }
    
    var self = this;
    if (typeof this.settings[handlerName] === "function") {
        // Queue the event
        this.eventQueue.push(function () {
            this.settings[handlerName].apply(this, argumentArray);
        });
        
        // Execute the next queued event
        setTimeout(function () {
            self.executeNextEvent();
        }, 0);
        
    } else if (this.settings[handlerName] !== null) {
        throw "Event handler " + handlerName + " is unknown or is not a function";
    }
};

// Private: Causes the next event in the queue to be executed.  Since events are queued using a setTimeout
// we must queue them in order to garentee that they are executed in order.
SWFUpload.prototype.executeNextEvent = function () {
    // Warning: Don't call this.debug inside here or you'll create an infinite loop

    var  f = this.eventQueue ? this.eventQueue.shift() : null;
    if (typeof(f) === "function") {
        f.apply(this);
    }
};

// Private: unescapeFileParams is part of a workaround for a flash bug where objects passed through ExternalInterface cannot have
// properties that contain characters that are not valid for JavaScript identifiers. To work around this
// the Flash Component escapes the parameter names and we must unescape again before passing them along.
SWFUpload.prototype.unescapeFilePostParams = function (file) {
    var reg = /[$]([0-9a-f]{4})/i;
    var unescapedPost = {};
    var uk;

    if (file != undefined) {
        for (var k in file.post) {
            if (file.post.hasOwnProperty(k)) {
                uk = k;
                var match;
                while ((match = reg.exec(uk)) !== null) {
                    uk = uk.replace(match[0], String.fromCharCode(parseInt("0x" + match[1], 16)));
                }
                unescapedPost[uk] = file.post[k];
            }
        }

        file.post = unescapedPost;
    }

    return file;
};

SWFUpload.prototype.flashReady = function () {
    // Check that the movie element is loaded correctly with its ExternalInterface methods defined
    var movieElement = this.getMovieElement();
    if (typeof movieElement.StartUpload !== "function") {
        throw "ExternalInterface methods failed to initialize.";
    }

    // Fix IE Flash/Form bug
    if (window[this.movieName] == undefined) {
        window[this.movieName] = movieElement;
    }
    
    this.queueEvent("swfupload_loaded_handler");
};


/* This is a chance to do something before the browse window opens */
SWFUpload.prototype.fileDialogStart = function () {
    this.queueEvent("file_dialog_start_handler");
};


/* Called when a file is successfully added to the queue. */
SWFUpload.prototype.fileQueued = function (file) {
    file = this.unescapeFilePostParams(file);
    this.queueEvent("file_queued_handler", file);
};


/* Handle errors that occur when an attempt to queue a file fails. */
SWFUpload.prototype.fileQueueError = function (file, errorCode, message) {
    file = this.unescapeFilePostParams(file);
    this.queueEvent("file_queue_error_handler", [file, errorCode, message]);
};

/* Called after the file dialog has closed and the selected files have been queued.
    You could call startUpload here if you want the queued files to begin uploading immediately. */
SWFUpload.prototype.fileDialogComplete = function (numFilesSelected, numFilesQueued) {
    this.queueEvent("file_dialog_complete_handler", [numFilesSelected, numFilesQueued]);
};

SWFUpload.prototype.uploadStart = function (file) {
    file = this.unescapeFilePostParams(file);
    this.queueEvent("return_upload_start_handler", file);
};

SWFUpload.prototype.returnUploadStart = function (file) {
    var returnValue;
    if (typeof this.settings.upload_start_handler === "function") {
        file = this.unescapeFilePostParams(file);
        returnValue = this.settings.upload_start_handler.call(this, file);
    } else if (this.settings.upload_start_handler != undefined) {
        throw "upload_start_handler must be a function";
    }

    // Convert undefined to true so if nothing is returned from the upload_start_handler it is
    // interpretted as 'true'.
    if (returnValue === undefined) {
        returnValue = true;
    }
    
    returnValue = !!returnValue;
    
    this.callFlash("ReturnUploadStart", [returnValue]);
};



SWFUpload.prototype.uploadProgress = function (file, bytesComplete, bytesTotal) {
    file = this.unescapeFilePostParams(file);
    this.queueEvent("upload_progress_handler", [file, bytesComplete, bytesTotal]);
};

SWFUpload.prototype.uploadError = function (file, errorCode, message) {
    file = this.unescapeFilePostParams(file);
    this.queueEvent("upload_error_handler", [file, errorCode, message]);
};

SWFUpload.prototype.uploadSuccess = function (file, serverData) {
    file = this.unescapeFilePostParams(file);
    this.queueEvent("upload_success_handler", [file, serverData]);
};

SWFUpload.prototype.uploadComplete = function (file) {
    file = this.unescapeFilePostParams(file);
    this.queueEvent("upload_complete_handler", file);
};

/* Called by SWFUpload JavaScript and Flash functions when debug is enabled. By default it writes messages to the
   internal debug console.  You can override this event and have messages written where you want. */
SWFUpload.prototype.debug = function (message) {
    this.queueEvent("debug_handler", message);
};


/* **********************************
    Debug Console
    The debug console is a self contained, in page location
    for debug message to be sent.  The Debug Console adds
    itself to the body if necessary.

    The console is automatically scrolled as messages appear.
    
    If you are using your own debug handler or when you deploy to production and
    have debug disabled you can remove these functions to reduce the file size
    and complexity.
********************************** */
   
// Private: debugMessage is the default debug_handler.  If you want to print debug messages
// call the debug() function.  When overriding the function your own function should
// check to see if the debug setting is true before outputting debug information.
SWFUpload.prototype.debugMessage = function (message) {
    if (this.settings.debug) {
        var exceptionMessage, exceptionValues = [];

        // Check for an exception object and print it nicely
        if (typeof message === "object" && typeof message.name === "string" && typeof message.message === "string") {
            for (var key in message) {
                if (message.hasOwnProperty(key)) {
                    exceptionValues.push(key + ": " + message[key]);
                }
            }
            exceptionMessage = exceptionValues.join("\n") || "";
            exceptionValues = exceptionMessage.split("\n");
            exceptionMessage = "EXCEPTION: " + exceptionValues.join("\nEXCEPTION: ");
            SWFUpload.Console.writeLine(exceptionMessage);
        } else {
            SWFUpload.Console.writeLine(message);
        }
    }
};

SWFUpload.Console = {};
SWFUpload.Console.writeLine = function (message) {
    var console, documentForm;

    try {
        console = document.getElementById("SWFUpload_Console");

        if (!console) {
            documentForm = document.createElement("form");
            document.getElementsByTagName("body")[0].appendChild(documentForm);

            console = document.createElement("textarea");
            console.id = "SWFUpload_Console";
            console.style.fontFamily = "monospace";
            console.setAttribute("wrap", "off");
            console.wrap = "off";
            console.style.overflow = "auto";
            console.style.width = "700px";
            console.style.height = "350px";
            console.style.margin = "5px";
            documentForm.appendChild(console);
        }

        console.value += message + "\n";

        console.scrollTop = console.scrollHeight - console.clientHeight;
    } catch (ex) {
        alert("Exception: " + ex.name + " Message: " + ex.message);
    }
};

/*
Uploadify v3.2.1
Copyright (c) 2012 Reactive Apps, Ronnie Garcia
Released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
;(function(factory){
	factory(window.jQuery);
})(function($) {

    // These methods can be called by adding them as the first argument in the uploadify plugin call
    var methods = {

        init : function(options, swfUploadOptions) {
            
            return this.each(function() {

                // Create a reference to the jQuery DOM object
                var $this = $(this);

                // Clone the original DOM object
                var $clone = $this.clone();

                // Setup the default options
                var settings = $.extend({
                    // Required Settings
                    id       : $this.attr('id'), // The ID of the DOM object
                    swf      : 'uploadify.swf',  // The path to the uploadify SWF file
                    uploader : 'uploadify.php',  // The path to the server-side upload script
                    
                    // Options
                    auto            : true,               // Automatically upload files when added to the queue
                    buttonClass     : '',                 // A class name to add to the browse button DOM object
                    buttonCursor    : 'hand',             // The cursor to use with the browse button
                    buttonImage     : null,               // (String or null) The path to an image to use for the Flash browse button if not using CSS to style the button
                    buttonText      : 'SELECT FILES',     // The text to use for the browse button
                    checkExisting   : false,              // The path to a server-side script that checks for existing files on the server
                    debug           : true,              // Turn on swfUpload debugging mode
                    fileObjName     : 'Filedata',         // The name of the file object to use in your server-side script
                    fileSizeLimit   : 0,                  // The maximum size of an uploadable file in KB (Accepts units B KB MB GB if string, 0 for no limit)
                    fileTypeDesc    : 'All Files',        // The description for file types in the browse dialog
                    fileTypeExts    : '*.*',              // Allowed extensions in the browse dialog (server-side validation should also be used)
                    height          : 30,                 // The height of the browse button
                    itemTemplate    : false,              // The template for the file item in the queue
                    method          : 'post',             // The method to use when sending files to the server-side upload script
                    multi           : true,               // Allow multiple file selection in the browse dialog
                    formData        : {},                 // An object with additional data to send to the server-side upload script with every file upload
                    preventCaching  : true,               // Adds a random value to the Flash URL to prevent caching of it (conflicts with existing parameters)
                    progressData    : 'percentage',       // ('percentage' or 'speed') Data to show in the queue item during a file upload
                    queueID         : false,              // The ID of the DOM object to use as a file queue (without the #)
                    queueSizeLimit  : 999,                // The maximum number of files that can be in the queue at one time
                    removeCompleted : true,               // Remove queue items from the queue when they are done uploading
                    removeTimeout   : 3,                  // The delay in seconds before removing a queue item if removeCompleted is set to true
                    requeueErrors   : false,              // Keep errored files in the queue and keep trying to upload them
                    successTimeout  : 30,                 // The number of seconds to wait for Flash to detect the server's response after the file has finished uploading
                    uploadLimit     : 0,                  // The maximum number of files you can upload
                    width           : 120,                // The width of the browse button
                    checkQueueExists: false,              // check file in queue
                    
                    // Events
                    overrideEvents  : []             // (Array) A list of default event handlers to skip
                    /*
                    onCancel         // Triggered when a file is cancelled from the queue
                    onClearQueue     // Triggered during the 'clear queue' method
                    onDestroy        // Triggered when the uploadify object is destroyed
                    onDialogClose    // Triggered when the browse dialog is closed
                    onDialogOpen     // Triggered when the browse dialog is opened
                    onDisable        // Triggered when the browse button gets disabled
                    onEnable         // Triggered when the browse button gets enabled
                    onFallback       // Triggered is Flash is not detected    
                    onInit           // Triggered when Uploadify is initialized
                    onQueueComplete  // Triggered when all files in the queue have been uploaded
                    onSelectError    // Triggered when an error occurs while selecting a file (file size, queue size limit, etc.)
                    onSelect         // Triggered for each file that is selected
                    onSWFReady       // Triggered when the SWF button is loaded
                    onUploadComplete // Triggered when a file upload completes (success or error)
                    onUploadError    // Triggered when a file upload returns an error
                    onUploadSuccess  // Triggered when a file is uploaded successfully
                    onUploadProgress // Triggered every time a file progress is updated
                    onUploadStart    // Triggered immediately before a file upload starts
                    */
                }, options);

                // Prepare settings for SWFUpload
                var swfUploadSettings = {
                    assume_success_timeout   : settings.successTimeout,
                    button_placeholder_id    : settings.id,
                    button_width             : settings.width,
                    button_height            : settings.height,
                    button_text              : null,
                    button_text_style        : null,
                    button_text_top_padding  : 0,
                    button_text_left_padding : 0,
                    button_action            : (settings.multi ? SWFUpload.BUTTON_ACTION.SELECT_FILES : SWFUpload.BUTTON_ACTION.SELECT_FILE),
                    button_disabled          : false,
                    button_cursor            : (settings.buttonCursor == 'arrow' ? SWFUpload.CURSOR.ARROW : SWFUpload.CURSOR.HAND),
                    button_window_mode       : SWFUpload.WINDOW_MODE.TRANSPARENT,
                    debug                    : settings.debug,                        
                    requeue_on_error         : settings.requeueErrors,
                    file_post_name           : settings.fileObjName,
                    file_size_limit          : settings.fileSizeLimit,
                    file_types               : settings.fileTypeExts,
                    file_types_description   : settings.fileTypeDesc,
                    file_queue_limit         : settings.queueSizeLimit,
                    file_upload_limit        : settings.uploadLimit,
                    flash_url                : settings.swf,                    
                    prevent_swf_caching      : settings.preventCaching,
                    post_params              : settings.formData,
                    upload_url               : settings.uploader,
                    use_query_string         : (settings.method == 'get'),
                    
                    // Event Handlers 
                    file_dialog_complete_handler : handlers.onDialogClose,
                    file_dialog_start_handler    : handlers.onDialogOpen,
                    file_queued_handler          : handlers.onSelect,
                    file_queue_error_handler     : handlers.onSelectError,
                    swfupload_loaded_handler     : settings.onSWFReady,
                    upload_complete_handler      : handlers.onUploadComplete,
                    upload_error_handler         : handlers.onUploadError,
                    upload_progress_handler      : handlers.onUploadProgress,
                    upload_start_handler         : handlers.onUploadStart,
                    upload_success_handler       : handlers.onUploadSuccess
                }

                // Merge the user-defined options with the defaults
                if (swfUploadOptions) {
                    swfUploadSettings = $.extend(swfUploadSettings, swfUploadOptions);
                }
                // Add the user-defined settings to the swfupload object
                swfUploadSettings = $.extend(swfUploadSettings, settings);
                
                // Detect if Flash is available
                var playerVersion  = swfobject.getFlashPlayerVersion();
                var flashInstalled = (playerVersion.major >= 9);

                if (flashInstalled) {
                    // Create the swfUpload instance
                    window['uploadify_' + settings.id] = new SWFUpload(swfUploadSettings);
                    var swfuploadify = window['uploadify_' + settings.id];

                    // Add the SWFUpload object to the elements data object
                    $this.data('uploadify', swfuploadify);
                    
                    // Wrap the instance
                    var $wrapper = $('<div />', {
                        'id'    : settings.id,
                        'class' : 'uploadify',
                        'css'   : {
                                    'height'   : settings.height + 'px',
                                    'width'    : settings.width + 'px'
                                  }
                    });
                    $('#' + swfuploadify.movieName).wrap($wrapper);
                    // Recreate the reference to wrapper
                    $wrapper = $('#' + settings.id);
                    // Add the data object to the wrapper 
                    $wrapper.data('uploadify', swfuploadify);

                    // Create the button
                    var $button = $('<div />', {
                        'id'    : settings.id + '-button',
                        'class' : 'uploadify-button ' + settings.buttonClass
                    });
                    if (settings.buttonImage) {
                        $button.css({
                            'background-image' : "url('" + settings.buttonImage + "')",
                            'text-indent'      : '-9999px'
                        });
                    }
                    $button.html('<span class="uploadify-button-text">' + settings.buttonText + '</span>')
                    .css({
                        'height'      : settings.height + 'px',
                        'line-height' : settings.height + 'px',
                        'width'       : settings.width + 'px'
                    });
                    // Append the button to the wrapper
                    $wrapper.append($button);

                    // Adjust the styles of the movie
                    $('#' + swfuploadify.movieName).css({
                        'position' : 'absolute',
                        'z-index'  : 1
                    });
                    
                    // Create the file queue
                    if (!settings.queueID) {
                        var $queue = $('<div />', {
                            'id'    : settings.id + '-queue',
                            'class' : 'uploadify-queue'
                        });
                        $wrapper.after($queue);
                        swfuploadify.settings.queueID      = settings.id + '-queue';
                        swfuploadify.settings.defaultQueue = true;
                    }
                    
                    // Create some queue related objects and variables
                    swfuploadify.queueData = {
                        files              : {}, // The files in the queue
                        filesSelected      : 0, // The number of files selected in the last select operation
                        filesQueued        : 0, // The number of files added to the queue in the last select operation
                        filesReplaced      : 0, // The number of files replaced in the last select operation
                        filesCancelled     : 0, // The number of files that were cancelled instead of replaced
                        filesErrored       : 0, // The number of files that caused error in the last select operation
                        uploadsSuccessful  : 0, // The number of files that were successfully uploaded
                        uploadsErrored     : 0, // The number of files that returned errors during upload
                        averageSpeed       : 0, // The average speed of the uploads in KB
                        queueLength        : 0, // The number of files in the queue
                        queueSize          : 0, // The size in bytes of the entire queue
                        uploadSize         : 0, // The size in bytes of the upload queue
                        queueBytesUploaded : 0, // The size in bytes that have been uploaded for the current upload queue
                        uploadQueue        : [], // The files currently to be uploaded
                        errorMsg           : '没有文件被添加至上传队列中:'
                    };

                    // Save references to all the objects
                    swfuploadify.original = $clone;
                    swfuploadify.wrapper  = $wrapper;
                    swfuploadify.button   = $button;
                    swfuploadify.queue    = $queue;

                    // Call the user-defined init event handler
                    if (settings.onInit) settings.onInit.call($this, swfuploadify);

                } else {

                    // Call the fallback function
                    if (settings.onFallback) settings.onFallback.call($this);

                }
            });

        },

        // Stop a file upload and remove it from the queue 
        cancel : function(fileID, supressEvent) {

            var args = arguments;

            this.each(function() {
                // Create a reference to the jQuery DOM object
                var $this        = $(this),
                    swfuploadify = $this.data('uploadify'),
                    settings     = swfuploadify.settings,
                    delay        = -1;

                if (args[0]) {
                    // Clear the queue
                    if (args[0] == '*') {
                        var queueItemCount = swfuploadify.queueData.queueLength;
                        $('#' + settings.queueID).find('.uploadify-queue-item').each(function() {
                            delay++;
                            if (args[1] === true) {
                                swfuploadify.cancelUpload($(this).attr('id'), false);
                            } else {
                                swfuploadify.cancelUpload($(this).attr('id'));
                            }
                            $(this).find('.data').removeClass('data').html(' - Cancelled');
                            $(this).find('.uploadify-progress-bar').remove();
                            $(this).delay(1000 + 100 * delay).fadeOut(500, function() {
                                $(this).remove();
                            });
                        });
                        swfuploadify.queueData.queueSize   = 0;
                        swfuploadify.queueData.queueLength = 0;
                        // Trigger the onClearQueue event
                        if (settings.onClearQueue) settings.onClearQueue.call($this, queueItemCount);
                    } else {
                        for (var n = 0; n < args.length; n++) {
                            swfuploadify.cancelUpload(args[n]);
                            $('#' + args[n]).find('.data').removeClass('data').html(' - Cancelled');
                            $('#' + args[n]).find('.uploadify-progress-bar').remove();
                            $('#' + args[n]).delay(1000 + 100 * n).fadeOut(500, function() {
                                $(this).remove();
                            });
                        }
                    }
                } else {
                    var item = $('#' + settings.queueID).find('.uploadify-queue-item').get(0);
                    $item = $(item);
                    swfuploadify.cancelUpload($item.attr('id'));
                    $item.find('.data').removeClass('data').html(' - Cancelled');
                    $item.find('.uploadify-progress-bar').remove();
                    $item.delay(1000).fadeOut(500, function() {
                        $(this).remove();
                    });
                }
            });

        },

        // Revert the DOM object back to its original state
        destroy : function() {
            this.each(function() {
                // Create a reference to the jQuery DOM object
                var $this        = $(this),
                    swfuploadify = $this.data('uploadify'),
                    settings     = swfuploadify.settings;

                $('#' + settings.id).replaceWith(swfuploadify.original);
                // Destroy the SWF object and 
                swfuploadify.destroy();
                
                // Destroy the queue
                if (settings.defaultQueue) {
                    $('#' + settings.queueID).remove();
                }

                // Reload the original DOM element
                //$('#' + settings.id).replaceWith(swfuploadify.original);

                // Call the user-defined event handler
                if (settings.onDestroy) settings.onDestroy.call(this);

                delete swfuploadify;
            });

        },

        // Disable the select button
        disable : function(isDisabled) {
            
            this.each(function() {
                // Create a reference to the jQuery DOM object
                var $this        = $(this),
                    swfuploadify = $this.data('uploadify'),
                    settings     = swfuploadify.settings;

                // Call the user-defined event handlers
                if (isDisabled) {
                    swfuploadify.button.addClass('disabled');
                    if (settings.onDisable) settings.onDisable.call(this);
                } else {
                    swfuploadify.button.removeClass('disabled');
                    if (settings.onEnable) settings.onEnable.call(this);
                }

                // Enable/disable the browse button
                swfuploadify.setButtonDisabled(isDisabled);
            });

        },

        // Get or set the settings data
        settings : function(name, value, resetObjects) {

            var args        = arguments;
            var returnValue = value;

            this.each(function() {
                // Create a reference to the jQuery DOM object
                var $this        = $(this),
                    swfuploadify = $this.data('uploadify'),
                    settings     = swfuploadify.settings;

                if (typeof(args[0]) == 'object') {
                    for (var n in value) {
                        setData(n,value[n]);
                    }
                }
                if (args.length === 1) {
                    returnValue =  settings[name];
                } else {
                    switch (name) {
                        case 'uploader':
                            swfuploadify.setUploadURL(value);
                            break;
                        case 'formData':
                            if (!resetObjects) {
                                value = $.extend(settings.formData, value);
                            }
                            swfuploadify.setPostParams(settings.formData);
                            break;
                        case 'method':
                            if (value == 'get') {
                                swfuploadify.setUseQueryString(true);
                            } else {
                                swfuploadify.setUseQueryString(false);
                            }
                            break;
                        case 'fileObjName':
                            swfuploadify.setFilePostName(value);
                            break;
                        case 'fileTypeExts':
                            swfuploadify.setFileTypes(value, settings.fileTypeDesc);
                            break;
                        case 'fileTypeDesc':
                            swfuploadify.setFileTypes(settings.fileTypeExts, value);
                            break;
                        case 'fileSizeLimit':
                            swfuploadify.setFileSizeLimit(value);
                            break;
                        case 'uploadLimit':
                            swfuploadify.setFileUploadLimit(value);
                            break;
                        case 'queueSizeLimit':
                            swfuploadify.setFileQueueLimit(value);
                            break;
                        case 'buttonImage':
                            swfuploadify.button.css('background-image', settingValue);
                            break;
                        case 'buttonCursor':
                            if (value == 'arrow') {
                                swfuploadify.setButtonCursor(SWFUpload.CURSOR.ARROW);
                            } else {
                                swfuploadify.setButtonCursor(SWFUpload.CURSOR.HAND);
                            }
                            break;
                        case 'buttonText':
                            $('#' + settings.id + '-button').find('.uploadify-button-text').html(value);
                            break;
                        case 'width':
                            swfuploadify.setButtonDimensions(value, settings.height);
                            break;
                        case 'height':
                            swfuploadify.setButtonDimensions(settings.width, value);
                            break;
                        case 'multi':
                            if (value) {
                                swfuploadify.setButtonAction(SWFUpload.BUTTON_ACTION.SELECT_FILES);
                            } else {
                                swfuploadify.setButtonAction(SWFUpload.BUTTON_ACTION.SELECT_FILE);
                            }
                            break;
                    }
                    settings[name] = value;
                }
            });
            
            if (args.length === 1) {
                return returnValue;
            }

        },

        // Stop the current uploads and requeue what is in progress
        stop : function() {

            this.each(function() {
                // Create a reference to the jQuery DOM object
                var $this        = $(this),
                    swfuploadify = $this.data('uploadify');

                // Reset the queue information
                swfuploadify.queueData.averageSpeed  = 0;
                swfuploadify.queueData.uploadSize    = 0;
                swfuploadify.queueData.bytesUploaded = 0;
                swfuploadify.queueData.uploadQueue   = [];

                swfuploadify.stopUpload();
            });

        },

        // Start uploading files in the queue
        upload : function() {
            var args = arguments;

            this.each(function() {
                // Create a reference to the jQuery DOM object
                var $this        = $(this),
                    swfuploadify = $this.data('uploadify');

                // Reset the queue information
                swfuploadify.queueData.averageSpeed  = 0;
                swfuploadify.queueData.uploadSize    = 0;
                swfuploadify.queueData.bytesUploaded = 0;
                swfuploadify.queueData.uploadQueue   = [];
                
                // Upload the files
                if (args[0]) {
                    if (args[0] == '*') {
                        swfuploadify.queueData.uploadSize = swfuploadify.queueData.queueSize;
                        swfuploadify.queueData.uploadQueue.push('*');
                        swfuploadify.startUpload();
                    } else {
                        for (var n = 0; n < args.length; n++) {
                            swfuploadify.queueData.uploadSize += swfuploadify.queueData.files[args[n]].size;
                            swfuploadify.queueData.uploadQueue.push(args[n]);
                        }
                        swfuploadify.startUpload(swfuploadify.queueData.uploadQueue.shift());
                    }
                } else {
                    swfuploadify.startUpload();
                }

            });

        }

    }

    // These functions handle all the events that occur with the file uploader
    var handlers = {

        // Triggered when the file dialog is opened
        onDialogOpen : function() {
            // Load the swfupload settings
            var settings = this.settings;

            // Reset some queue info
            this.queueData.errorMsg       = '没有文件被添加至上传队列中:';
            this.queueData.filesReplaced  = 0;
            this.queueData.filesCancelled = 0;

            // Call the user-defined event handler
            if (settings.onDialogOpen) settings.onDialogOpen.call(this);
        },

        // Triggered when the browse dialog is closed
        onDialogClose :  function(filesSelected, filesQueued, queueLength) {
            // Load the swfupload settings
            var settings = this.settings;

            // Update the queue information
            this.queueData.filesErrored  = filesSelected - filesQueued;
            this.queueData.filesSelected = filesSelected;
            this.queueData.filesQueued   = filesQueued - this.queueData.filesCancelled;
            this.queueData.queueLength   = queueLength;

            // Run the default event handler
            if ($.inArray('onDialogClose', settings.overrideEvents) < 0) {
                if (this.queueData.filesErrored > 0) {
                    alert(this.queueData.errorMsg);
                }
            }

            // Call the user-defined event handler
            if (settings.onDialogClose) settings.onDialogClose.call(this, this.queueData);

            // Upload the files if auto is true
            if (settings.auto) $('#' + settings.id).uploadify('upload', '*');
        },

        // Triggered once for each file added to the queue
        onSelect : function(file) {
            // Load the swfupload settings
            var settings = this.settings;

            // Check if a file with the same name exists in the queue
            var queuedFile = {};

            if(settings.checkQueueExists){
                for (var n in this.queueData.files) {
                    queuedFile = this.queueData.files[n];
                    if (queuedFile.uploaded != true && queuedFile.name == file.name) {
                        var replaceQueueItem = confirm('"' + file.name + '" 此文件已在上传队列中.\n确定进行替换?');
                        if (!replaceQueueItem) {
                            this.cancelUpload(file.id);
                            this.queueData.filesCancelled++;
                            return false;
                        } else {
                            $('#' + queuedFile.id).remove();
                            this.cancelUpload(queuedFile.id);
                            this.queueData.filesReplaced++;
                        }
                    }
                }
            }

            // Get the size of the file
            var fileSize = Math.round(file.size / 1024);
            var suffix   = 'KB';
            if (fileSize > 1000) {
                fileSize = Math.round(fileSize / 1000);
                suffix   = 'MB';
            }
            var fileSizeParts = fileSize.toString().split('.');
            fileSize = fileSizeParts[0];
            if (fileSizeParts.length > 1) {
                fileSize += '.' + fileSizeParts[1].substr(0,2);
            }
            fileSize += suffix;
            
            // Truncate the filename if it's too long
            var fileName = file.name;
            if (fileName.length > 25) {
                fileName = fileName.substr(0,25) + '...';
            }

            // Create the file data object
            itemData = {
                'fileID'     : file.id,
                'instanceID' : settings.id,
                'fileName'   : fileName,
                'fileSize'   : fileSize
            }

            // Create the file item template
            if (settings.itemTemplate == false) {
                settings.itemTemplate = '<div id="${fileID}" class="uploadify-queue-item">\
                    <div class="cancel">\
                        <a href="javascript:$(\'#${instanceID}\').uploadify(\'cancel\', \'${fileID}\')">X</a>\
                    </div>\
                    <span class="fileName">${fileName} (${fileSize})</span><span class="data"></span>\
                    <div class="uploadify-progress">\
                        <div class="uploadify-progress-bar"><!--Progress Bar--></div>\
                    </div>\
                </div>';
            }

            // Run the default event handler
            if ($.inArray('onSelect', settings.overrideEvents) < 0) {
                
                // Replace the item data in the template
                itemHTML = settings.itemTemplate;
                for (var d in itemData) {
                    itemHTML = itemHTML.replace(new RegExp('\\$\\{' + d + '\\}', 'g'), itemData[d]);
                }

                // Add the file item to the queue
                $('#' + settings.queueID).append(itemHTML);
            }

            this.queueData.queueSize += file.size;
            this.queueData.files[file.id] = file;

            // Call the user-defined event handler
            if (settings.onSelect) settings.onSelect.apply(this, arguments);
        },

        // Triggered when a file is not added to the queue
        onSelectError : function(file, errorCode, errorMsg) {
            // Load the swfupload settings
            var settings = this.settings;

            // Run the default event handler
            if ($.inArray('onSelectError', settings.overrideEvents) < 0) {
                switch(errorCode) {
                    case SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED:
                        if (settings.queueSizeLimit > errorMsg) {
                            this.queueData.errorMsg += '\n选择的文件数超过允许上传的最大文件数 (' + errorMsg + ').';
                        } else {
                            this.queueData.errorMsg += '\n选择的文件数超过允许上传队列的最大数量 (' + settings.queueSizeLimit + ').';
                        }
                        break;
                    case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
                        this.queueData.errorMsg += '\n"' + file.name + '" 此文件大小超过允许上传的最大文件大小 (' + settings.fileSizeLimit + ').';
                        break;
                    case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
                        this.queueData.errorMsg += '\n"' + file.name + '" 此文件为空.';
                        break;
                    case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
                        this.queueData.errorMsg += '\n"' + file.name + '" 此文件文件格式不对 (' + settings.fileTypeDesc + ').';
                        break;
                }
            }
            if (errorCode != SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED) {
                delete this.queueData.files[file.id];
            }

            // Call the user-defined event handler
            if (settings.onSelectError) settings.onSelectError.apply(this, arguments);
        },

        // Triggered when all the files in the queue have been processed
        onQueueComplete : function() {
            if (this.settings.onQueueComplete) this.settings.onQueueComplete.call(this, this.settings.queueData);
        },

        // Triggered when a file upload successfully completes
        onUploadComplete : function(file) {
            // Load the swfupload settings
            var settings     = this.settings,
                swfuploadify = this;

            // Check if all the files have completed uploading
            var stats = this.getStats();
            this.queueData.queueLength = stats.files_queued;
            if (this.queueData.uploadQueue[0] == '*') {
                if (this.queueData.queueLength > 0) {
                    this.startUpload();
                } else {
                    this.queueData.uploadQueue = [];

                    // Call the user-defined event handler for queue complete
                    if (settings.onQueueComplete) settings.onQueueComplete.call(this, this.queueData);
                }
            } else {
                if (this.queueData.uploadQueue.length > 0) {
                    this.startUpload(this.queueData.uploadQueue.shift());
                } else {
                    this.queueData.uploadQueue = [];

                    // Call the user-defined event handler for queue complete
                    if (settings.onQueueComplete) settings.onQueueComplete.call(this, this.queueData);
                }
            }

            // Call the default event handler
            if ($.inArray('onUploadComplete', settings.overrideEvents) < 0) {
                if (settings.removeCompleted) {
                    switch (file.filestatus) {
                        case SWFUpload.FILE_STATUS.COMPLETE:
                            setTimeout(function() { 
                                if ($('#' + file.id)) {
                                    swfuploadify.queueData.queueSize   -= file.size;
                                    swfuploadify.queueData.queueLength -= 1;
                                    delete swfuploadify.queueData.files[file.id]
                                    $('#' + file.id).fadeOut(500, function() {
                                        $(this).remove();
                                    });
                                }
                            }, settings.removeTimeout * 1000);
                            break;
                        case SWFUpload.FILE_STATUS.ERROR:
                            if (!settings.requeueErrors) {
                                setTimeout(function() {
                                    if ($('#' + file.id)) {
                                        swfuploadify.queueData.queueSize   -= file.size;
                                        swfuploadify.queueData.queueLength -= 1;
                                        delete swfuploadify.queueData.files[file.id];
                                        $('#' + file.id).fadeOut(500, function() {
                                            $(this).remove();
                                        });
                                    }
                                }, settings.removeTimeout * 1000);
                            }
                            break;
                    }
                } else {
                    file.uploaded = true;
                }
            }

            // Call the user-defined event handler
            if (settings.onUploadComplete) settings.onUploadComplete.call(this, file);
        },

        // Triggered when a file upload returns an error
        onUploadError : function(file, errorCode, errorMsg) {
            // Load the swfupload settings
            var settings = this.settings;

            // Set the error string
            var errorString = 'Error';
            switch(errorCode) {
                case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
                    errorString = 'HTTP Error (' + errorMsg + ')';
                    break;
                case SWFUpload.UPLOAD_ERROR.MISSING_UPLOAD_URL:
                    errorString = 'Missing Upload URL';
                    break;
                case SWFUpload.UPLOAD_ERROR.IO_ERROR:
                    errorString = 'IO Error';
                    break;
                case SWFUpload.UPLOAD_ERROR.SECURITY_ERROR:
                    errorString = 'Security Error';
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
                    alert('已达到上传限制次数 (' + errorMsg + ').');
                    errorString = 'Exceeds Upload Limit';
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_FAILED:
                    errorString = 'Failed';
                    break;
                case SWFUpload.UPLOAD_ERROR.SPECIFIED_FILE_ID_NOT_FOUND:
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED:
                    errorString = 'Validation Error';
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
                    errorString = 'Cancelled';
                    this.queueData.queueSize   -= file.size;
                    this.queueData.queueLength -= 1;
                    if (file.status == SWFUpload.FILE_STATUS.IN_PROGRESS || $.inArray(file.id, this.queueData.uploadQueue) >= 0) {
                        this.queueData.uploadSize -= file.size;
                    }
                    // Trigger the onCancel event
                    if (settings.onCancel) settings.onCancel.call(this, file);
                    delete this.queueData.files[file.id];
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
                    errorString = 'Stopped';
                    break;
            }

            // Call the default event handler
            if ($.inArray('onUploadError', settings.overrideEvents) < 0) {

                if (errorCode != SWFUpload.UPLOAD_ERROR.FILE_CANCELLED && errorCode != SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED) {
                    $('#' + file.id).addClass('uploadify-error');
                }

                // Reset the progress bar
                $('#' + file.id).find('.uploadify-progress-bar').css('width','1px');

                // Add the error message to the queue item
                if (errorCode != SWFUpload.UPLOAD_ERROR.SPECIFIED_FILE_ID_NOT_FOUND && file.status != SWFUpload.FILE_STATUS.COMPLETE) {
                    $('#' + file.id).find('.data').html(' - ' + errorString);
                }
            }

            var stats = this.getStats();
            this.queueData.uploadsErrored = stats.upload_errors;

            // Call the user-defined event handler
            if (settings.onUploadError) settings.onUploadError.call(this, file, errorCode, errorMsg, errorString);
        },

        // Triggered periodically during a file upload
        onUploadProgress : function(file, fileBytesLoaded, fileTotalBytes) {
            // Load the swfupload settings
            var settings = this.settings;

            // Setup all the variables
            var timer            = new Date();
            var newTime          = timer.getTime();
            var lapsedTime       = newTime - this.timer;
            if (lapsedTime > 500) {
                this.timer = newTime;
            }
            var lapsedBytes      = fileBytesLoaded - this.bytesLoaded;
            this.bytesLoaded     = fileBytesLoaded;
            var queueBytesLoaded = this.queueData.queueBytesUploaded + fileBytesLoaded;
            var percentage       = Math.round(fileBytesLoaded / fileTotalBytes * 100);
            
            // Calculate the average speed
            var suffix = 'KB/s';
            var mbs = 0;
            var kbs = (lapsedBytes / 1024) / (lapsedTime / 1000);
                kbs = Math.floor(kbs * 10) / 10;
            if (this.queueData.averageSpeed > 0) {
                this.queueData.averageSpeed = Math.floor((this.queueData.averageSpeed + kbs) / 2);
            } else {
                this.queueData.averageSpeed = Math.floor(kbs);
            }
            if (kbs > 1000) {
                mbs = (kbs * .001);
                this.queueData.averageSpeed = Math.floor(mbs);
                suffix = 'MB/s';
            }
            
            // Call the default event handler
            if ($.inArray('onUploadProgress', settings.overrideEvents) < 0) {
                if (settings.progressData == 'percentage') {
                    $('#' + file.id).find('.data').html(' - ' + percentage + '%');
                } else if (settings.progressData == 'speed' && lapsedTime > 500) {
                    $('#' + file.id).find('.data').html(' - ' + this.queueData.averageSpeed + suffix);
                }
                $('#' + file.id).find('.uploadify-progress-bar').css('width', percentage + '%');
            }

            // Call the user-defined event handler
            if (settings.onUploadProgress) settings.onUploadProgress.call(this, file, fileBytesLoaded, fileTotalBytes, queueBytesLoaded, this.queueData.uploadSize);
        },

        // Triggered right before a file is uploaded
        onUploadStart : function(file) {
            // Load the swfupload settings
            var settings = this.settings;

            var timer        = new Date();
            this.timer       = timer.getTime();
            this.bytesLoaded = 0;
            if (this.queueData.uploadQueue.length == 0) {
                this.queueData.uploadSize = file.size;
            }
            if (settings.checkExisting) {
                $.ajax({
                    type    : 'POST',
                    async   : false,
                    url     : settings.checkExisting,
                    data    : {filename: file.name},
                    success : function(data) {
                        if (data == 1) {
                            var overwrite = confirm('"' + file.name + '" 此文件在服务器上已经存在.\n是否替换已存在文件?');
                            if (!overwrite) {
                                this.cancelUpload(file.id);
                                $('#' + file.id).remove();
                                if (this.queueData.uploadQueue.length > 0 && this.queueData.queueLength > 0) {
                                    if (this.queueData.uploadQueue[0] == '*') {
                                        this.startUpload();
                                    } else {
                                        this.startUpload(this.queueData.uploadQueue.shift());
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Call the user-defined event handler
            if (settings.onUploadStart) settings.onUploadStart.call(this, file); 
        },

        // Triggered when a file upload returns a successful code
        onUploadSuccess : function(file, data, response) {
            // Load the swfupload settings
            var settings = this.settings;
            var stats    = this.getStats();
            this.queueData.uploadsSuccessful = stats.successful_uploads;
            this.queueData.queueBytesUploaded += file.size;

            // Call the default event handler
            if ($.inArray('onUploadSuccess', settings.overrideEvents) < 0) {
                $('#' + file.id).find('.data').html(' - Complete');
            }

            // Call the user-defined event handler
            if (settings.onUploadSuccess) settings.onUploadSuccess.call(this, file, data, response); 
        }

    }

    $.fn.uploadify = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('The method ' + method + ' does not exist in $.uploadify');
        }

    }

});


window.swfobject = swfobject;
window.SWFUpload = SWFUpload;;//自动获取swf的地址
(function(){
var doc = document, currentScript;

//获取upoader.js的url
if(doc.currentScript){
    currentScript = doc.currentScript.src;
}else{
    var stack;

    try{
        currentScript();
    }catch(e){
        stack = e.stack;

        if(!stack && window.opera){
            stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
        }
    }

    if(stack){
        stack = stack.split( /[@ ]/g).pop();
        stack = stack[0] == "(" ? stack.slice(1,-1) : stack;
        currentScript = stack.replace(/(:\d+)?:\d+$/i, "");
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
}

//如果未使用编译工具，则直接返回
function __uri(url){
    return url;
}

var prefix = currentScript.replace(/[^\/]+$/, '');
var swfUrl = __uri("./uploader.swf").split('/').pop();

window.__featherUiUploaderSwfUrl__ = prefix + swfUrl;
})();

;(function(factory){
if(typeof define == 'function' && define.amd){
    //seajs or requirejs environment
    define(['jquery', '../class/class', '../cookie/cookie', './lib/uploadify'], factory);
}else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = factory(
        require('jquery'),
        require('../class/class'),
        require('../cookie/cookie'),
        require('./lib/uploadify')
    );
}
})(function($, Class, Cookie){
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
            self.dom.attr('id', 'ui2-uploader-' + $.now());
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

        if(method == 'destroy'){
            self.dom.removeData(DATANAME);
            /ui2-uploader-\d+/.test(self.dom.attr('id')) && self.dom.removeAttr('id');
            self.dom = null;
            self.uploader.removeData(DATANAME);
            self.uploader = null;
        }
    };
});

return Class.$factory('uploader', prototype);
});