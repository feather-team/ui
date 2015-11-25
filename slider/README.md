Slider(滑动插件)
=======================

slider插件提供最基础的滑动API，可自行继承并定制，也可不定制，全部依赖原有api来实现各种复杂滑动功能，无强制的dom结构，只需提供一个简单的dom元素即可，滑动对该dom元素下的直接子元素生效

###Options

* dom: 元素

* time：动画时间长度

* cps: 每次参与滚动的元素个数

* maxIndex：最多滚动多少次

* noGap：是否无缝

* easing：jquery的运动动画

* mode：指定滚动方式，horizontal表示水平 vertical表示垂直

###Event

* before：滚动前执行
* after：滚动后执行

###Api

* to(index[, time])    滑动到第几个，该index非子元素index，子元素index = index * cps， time为滑动时长，可临时改变滑动时长。

* pause 滑动过程中暂停滑动，该方法可能导致元素未滑动到指定位置，而出现特效异常。

* resume 如果过程中使用了pause方法，可使其滑动恢复。

* toNext    滑动至下一个

* toPrev    滑动至上一个

* toFirst   滑动至第一个

* toLast    滑动至最后一个

* isFirst   是否已经滑动到第一个

* isLast    是否为最后一个

* getMaxIndex   获取最大可以滑动的index

* refresh	用于子元素数量改变后，位置出现错误的情况，可使用refresh来恢复

##Example

```js
var slider = new Slider({
    time: 1000, //滑动时长
	dom: null,  //某一个元素滑动，滑动内的元素则为该元素的直接子元素
	cps: 1, //每次滑动几个子元素
	noGap: false,//是否无缝滑动
	easing: null,   //提供jquery 的easing运动函数
	mode: 'horizontal', //上下滑动还是水平滑动，默认为水平滑动
});
```

```js
//一个定时滑动的例子
var slider = new Slider({
    dom: '#slide',
    noGap: true
});

setInterval(function(){
    slide.toNext();
}, 3000);
```

```js
//禁用按钮
$('#slide').slider().on('before', function(){
	//在执行before时，index已经为目标运行后的index，而非以前的index
	if(this.isFirst()){
		$('#prev_btn').attr('disabled', 'disabled');
	}
});
```
