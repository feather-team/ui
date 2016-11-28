Tooltip (工具气泡组件)
==============================

###Options

* dom：需绑定的元素

* content: 气泡内容

* contentAttr：指定一个气泡内容获取的属性，content为空时，默认为data-tooltip

* hover：hover时显示和隐藏，默认为true，如果为false，则需手动控制

* theme：气泡的样式风格，可选：gray、red、black、orange

* pos：指定出现位置，默认为top，值的格式为：top-left|left-top|top left|left top，可选值为top|right|left|bottom|top left|top right|right bottom|left bottom

* offset: 指定偏移值，该值是向指定的坐标的方向偏移，比如指定bottom，offset为正值，则tooltip的位置会更向下，如果是bottom right,则会向2个方向加上坐标值

* className: 指定一个classname，可自定义自己的样式

###Api

* setContent(content): 动态设置一个content

* show(): 显示

* hide(): 隐藏

* toggle(): 动态切换隐藏还是显示

* setPos(pos): 动态一个坐标位置，同options里的pos参数，可选值top|right|left|bottom|top left|top right|right bottom|left bottom

* destroy()：删除tooltip

###Example

```js
$('#tooltip').tooltip({
	theme: 'red',
	pos: 'left top',
	offset: 5,
	hover: false,
	content: '这是一个例子'
});

$('#tooltip').click(function(){
	$(this).tooltip('toggle');
	//$(this).tooltip().toggle();
});
```