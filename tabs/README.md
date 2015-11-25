Tabs
=================================

###Options:

* dom：指定tabs的父级元素
* selecter: 指定一个选择表达式，dom下所有符合该表达式的元素将会被收集,默认为 '> *'
* targetAttr: 指定收集target id的属性，默认为data-target
* currentClass: 当前被选中的tab的className
* currentIndex: 指定一个当前索引
* event: 指定一个触发切换的事件，默认为click，可以指定mouseover等

###Event:

* switch(index)：切换时触发

###Api

* to(index)：切换至某一项
* refresh(): 当tabs结构有改动时，可执行refresh方法，进行刷新，重新初始化


###Example

```html
<div id="tab-btns">
	<a href="#tab1" data-target="tab1">tab1</a>
	<a href="#tab2" data-target="tab2">tab2</a>
	<a href="#tab3" data-target="tab3">tab3</a>
</div>

<div id="tab1"></div>
<div id="tab1"></div>
<div id="tab1"></div>
```

```js
$('#tab-btns').tabs({
	selecter: '> a',
	event: 'mouseover'
});

$('#tab-btns').tabs().on('switch', function(index){
	console.log(index);
});

$('#tabs-btns').tabs('to', 2);
```js