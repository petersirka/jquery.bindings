var jquerybindings_cache = {};
$.bindings = {};

$.fn.bindings = function (type) {
    var self = this;

    if (typeof (type) === 'undefined')
        type = 'model';

    var schema = self.attr('data-name');

    switch (type) {
        case 'create':
            return (function (model, template) { return bindings_create.call(self, model, template, schema); });
        case 'json':
            return (function (query, template) { return bindings_json.call(self, query, template, schema); });
        case 'download':
            return (function (url, template, options) { return bindings_download.call(self, url, template, options, schema); });
        case 'change':
            return (function (value) { if (typeof (value) !== 'boolean') return self.data('isChange') || false; return self.data('isChange', value); });
        case 'refresh':
            bindings_refresh.call(self, schema);
            return;
        case 'destroy':
            bindings_destroy.call(self, schema);
            return;
        case 'default':
            bindings_default.call(self, schema);
            return;
        case 'validate':
        case 'validation':
            return bindings_validate.call(self, schema);
        case 'set':
            return (function (path, value) { return bindings_set.call(self, path, value, schema); });
        case 'get':
            return (function (path) { return bindings_get.call(self, path, schema); });
        case 'update':
            return (function (model) { return bindings_create.call(self, model, schema); });
        case 'model':
            return bindings_create.call(self, null, null, schema);
        case 'send':
            return (function (url, options, callback) {
                if (typeof (options) === 'function') {
                    var tmp = callback;
                    callback = options;
                    options = callback;
                }
                return bindings_send.call(self, url, options, schema, callback);
            });
    }

    return self;
};

function bindings_create(model, template, schema) {
    var self = this;

    if (typeof (model) === 'undefined' || model === null)
        return $.extend({}, self.data('model'));

    var tmp = self.data('model');

    self.data('isChange', false);

    if (typeof (tmp) !== 'undefined') {
        if (typeof (model) === 'function') {
            tmp = model(tmp);
            if (tmp)
                self.data('model', tmp);
        }
        else
            self.data('model', model);

        bindings_refresh.call(self, schema);
        self.trigger('model-update', [model, schema]);
        return self;
    }

    if (typeof (template) !== 'undefined') {
        if (template.substring(0, 1) === '/') {
            self.trigger('template-download-begin', [template]);
            $.get(template, {}, function (data) {
                self.trigger('template-download-end', [template, data]);
                bindings_create.call(self, self.data('model'), data);
            });
            return;
        }

        if (template.indexOf('>') !== -1 && template.indexOf('<') !== -1)
            self.html(template);
        else
            template = $(template).html();
    }

    self.data('default', $.extend(true, {}, model));
    self.data('model', model);

    self.on('change', 'input[data-model]', function (e) {
        bindings_internal_change.call(this, e, self, self.data('model'), schema);
    });

    self.on('change', 'textarea[data-model],select[data-model]', function (e) {
        bindings_internal_change.call(this, e, self, self.data('model'), schema);
    });

    bindings_refresh.call(self, schema);

    bindings_delay(function() {
        self.trigger('model-create', [model, schema]);
    });

    return bindings_rebind.call(self);
}

function bindings_internal_change(e, self, model, schema) {
    var el = $(this);
    var name = el.attr('data-model');
    var type = el.attr('type');
    var value = el.val();

    if (!(/(MSIE\ [0-8]\.\d+)/.test(navigator.userAgent)))
        e.preventDefault();

    e.stopPropagation();
    e.stopImmediatePropagation();

    if (type === 'checkbox')
        value = this.checked;

    var prepare = el.attr('data-prepare');
    var value_new = $.bindings.prepare.call(el, name, value, prepare, model, schema);

    if (typeof (value_new) === 'undefined')
        value_new = $.bindings._prepare.call(el, name, value, prepare, model, schema);

    var r = $.bindings._validation.call(el, name, value_new, model, schema);
    $.bindings.watch.call(el, r, name, value_new, model, schema);

    if (!r)
        return;

    bindings_setvalue.call(el, model, name, value_new, schema);

    if (type !== 'checkbox' && type !== 'radio') {
        switch (this.tagName.toLowerCase()) {
            case 'input':
            case 'textarea':
                this.value = $.bindings.format.call(el, name, value_new, el.attr('data-format'), self.data('model'), schema);
                break;
        }
    } else
        this.checked = value;


    bindings_rebind.call(self, schema);
    self.data('isChange', true);

    bindings_delay(function() {
        self.trigger('model-change', [name, value_new, model, schema, el]);
        self.trigger('model-update', [model, name, schema]);
    });
}

