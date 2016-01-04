Draggable组件
==========================


###Options
 
*   dom：被拖拽的元素
*   handle：拖拽事件的元素
*   axis: 指定拖拽方向，可选x和y，如果为空，则任意方向

###Events

*   start(event, left, top)：开始拖拽时触发
*   drag(event, left, top)： 拖拽时触发
*   stop(event, left, top)：停止拖拽时触发

###Example

```js
$('#draggable').draggable({
   handle: '#draggable-handle',
   axis: 'y'
}).on('draggable:start', function(event, x, y, mouseEvent){
   console.log(x, y, mouseEvent.pageX, mouseEvent.pageY);
});
```