Class 
=====================

###Api

* create(prototype:Object)：创建并返回一个类

```js
var A = Class.create({
	//构造函数，初始化时，自动执行
	initialize: function(){
		console.log('init');
	}
});

new A //init
```

* extend(parent:String|Function|Object, prototype:Object)：继承一个类，并创建，parent为string类型时，则只能为Class中预定义的类，如'Event'

```js
var A = Class.extend('Event', {
	initialize: function(){
		this.data = {};
	},

	set: function(name, value){
		this.data[name] = value;
		this.trigger('change', name, value);
	}
});

A.on('change', function(name, value){
	console.log(name ' is ' + value + ' now!');
});
```

* $factory(name:String[, parent:String|Function|Object], prototype:Object)：创建一个类，并扩展为jQuery的插件，parent如果缺省，则自动继承于Event，元素会以dom参数传入。

```js
Class.$factory('hello', {
	initialize: function(opt){
		this.options = $.extend({
			dom: null
		}, opt || {});
	},

	sayHello: function(){
		console.log('hello, world! my id is ' + this.options.dom.attr('id'));
	}
});

$('#test').hello().sayHello(); //hello, world! my id is test
```

###预定义类Event Api

* on(event, fn)
* off(event)
* trigger(event[, data])