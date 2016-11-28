Template
================

超轻量级的前端模版引擎

###Api

* parse(content:String, data:Object)：执行一个字符串
* fetch(id:String, data:Object)：通过id提取出一个dom元素内的内容，并执行，dom元素通常为一个script标签，如果是input或者textarea，则直接取value属性

###Example
```html
<script>
Template.parse("<%if(status){%>true<%}else{%>false<%}%>", {status: 1});

Template.fetch("test", {
  list: [
    {
      name: '123'
    },
    
    {
      name: '123'
    }
  ]
});
</script>

<script type="text/html" id="test">
<%list.forEach(function(item){%>
<p><%=item.name%></p>
<%});%>
</script>
```
