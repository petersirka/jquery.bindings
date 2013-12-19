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
		return self;
	}

	self.data('default', $.extend({}, model));
	self.data('model', model);

	if (typeof(template) !== 'undefined') {
		if (template.indexOf('<') === -1)
			template = $(template).html();
		self.html(template);
	}

	bindings_refresh.call(self);
	self.trigger('model-create');
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
	self.data('model', self.data('default'));
	bindings_refresh.call(self);
	self.trigger('model-default');
	return self;
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
				el.html($.bindings.format.call(el, name, model[name], el.attr('data-format'), model));
				return;
		}
	});
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
		self.trigger('model-update', name, value, model, false);
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

			self.trigger('model-update', name, value, model, true);
		}
		else
			el.html(value);
	});
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

	self.trigger('loading', true, url);

	options.contentType = 'application/json';
	options.data = JSON.stringify(model);

	options.success = function(data) {
		self.trigger('loading', false, url);
		delete jqueryforms_cache[key];
		if (data instanceof Array)
			self.trigger('no', data);
		else
			self.trigger('ok', data);
	};

	options.error = function(xhr, status) {
		self.trigger('loading', false, url);
		delete jqueryforms_cache[key];
		self.trigger('error', status);
	};

	$.ajax(url, options);
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