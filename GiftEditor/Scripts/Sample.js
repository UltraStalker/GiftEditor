var Sample = Sample ? Sample : {};

Sample._onTabSelected = function (event, ui) {
    Sample._processingTabSelected = true;

    var phl = Sample.get_photoLabel();
    phl.set_currentRegion($(ui.panel).data("regionName"));

    Sample._processingTabSelected = false;
}

Sample._onCurrentRegionChanged = function () {
    var phl = Sample.get_photoLabel();
    var curr = phl.get_currentRegion();
    if (curr) {
        var tabs, selectedTab;
        selectedTab = (tabs = $("div.regions")).find('div.tabPanel').filter(function (index) {
            return $(this).data('regionName') == curr.Name;
        });
        if (!Sample._processingTabSelected)
            tabs.tabs("select", selectedTab.attr("id"));
    }
}

Sample._onVObjectCollectionChanged = function (sender, layer) {
    /*
    * To avoid rebuild VObject list while deserialization much time
    * we wait until layer will be added into canvas
    */
    if (layer.get_canvas())
        Sample._updateRegionTabPanel(layer);
    else if (!Sample._onVObjectCollectionChangedTimer)
    //try some later
        Sample._onVObjectCollectionChangedTimer = setTimeout(function () {
            clearTimeout(Sample._onVObjectCollectionChangedTimer);
            Sample._onVObjectCollectionChangedTimer = null;
            Sample._onVObjectCollectionChanged(sender, layer);
        }, 100);
}

Sample.addImageVObject = function (imageVObjectData, context) {
    var phl = Sample.get_photoLabel();
    var curr = phl.get_currentRegion();
    if (curr) {
        var ns = Aurigma.GraphicsMill.AjaxControls.VectorObjects;
        var vo = new ns.ImageVObject();
        vo.set_data(imageVObjectData);
        vo.beginUpdate();

        var r = vo.get_rectangle();
        if (context) {
            var left = context.point.x - 5;
            var top = context.point.y - 5;
            var d = left + r.Width - (curr.Left + curr.Width);
            if (d > 0) {
                left -= d;
            }
            d = curr.Left - left;
            if (d > 0)
                left += d;
            d = top + r.Height - (curr.Top + curr.Height);
            if (d > 0)
                top -= d;
            d = curr.Top - top;
            if (d > 0)
                top += d;
            r.CenterX = left + r.Width / 2 - curr.Left;
            r.CenterY = top + r.Height / 2 - curr.Top;
        } else {
            r.CenterX = curr.Width / 2;
            r.CenterY = curr.Height / 2;
        }
        vo.set_rectangle(r);
        vo.endUpdate();

        phl.addVObject(vo, curr.Name);

        var index = vo.get_index();
        if (index >= 0)
            phl.set_currentVObjectIndex(index);
        phl.pendingRedraw(10);

        //update VObject
        vo.quickUpdate();
    }
}

Sample.addTextVObject = function () {
    var phl = Sample.get_photoLabel();
    var curr = phl.get_currentRegion();
    if (curr) {
        var ns = Aurigma.GraphicsMill.AjaxControls.VectorObjects;
        var vo = new ns.PlainTextVObject();
        vo.beginUpdate();

        vo.get_permissions().set_allowRotate(false);
        Sample.updateTextVObject(vo);

        if (vo.get_text() && vo.get_text() != "") {
            vo.set_borderWidth(0);
            vo.set_alignment(1); //center
            var r = vo.get_rectangle();
            r.CenterX = curr.Width / 2;
            r.CenterY = curr.Height / 2;
            vo.set_rectangle(r);
            vo.endUpdate();

            phl.addVObject(vo, curr.Name);
            var index = vo.get_index();
            if (index >= 0)
                phl.set_currentVObjectIndex(index);
        }
    }
    //hide add text pane
    $("#textMenu").hide();
    $(".menuToggleButton[rel=textMenu]").removeClass("pushed");
}

