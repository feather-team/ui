Calendar组件
===============================

 
###Options

*	 container: 日历容器，一般为document.body
*   dom：在指定元素上绑定日历组件，通常为input
*   maxDate：最大日期，格式同dateFormat
*   minDate: 最小可选日期
*   yearRange: 年月下拉可选范围，格式：1999:2100
*   dateFormat: 见util.date.date格式

 
###Events
 
*   switch(year, month)：年月切换时触发
*   select(date)： 选择有效日期时触发，日期格式由dateformat决定
*   open: 日历打开时触发
*   close：日历关闭时触发 

###Api

*   prevMonth: 切换至上个月
*   nextMonth: 切换至下个月
*   toMonth(month[, year]): 切换至某一年的某一月,此月为正常月份，非js date返回月份，比如要返回1月份，则传入1即可
*   open：打开日历
*   close: 关闭日历
 
###Example

```js
$('#calendar').calendar().on('select', function(date){
      console.log(date);
});
```