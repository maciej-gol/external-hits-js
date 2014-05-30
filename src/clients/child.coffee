class ChildClient extends BaseLogging
  constructor: (options={}) ->
    super options
    options.stateKey   ?= 'state'
    options.sourceKey  ?= 'source'
    options.resultsKey ?= 'results'

    uri        = parseUri(location.href)
    state      = uri.search[options.stateKey]   or null
    sourceUrl  = uri.search[options.sourceKey]  or null
    resultsUrl = uri.search[options.resultsKey] or null

    if not state
      throw new Exception 'State is required'

    if not sourceUrl
      throw new Exception 'Source URL is required'

    if not resultsUrl
      throw new Exception 'Results URL is required'

    notify = new Notify
      logging: options.logging
      window: parent
      target: document.referrer
      onStartReceiver: @_onStartReceiver(@)
      onPreviewReceiver: @_onPreviewReceiver(@)

    @set 'state', state
    @set 'sourceUrl', sourceUrl
    @set 'resultsUrl', resultsUrl
    @set 'notify', notify
    @set 'requestTimeout', options.requestTimeout or 30000

    self = @
    self._documentSize = null
    window.setInterval () ->
      size = getDocumentSize()
      if not self._documentSize or self._documentSize.width isnt size.width or self._documentSize.height isnt size.height
        self._documentSize = size
        self.notify.iFrameChange size
    ,
      300

  getData: (options, callback) ->
    if typeof(options) is 'function'
      callback = options
      options = {}

    options.endpoint ?= @get 'sourceUrl'

    @request options, (err, response)->
      return callback err, response if err
      callback null, response

  saveData: (data, options, callback) ->
    if typeof(options) is 'function'
      callback = options
      options = {}

    options.body = data
    options.endpoint ?= @get 'resultsUrl'
    options.method   ?= 'POST'

    @request options, (err, response)->
      return callback err, response if err
      callback null, response

  request: (options, callback) ->
    self     = this
    method   = options.method or 'GET'
    endpoint = options.endpoint or ''
    body     = JSON.stringify options.body or {}
    qs       = options.qs or {}
    url      = endpoint

    # Auth
    if @get 'state'
      qs.state = @get 'state'

    # Query
    # Workaround for middleware
    qs.cookie_fix = 0
    encodedParams = urlEncode qs
    if encodedParams
      url += '?' + encodedParams
    url = url.replace '//?', '/?'

    xhr = new XMLHttpRequest()
    xhr.open method, url, true

    if options.body
      xhr.setRequestHeader 'Content-Type', 'application/json'
      xhr.setRequestHeader 'Accept', 'application/json'

    xhr.onerror = (response) ->
      clearTimeout timeout
      self.log "XHR Request Error #{method} - #{url}"

      if typeof(callback) is 'function'
        callback true, response

    xhr.onload = (response) ->
      clearTimeout timeout
      self.log "XHR Request Success #{method} - #{url}"

      try
        response = JSON.parse xhr.responseText
      catch err
        console.error err

      if typeof(callback) is 'function'
        callback err or false, response

    timeoutCallback = () ->
      xhr.abort()
      self.log "XHR Request Timeout #{method} - #{url}"
      self.onRequestTimeout()
    timeout = setTimeout timeoutCallback, @requestTimeout

    self.log "XHR Request Calling #{method} - #{url}"
    xhr.send body

  success: () ->
    @notify.success()

  error: (err) ->
    @notify.error err.message

  progress: (data) ->
    @notify.progress data

  _onStartReceiver: (self) ->
    () ->
      self.notify.started()
      self.onStart()

  _onPreviewReceiver: (self) ->
    () ->
      self.notify.preview()
      self.onPreview()

  onStart: () ->
    @log new Exception 'onStart: Not implemented'

  onPreview: () ->
    @log new Exception 'onPreview: Not implemented'

  onRequestTimeout: () ->
    @error new Exception 'XHR Request Timeout'
