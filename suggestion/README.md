Suggestion
=======================

##Options

* dom：绑定suggestion的input元素
* width：指定一个宽度，如果为false，则会自动适应input的宽度
* max: 最大返回记录数，默认为10
* caching：是否进行缓存，默认true
* url：发送请求的url
* data：指定一个本地数据集，标准类型为一个字符串数组，具体结构如下：

```js
//字符串数组格式
$('#suggestion').suggestion({
	data: ['123', '1111', '1234']
});

//规范对象数组格式
$('#suggestion').suggestion({
	data: {
		status: 1,
		data: {
			userList: [
				{
					uid: 1,
					name: "张三"
				},

				{
					uid: 2,
					name: "李四"
				}
			]
			//其他数据
		}
	},
	dataField: 'data.userList',	//从data中的data.userList字段作为最终的数据集
	matchKwField: 'name'	//指定关键词候选项取每一个对象的name属性
});
```

* dataField：指定从data中的哪一个字段中返回数据集
* matchKwField：指定关键词候选项读取对象的属性
* delay：键盘操作延迟多少ms后进行候选项匹配操作，默认为300ms
* empty2close：input值为空时，是否隐藏suggestion，默认true，可用于input值为空时，一样发送请求返回一些默认数据
* emptyNoCache：input值为空时，是否使用缓存
* kw：发送请求时，该参数作为关键词请求参数传递给服务器端，默认kw，发送请求时，格式为：/suggestion?kw=123
* requestParams：发送请求时，追加的参数，默认为{}
* match(data:数据源, kw:关键词)：自定义匹配的hook函数，默认不做任何处理，直接返回原始数据源

```js
//规范对象数组格式
$('#suggestion').suggestion({
	data: {
		status: 1,
		data: {
			userList: [
				{
					uid: 1,
					name: "张三"
				},

				{
					uid: 2,
					name: "李四"
				}
			]
			//其他数据
		}
	},
	dataField: 'data.userList',
	//自定义匹配规则
	match: function(data, kw){
		var result = [];

		data.forEach(function(item){
			if(item.name.indexOf(kw)){
				result.push(item.name);
			}
		});

		return result;
	}
});
```

* format(item:数据源数组项, kw:关键词)：自定义格式化候选项格式的函数，默认不做任何处理，返回值必须为字符串

```js
//规范对象数组格式
$('#suggestion').suggestion({
	data: {
		status: 1,
		data: {
			userList: [
				{
					uid: 1,
					name: "张三"
				},

				{
					uid: 2,
					name: "李四"
				}
			]
			//其他数据
		}
	},
	dataField: 'data.userList',
	//自定义匹配规则
	match: function(data, kw){
		var result = [];

		data.forEach(function(item){
			if(item.name.indexOf(kw)){
				result.push(item.name);
			}
		});

		return result;
	},

	//返回一个自定义的候选项字符串
	format: function(item, kw){
		return item.replace(kw, '<strong>' + kw + '</strong>');
	}
});
```

##Event

* switch(txt)：上下键切换时，触发
* select(value:候选项, data:候选项所在数据源中的数组项)：选择候选项时触发

```js
//规范对象数组格式
$('#suggestion').suggestion({
	data: {
		status: 1,
		data: {
			userList: [
				{
					uid: 1,
					name: "张三"
				},

				{
					uid: 2,
					name: "李四"
				}
			]
			//其他数据
		}
	},
	dataField: 'data.userList',
	//自定义匹配规则
	match: function(data, kw){
		var result = [];

		data.forEach(function(item){
			if(item.name.indexOf(kw)){
				result.push(item.name);
			}
		});

		return result;
	},

	//返回一个自定义的候选项字符串
	format: function(item, kw){
		return item.replace(kw, '<strong>' + kw + '</strong>');
	}
}).on('select', function(value, obj){
	console.log(value); //张三
	console.log(obj); //{uid: 1, name: "张三"}
});
```

##API

* setData(data)：手动设置数据源

* setHeader(header)：设置头部文本

* setFooter(footer): 设置底部文本

* setRequestParams(params)：设置请求追加参数

* open

* close
