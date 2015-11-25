DropList组件
==========================

###Options

* list：droplist中显示内容的key-value对象
* items: list的别名
* dom：一个select对象，直接和droplist建立绑定关系，droplist会自动获取select中所有的key-value对
* container：droplist的容器指定，默认为document.body
* width：指定一个宽度，如果为false，则自适应变化宽度
* height：指定一个高度，如果为false, 则按照标准高度显示
* hover：是否鼠标划过时，显示下拉列表，默认为true，如果为false，则使用click事件来控制
* defaultValue：默认值
* selectedClassName：选中时的样式

###Events

* open：打开dialog时触发
* close： 关闭dialog时触发
* select(key, value)：选择时触发

###Api

* open: 打开
* close: 关闭
* setList(list[, defaultValue, defaultKey])：手动设置一个list，list可以为一个jquery选择器表达式、dom对象，jquery对象或者key-value对
* setValue(value[, key])：设置一个值
* getValue()：设置当前值
* disable()：禁用
* enable(): 恢复使用
* destroy(): 摧毁对象