Sample._onCurrentVObjectChanged = function () {
    var phl = Sample.get_photoLabel();
    var cv = phl.get_canvasViewer().get_canvas();
    var ns = Aurigma.GraphicsMill.AjaxControls.VectorObjects;
    var cvo = cv.get_currentVObject();

    $("ul.layers li").each(function () {
        var vo = $(this).data("vObject");
        if (vo == cvo) {
            $(this).addClass("selected");
        } else {
            $(this).removeClass("selected");
        }
    });
}

Sample.get_photoLabel = function () {
    var phl = $find(Sample.photoLabelId);
    Sample.get_photoLabel = function () { return phl; };
    return Sample.get_photoLabel();
}

Sample.onImageDrop = function (event, ui) {
    var phl = Sample.get_photoLabel();
    var cv = phl.get_canvasViewer();
    //get coordinates related to canvasViewer
    var offset = Sample._imageDraggingParams.offset;
    var point = new Sys.UI.Point(Math.round(event.pageX - offset.left), Math.round(event.pageY - offset.top));
    //convert control coordinate to workspace
    var pt = cv.controlToWorkspacePoint(point);
    var restoreCurrentRegion = true;

    //get regions
    var regions = Sample._imageDraggingParams.regions;
    var region;
    for (var i in regions) {
        region = regions[i];
        //if point inside region add image and set current region
        if (region.Left < pt.x && region.Left + region.Width > pt.x &&
			region.Top < pt.y && region.Top + region.Height > pt.y) {
            phl.set_currentRegion(region.Name);
            var imageId = $("span.imageId", ui.draggable).attr("title");
            if (!isNaN(new Number(imageId))) {

                PageMethods.CreateImageVObject(imageId, function (imageVObjectData) { Sample.addImageVObject(imageVObjectData, { region: region, point: pt }); });
            }
            restoreCurrentRegion = false;
            break;
        }
    }

    Sample._imageDraggingParams.restoreCurrentRegion = restoreCurrentRegion;

    //hide add image pane
    $("#imageMenu").hide();
    $(".menuToggleButton[rel=imageMenu]").removeClass("pushed");
}

Sample.onImageStartDrag = function (event, ui) {
    var phl = Sample.get_photoLabel();
    var cv = phl.get_canvasViewer();

    Sample._imageDraggingParams = {};
    Sample._imageDraggingParams.offset = $(cv.get_element()).offset();
    Sample._imageDraggingParams.regions = phl.getRegions();
    Sample._imageDraggingParams.region = Sample._imageDraggingParams.currentRegion = phl.get_currentRegion();
}

Sample.onImageStopDrag = function (event, ui) {
    var phl = Sample.get_photoLabel();

    //restore current region if image wasn't added
    if ((typeof Sample._imageDraggingParams.restoreCurrentRegion === "undefined") ||
		Sample._imageDraggingParams.restoreCurrentRegion)
        phl.set_currentRegion(Sample._imageDraggingParams.currentRegion ? Sample._imageDraggingParams.currentRegion.Name : null);

    //delete dragging params
    delete Sample._imageDraggingParams;
}

Sample.onImageDragging = function (event, ui) {
    var phl = Sample.get_photoLabel();
    var cv = phl.get_canvasViewer();

    //get coordinates related to canvasViewer
    var offset = Sample._imageDraggingParams.offset;
    var point = new Sys.UI.Point(Math.round(event.pageX - offset.left), Math.round(event.pageY - offset.top));
    //convert control coordinates to workspace
    var pt = cv.controlToWorkspacePoint(point);

    var regions = Sample._imageDraggingParams.regions;
    var region;
    for (var i in regions) {
        region = regions[i];
        //if point inside region add image and set current region
        if (region.Left < pt.x && region.Left + region.Width > pt.x &&
			region.Top < pt.y && region.Top + region.Height > pt.y) {
            break;
        } else {
            region = null;
        }
    }

    if (!Sample._imageDraggingParams.region) {
        if (region)
            phl.set_currentRegion(region.Name);
    } else if (Sample._imageDraggingParams.region && (!region || Sample._imageDraggingParams.region.Name != region.Name)) {
        if (region)
            phl.set_currentRegion(region.Name);
        else
            phl.set_currentRegion(null);
    }

    //save region to dragging parameters
    Sample._imageDraggingParams.region = region;
}

