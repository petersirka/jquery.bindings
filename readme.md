# jQuery two way bindings

Simple jQuery two way bindings. This plugin joins HTML elements with a model and in reverse. __This plugin is a little big cannon for the web development.__

![jQuery two way bindings](http://source.858project.com/img/jquery-two-way-bindings.png)

- [CLICK HERE - jComponent](https://github.com/petersirka/jComponent)
- easy to use
- minified only 11 kB (without GZIP compression)
- great functionality
- great use
- works with jQuery 1.9+
- works in IE 7+
- [__DEMO EXAMPLE__](http://source.858project.com/jquery-bindings-demo.html)

__MUST SEE:__

- [partial.js client-side routing](https://github.com/petersirka/partial.js-clientside)
- [jQuery templating engine according to partial.js](https://github.com/petersirka/jquery.templates)
- [Web application framework for node.js - partial.js](https://github.com/petersirka/partial.js)

#### How does it works?

- plugin connects a JavaScript object with HTML elements according to data-model attribute
- data-model must contain object property name
- in INPUTS, SELECTS and TEXTAREAS plugin uses two way bindings
- model is updated when is changed value in a INPUT/SELECT/TEXTAREA or [manually](#bindingssetpath-value)

__HTML attributes:__

```html
<div id="container" data-name="my-model-1">
	<div><input type="text" data-model="property" /></div>
	<div data-model="property"></div>
	<div data-model="property.next.property"></div>
	<div data-model="created" data-format="your-custom-format"></div>
	<div data-model="tags" data-custom="your-custom-identificator"></div>
	<div data-model="html" data-encode="false"></div>
</div>
```

- data-name="{String}" is a container name
- data-encode="{Boolean}" enable HTML encoding/decoding string (default: true)
- data-format="{String}" calls $.bindings.format() delegate
- data-custom="{String}" calls $.bindings.custom() delegate

#### $.bindings('create')(model, [template]);

> Create bindings.

```js
$('#form').bindings('create')({ firstname: 'Peter', lastname: 'Širka' });

// or (XHR)

$('#form').bindings('create')({ firstname: 'Peter', lastname: 'Širka' }, '/my-form.html');

// or (HTML)

$('#form').bindings('create')({ firstname: 'Peter', lastname: 'Širka' }, '<input type="text" data-model="firstname" /><span>your firstname: <b data-model="first-name"></b></span>');

// or (SELECTOR)

$('#form').bindings('create')({ firstname: 'Peter', lastname: 'Širka' }, '#template-selector');
```

#### $.bindings('download')(url, [template]);

> Create bindings.

```js
$('#form').bindings('download')('/model.json');

// or

$('#form').bindings('download')('/model.json', '<input type="text" data-model="firstname" /><span>your firstname: <b data-model="first-name"></b></span>');

// or

$('#form').bindings('download')('/model.json', '#template-selector');
```

#### $.bindings('json')(query, [template]);

> Create bindings.

```html
<script type="text/plain" id="model-selector">{"firstname":"Peter","lastname":"Širka"}</script>
```

```js
$('#form').bindings('json')('#model-selector');

// or

$('#form').bindings('json')('#model-selector', '<input type="text" data-model="firstname" /><span>your firstname: <b data-model="first-name"></b></span>');

// or

$('#form').bindings('json')('#model-selector', '#template-selector');
```

#### $.bindings('refresh');

> Refresh values in HTML.

```js
$('#form').bindings('refresh');
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

#### $.bindings('validate');

> Validate a model.

```js
$('#form').bindings('validate');
```

#### $.bindings('set')(path, value);

> Rewrite an existing value.

```js
$('#form').bindings('set')('firstname', 'Janko');

// or

$('#form').bindings('set')('user.firstname', 'Janko');

// or

$('#form').bindings('set')('tags', function(value) {
	value.push('new-tag');
	return value;
});
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

// OR

$('#form').bindings('update')(function(model) {
	model.firstname = 'Peter';
	model.lastname = 'Širka';
	return model;
});
```

#### $.bindings('model') or $.bindings();

> Get a model.

```js
$('#form').bindings();

// or

$('#form').bindings('model');

// OUTPUT: { firstname: 'Janko', lastname: 'Izaak' }
```

#### $.bindings('send')(url, [options], [callback(err, data)])

> Send a model via XHR as application/json.

```js
$('#form').bindings('send')('/form/submit/');

// or

$('#form').bindings('send')('/form/submit/', { type: 'PUT' });
```

#### $.bindings('change')([isChange])

> Was a model changed?

```js

console.log($('#form').bindings('change')());

// or, custom set:

$('#form').bindings('change')(true);
```

## Delegates

#### $.bindings.prepare(path, value, format, model, name)

> Prepare current value from an INPUT to a MODEL. Always must return a value.

```js
$.bindings.prepare = function(path, value, format, model, name) {
	// EXAMPLE:
	// this === current element with data-model attribute
	if (path === 'age')
		return parseInt(value);
	return value;
};
```

#### $.bindings.format(path, value, format, model)

> Format current value from a MODEL to a HTML. Always must return a value.

```html
<!-- ENCODED -->
<div data-model="age" data-format="years <b>old</b>"></div>

<!-- OR RAW -->
<div data-model="age" data-format="years <b>old</b>" data-encode="false"></div>
```

```js
$.bindings.format = function(path, value, format, model, name) {
	// EXAMPLE:
	// this === current element with data-model attribute
	if (path === 'age')
		return value + ' ' + format;
	return value;
};
```

#### $.bindings.custom(path, value, format, model, name)

> Format current value from a MODEL to HTML. Always must return a value.

```html
<div data-model="age" data-custom="custom-value"></div>
```

```js
$.bindings.custom = function(path, value, custom, model, name) {
	// EXAMPLE:
	// this === current element with data-model and data-custom attribute
	if (path === 'age' && custom === 'custom-value')
		return value + ' years old';
	return value;
};
```

#### $.bindings.validation(path, value, model, name)

> Validate current value to MODEL. Always must return Boolean.

```js
$.bindings.validation = function(path, value, model, name) {

	switch (path) {
		case 'age':
			return value > 17 && value < 50;
	}

	return true;
};
```

#### $.bindings.watch(isValid, path, value, model, name)

> Watch an element.

```js
$.bindings.watch = function(isValid, path, value, model, name) {
	var el = this;
	el.toggleClass('error', isValid);
};
```

## Events

```js
$('#form').on('model-create', function(e, model) {
	// Is triggered after $().bindings('create')
});

$('#form').on('model-update', function(e, model, path) {
	// Is triggered after is the model updated
});

$('#form').on('model-change', function(e, path, value, model, name, element) {
	// Is triggered when is changed a value in the model through HTML element
});

$('#form').on('model-destroy', function(e) {
	// Is triggered when is destroyed binding
});

$('#form').on('model-default', function(e, model) {
	// set to the default model
});

$('#form').on('model-validate', function(e, errorlist) {
	errorlist[0].path;
	errorlist[0].value;
	errorlist[0].element;
});

// OR

$('#form').on('validate', function(e, errorlist) {
	errorlist[0].path;
	errorlist[0].value;
	errorlist[0].element;
});

$('#form').on('model-send-begin', function(e, url, model) {
	// begin sending
});

$('#form').on('model-send-end', function(e, url, model) {
	// end sending
	// IMPORTANT: always is executed
});

$('#form').on('model-send-error', function(e, status, url, model) {
	// error
});

$('#form').on('model-send', function(e, data, model) {
	// Response data
});

// OR

$('#form').on('send', function(e, data, model) {
	// Response data
});

$('#form').on('model-download-begin', function(e, url) {
	// begin downloading JSON model
});

$('#form').on('model-download-end', function(e, url, data) {
	// end downloading JSON model
	// IMPORTANT: always is executed
});

$('#form').on('model-download-error', function(e, status, url) {
	// error
});

$('#form').on('template-download-begin', function(e, url) {
	// begin downloading template
});

$('#form').on('template-download-end', function(e, url, data) {
	// end downloading template
});
```
