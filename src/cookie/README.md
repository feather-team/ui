Cookie
======================

cookie操作插件

###Api

* set(key, value[, options]) 设置一个cookie

```js
Cookie.set('name', 123, {
  expires: 3600, //3600秒后过期
  path: '/abc',
  secure: true
});
```

* get(key[, _default]) 获取一个cookie
```js
console.log(Cookie.get('name', 456));
```

* remove(key) 删除
```js
Cookie.remove('name');
console.log(Cookie.get('name'));
```
