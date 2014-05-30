class Notify extends BaseLogging
  @types: [
    'preview',
    'start',
    'started',
    'success',
    'error',
    'iFrameChange',
    'scrollTop',
    'progress',
    'configProgress',
  ]

  constructor: (options={}) ->
    super options

    if not options.window
      throw new Exception 'Window is required'

    if not options.target
      throw new Exception 'Target is required. Possible reasons: your protocols (http, https) must match'

    # Browser test for proper listener and event method
    eventMethod  = if window.addEventListener then 'addEventListener' else 'attachEvent'
    eventer      = window[eventMethod]
    messageEvent = if eventMethod is 'attachEvent' then 'onmessage' else 'message'

    # postMessage listener setup
    eventer messageEvent, @notifyReceiver(@), false

    @set '_window', options.window
    @set '_target', options.target

    for type in Notify.types
      key = toCamelCase "on_#{type}_receiver"
      if options[key]
        @set key, options[key]

  sendNotify: (type, notify=null) ->
    @log "Sending #{type}"
    @_window.postMessage type: type, notify: notify, @_target

  notifyReceiver: (self) ->
    (event) ->
      self.log "Received #{event.data.type} from #{event.origin}"

      if self._target.indexOf(event.origin) isnt 0
        return self.log new Exception 'Invalid notify origin'

      key = toCamelCase("on_#{event.data.type}_receiver")
      if self[key] and typeof(self[key]) is 'function'
        self.log "Runing #{key}"
        self[key](event.data.notify)

  for type in Notify.types
    Notify::[type] = do (type) ->
      (notify) ->
        @sendNotify type, notify
