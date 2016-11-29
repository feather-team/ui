Util 工具集
========================

###Api

####number

* format：为数字添加千分位
```js
console.log(Util.number.format(1111)); //1,111
```

* toInt：转整数

####string

* toPad(原字符串, pad的字符串, pad的次数[, 是否左边pad])  为一个字符串追加字符片段 
```js
console.log(Util.string.toPad('s', 'e', 3));  //'seee'
```

* nl2br(原字符串)  将string中的换行符替换为 html换行
```js
console.log(Util.string.nl2br('a\r\nb')); //'a<br />b'
```

* empty(字符串)  检查一个字符串是否为空
* toInt() 将其他类型转为整形，不能转化则返回0
* reverse(字符串)  字符反转
* md5(字符串)
* base64Encode
* base64Decode
* parseJSON
* jsonDecode

####date

* time() 获取当前事件戳
* date(时间格式化字符串[,时间戳]) 返回和php一样的时间格式

```js
//如Date.date('Y-m-d H:i:s'); 2012-09-10 11:10:00
//Y 4位年
//y 2位年
//m 2位月
//n 不加0的月
//d 2位 当前多少日
//j 不加0的日
//D 星期几
//h 不加0的小时
//H 2位小时
//i 2位分
//s 2位秒
//a am或者pm
//A AM或者PM
//t 当前月有多少天
```

####object

* set(obj, key, value)

```js
Util.object.set({}, 'a.b.c.d', 1);
```

* get(obj, key):

```js
Util.object.get({
	a: {
		b: {
			c: {
				d: 1
			}
		}
	}
}, 'a.b.c.d');   //1
```

* toJSONString(object)
* jsonEncode(object)
* parseJSON(string)
* jsonDecode(string)