FormValid组件
================================

###Options

* dom: 检验的dom对象
* rules：规则object
* showSucesssStatus：是否显示成功状态，默认为false
* showErrorStatus：是否显示失败状态，默认为true
* errorStop：碰到失败时立即停止检查，默认为false
* skipHidden：跳过隐藏元素，默认为false

###Events

* error(name, errorTxt)：错误时触发
* success(name, successTxt)：成功时触发

###Api

* setRules(rules)： 重新设置所有的rules
* check([name])：检查指定元素，或者所有元素并返回状态值
* error(name[, text])：手动触发一个错误
* success(name[, text, showSuccessStatus])：手动触发成功
* reset(name[, _default])：重置一个元素的状态，可设置一个默认文本
* addRule(name[, rule])：新增一个规则，name可为object
* removeRule(name)：移除一个元素的规则

###Example

```js
$('#form').formValid({
    showSuccessStatus: false,
    rules: {
        'name': {
            required: true, //必选
            length: '1,8'   //1-8个字符的长度,
            errorText: '格式错误'
        },

        'password': {
            rule: /^\w{9}$/,
            successText: '正确',
            showSuccessStatus: true
        },

        'age': {
            rule: function(value, name){
                return value > 0 && value < 130;
            },
            errorText: '年龄错误'
        }
    }
}).on('error', function(name, text){
    console.log(name, text);
});
```