function bindings_json(query, template, schema) {
    var el = this;
    var q = $(query);
    var tag = q.get(0).tagName.toLowerCase();

    switch (tag) {
        case 'input':
        case 'select':
        case 'textarea':
            bindings_create.call(el, $.parseJSON(q.val().replace(/\n/g, '\\n')), template, schema);
            return;
    }

    bindings_create.call(el, $.parseJSON(q.html().replace(/\n/g, '\\n')), template, schema);
    return el;
}

function bindings_download(url, template, options, schema) {
    var self = this;

    if (typeof (template) === 'object') {
        var tmp = options;
        options = template;
        template = options;
    }

    if (!options)
        options = {};

    if (!options.type)
        options.type = 'GET';

    if (!options.dataType)
        options.dataType = 'json';

    var key = url + JSON.stringify(options);
    if (jquerybindings_cache[key])
        return;

    self.trigger('model-download-begin', [url]);

    options.success = function (data) {
        self.trigger('model-download-end', [url, data, schema]);
        delete jquerybindings_cache[key];
        bindings_create.call(self, data, template, schema);
    };

    options.error = function (xhr, status) {
        self.trigger('model-download-end', [url, schema]);
        delete jquerybindings_cache[key];
        self.trigger('model-download-error', [status, url, schema]);
    };

    $.ajax(url, options);
    return self;
}

function bindings_destroy() {
    var self = this;
    var schema = self.attr('data-name');
    self.removeData('model');
    self.removeData('default');
    self.removeData('isChange');
    self.find('input[data-model],textarea[data-model],select[data-model]').unbind('change');
    self.trigger('model-destroy', [schema]);
    return self;
}

function bindings_default() {
    var self = this;
    var model = self.data('default');
    var schema = self.attr('data-name');
    self.data('model', $.extend({}, model));
    self.data('isChange', false);
    bindings_refresh.call(self, schema);
    bindings_delay(function() {
        self.trigger('model-default', [model, schema]);
    });
    return self;
}

function bindings_validate(schema) {
    var self = this;
    var model = self.data('model');
    var error = [];

    bindings_reflection(model, function (path, value, key) {
        var r = $.bindings._validation(path, value, schema);
        if (typeof (r) === 'undefined' || r === null || r)
            return;
        error.push({ path: path, value: value, element: self.find('input[data-model="' + path + '"],textarea[data-model="' + path + '"],select[data-model="' + path + '"]') });
    });

    self.trigger('validate', [error, schema]);
    self.trigger('validation', [error, schema]);
    self.trigger('model-validate', [error, schema]);
    self.trigger('model-validation', [error, schema]);
    return self;
}

function bindings_set(path, value, schema) {
    var self = this;
    var model = self.data('model');

    if (typeof (model) === 'undefined')
        return self;

    if (typeof (value) === 'function')
        value = value(bindings_getvalue(model, path, schema));

    var r = $.bindings._validation(path, value, model, schema);
    $.bindings.watch.call($('input[data-model="' + path + '"],textarea[data-model="' + path + '"],select[data-model="' + path + '"]'), r, path, value, model, schema);

    if (!r)
        return self;

    if (bindings_setvalue(model, path, value, schema))
        bindings_refresh.call(self, schema);

    self.data('isChange', true);
    self.trigger('model-update', [model, path, schema]);
    return self;
}

