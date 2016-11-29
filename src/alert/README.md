Alert组件
=============================

###Options

*	content: 显示内容
*   callback：点击确认按钮后，执行的回调函数
*   unclose：点击确认后，是否关闭，默认为false，即关闭
*   opt: 同dialog组件

###Event 同dialog组件

###Api 同dialog组件
 
###Example

```js
var alert = Alert.alert('确定删除该微博么？', function(){
    console.log('点击了确认按钮');
}, true);

console.log(alert) //dialog对象

alert.getButton('确定').click(function(){
		 console.log('直接在jquery上绑定的click事件触发了');
});

alert.on('close', function(){console.log('alert关闭了')});
```