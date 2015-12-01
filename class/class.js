;(function(window, factory){
if(typeof define == 'function'){
    //seajs or requirejs environment
    define(function(require, exports, module){
        return factory(
            require('../jquery/jquery.js')
        );
    });
}else{
    window.jQuery.featherUi = window.jQuery.featherUi || {};
    window.jQuery.featherUi.Class = factory(window.jQuery || window.$);
}
})(window, function($){
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
                var args = slice.call(arguments, 1);
                return callback.apply(this, args);
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
        prototype = $.extend({}, _super, {
            _super: _super
        }, prototype);

        return this.create(prototype);
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
            var action, args;

            if(typeof options == 'string'){
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

                    //listen memory release
                    instance.on('release', function(){
                        $this.removeData(DATANAME);
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

            return !action ? this.eq(0).data(DATANAME) : this;
        };

        return klass;
    }
};
});