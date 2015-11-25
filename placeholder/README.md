PlaceHolder
================================

为不兼容HTML5的浏览器实现Plcaceholder属性

###Options

* dom：绑定placeholder的元素
* text：placeholder的文字，可不设置，自动读取placeholder属性和data-placeholder属性

###Api:

* setPlaceHolder([text])：设置placeholder，如果为空，则自动读取placeholder和data-placeholder属性

##Example
```html
<input type="text" id="username" name="username" placeholder="输入用户名" />
```

```js
new PlaceHolder({
    dom: '#username',
    text: 'xxx' //也可以不设置placeholder属性 而设置text字段，text字段里的内容会被自动设置成placeholder
});
```
