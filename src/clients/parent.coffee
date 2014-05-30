class ParentClient extends BaseLogging
  constructor: (options={}) ->
    super options

    if not options.iFrame
      throw new Exception 'iFrame is required'

    if typeof(options.iFrame) isnt 'string'
      throw new Exception 'iFrame should be ID selector'

    options.iFrame = document.getElementById options.iFrame
    if not options.iFrame
      throw new Exception 'Invalid iFrame ID'

    notify = new Notify
      logging: options.logging
      window: options.iFrame.contentWindow
      target: options.iFrame.getAttribute 'src'
      onSuccessReceiver: @_onSuccessReceiver(@)
      onStartedReceiver: @_onStartedReceiver(@)
      onErrorReceiver: @_onErrorReceiver(@)
      onIFrameChangeReceiver: @_onIFrameChangeReceiver(@)
      onScrollTopReceiver: @_onScrollTopReceiver(@)
      onPreviewReceiver: @_onPreviewReceiver(@)
      onProgressReceiver: @_onProgressReceiver(@)
      onConfigProgressReceiver: @_onConfigProgressReceiver(@)

    @set 'iFrame', options.iFrame
    @set 'notify', notify

  start: () ->
    @notify.start()

  preview: () ->
    @notify.preview()

  _onSuccessReceiver: (self) ->
    () ->
      self.onSuccess()

  _onStartedReceiver: (self) ->
    () ->
      self.onStarted()

  _onErrorReceiver: (self) ->
    () ->
      self.onError()

  _onIFrameChangeReceiver: (self) ->
    (size) ->
      self.iFrame.style.height = "#{size.height}px"

  _onScrollTopReceiver: (self) ->
    () ->
      $("body").animate({scrollTop:0}, 'fast')

  _onPreviewReceiver: (self) ->
    () ->
      self.onPreview()

  _onProgressReceiver: (self) ->
    (data) ->
      self.onProgress(data)

  _onConfigProgressReceiver: (self) ->
    (data) ->
      self.onConfigProgress(data)

  onSuccess: () ->
    @log new Exception 'onSuccess: Not implemented'

  onStarted: () ->
    @log new Exception 'onStarted: Not implemented'

  onError: () ->
    @log new Exception 'onError: Not implemented'

  onPreview: () ->
    @log new Exception 'onPreview: Not implemented'

  onProgress: (current, total) ->
    @log new Exception 'onProgress: Not implemented'