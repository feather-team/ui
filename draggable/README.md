Draggable组件
==========================


###Options
 
*   dom：被拖拽的元素
*   handle：拖拽事件的元素
*   axis: 指定拖拽方向，可选x和y，如果为空，则任意方向

###Events

*   start(left, top, event)：开始拖拽时触发
*   drag(left, top, event)： 拖拽时触发
*   stop(left, top, event)：停止拖拽时触发

###Example

```js
$('#draggable').draggable({
   handle: '#draggable-handle',
   axis: 'y'
}).on('start', function(x, y, event){
   console.log(x, y, event.pageX, event.pageY);
});
```