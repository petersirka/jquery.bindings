// <element data-model="property" data-default="1" data-format="dd.MM.yyyy" data-prepare="#####.##" />
var jquerybindings_cache = {};

$.bindings = {};

$.fn.bindings = function(type) {

	var self = this;

	if (typeof(type) === 'undefined')
		type = 'model';

	switch (type) {
		case 'create':
			return (function(model, template) { return bindings_create.call(self, model, template); });
		case 'refresh':
			bindings_refresh.call(self);
			return;
		case 'destroy':
			bindings_destroy.call(self);
			return;
		case 'default':
			bindings_default.call(self);
			return;
		case 'set':
			return (function(path, value) { return bindings_set.call(self, path, value); });
		case 'get':
			return (function(path) { return bindings_get.call(self, path); });
		case 'update':
			return (function(model) { return bindings_create.call(self, model); });
		case 'model':
			return bindings_create.call(self);
		case 'send':
			return (function(url, options) { return bindings_send.call(self, url, options); });
	}

	return self;
};

function bindings_create(model, template) {

	var self = this;

	if (typeof(model) === 'undefined')
		return self.data('model');

	if (typeof(self.data('model')) !== 'undefined') {
		self.data('model', model);
		bindings_refresh.call(self);
		self.trigger('model-update', model);
		return self;
	}

	self.data('default', $.extend({}, model));
	self.data('model', model);

	if (typeof(template) !== 'undefined') {
		if (template.indexOf('>') !== -1 && template.indexOf('<') !== -1)
			self.html(template);
		else
			template = $(template).html();
	}

	bindings_refresh.call(self);
	self.trigger('model-create', model);
	return bindings_rebind.call(self);
}

function bindings_destroy() {
	var self = this;
	self.removeData('model');
	self.find('input[data-model],textarea[data-model],select[data-model]').unbind('change');
	self.trigger('model-destroy');
	return self;
}

function bindings_default() {
	var self = this;
	var model = self.data('default');
	self.data('model', model);
	bindings_refresh.call(self);
	self.trigger('model-default', model);
	return self;
}

function bindings_set(path, value) {
	var self = this;
	var model = self.data('model');

	if (typeof(model) === 'undefined')
		return self;

	if (bindings_setvalue(model, path, value))
		bindings_rebind.call(self);

	self.trigger('model-update', model, path);
	return self;
}

function bindings_get(path) {
	var self = this;
	var model = self.data('model');
	if (typeof(model) === 'undefined')
		return;
	return bindings_getvalue(model, path);
}

function bindings_rebind() {

	var self = this;
	var model = self.data('model');

	if (typeof(model) === 'undefined')
		return self;

	self.find('[data-model]').each(function() {
		var el = $(this);
		switch (this.tagName.toLowerCase()) {
			case 'input':
			case 'textarea':
			case 'select':
				return;
			default:
				var name = el.attr('data-model');
				var custom = el.attr('data-custom');
				if (typeof(custom) === 'undefined')
					el.html($.bindings.format.call(el, name, model[name], el.attr('data-format'), model));
				else
					$.bindings.element.call(el, name, model[name]);
				return;
		}
	});

	return self;
}

function bindings_refresh() {
	var self = this;

	var model = self.data('model');
	if (typeof(model) === 'undefined') {
		model = {};
		self.data('model', model);
	}

	var elements = self.find('input[data-model],textarea[data-model],select[data-model]').unbind('change').bind('change', function(e) {
		var el = $(this);
		var name = el.attr('data-model') || '';
		var type = el.attr('type');
		var value = el.val();

		if (name.length === 0)
			name = this.name;

		if (type === 'checkbox')
			value = this.checked;

		self.data('model')[name] = $.bindings.prepare.call(el, name, value, el.attr('data-prepare'));

		if (type !== 'checkbox' && type !== 'radio') {
			switch (this.tagName.toLowerCase()) {
				case 'input':
				case 'textarea':
					this.value = $.bindings.format.call(el, name, value, el.attr('data-format'), self.data('model'));
					break;
			}
		} else
			this.checked = value;

		bindings_rebind.call(self);
		self.trigger('model-change', name, value, model);
	});

	self.find('[data-model]').each(function() {
		var el = $(this);
		var name = el.attr('data-model') || '';
		var isIO = false;

		switch (this.tagName.toLowerCase()) {
			case 'input':
			case 'textarea':
			case 'select':
				isIO = true;
				if (name.length === 0)
					name = this.name;
				break;
		}

		var value = model[name];

		if (typeof(value) === 'undefined')
			value = el.attr('data-default');

		if (isIO) {
			var type = el.attr('type');
			if (type === 'checkbox')
				this.checked = value === true || value === 1 || value == 'true';
			else if (type === 'radio') {
				if (this.value == value)
					this.checked = true;
				else
					return;
			} else
				el.val(value);

			self.trigger('model-change', name, value, model);
		}
		else
			el.html(value);
	});

	return self;
}

function bindings_send(url, options) {

	var self = this;
	var model = self.data('model');

	if (!model)
		return self;

	var self = this;

	if ($.isPlainObject(url)) {
		var tmp = options;
		options = url;
		url = tmp;
	}

	url = url || window.location.pathname;

	if (!options)
		options = {};

	if (!options.type)
		options.type = 'POST';

	if (!options.dataType)
		options.dataType = 'json';

	var key = url + JSON.stringify(options);
	if (jquerybindings_cache[key])
		return;

	self.trigger('model-send-begin', url, model);

	options.contentType = 'application/json';
	options.data = JSON.stringify(model);

	options.success = function(data) {
		self.trigger('model-send-end', url, model);
		delete jqueryforms_cache[key];
		if (data instanceof Array)
			self.trigger('model-send-no', data, model);
		else
			self.trigger('model-send-ok', data, model);
	};

	options.error = function(xhr, status) {
		self.trigger('model-send-end', url, model);
		delete jqueryforms_cache[key];
		self.trigger('model-send-error', status, url, model);
	};

	$.ajax(url, options);
	return self;
}

$.bindings.prepare = function(name, value, format, model) {

	if (typeof(value) !== 'string')
		return value;

	if (!value.isNumber())
		return value;

	value = value.replace(',', '.');
	if (value.indexOf('.') === -1)
		return parseInt(value);

	return parseFloat(value);
};

$.bindings.format = function(name, value, format, model) {
	return value;
};

$.bindings.element = function(name, value, model) {};

function bindings_setvalue(obj, path, value) {
	path = path.split('.');
	var length = path.length;
	var current = obj;
	for (var i = 0; i < path.length; i++) {
		if (typeof(current[path[i]]) === 'undefined')
			return false;
		current[path[i]] = value;
	}
	return true;
}

function bindings_getvalue(obj, path) {
	path = path.split('.');
	var length = path.length;
	var current = obj;
	for (var i = 0; i < path.length; i++) {
		if (typeof(current[path[i]]) === 'undefined')
			return;
		current = current[path[i]];
	}
	return current;
}

if (!String.prototype.isNumber) {
	String.prototype.isNumber = function(isDecimal) {

		var self = this;
		var length = self.length;

		if (length === 0)
			return false;

		isDecimal = isDecimal || true;

		for (var i = 0; i < length; i++) {
			var ascii = self.charCodeAt(i);

			if (isDecimal) {
				if (ascii === 44 || ascii === 46) {
					isDecimal = false;
					continue;
				}
			}

			if (ascii < 48 || ascii > 57)
				return false;
		}

		return true;
	};
}