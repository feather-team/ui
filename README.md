feather前端模块化组件库2.0     
=====================     
      
###关于feather-ui##     
      
feather-ui组件库是一套基于jquery/zepto的简单，轻量，且遵循暴露核心API，易扩展，且代码可读性高思想的前端ui组件库。        
      
feather-ui只提供了一些网站上的常用组件以及一些简单的特效，因使用者的需求往往是很简单的，可能仅仅只是需要一些简单的特效。另外一方面，一般开源的组件库往往会实现各种功能以便组件库看上去更完善，然而对于需要定制的使用者其实是一种灾难，往往因为臃肿的代码而不敢下手。所以feather-ui提倡暴露更多的核心api，让使用者更加容易的去进行扩展，以便适应自己的业务场景。       
      
##### 注：feather-ui不会更新图表类，表格类等插件，因这些插件已经真的够多的了！       
      
feather-ui兼容了模块化，以及传统方式使用，如果是非模块下的调用，则需要提前知道组件的依赖是哪些，具体的可以进组件文件中查看，比如mask组件，依赖于jquery.js，则需要提前加载jquery，方式如下:      
      
```html       
<link rel="stylesheet" type="text/css" href="/static/mask.css" />     
<script src="/static/jquery.js"></script>     
<script src="/static/mask.js"></script>       
      
<script>      
var mask = new window.jQuery.fn.mask;   
make.open();
</script>     
```       
      
##### feather-ui中有很多依赖的关系，建议：     
      
* 使用模块化加载方式去解决依赖问题        
* 使用[feather](http://github.com/feather-team/feather)等工程构建框架去解决依赖问题，而且会带来很多不一样的惊喜！！！      
      
      
###2.0和以往版本的主要区别：     
      
* 增加了一部分新功能       
* 代码部分重构      
* 和dom相关的组件都被绑定至$.fn上，也就是可以使用这样的方式调用组件了：      
      
```js     
$('#droplist').droplist({     
  //初始化参数     
});       
```       
      
注：        
      
* 同一个插件调用多次时，不会重复实例化，如果已绑定了插件，则直接返回之前绑定的插件，如未绑定，则直接实例化，如果需重新绑定，部分组件提供了destroy功能，可执行。      
      
```js     
$('#droplist').droplist() // => jquery object     
```       
      
* 如果想调用组件自身的方法时，只需要调用组件名，第一个参数为执行的方法名，后续参数传入即可，如：     
      
```js     
$('#droplist').droplist('open')  // => jquery object      
$('#droplist').droplist('on', 'select', function(event, value){       
  console.log(value);     
});       
```       
      
* 也可以直接通过instance魔术方法，获取组件实例化对象       
      
```js     
$('#droplist').droplist('instance')/* => DropList Object*/.getValue(); // => 123      
```       
      
* 实例对象可以通过widget方法，获取绑定的jquery对象      
      
```js     
$('#droplist').droplist('instance').widget().droplist('open') //=> jquery object      
```       
      
* 和dom相关的组件都支持事件功能，以往使用options传递回调函数的方式也变成了事件的方式，比如：      
      
```js     
//预先绑定一个事件        
$('#droplist').on('droplist:sayHello', function(event, iSay){     
  console.log('i say:' + iSay);       
});       
      
//触发事件        
var instance = $('#droplist').droplist('instance');       
      
instance.on('sayHello', function(event, instanceSay){     
  console.log('instance say: ' + instanceSay);        
});       
      
instance.trigger('sayHello', 'hello, world'); //instace say: hello, world \r\n i say: hello, world;       
```       
这些插件都继承于预定义类Event，更多使用方法可查看[Event](/class)        
      
      
###组件列表       
* [Dialog](/dialog)       
* [Tips](/tips)       
* [Mask](/mask)       
* [Alert](/alert)     
* [Tabs](/tabs)       
* [Template](/template)       
* [FormValid](/formValid)     
* [Util](/util)       
* [Pager](/pager)     
* [PlaceHolder](/placeholder)     
* [Cookie](/cookie)       
* [Slider](/slider)       
* [Class](/class)     
* [Uploader](/uploader)       
* [LightBox](/lightbox)       
* [Draggable](/Draggable)     
* [Calendar](/calendar)       
* [Suggestion](/suggestion)       
* [Tooltip](/tooltip)     
* [Droplist](/droplist)