Sample.getDragHelper = function (event, ui) {
    var el = $("img", this).clone();
    el.css("zIndex", 77777);
    return el;
}

Sample._textProperties = [
	{ name: "text", controlId: "textInput", type: "text" },
	{ name: "fontName", controlId: "fontSelect", type: "select" },
	{ name: "fontSize", controlId: "fontSizeInput", type: "text" },
	{ name: "textColor", controlId: "textColor", type: "color" },
	{ name: "bold", controlId: "textBold", type: "checkbox" },
	{ name: "italic", controlId: "textItalic", type: "checkbox" },
	{ name: "underline", controlId: "textUnderline", type: "checkbox" }
]

Sample.updateTextVObject = function (vObject) {
    var properties = Sample._textProperties;
    var value;

    vObject.beginUpdate();

    for (var i in properties) {
        var ctrl = $get(properties[i].controlId);
        if (ctrl) {
            switch (properties[i].type) {
                case "text":
                    value = ctrl.value;
                    break;
                case "select":
                    value = ctrl.options[ctrl.selectedIndex].value;
                    break;
                case "color":
                    ctrl = $get(properties[i].controlId + "Value");
                    value = ctrl.value;
                    break;
                case "checkbox":
                    if (ctrl.checked)
                        value = true;
                    else
                        value = false;
                    break;
            }
            vObject["set_" + properties[i].name](value);
        }
    }

    vObject.endUpdate();
}

Sample.updateTextTool = function (vObject) {
    var properties = Sample._textProperties;

    for (var i in properties) {
        var ctrl = $get(properties[i].controlId);
        var value = vObject["get_" + properties[i].name]();
        if (ctrl) {
            switch (properties[i].type) {
                case "text":
                    ctrl.value = value;
                    break;
                case "select":
                    for (var optNum = 0; optNum < ctrl.options.length; optNum++) {
                        if (ctrl.options[optNum].value == value) {
                            ctrl.selectedIndex = optNum;
                            break;
                        }
                    }
                    break;
                case "color":
                    var color = Sample._parseColor(value);
                    ctrl.style.backgroundColor = "#" + color.substr(2, 6);
                    $("#textColorValue").val(value);
                    break;
                case "checkbox":
                    if (value)
                        ctrl.checked = true;
                    else
                        ctrl.checked = false;
                    break;
            }
        }
    }
}

Sample._toHex = function (color) {
    color = parseInt(color).toString(16).toUpperCase();
    return color.length < 2 ? "0" + color : color;
}

// returns string in hex AARRGGBB
Sample._parseColor = function (color) {

    var rgba = /^\s*rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\,\s*(\d{1,}(\.\d{1,})?)\s*\)\s*;{0,1}\s*$/i;
    var rgb = /^\s*rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)\s*;{0,1}\s*$/i;
    var std = /^\s*#[0-9A-F]{6,6}\s*$/i;

    var a = rgba.exec(color);
    var b = rgb.exec(color);
    var c = std.exec(color);
    color = { r: 255, g: 255, b: 255, a: 255 };
    if (a) {
        color = { r: a[1], g: a[2], b: a[3], a: Math.round(a[4] * 255) };
    }
    if (b) {
        color = { r: b[1], g: b[2], b: b[3], a: 255 };
    }
    if (c) {
        color = { r: parseInt(c[0].substr(1, 2), 16), g: parseInt(c[0].substr(3, 2), 16), b: parseInt(c[0].substr(5, 2), 16), a: 255 };
    }
    return this._toHex(color.a) + this._toHex(color.r) + this._toHex(color.g) + this._toHex(color.b);
}

