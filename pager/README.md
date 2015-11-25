Pager分页组件
====================== 
 
###Options

* dom: 生成页码的容器
* pageTotal: 页总数
* perPage：显示的页的个数，如果总数大雨此参数，则会出现...来表示中间省略的页码
* url：跳转的地址，组件会自动在该url后面追加&page=页码，默认为空，则需要绑定switch事件
* first：是否显示首页按钮
* last：是否显示尾页按钮
* currentPage：初始化时的页码
* currentPageClassName: 当前页码的类名
* className：组件对象的类名
* pageClassName：各个页码的样式

###Events:

* switch(pageIndex)：切换页码时触发

###Api:

* to(pageIndex)：跳转至第几页，该方法会触发switch事件