function bindings_get(path, schema) {
    var self = this;
    var model = self.data('model');
    if (typeof (model) === 'undefined')
        return;
    return bindings_getvalue(model, path, schema);
}

function bindings_rebind_force(schema) {
    var self = this;
    var model = self.data('model');

    if (typeof (model) === 'undefined')
        return self;

    self.find('[data-model]').each(function () {
        var tag = this.tagName.toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea')
            return;

        var el = $(this);
        var name = el.attr('data-model');
        var custom = el.attr('data-custom');
        var value = bindings_getvalue(model, name);

        if (typeof (custom) !== 'undefined') {
            $.bindings.custom.call(el, name, value, custom || '', model, schema);
            return;
        }

        var attr = el.attr('data-encode');
        var isRaw = typeof (attr) !== 'undefined' && attr === 'false';
        var val = $.bindings.format.call(el, name, value, el.attr('data-format'), model, schema);

        if (typeof (val) === 'undefined')
            val = '';

        if (typeof (val) !== 'string') {
            if (val instanceof Array)
                val = val.join(', ');
            else
                val = val === null ? '' : val.toString();
        }

        el.html(val);
    });

    return self;
}

function bindings_rebind(schema) {
    var self = this;
    var model = self.data('model');

    if (typeof (model) === 'undefined')
        return self;

    var timeout = self.data('timeout_rebind') || null;

    if (timeout !== null)
        clearTimeout(timeout);

    var timeout = setTimeout(function () {
        bindings_rebind_force.call(self, schema);
    }, 100);

    self.data('timeout_rebind', timeout);
    return self;
}

function bindings_refresh(schema) {
    var self = this;
    var model = self.data('model');

    if (typeof (model) === 'undefined')
        return self;

    var timeout = self.data('timeout_refresh') || null;
    if (timeout !== null)
        clearTimeout(timeout);

    var timeout = setTimeout(function () {
        bindings_refresh_force.call(self, schema);
    }, 100);

    self.data('timeout_refresh', timeout);
    return self;
}

function bindings_refresh_force(schema) {
    var self = this;

    var model = self.data('model');

    if (typeof (model) === 'undefined') {
        model = {};
        self.data('model', model);
    }

    self.find('[data-model]').each(function () {
        var el = $(this);
        var name = el.attr('data-model') || '';
        var isIO = false;

        switch (this.tagName.toLowerCase()) {
            case 'input':
            case 'textarea':
            case 'select':
                isIO = true;
                break;
        }

        var value = bindings_getvalue(model, name, schema);
        var format = el.attr('data-format');
        var custom = el.attr('data-custom');

        if (typeof (value) === 'undefined')
            value = el.attr('data-default');

        if (typeof (custom) !== 'undefined') {
            $.bindings.custom.call(el, name, value, custom || '', model, schema);
            return;
        }

        var val = $.bindings.format.call(self, name, value, format, model, schema);

        if (isIO) {
            var type = el.attr('type');
            if (type === 'checkbox')
                this.checked = value === true || value === 1 || value === 'true';
            else if (type === 'radio') {
                if (this.value == value)
                    this.checked = true;
                else
                    return;
            } else
                el.val(val);

            return;
        }

        var attr = el.attr('data-encode');
        var isRaw = typeof (attr) !== 'undefined' && attr === 'false';

        if (typeof (val) === 'undefined')
            val = '';

        if (typeof (val) !== 'string') {
            if (val instanceof Array)
                val = val.join(', ');
            else
                val = val === null ? '' : val.toString();
        }

        el.html(isRaw ? val : val.encode());
    });

    return self;
}