Sample.changeZoom = function (e) {
    var phl = Sample.get_photoLabel();
    var zoomControl = $get("zoomModeSelect");
    var value = zoomControl.options[zoomControl.selectedIndex].value;
    if (value.lastIndexOf("%") != -1) {
        phl.set_zoomMode(GraphicsMill.ZoomMode.none);
        phl.set_zoom(parseInt(value) / 100);
    }
    else {
        phl.set_zoomMode(parseInt(value));
    }
}

Sample.updateUndoRedo = function () {
    var cv = Sample.get_photoLabel().get_canvasViewer().get_canvas();
    var h = cv.get_history();
    if (h.get_canUndo())
        $(".toolbar li.group4 a.undo").parent().removeClass("disabled");
    else
        $(".toolbar li.group4 a.undo").parent().addClass("disabled");
    if (h.get_canRedo())
        $(".toolbar li.group4 a.redo").parent().removeClass("disabled");
    else
        $(".toolbar li.group4 a.redo").parent().addClass("disabled");
}

Sample.onColorSelected = function (hsb, hex, rgb) {
    $("#textColor").ColorPickerHide().css('backgroundColor', '#' + hex.substring(2));
    $("#textColorValue").val("rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + rgb.a / 255 + ");");
}

Sample.setColorPickerColor = function () {
    $("#textColor").ColorPickerSetColor(Sample._parseColor($("#textColorValue").val()));
}

Sample._updateRegionTabPanel = function (layer) {
    var regionName = layer.get_name();
    var tabs, tabPanel, ul;
    ul = (tabPanel = (tabs = $("div.regions")).find('div.tabPanel').filter(function (index) {
        return $(this).data('regionName') == regionName;
    })).find('ul');
    //clear layers list
    ul.empty();
    var phl = Sample.get_photoLabel();
    var vObjects = layer.get_vObjects();
    var ns = Aurigma.GraphicsMill.AjaxControls.VectorObjects;
    var cvo = phl.get_currentVObject();
    //create list items
    for (var j = vObjects.get_count() - 1, i = j; i >= 0; i--) {
        var vo = vObjects.get_item(i);
        var isText = ns.PlainTextVObject.isInstanceOfType(vo);
        var isImage = !isText && ns.ImageVObject.isInstanceOfType(vo);
        if (isText || isImage) {
            //build layer list item markup
            var html = [];
            html.push("<li class=\"listItem"); //item
            //set class for selected vobject vobject
            if (cvo == vo)
                html.push(" selected");
            html.push("\">");
            html.push("<div class=\"controls\">"); //controls div
            html.push("<input type=\"checkbox\" title=\"show / hide\" checked=\"");
            if (vo.get_visible())
                html.push("");
            else
                html.push("checked");
            html.push("\" />");
            html.push("<a href=\"#\" title=\"up\" class=\"up");
            if (i == j)
                html.push(" disabled");
            html.push("\"/>");
            html.push("<a href=\"#\" title=\"down\" class=\"down");
            if (i == 0)
                html.push(" disabled");
            html.push("\"/>");
            html.push("</div>"); //controls div
            html.push("<div class=\"content\">"); //content div
            html.push("<img alt=\"layer img\" src=\"");
            if (isText) {
                html.push("styles/default/images/textlayer.gif");
            } else if (isImage) {
                //get link to thumbnail
                html.push(vo.get_tag());
            }
            html.push("\"/>");
            html.push("<h1>");
            if (isText)
                html.push(vo.get_text());
            else
                html.push("&nbsp;");
            html.push("</h1>");
            html.push("<div class=\"buttons\">"); // buttons div
            if (isText) {
                html.push("<a class=\"button edit\" href=\"#\">");
                html.push("<span class=\"icon edit\">edit \u25BC</span>");
                html.push("</a> ");
            }
            html.push("<a class=\"button delete\" href=\"#\">");
            html.push("<span class=\"icon delete\">delete</span>");
            html.push("</a>");
            html.push("</div>"); // buttons div
            html.push("</div>"); // conent div
            html.push("</li>"); // item
            //add item to list, add vObject to data property
            $(html.join("")).appendTo(ul).data("vObject", vo);
        }
    }
    ul.sortable("refresh");
}

