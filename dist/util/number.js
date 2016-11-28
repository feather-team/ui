;(function(factory){
if(typeof define == 'function' && define.amd){
    //seajs or requirejs environment
    define(['./string'], factory);
}else if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = factory(
        require('./string')
    );
}else{
    this.util = this.util || {};
    this.util.number = factory(this.util.string);
}
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

});