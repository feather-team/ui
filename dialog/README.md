Dialog组件
=======================

###Options

*   title: 标题，如果为false，则整个头部都不会显示
*   container: 约束的容器
*   dom：指定将某一个dom放置在dialog中
*   content: 指定dialog中的内容
*   url: 加载一个url显示在dialog中
*   width: dialog宽度
*   height：dialog高度，默认为false，自适应高度
*   esc：是否按下ESC键关闭，默认false
*   mask：是否背景遮罩，默认true
*   autoOpen：是否创建后自动打开，默认false
*   className: 为dialog指定一个className
*   handle：触发打开dialog的元素
*   buttons：dialog按钮组
*   customWraper: 是否自定义dialog的wraper，默认为false，如果为true，传入dom时，dom则自动变成dialog的整体，如果需要使用dialog的部分api时，则需和原dialog结构保持一致。

```html
<div id="dialog"></div>

<script>
//直接将自己当成dialog，并实例化
$('#dialog').dialog({
    customWraper: true
});
</script>


<!--保持结构一致，可支持设置按钮和标题等api-->
<div id="dialog" class="ui2-dialog-wraper">
    <strong class="ui2-dialog-header">
        <a href="javascript:void(0);" class="ui2-dialog-close">&times;</a>
        <span class="ui2-dialog-title"></span>
    </strong>
    <div class="ui2-dialog-content"></div>
    <div class="ui2-dialog-buttons"></div>
</div>

<script>
$('#dialog').dialog({
    customWraper: true
}).setContent("hello, world");
</script>
```

###Events

*   open：打开dialog时触发
*   close： 关闭dialog时触发
*   firstOpen：第一次打开时触发
 

###Api

*   setContent(html): 设置dialog的html格式内容
*   setDom(dom): 将一个dom放置于dialog中
*   load(url)：加载这个url的内容
*   resetPosition(): 位置发生异常时，可执行，窗口大小改变和滚动页面时，会自动执行该方法
*   setTitle(title): 设置title，同options.title
*　 open: 打开
*   close: 关闭
*   destroy: 删除对象，如果dialog中的内容为一个dom，则此dom会自动释放于document.body中
*   setButtons(buttonsObject): 设置dialog的按钮组，同options.buttons
*   getButton(buttonName|buttonIndex): 获取到按钮组成员的jQuery对象
 
###Example

```js    
//bind event
$('#dialog').dialog().on('open', function(){
    console.log(123);
});
 
//setButtons:
$('#dialog').dialog().setButtons({
    '确定': function(){
        alert('点击了确定');
    },

    '取消': {
        //设置className
        className: 'cancel',
        events: {
            click: function(){
                alert('点击了取消按钮');
            },

            mouseover: function(){
                alert('鼠标划过按钮');
            }
        }
    }
});
  
//getButton:
$('#dialog').dialog().getButton('确定').click(function(){
    alert('绑定click事件')
});

$('#dialog').dialog().getButton(0).click(function(){
    alert('为确定再次绑定click事件')
});
```