Sample._onDeleteButtonClick = function (event) {
    event.stopPropagation();
    event.preventDefault();
    var phl = Sample.get_photoLabel();
    var vo = $(this).parent().parent().parent().data("vObject");
    phl.removeVObject(vo);
    event.data = { ignoreListItemClick: true };
}

Sample._onEditButtonClick = function (event) {
    event.stopPropagation();
    event.preventDefault();
    var th = $(this);
    var menu = $("#textMenu");
    if (th.hasClass("pushed")) {
        th.removeClass("pushed");
        menu.slideUp("fast");
    } else {
        $("#imageMenu").hide();
        $(".menuToggleButton").removeClass("pushed");
        $("div.regions div.tabPanel ul li.listItem a.edit.pushed").removeClass("pushed");
        th.addClass("pushed");
        menu.slideDown("fast");
        Sample._updateTextMenu(this);
    }
    event.data = { ignoreListItemClick: true };
}

Sample._updateTextMenu = function (button) {
    var btn = $(button);
    var menu = $("#textMenu");

    var buttonPos = btn.offset();
    var sidebarPos = $(".sidebar").offset();


    if (btn.hasClass("menuToggleButton")) {
        $("#addTextButton", menu).css("display", "inline-block");
        $("#editTextButton", menu).css("display", "none");
        menu.removeData("vObject");
    } else {
        $("#editTextButton", menu).css("display", "inline-block");
        $("#addTextButton", menu).css("display", "none");
        var vo = btn.parent().parent().parent().data("vObject");
        if (vo) {
            menu.data("vObject", vo);
            Sample.updateTextTool(vo);
        }
    }

    var menuPos = { left: buttonPos.left + btn.outerWidth() - sidebarPos.left - menu.outerWidth() - 1,
        top: buttonPos.top + btn.outerHeight() - sidebarPos.top - 2
    };
    menu.css("left", menuPos.left);
    menu.css("top", menuPos.top);
}

Sample._onHideButtonClick = function (event) {
    event.stopPropagation();
    var th = $(this);
    var phl = Sample.get_photoLabel();
    var vo = th.parent().parent().data("vObject");
    var visible = !vo.get_visible();
    vo.set_visible(visible);
    if (visible) {
        th.attr("checked", "checked");
    } else {
        th.removeAttr("checked");
    }
    Sample._pendingRedraw(200);
    event.data = { ignoreListItemClick: true };
}

Sample._onUpDownButtonClick = function (event) {
    event.stopPropagation();
    event.preventDefault();
    var th = $(this);
    var vo = th.parent().parent().data("vObject");
    var cv = vo.get_canvas();
    var voc = vo.get_layer().get_vObjects();
    var index = vo.get_index();
    var newIndex = index;

    if (th.is(".up") && index < voc.get_count() - 1)
        newIndex = index + 1;
    else if (th.is(".down") && index > 0)
        newIndex = index - 1;
    if (index != newIndex) {
        cv.beginUpdate();
        voc.move(index, newIndex);
        cv.endUpdate();
        Sample._pendingRedraw(200);
    }
    event.data = { ignoreListItemClick: true };
}

Sample._selectNavigationButton = function (btn) {
    $("div.navigationPanel > ul > li.selected.group1").removeClass("selected");
    $(btn).parent().addClass("selected");
}

