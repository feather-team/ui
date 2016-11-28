;(function(factory){
if(typeof define == 'function' && define.amd){
    //seajs or requirejs environment
    define(['jquery', '../class/class'], factory);
}else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = factory(
        require('jquery'),
        require('../class/class')
    );
}else{
    factory(window.jQuery, window.jQuery.klass);
}
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
});