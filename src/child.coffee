do (window, document) ->
  if window.Tagasauris
    return

  include "utils.coffee"
  include "exceptions.coffee"
  include "common.coffee"
  include "notify.coffee"
  include "models/base.coffee"
  include "clients/child.coffee"

  window.Tagasauris =
    VERSION: '0.0.1'
    ChildClient: ChildClient
