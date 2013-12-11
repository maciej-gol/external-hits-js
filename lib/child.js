(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(window, document) {
    var Base, BaseLogging, ChildClient, Exception, MediaObject, MediaObjectItem, ModelBase, Notifications, Score, TransformResult, toCamelCase, toUnderscore, urlEncode, _ref, _ref1, _ref2, _ref3;
    if (window.Tagasauris) {
      return;
    }
    urlEncode = function(params) {
      var key, param, tail, v, value, _i, _j, _len, _len1;
      tail = [];
      if (params instanceof Array) {
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          param = params[_i];
          if (param instanceof Array && param.length > 1) {
            tail.push("" + param[0] + "=" + (encodeURIComponent(param[1])));
          }
        }
      } else {
        for (key in params) {
          value = params[key];
          if (value instanceof Array) {
            for (_j = 0, _len1 = value.length; _j < _len1; _j++) {
              v = value[_j];
              tail.push("" + key + "=" + (encodeURIComponent(v)));
            }
          } else {
            tail.push("" + key + "=" + (encodeURIComponent(value)));
          }
        }
      }
      return tail.join('&');
    };
    toCamelCase = function(text) {
      return text.replace(/(_[a-z])/g, function($1) {
        return $1.toUpperCase().replace('_', '');
      });
    };
    toUnderscore = function(text) {
      return text.replace(/([A-Z])/g, function($1) {
        return '_' + $1.toLowerCase();
      });
    };
    Exception = (function() {
      function Exception(message) {
        this.message = message;
        this.name = 'Exception';
      }

      Exception.prototype.toString = function() {
        return this.message;
      };

      return Exception;

    })();
    Base = (function() {
      function Base() {}

      Base.prototype.set = function(key, value) {
        return this[key] = value;
      };

      Base.prototype.get = function(key, empty) {
        if (empty == null) {
          empty = null;
        }
        return this[key] || empty;
      };

      return Base;

    })();
    BaseLogging = (function(_super) {
      __extends(BaseLogging, _super);

      function BaseLogging(options) {
        if (options == null) {
          options = {};
        }
        this.set('logging', options.logging || false);
      }

      BaseLogging.prototype.log = function(message) {
        if (this.get('logging')) {
          return console.log("Tagasauris." + this.constructor.name + ": " + message);
        }
      };

      return BaseLogging;

    })(Base);
    Notifications = (function(_super) {
      var type, _i, _len, _ref;

      __extends(Notifications, _super);

      Notifications.types = ['start', 'started', 'success', 'error'];

      function Notifications(options) {
        var eventMethod, eventer, key, messageEvent, type, _i, _len, _ref;
        if (options == null) {
          options = {};
        }
        Notifications.__super__.constructor.call(this, options);
        if (!options.window) {
          throw new Exception('Window is required');
        }
        if (!options.target) {
          throw new Exception('Target is required');
        }
        eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        eventer = window[eventMethod];
        messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';
        eventer(messageEvent, this.notificationReceiver(this), false);
        this.set('_window', options.window);
        this.set('_target', options.target);
        _ref = Notifications.types;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          type = _ref[_i];
          key = toCamelCase("on_" + type + "_receiver");
          if (options[key]) {
            this.set(key, options[key]);
          }
        }
      }

      Notifications.prototype.sendNotification = function(type, notification) {
        if (notification == null) {
          notification = '';
        }
        this.log("Sending " + type);
        return this._window.postMessage({
          type: type,
          notification: notification
        }, this._target);
      };

      Notifications.prototype.notificationReceiver = function(self) {
        return function(event) {
          var key;
          self.log("Received " + event.data.type + " from " + event.origin);
          if (self._target.indexOf(event.origin) !== 0) {
            return self.log(new Exception('Invalid notification origin'));
          }
          key = toCamelCase("on_" + event.data.type + "_receiver");
          if (self[key] && typeof self[key] === 'function') {
            self.log("Runing receiver " + key);
            return self[key](event.data.notification);
          }
        };
      };

      _ref = Notifications.types;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        Notifications.prototype[toCamelCase("send_" + type)] = (function(type) {
          return function(notification) {
            return this.sendNotification(type, notification);
          };
        })(type);
      }

      return Notifications;

    })(BaseLogging);
    ModelBase = (function(_super) {
      __extends(ModelBase, _super);

      ModelBase.prototype._fields = [];

      function ModelBase(options) {
        var initial, key, name, value, _i, _len, _ref, _ref1;
        if (options == null) {
          options = {};
        }
        options = this.toObject(options);
        _ref = this._fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _ref1 = _ref[_i], name = _ref1[0], initial = _ref1[1];
          value = options[name] || initial;
          key = toCamelCase("deserialize_" + name);
          if (this[key] && typeof this[key] === 'function') {
            value = this[key](name, value, options);
          }
          this.set(name, value);
        }
      }

      ModelBase.prototype.toObject = function(data) {
        var k, tmp, v;
        tmp = {};
        for (k in data) {
          v = data[k];
          tmp[toCamelCase(k)] = v;
        }
        return tmp;
      };

      ModelBase.prototype.toJSON = function() {
        var k, tmp, v;
        tmp = {};
        for (k in this) {
          v = this[k];
          if (v !== null && k.substring(0, 1) !== '_') {
            tmp[toUnderscore(k)] = v;
          }
        }
        return tmp;
      };

      return ModelBase;

    })(Base);
    MediaObject = (function(_super) {
      __extends(MediaObject, _super);

      function MediaObject() {
        _ref = MediaObject.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      MediaObject.prototype._fields = [['id', null], ['type', null], ['attributes', {}], ['items', []], ['results', []]];

      MediaObject.prototype.deserializeItems = function(name, value, options) {
        var item, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = value.length; _i < _len; _i++) {
          item = value[_i];
          _results.push(new MediaObjectItem(item));
        }
        return _results;
      };

      MediaObject.prototype.deserializeResults = function(name, value, options) {
        var result, results, _i, _len;
        results = [];
        for (_i = 0, _len = value.length; _i < _len; _i++) {
          result = value[_i];
          result.mediaObject = options.id;
          results.push(new TransformResult(result));
        }
        return results;
      };

      MediaObject.prototype.createTransformResult = function(options) {
        if (options == null) {
          options = {};
        }
        if (options.mediaObject == null) {
          options.mediaObject = this.get('id');
        }
        return new TransformResult(options);
      };

      return MediaObject;

    })(ModelBase);
    MediaObjectItem = (function(_super) {
      __extends(MediaObjectItem, _super);

      function MediaObjectItem() {
        _ref1 = MediaObjectItem.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      MediaObjectItem.prototype._fields = [['id', null], ['type', null], ['src', null], ['width', 0], ['height', 0]];

      return MediaObjectItem;

    })(ModelBase);
    Score = (function(_super) {
      __extends(Score, _super);

      function Score() {
        _ref2 = Score.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Score.prototype._fields = [['id', null], ['type', null], ['value', null], ['semanticValue', null], ['transformResult', null]];

      return Score;

    })(ModelBase);
    TransformResult = (function(_super) {
      __extends(TransformResult, _super);

      function TransformResult() {
        _ref3 = TransformResult.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      TransformResult.prototype._fields = [['id', null], ['type', null], ['data', {}], ['mediaObject', null]];

      TransformResult.prototype.setTag = function(tag) {
        return this.set('data', {
          tag: tag
        });
      };

      TransformResult.prototype.getTag = function(tag) {
        var data;
        data = this.get('data', {});
        return data.tag;
      };

      return TransformResult;

    })(ModelBase);
    ChildClient = (function(_super) {
      __extends(ChildClient, _super);

      function ChildClient(options) {
        var notifications;
        if (options == null) {
          options = {};
        }
        ChildClient.__super__.constructor.call(this, options);
        if (!options.state) {
          throw new Exception('State is required');
        }
        if (!options.sourceUrl) {
          throw new Exception('Source URL is required');
        }
        if (!options.resultsUrl) {
          throw new Exception('Results URL is required');
        }
        notifications = new Notifications({
          logging: options.logging,
          window: parent,
          target: document.referrer,
          onStartReceiver: this._onStartReceiver(this)
        });
        this.set('state', options.state);
        this.set('sourceUrl', options.sourceUrl);
        this.set('resultsUrl', options.resultsUrl);
        this.set('notifications', notifications);
        this.set('requestTimeout', options.requestTimeout || 30000);
      }

      ChildClient.prototype.getData = function(options, callback) {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        if (options.endpoint == null) {
          options.endpoint = this.get('sourceUrl');
        }
        return this.request(options, function(err, response) {
          var mo;
          if (err) {
            return callback(err, response);
          }
          response.data = (function() {
            var _i, _len, _ref4, _results;
            _ref4 = response.data;
            _results = [];
            for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
              mo = _ref4[_i];
              _results.push(new MediaObject(mo));
            }
            return _results;
          })();
          return callback(null, response);
        });
      };

      ChildClient.prototype.saveData = function(data, options, callback) {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        options.body = data;
        if (options.endpoint == null) {
          options.endpoint = this.get('resultsUrl');
        }
        if (options.method == null) {
          options.method = 'POST';
        }
        return this.request(options, function(err, response) {
          if (err) {
            return callback(err, response);
          }
          return callback(null, response);
        });
      };

      ChildClient.prototype.request = function(options, callback) {
        var body, encodedParams, endpoint, method, qs, self, timeout, timeoutCallback, url, xhr;
        self = this;
        method = options.method || 'GET';
        endpoint = options.endpoint || '';
        body = JSON.stringify(options.body || {});
        qs = options.qs || {};
        url = endpoint;
        if (this.get('state')) {
          qs.state = this.get('state');
        }
        qs.cookie_fix = 0;
        encodedParams = urlEncode(qs);
        if (encodedParams) {
          url += '?' + encodedParams;
        }
        xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (options.body) {
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Accept', 'application/json');
        }
        xhr.onerror = function(response) {
          clearTimeout(timeout);
          self.log("XHR Request Error " + method + " - " + url);
          if (typeof callback === 'function') {
            return callback(true, response);
          }
        };
        xhr.onload = function(response) {
          var err;
          clearTimeout(timeout);
          self.log("XHR Request Success " + method + " - " + url);
          try {
            response = JSON.parse(xhr.responseText);
          } catch (_error) {
            err = _error;
            console.error(err);
          }
          if (typeof callback === 'function') {
            return callback(err || false, response);
          }
        };
        timeoutCallback = function() {
          xhr.abort();
          self.log("XHR Request Timeout " + method + " - " + url);
          return self.onRequestTimeout();
        };
        timeout = setTimeout(timeoutCallback, this.requestTimeout);
        self.log("XHR Request Calling " + method + " - " + url);
        return xhr.send(body);
      };

      ChildClient.prototype.success = function() {
        return this.notifications.sendSuccess();
      };

      ChildClient.prototype.error = function(err) {
        return this.notifications.sendError(err.message);
      };

      ChildClient.prototype._onStartReceiver = function(self) {
        return function() {
          self.notifications.sendStarted();
          return self.onStart();
        };
      };

      ChildClient.prototype.onStart = function() {
        return this.log(new Exception('onStart: Not implemented'));
      };

      ChildClient.prototype.onRequestTimeout = function() {
        return this.error(new Exception('XHR Request Timeout'));
      };

      return ChildClient;

    })(BaseLogging);
    return window.Tagasauris = {
      VERSION: '0.0.1',
      ChildClient: ChildClient,
      MediaObject: MediaObject,
      MediaObjectItem: MediaObjectItem,
      TransformResult: TransformResult,
      Score: Score
    };
  })(window, document);

}).call(this);