//drag and drop layers
Sample.onSortingStop = function (event, ui) {
    var ul = ui.item.parent();
    var items = $("li", ul);
    var newIndex = items.length - 1 - items.index(ui.item);
    var vo = ui.item.data("vObject");
    var oldIndex = vo.get_index();
    if (oldIndex != newIndex) {
        vo.get_layer().get_vObjects().move(oldIndex, newIndex);
    }
    Sample._pendingRedraw();
}

//select obkect on canvas by click in layer list
Sample._onListItemClick = function (event) {
    //ignore bubling events from inner buttons
    //but 'live' events doesn't support stopPropagation
    //so check flag property in event.data we set in previous event handler
    if (!event.data || !event.data.ignoreListItemClick) {
        event.stopPropagation();
        var vo = $(this).data("vObject");
        var index = vo.get_index();
        var cv = vo.get_canvas();
        cv.set_currentLayerIndex(vo.get_layer().get_index());
        cv.set_currentVObjectIndex(index);
        Sample._pendingRedraw(200);
        $(this).parent().children("li.selected").removeClass("selected").end().end().addClass("selected");
    }
}

Sample._pendingRedraw = function (interval) {
    //wait "interval" milliseconds before redraw canvas
    Sample.get_photoLabel().pendingRedraw(interval);
}

Sample._changeSupportAction = function (event) {
    var btn = $(this);
    var isSupport = btn.parent().hasClass("selected");

    if (isSupport)
        btn.parent().removeClass("selected");
    else
        btn.parent().addClass("selected");

    var vobjects = Sample.get_photoLabel().getVObjects();
    for (var i in vobjects) {
        if (btn.attr("rel") === "rotate") {
            vobjects[i].get_permissions().set_allowRotate(!isSupport);
        }
        else if (btn.attr("rel") === "resize") {
            vobjects[i].get_permissions().set_allowProportionalResize(!isSupport);
        }
    }
    
    Sample.get_photoLabel().pendingRedraw(50);
}

