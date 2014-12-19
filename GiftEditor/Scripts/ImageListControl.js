/// <reference name="MicrosoftAjax.js"/>

Type.registerNamespace("Aurigma");

Aurigma.ImageListControl = function (element) {

    Aurigma.ImageListControl.initializeBase(this, [element]);
    this._parentControlId = null;
    this._okButtonId = null;
    this._cancelButtonId = null;
}

Aurigma.ImageListControl.prototype = {

    add_okClick: function (handler) {

        this.get_events().addHandler('okClick', handler);
    },

    remove_okClick: function (handler) {
        this.get_events().removeHandler('okClick', handler);
    },

    add_cancelClick: function (handler) {
        this.get_events().addHandler('cancelClick', handler);
    },

    remove_cancelClick: function (handler) {
        this.get_events().removeHandler('cancelClick', handler);
    },

    initialize: function () {
        Aurigma.ImageListControl.callBaseMethod(this, 'initialize');

        this._okClickDelegate = Function.createDelegate(this, this._okClick);
        this._cancelClickDelegate = Function.createDelegate(this, this._cancelClick);

        var el = this.get_element();
        var btn = $get(this._okButtonId, el);
        if (btn)
            $addHandler(btn, "click", this._okClickDelegate);
        btn = $get(this._cancelButtonId, el);
        if (btn)
            $addHandler(btn, "click", this._cancelClickDelegate);

        this._createBackground();
        this._initListItems();
    },

    _initListItems: function () {
        var el = this.get_element();
        $(".image-list .image-item", el).bind("click", this, this._selectItem);
    },

    _selectItem: function (event) {
        var imageListControl = event.data;
        $(".image-list .image-item.selected", imageListControl.get_element()).removeClass("selected");
        $(this).addClass("selected");
        //find imageID
        imageListControl._selectedImageId = $("span.imageId", this).attr("title") || null;
    },

    _createBackground: function () {
        var parent = this._parentControlId ? $get(this._parentControlId) : null;
        if (!parent)
            parent = document.body;

        var bounds = Sys.UI.DomElement.getBounds(parent);

        var modalBackgroundPanel = parent.ownerDocument.createElement("div");
        modalBackgroundPanel.className = "ModalBackgroundPanel";
        modalBackgroundPanel.style.display = "none";
        modalBackgroundPanel.style.width = bounds.width + "px";
        modalBackgroundPanel.style.height = bounds.height + "px";
        modalBackgroundPanel = parent.appendChild(modalBackgroundPanel);

        this._backgroundPanel = modalBackgroundPanel;
    },

    _updateBackgroundPanelPosition: function () {
        var parent = this._parentControlId ? $get(this._parentControlId) : null;
        if (!parent)
            parent = document.body;

        var bounds = Sys.UI.DomElement.getBounds(parent);
        this._backgroundPanel.style.width = bounds.width + "px";
        this._backgroundPanel.style.height = bounds.height + "px";
    },

    dispose: function () {
        var el = this.get_element();
        var btn = $get(this._okButtonId, el);
        if (btn)
            $clearHandlers(btn);
        btn = $get(this._cancelButtonId, el);
        if (btn)
            $clearHandlers(btn);

        delete this._okClickDelegate;
        delete this._cancelClickDelegate;

        var items = el.getElementsByTagName("li");
        for (var i = 0; i < items.length; i++)
            $clearHandlers(items[i]);

        Aurigma.ImageListControl.callBaseMethod(this, 'dispose');
    },

    _okClick: function () {

        var imageId = this._selectedImageId;
        //this._hide();
        var h = this.get_events().getHandler('okClick');
        if (h) h(this, imageId);
    },

    _cancelClick: function () {
        //this._hide();
        var h = this.get_events().getHandler('cancelClick');
        if (h) h(this, Sys.EventArgs.Empty);
    },

    //show popup
    _show: function () {
        var el = this.get_element();
        if (el) {
            this._updateBackgroundPanelPosition();
            this._backgroundPanel.style.display = "block";
            el.style.display = "block";
        }
    },

    show: function () {
        //this._show();
    },

    //hide popup
    _hide: function () {
        var el = this.get_element();
        if (el) {
            el.style.display = "none";
            this._backgroundPanel.style.display = "none";
        }
        this._selectItem(null);
        delete this._selectedImageId;
    }

}

Aurigma.ImageListControl.registerClass("Aurigma.ImageListControl", Sys.UI.Control);

if (typeof (Sys) !== 'undefined') Sys.Application.notifyScriptLoaded();