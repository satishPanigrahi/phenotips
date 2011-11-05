var MS = (function (MS) {
// Start MS augmentation.
var widgets = MS.widgets = MS.widgets || {};
widgets.ModalPopup = Class.create({
  /** Configuration. Empty values will fall back to the CSS. */
  options : {
    idPrefix : "modal-popup-",
    title : "",
    displayCloseButton : true,
    screenColor : "",
    borderColor : "",
    titleColor : "",
    backgroundColor : "",
    screenOpacity : "0.5",
    verticalPosition : "center",
    horizontalPosition : "center",
    resetPositionOnShow: true,
    removeOnClose : false,
    onClose : Prototype.emptyFunction
  },
  /** Constructor. Registers the key listener that pops up the dialog. */
  initialize : function(content, shortcuts, options) {
    /** Shortcut configuration. Action name -&gt; {method: function(evt), keys: string[]}. */
    this.shortcuts = {
      "show" : { method : this.showDialog, keys : ['Ctrl+G', 'Meta+G']},
      "close" : { method : this.closeDialog, keys : ['Esc']}
    },

    this.content = content || "Hello world!";
    // Add the new shortcuts
    this.shortcuts = Object.extend(Object.clone(this.shortcuts), shortcuts || { });
    // Add the custom options
    this.options = Object.extend(Object.clone(this.options), options || { });
    // Register a shortcut for showing the dialog.
    this.registerShortcuts("show");

    if (typeof (widgets.ModalPopup.instanceCounter) == 'undefined') {
      widgets.ModalPopup.instanceCounter = 0;
    }
    this.id = ++widgets.ModalPopup.instanceCounter;
  },

  getBoxId : function() {
    return this.options.idPrefix + this.id;
  },

  /** Create the dialog, if it is not already loaded. Otherwise, just make it visible again. */
  createDialog : function(event) {
    this.dialog = new Element('div', {'class': 'xdialog-modal-container'});
    // A full-screen semi-transparent screen covering the main document
    this.screen = new Element('div', {'class': 'xdialog-screen'}).setStyle({
      opacity : this.options.screenOpacity,
      backgroundColor : this.options.screenColor
    });
    this.dialog.update(this.screen);
    // The dialog chrome
    this.dialogBox = new Element('div', {'class': 'xdialog-box', 'id' : this.getBoxId()});
    // Insert the content
    this.dialogBox._x_contentPlug = new Element('div', {'class' : 'content'});
    this.dialogBox.update(this.dialogBox._x_contentPlug);
    this.dialogBox._x_contentPlug.update(this.content);
    // Add the dialog title
    if (this.options.title) {
      var title = new Element('div', {'class': 'xdialog-title'}).update(this.options.title);
      title.setStyle({"color" : this.options.titleColor, "backgroundColor" : this.options.borderColor});
      this.dialogBox.insertBefore(title, this.dialogBox.firstChild);
    }
    // Add the close button
    if (this.options.displayCloseButton) {
      var closeButton = new Element('div', {'class': 'xdialog-close', 'title': 'Close'}).update("&#215;");
      closeButton.setStyle({"color": this.options.titleColor});
      closeButton.observe("click", this.closeDialog.bindAsEventListener(this));
      this.dialogBox.insertBefore(closeButton, this.dialogBox.firstChild);
    }
    this.dialog.appendChild(this.dialogBox);
    this.dialogBox.setStyle({
      "textAlign": "left",
      "borderColor": this.options.borderColor,
      "backgroundColor" : this.options.backgroundColor
    });
    this.positionDialog();
    // Append to the end of the document body.
    document.body.appendChild(this.dialog);
    new Draggable(this.getBoxId(), {
      handle: $(this.getBoxId()).down('.xdialog-title'),
      scroll: window,
      change: this.updateScreenSize.bind(this)
    });
    this.dialog.hide();
    Event.observe(window, 'resize', function(event) {
      if (this.dialog.visible()) {
        this.updateScreenSize();
      }
    }.bindAsEventListener(this));
  },
  positionDialog : function() {
    switch(this.options.verticalPosition) {
      case "top":
        this.dialogBox.setStyle({"top": (document.viewport.getScrollOffsets().top + 6) + "px"});
        break;
      case "bottom":
        this.dialogBox.setStyle({"bottom": ".5em"});
        break;
      default:
        // TODO: smart alignment according to the actual height
        this.dialogBox.setStyle({"top": "35%"});
        break;
    }
    this.dialogBox.setStyle({"left": "", "right" : ""});
    switch(this.options.horizontalPosition) {
      case "left":
        this.dialog.setStyle({"textAlign": "left"});
        break;
      case "right":
        this.dialog.setStyle({"textAlign": "right"});
        break;
      default:
        this.dialog.setStyle({"textAlign": "center"});
        this.dialogBox.setStyle({"margin": "auto"});
      break;
    }
  },
  updateScreenSize : function() {
    var __getNewDimension = function (eltToFit, dimensionAccessFunction, position) {
      var crtDimension = $(document.documentElement)[dimensionAccessFunction]();
      var viewportDimension = document.viewport.getScrollOffsets()[position] + document.viewport[dimensionAccessFunction]();
      if (eltToFit) {
        var limit = eltToFit.cumulativeOffset()[position] + eltToFit[dimensionAccessFunction]();
      }
      var result = '';
      if (limit && crtDimension < limit) {
        result = limit + 'px';
      }
      if (limit && limit < viewportDimension) {
        result = viewportDimension + 'px';
      }
      return result;
    };
    this.screen.style.width  = __getNewDimension(this.dialogBox, 'getWidth', 'left');
    this.screen.style.height = __getNewDimension(this.dialogBox, 'getHeight', 'top');
  },
  /** Set a class name to the dialog box */
  setClass : function(className) {
    this.dialogBox.addClassName('xdialog-box-' + className);
  },
  /** Remove a class name from the dialog box */
  removeClass : function(className) {
    this.dialogBox.removeClassName('xdialog-box-' + className);
  },
  /** Set the content of the dialog box */
  setContent : function(content) {
     this.content = content;
     this.dialogBox._x_contentPlug.update(this.content);
  },
  /** Called when the dialog is displayed. Enables the key listeners and gives focus to the (cleared) input. */
  showDialog : function(event) {
    if (event) {
      Event.stop(event);
    }
    // Only do this if the dialog is not already active.
    if (!widgets.ModalPopup.active) {
      widgets.ModalPopup.active = true;
      if (!this.dialog) {
        // The dialog wasn't loaded, create it.
        this.createDialog();
      }
      // Start listening to keyboard events
      this.attachKeyListeners();
      // In IE, position: fixed does not work.
      /*if (Prototype.Browser.IE6x) {
        this.dialog.setStyle({top : document.viewport.getScrollOffsets().top + "px"});
        this.dialog._x_scrollListener = this.onScroll.bindAsEventListener(this);
        Event.observe(window, "scroll", this.dialog._x_scrollListener);
        $$("select").each(function(item) {
          item._x_initiallyVisible = item.style.visibility;
          item.style.visibility = 'hidden';
        });
      }*/
      // Display the dialog
      this.dialog.show();
      if (this.options.resetPositionOnShow) {
        this.positionDialog();
      }
      this.updateScreenSize();
    }
  },
  onScroll : function(event) {
    this.dialog.setStyle({top : document.viewport.getScrollOffsets().top + "px"});
  },
  /** Called when the dialog is closed. Disables the key listeners, hides the UI and re-enables the 'Show' behavior. */
  closeDialog : function(event) {
    if (event) {
      Event.stop(event);
    }
    /*if (window.browser.isIE6x) {
      Event.stopObserving(window, "scroll", this.dialog._x_scrollListener);
      $$("select").each(function(item) {
        item.style.visibility = item._x_initiallyVisible;
      });
    }*/
    // Call optional callback
    this.options.onClose.call(this);
    // Hide the dialog, without removing it from the DOM.
    this.dialog.hide();
    if (this.options.removeOnClose) {
      this.dialog.remove();
    }
    // Stop the UI shortcuts (except the initial Show Dialog one).
    this.detachKeyListeners();
    // Re-enable the 'show' behavior.
    widgets.ModalPopup.active = false;
  },
  /** Enables all the keyboard shortcuts, except the one that opens the dialog, which is already enabled. */
  attachKeyListeners : function() {
    for (var action in this.shortcuts) {
      if (action != "show") {
        this.registerShortcuts(action);
      }
    }
  },
  /** Disables all the keyboard shortcuts, except the one that opens the dialog. */
  detachKeyListeners : function() {
    for (var action in this.shortcuts) {
      if (action != "show") {
        this.unregisterShortcuts(action);
      }
    }
  },
  /**
   * Enables the keyboard shortcuts for a specific action.
   *
   * @param {String} action The action to register
   * {@see #shortcuts}
   */
  registerShortcuts : function(action) {
    var shortcuts = this.shortcuts[action].keys;
    var method = this.shortcuts[action].method;
    for (var i = 0; i < shortcuts.size(); ++i) {
      if (Prototype.Browser.IE || Prototype.Browser.WebKit) {
        shortcut.add(shortcuts[i], method.bindAsEventListener(this, action), {type: 'keyup'});
      } else {
        shortcut.add(shortcuts[i], method.bindAsEventListener(this, action), {type: 'keypress'});
      }
    }
  },
  /**
   * Disables the keyboard shortcuts for a specific action.
   *
   * @param {String} action The action to unregister {@see #shortcuts}
   */
  unregisterShortcuts : function(action) {
    for (var i = 0; i < this.shortcuts[action].keys.size(); ++i) {
      shortcut.remove(this.shortcuts[action].keys[i]);
    }
  },
  createButton : function(type, text, title, id) {
    var wrapper = new Element("span", {"class" : "buttonwrapper"});
    var button = new Element("input", {
      "type" : type,
      "class" : "button",
      "value" : text,
      "title" : title,
      "id" : id
    });
    wrapper.update(button);
    return wrapper;
  }
});
/** Whether or not the dialog is already active (or activating). */
widgets.ModalPopup.active = false;
// End MS augmentation.
return MS;
}(MS || {}));

// When the document is loaded, enable the keyboard listener that triggers the dialog.
// document.observe("ms:dom:loaded", function() {
//   new MS.widgets.ModalPopup("An example dialog",
//     { "show" : { method : "this.createDialog", keys : ['Ctrl+Y', 'Meta+Y']} },
//     { title: "Example", titleColor: "#369", borderColor: "#369", screenColor: "#FFF" }
//   );
// });