function bindings_send(url, options, schema, callback) {
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

    self.trigger('model-send-begin', [url, model, schema]);

    options.contentType = 'application/json';
    options.data = JSON.stringify(model);

    options.success = function (data) {
        self.trigger('model-send-end', [url, model, schema]);
        delete jquerybindings_cache[key];
        self.trigger('send', [data, model, schema]);
        self.trigger('model-send', [data, model, schema]);
        if (callback)
            callback(null, data);
    };

    options.error = function (xhr, status) {
        self.trigger('model-send-end', [url, model, schema]);
        delete jquerybindings_cache[key];
        self.trigger('model-send-error', [status, url, model, schema]);
        if (callback)
            callback(status, null);
    };

    $.ajax(url, options);
    return self;
}

$.bindings.prepare = function (path, value, format, model, schema) { }

$.bindings._prepare = function (path, value, format, model, schema) {
    if (typeof (value) !== 'string')
        return value;

    if (bindings_getvalue(model, path) instanceof Array) {
        var arr = value.split(',');
        var length = arr.length;
        var tmp = [];
        for (var i = 0; i < length; i++) {
            var val = $.trim(arr[i]);
            if (val.length > 0)
                tmp.push(val);
        }
        return tmp;
    }

    if (!value.isNumber())
        return value;

    if (value[0] === '0' && value.length > 1)
        return value;

    value = value.replace(',', '.');
    if (value.indexOf('.') === -1)
        return parseInt(value);

    return parseFloat(value);
};

$.bindings.format = function (path, value, format, model, schema) {
    if (value instanceof Array)
        return value.join(', ');
    return value;
};

$.bindings.custom = function (path, value, custom, model, schema) { };
$.bindings.watch = function (isValid, path, value, model, schema) { };

$.bindings.validation = function (path, value, model, schema) {
    return true;
};

$.bindings._validation = function (path, value, model, schema) {
    var r = $.bindings.validation(path, value, model, schema);
    if (typeof (r) === 'undefined' || r === null)
        r = true;
    return r === true;
};

function bindings_setvalue(obj, path, value, schema) {

    path = path.split('.');
    var length = path.length;
    var current = obj;

    for (var i = 0; i < length - 1; i++) {
        current = bindings_findpipe(current, path[i]);
        if (typeof (current) === 'undefined')
            return false;
    }

    current = bindings_findpipe(current, path[length - 1], value);
    return true;
}

function bindings_findpipe(current, name, value) {
    var beg = name.lastIndexOf('[');
    var pipe;
    var index = -1;

    if (beg !== -1) {

        index = parseInt(name.substring(beg + 1).replace(/\]\[/g, ''));
        if (isNaN(index))
            return;

        name = name.substring(0, beg);
        pipe = current[name][index];

    } else
        pipe = current[name];

    if (typeof (pipe) === 'undefined')
        return;

    if (typeof(value) === 'undefined')
        return pipe;

    if (index !== -1) {
        current[name][index] = value;
        pipe = current[name][index];
    } else {
        current[name] = value;
        pipe = current[name];
    }

    return pipe;
}

function bindings_getvalue(obj, path, schema) {
    path = path.split('.');
    var length = path.length;
    var current = obj;
    for (var i = 0; i < path.length; i++) {
        current = bindings_findpipe(current, path[i]);
        if (typeof (current) === 'undefined')
            return;
    }
    return current;
}

if (!String.prototype.isNumber) {
    String.prototype.isNumber = function (isDecimal) {
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

if (!String.prototype.encode) {
    String.prototype.encode = function () {
        return this.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
}

function bindings_reflection(obj, fn, path) {
    path = path || '';
    for (var k in obj) {
        if (typeof (k) !== 'string')
            continue;

        var current = path + (path !== '' ? '.' : '') + k;
        var type = typeof (obj[k]);

        if (type === 'function')
            continue;

        fn(current, obj[k], k);

        if (type === 'object')
            bindings_reflection(obj[k], fn, current);
    }
}

function bindings_delay(fn) {
    setTimeout(function() {
        fn();
    }, 120);
}