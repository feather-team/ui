Uploader (上传组件)
=========================

Uploader组件是基于uploadify插件2次开发的组件，提供用户更好和更简单的使用体验，更多使用方式可参考[uploadify官网](http://www.uploadify.com)

###Options(常用)

* dom：需要创建上传组件的dom
* fixedCookie：是否将cookie传至服务器端，解决flash在某些浏览器下无法传递cookie的bug，cookie会以post方式发送至服务器端
* debug：是否开启debug模式
* width：宽度，默认为dom的宽度
* height：高度，默认为dom的高度
* buttonText：按钮的文字，默认为“上传”
* buttonClass：按钮样式
* buttonImage：按钮图片，指定一个图片url
* uploader：上传接收地址
* auto：是否选择后自动上传，默认为true，如果设置为false，则需要手动调用upload方法
* formData：发送请求时额外传递的参数,Object
* queueID: 指定一个容器，在此容器里会显示上传进度和上传队列
* queueSizeLimit：队列最大值，默认999
* uploadLimit：最大上传个数
* fileTypeExts: 允许的文件后缀，如：'*.jpg;*.jpeg;*.png'

###Event

* cancel
* clearQueue 
* destroy 
* dialogOpen
* dialogClose(filesSelected, filesQueued, queueLength)
* select(file) 
* selectError(file, errorCode, errorMsg) 
* queueComplete 
* uploadComplete(file) 
* uploadError(file, errorCode, errorMsg) 
* uploadProgress(file, fileBytesLoaded, fileTotalBytes) 
* uploadStart(file) 
* uploadSuccess(file, data, response)

###Api

* cancel 
* destroy 
* disable 
* settings 
* stop 
* upload

###Example

```js
$('#uploader').uploader({
	uploader: '/ajax/uploadFile',
	queueID: 'uploader-queue',
	buttonText: '上传文件'
});

$('#uploader').on('uploadSuccess', function(file, data){
	console.log(file, data);
});
```

###注意

如果上传时需要跨域，需要服务器端自行在webroot根目录下添加crossdomain.xml文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<cross-domain-policy>
<allow-access-from domain="*.baidu.com" />
<allow-access-from domain="baidu.com" />
</cross-domain-policy>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<cross-domain-policy>
<allow-access-from domain="*" />
</cross-domain-policy>
```