Sample.init = function () {
    var ns = Aurigma.GraphicsMill.AjaxControls.VectorObjects;
    var phl = Sample.get_photoLabel();
    var cv = phl.get_canvasViewer().get_canvas();
    var h = cv.get_history();

    phl.get_canvasViewer().set_clearSelectionOnDocumentClick(false);

    //image list behaviour
    var imageList = $find(Sample.imageListId);
    imageList.add_okClick(function (sender, arg) {
        //on OK click call page method
        var curr = phl.get_currentRegion();
        if (curr && arg)
        PageMethods.CreateImageVObject(arg, Sample.addImageVObject);
        //hide add image pane
        $("#imageMenu").hide();
        $(".menuToggleButton[rel=imageMenu]").removeClass("pushed");
    });

    //add text object
    $("#addTextButton").bind("click", Sample.addTextVObject);

    //edit text object
    $("#editTextButton").bind("click", function (event) {
        var vo = $("#textMenu").data("vObject");
        if (ns.PlainTextVObject.isInstanceOfType(vo))
            Sample.updateTextVObject(vo);
        $("#textMenu").slideUp("fast");
        $("div.regions div.tabPanel ul li.listItem a.edit").removeClass("pushed");
        Sample._updateRegionTabPanel(vo.get_layer());
    });

    cv.add_currentVObjectChanged(Sample._onCurrentVObjectChanged);

    phl.add_currentRegionChanged(Sample._onCurrentRegionChanged);

    /*
    * init tollbar
    */
    //hover effect
    $(".toolbar li").hover(function () { $(this).addClass("hover"); },
		function () { $(this).removeClass("hover"); });
    //navigators
    $(".toolbar li.group1 a").bind("click", function (event) {
        var navigator = $(this).attr("rel");
        if (navigator == "move")
            navigator = "";
        phl.set_navigator(navigator);
        $(".toolbar li.group1.selected").removeClass("selected");
        $(this).parent().addClass("selected");
    });

    //reset zoom
    $(".toolbar li a.zoom1").bind("click", function (event) {
        phl.set_zoom(1);
    });
    //zoomin
    $(".toolbar li a.zoomin").bind("click", function (event) {
        var zoom = phl.get_zoom();
        phl.set_zoom(zoom * 1.25);
    });
    //zoom out
    $(".toolbar li a.zoomout").bind("click", function (event) {
        var zoom = phl.get_zoom();
        phl.set_zoom(zoom / 1.25);
    });

    //switch rotate / resize
    $(".toolbar li.group2 a").bind("click", Sample._changeSupportAction);
    //align buttons
    $(".toolbar li.group3 a").bind("click", function (event) {
        phl.alignVObject(phl.get_currentVObject(), $(this).attr("rel"));
    });

    //history functionality
    $(".toolbar li.group4 a.undo").bind("click", function () { h.undo(); });
    $(".toolbar li.group4 a.redo").bind("click", function () { h.redo(); });
    h.set_enable(true);
    h.add_changed(Sample.updateUndoRedo);
    Sample.updateUndoRedo();

    //init region tabs
    var tabs = $("div.regions");
    tabs.tabs({ select: Sample._onTabSelected });

    //add vobject count changed handler
    phl.add_vObjectCollectionChanged(Sample._onVObjectCollectionChanged);

    //add list item click handler
    $("div.regions div.tabPanel ul li.listItem").live("click", Sample._onListItemClick);

    //add delete VObject event handler
    $("div.regions div.tabPanel ul li.listItem a.delete").live("click", Sample._onDeleteButtonClick);

    //add delete VObject event handler
    $("div.regions div.tabPanel ul li.listItem a.edit").live("click", Sample._onEditButtonClick);

    //add hide/show VObject event handler
    $("div.regions div.tabPanel ul li.listItem input[type=checkbox]").live("click", Sample._onHideButtonClick);

    //add up VObject event handler
    $("div.regions div.tabPanel ul li.listItem a.up").live("click", Sample._onUpDownButtonClick);

    //add down VObject event handler
    $("div.regions div.tabPanel ul li.listItem a.down").live("click", Sample._onUpDownButtonClick);

    $(".menuToggleButton[rel='textMenu']").click(function (event) {
        Sample._onEditButtonClick.call(this, event);
    });

    //show / hide add image menu
    $(".menuToggleButton[rel='imageMenu']").click(function () {
        if ($(this).hasClass("pushed")) {
            $("#imageMenu").slideUp("fast");
            $(this).removeClass("pushed");
        } else {
            $("#textMenu").hide();
            $("#imageMenu").slideDown("fast");
            $(".menuToggleButton").removeClass("pushed");
            $("div.regions div.tabPanel ul li.listItem a.edit").removeClass("pushed");
            $(this).addClass("pushed");
        }
    });

    //layers drag and drop
    $("ul.layers").sortable({ distance: 7, axis: "y", items: "li", zIndex: 90,
        stop: Sample.onSortingStop
    });

    //zoom info
    var onZoomed = function () {
        var zoom = Math.round(phl.get_zoom() * 100);
        $("#zoomInfo").text(zoom + "%");
    }
    phl.get_canvasViewer().add_zoomed(onZoomed);
    onZoomed();
    $(".zoomout, .zoom1, .zoomin").hover(
		function () { $("#zoomInfo").stop().show().fadeTo("fast", 0.7); },
		function () { $("#zoomInfo").stop().fadeOut("fast"); }
	);

    //"loading..." tooltip
    cv.add_sendingRequest(function () { $(".loading-info").stop().fadeIn("fast"); });
    cv.add_requestComplete(function () { $(".loading-info").stop().fadeOut("def"); });

    // update object list
    var l = cv.get_currentLayer();
    if (l) {
        Sample._updateRegionTabPanel(l);
    }
}