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
    window.jQuery.featherUi.Draggable = factory(
        window.jQuery || window.$, 
        window.jQuery.featherUi.Class,
        window.jQuery.featherUi.Util
    );
}
})(window, function($, Class, Util){

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

});