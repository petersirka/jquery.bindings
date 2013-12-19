# jQuery two way bindings

#### $.bindings('create')(model, [template]);

> Create bindings.

```js
$('#form').bindings('create')({ firstname: 'Peter', lastname: 'Širka' });

// or

$('#form').bindings('create')({ firstname: 'Peter', lastname: 'Širka' }, '<input type="text" data-model="firstname" /><span>your firstname: <b data-model="first-name"></b></span>');

// or

$('#form').bindings('create')({ firstname: 'Peter', lastname: 'Širka' }, '#template-selector');
```

#### $.bindings('destroy');

> Destroy bindings.

```js
$('#form').bindings('destroy');
```

#### $.bindings('default');

> Default bindings. As default model is used a model from bindings('create').

```js
$('#form').bindings('default');
```

#### $.bindings('set')(path, value);

> Rewrite an existing value.

```js
$('#form').bindings('set')('firstname', 'Janko');

// or

$('#form').bindings('set')('user.firstname', 'Janko');
```

#### $.bindings('get')(path);

> Get an existing value.

```js
$('#form').bindings('get')('firstname');

// or

$('#form').bindings('get')('user.firstname');
```

#### $.bindings('update')(model);

> Update a model.

```js
$('#form').bindings('update')({ firstname: 'Janko', lastname: 'Izaak' });
```

#### $.bindings('model') or $.bindings();

> Get a model.

```js
$('#form').bindings();

// or

$('#form').bindings('model');

// OUTPUT: { firstname: 'Janko', lastname: 'Izaak' }
```

#### $.bindings('send')(url, [options])

> Send a model via XHR as application/json.

```js
$('#form').bindings('send')('/form/submit/');

// or

$('#form').bindings('send')('/form/submit/', { type: 'PUT' });
```

## Delegates

#### $.bindings.prepare(name, value, format, model)

> Prepare current value from an INPUT to a MODEL. Always must return a value.

```js
$.bindings.prepare = function(name, value, format, model) {
	// EXAMPLE:
	// this === current element with data-model attribute
	if (name === 'age')
		return parseInt(value);
	return value;
};
```

#### $.bindings.format(name, value, format, model)

> Format current value from a MODEL to a HTML. Always must return a value.

```html
<div data-model="age" data-format="years old"></div>
```

```js
$.bindings.format = function(name, value, format, model) {
	// EXAMPLE:
	// this === current element with data-model attribute
	if (name === 'age')
		return value + ' ' + format;
	return value;
};
```

#### $.bindings.format(name, value, format, model)

> Format current value from MODEL to HTML. Always must return a value.

```html
<div data-model="age" data-custom="custom-value"></div>
```

```js
$.bindings.element = function(custom, name, value, model) {
	// EXAMPLE:
	// this === current element with data-model and data-custom attribute
	if (name === 'age' || custom === 'custom-value')
		return value + ' years old';
	return value;
};
```

## Events

```js

$('#form').on('model-create', function(e, model) {
	// create bindings
});

$('#form').on('model-update', function(e, model, path) {
	// update a model in bindings
});

$('#form').on('model-change', function(e, name, value, model) {
	// change a value in the model
});

$('#form').on('model-destroy', function(e) {
	// destroy bindings
});

$('#form').on('model-default', function(e, model) {
	// set a default model
});

$('#form').on('model-send-begin', function(e, url, model) {
	// begin sending
});

$('#form').on('model-send-end', function(e, url, model) {
	// end sending
	// IMPORTANT: always is executed
});

$('#form').on('model-send-error', function(e, url, model) {
	// error
});

$('#form').on('model-send-no', function(e, data, model) {
	// Response data is an Array
});

$('#form').on('model-send-ok', function(e, data, model) {
	// Response ata is an Object
});

```
