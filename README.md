feather前端模块化组件库2.0
=====================

###关于feather-ui##

feather-ui组件库是一套基于jquery/zepto的简单，轻量，且遵循暴露核心API，易扩展，且代码可读性高思想的前端ui组件库。

feather-ui只提供了一些网站上的常用组件以及一些简单的特效，因使用者的需求往往是很简单的，可能仅仅只是需要一些简单的特效。另外一方面，一般开源的组件库往往会实现各种功能以便组件库看上去更完善，然而对于需要定制的使用者其实是一种灾难，往往因为臃肿的代码而不敢下手。所以feather-ui提倡暴露更多的核心api，让使用者更加容易的去进行扩展，以便适应自己的业务场景。

##### 注：feather-ui不会更新一般比如图表类，表格类等插件，因这些插件已经真的够多的了！

feather-ui兼容了模块化，以及传统方式使用，如果是非模块下的调用，则需要提前知道组件的依赖是哪些，具体的可以进组件文件中查看，比如mask组件，依赖于jquery.js，则需要提前加载jquery，方式如下:

```html
<link rel="stylesheet" type="text/css" href="/static/mask.css" />
<script src="/static/jquery.js"></script>
<script src="/static/mask.js"></script>

<script>
var mask = new window.jQuery.featherUi.Mask();
</script>
```

###2.0和以往版本的主要区别：

* 增加了一部分新功能
* 代码部分重构
* 和dom相关的组件都被绑定至$.fn上，也就是可以使用这样的方式调用组件了：

```js
//dom元素首次和droplist对象绑定关系，返回droplist对象，非jquery对象
$('#droplist').droplist();

//再次调用一样返回droplist对象
$('#droplist').droplist().on('select', function(){});

//直接在droplist方法内执行droplist的方法，完成后，返回jquery对象
$('#droplist').droplist('on', 'select', function(){});	//jquery对象
```

```js
//同样也可以使用老的方式
new DropList({
	dom: '#droplist'
});
```

* 和dom相关的组件都支持事件功能，以往使用options传递回调函数的方式也变成了事件的方式，比如：

```js
$('#droplist').droplist().on('sayHello', function(){
	console.log('hello');
});

$('#droplist').droplist().trigger('sayHello');
```
这些插件都继承于预定义类Event，更多使用方法可查看[Event](/class)


##### 注：feather-ui中有很多依赖的关系，建议：

* 使用模块化加载方式去解决依赖问题
* 使用[feather](http://github.com/feather-team/feather)等工程构建框架去解决依赖问题，而且会带来很多不一样的惊喜！！！


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
