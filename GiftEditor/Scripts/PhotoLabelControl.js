/// <reference name="MicrosoftAjax.js"/>

Type.registerNamespace("PhotoLabel");

PhotoLabel.PhotoLabelControl = function(element) {
    PhotoLabel.PhotoLabelControl.initializeBase(this, [element]);
    
    this._canvasViewer = null;
    this._photoLayerName = null;
    this._regionLayerName = null;
	this._zoomInNavigatorId = null;
	this._zoomOutNavigatorId = null;
	this._panNavigatorId = null;
	this._regionDisplayStyle = { };
	this._currentRegionDisplayStyle = {};

	this._currentLayerIndex = -1;
}

PhotoLabel.PhotoLabelControl.prototype = {
    
    get_canvasViewer: function() {
		return this._canvasViewer;
    },
    
    set_canvasViewer: function(v) {
		this._canvasViewer = v;
	},
	
	set_zoom: function(v) {
		this._canvasViewer.set_zoom(v);
	},
	
	get_zoom: function() {
		return this._canvasViewer.get_zoom();
	},
	
	get_zoomMode: function() {
		return this._canvasViewer.get_zoomMode();
	},
	
	set_zoomMode: function(v) {
		this._canvasViewer.set_zoomMode(v);
	},
	
	addVObject: function(vObject, regionName) {
		if (typeof regionName != "string") {
			throw Error.argumentType("regionName", typeof regionName, "string");
		}
		
		var layers = this.get_canvasViewer().get_canvas().get_layers().getLayersByName(regionName);
		if (layers.length == 0)
		{
			throw Error.argument("regionName", "Region not found.");
		}
		
		var dx = layers[0].get_region().Left;
		var dy = layers[0].get_region().Top;
		vObject.get_transform()._translateX += dx;
		vObject.get_transform()._translateY += dy;
		
		layers[0].get_vObjects().add(vObject);
	},
    
    getVObjects: function() {
		var result = [];
		var voc, i, vocnt;
		if (arguments.length == 1 && typeof arguments[0] == "string") {
			var layers = this.get_canvasViewer().get_canvas().get_layers().getLayersByName(arguments[0]);
			if (layers.length > 0) {
				voc = layers[0].get_vObjects();
				vocnt = voc.get_count();
				for (i=0; i<vocnt; i++) {
					result.push(voc.get_item(i));
				}
			}
		}
		else
		{
			var lc = this.get_canvasViewer().get_canvas().get_layers();
			var lcnt = lc.get_count();
			for (i=0; i<lcnt; i++) {
				var layer = lc.get_item(i);
				var name = layer.get_name();
				if (name && name != this._photoLayerName && name != this._regionLayerName) {
					voc = layer.get_vObjects();
					vocnt = voc.get_count();
					for (var j=0; j<vocnt; j++) {
						result.push(voc.get_item(j));
					}
				}
			}
		}
		return result;
    },
    
    removeVObject: function(vo) {
		var cv = this.get_canvasViewer().get_canvas();
		var lc = cv.get_layers();
		var lcnt = lc.get_count();
		for (var i=0; i<lcnt; i++) {
			if (i !=  this._photoLayerIndex) {
				var voc = lc.get_item(i).get_vObjects();
				var index = voc.indexOf(vo);
				if (index > -1) {
					voc.removeAt(index);
					break;
				}
			}
		}
		this.pendingRedraw(300);
    },
    
    getRegions: function() {
		var regions = [];
		var lc = this.get_canvasViewer().get_canvas().get_layers();
		var lcnt = lc.get_count();
		for (i=0; i<lcnt; i++) {
			var layer = lc.get_item(i);
			var name = layer.get_name();
			if (name !=  this._photoLayerName && name != this._regionLayerName) {	
				var region = layer.get_region();
				if (typeof name == "string" && name != "") {
					regions.push({ Name: name, Left: region.Left, Top: region.Top, Width: region.Width, Height: region.Height, Locked: layer.get_locked() });
				}
			}
		}
		return regions;
    },
    
    removeRegion: function(regionName) {
		if (typeof regionName == "string" && regionName != "") {
			var lc = this.get_canvasViewer().get_canvas().get_layers();
			var cnt = lc.get_count();
			var layer;
			for (var i=cnt-1; i>=0; i--) {
				layer = lc.get_item(i);
				if (layer.get_name() == regionName) {
					lc.removeAt(i);
				}
				else if (layer.get_name() == this._regionLayerName) {
					for (var j=layer.get_vObjects().get_count()-1; j>=0; j--) {
						var vo = layer.get_vObjects().get_item(j);
						if (vo.get_name() == regionName) {
							layer.get_vObjects().removeAt(j);
						}
					}
				}
			}
		}
    },
    
    lockRegion: function(regionName) {
		this.set_currentRegion(regionName);
		
		var lc = this.get_canvasViewer().get_canvas().get_layers();
		var cnt = lc.get_count();
		for (var i=0; i<cnt; i++) {
			var layer = lc.get_item(i);
			var name = layer.get_name();
			if (name != regionName)
				layer.set_locked(true);
			else if (name != this._photoLayerName && name != this._regionLayerName)
				layer.set_locked(false);
		}
		this.get_canvasViewer().get_canvas().redraw();
    },
    
    unlockRegion: function() {
		var lc = this.get_canvasViewer().get_canvas().get_layers();
		var cnt = lc.get_count();
		for (var i=0; i<cnt; i++) {
			var layer = lc.get_item(i);
			var name = layer.get_name();
			if (name != this._photoLayerName && name != this._regionLayerName)
				layer.set_locked(false);
		}
    },
 
    get_currentVObject: function() {
		return this.get_canvasViewer().get_canvas().get_currentVObject();
    },
    
    set_currentVObjectIndex: function(index) {
		this.get_canvasViewer().get_canvas().set_currentVObjectIndex(index);
    },
    
    get_currentRegion: function() {
		var layer = this.get_canvasViewer().get_canvas().get_currentLayer();
		if (layer != null && typeof layer.get_name() == "string" && layer.get_name() != "" && layer.get_region() != null) {
			var region = layer.get_region();
			return { Name: layer.get_name(), Left: region.Left, Top: region.Top, Width: region.Width, Height: region.Height };
		}
		else
			return null;
    },
    
    set_currentRegion: function(regionName) {
        var cv = this.get_canvasViewer().get_canvas();
        var newIndex = -1;

		if (regionName != null && regionName != "") {
			var l = cv.get_layers().getLayersByName(regionName);
			if (l.length > 0)
			    newIndex = l[0].get_index();
		}

		if (this._currentLayerIndex != newIndex) {
		    cv.set_currentLayerIndex(newIndex);

		    this._currentLayerIndex = newIndex;
		    this._onCurrentRegionChanged();
		}

		this.pendingRedraw(100);
    },

    _get_lastRegion: function(){
        var regions = this.getRegions();
        return regions.length > 0 ? regions[regions.length - 1] : null;
    },
    
    _updateRegionStyle: function() {
		var cv = this.get_canvasViewer().get_canvas();
		var regionLayer = this.get_regionLayer();
		if (regionLayer) {
			var currentLayer = cv.get_currentLayer();
			var voc = regionLayer.get_vObjects();
			var currentRegionName = currentLayer ? currentLayer.get_name() : null;
			for (var i=0, cnt=voc.get_count(); i<cnt; i++) {
				var vo = voc.get_item(i);
				if (vo.get_name() == currentRegionName) {
					vo.beginUpdate();
					vo.set_borderWidth(this._currentRegionDisplayStyle.BorderWidth);
					vo.set_borderColor(this._currentRegionDisplayStyle.BorderColor);
					vo.set_fillColor(this._currentRegionDisplayStyle.FillColor);
					vo.endUpdate();
				} else {
					vo.beginUpdate();
					vo.set_borderWidth(this._regionDisplayStyle.BorderWidth);
					vo.set_borderColor(this._regionDisplayStyle.BorderColor);
					vo.set_fillColor(this._regionDisplayStyle.FillColor);
					vo.endUpdate();
				}
			}
		}
    },
    
    //Alignment: left, right, horizontalCenter, top, bottom, verticalCenter
    alignVObject: function(vObject, align) {
		if (vObject && align)
			this.get_canvasViewer().get_canvas().alignVObject(vObject, align);
    },
    
    set_navigator: function(navigator) {
		if (navigator == "zoomIn")
			navigator = this._zoomInNavigatorId;
		else if (navigator == "zoomOut")
			navigator = this._zoomOutNavigatorId;
		else if (navigator == "pan")
			navigator = this._panNavigatorId;
		else
			navigator = "";
		
		this.get_canvasViewer().set_navigator(navigator);
    },
    
    _onMouseDown: function(e, t) {
		if ((this._canvasViewer.get_navigator() == '') && (this._canvasViewer.get_rubberband() == '')) {
			var regions = this.getRegions();
			for (var i=regions.length - 1; i>=0; i--) {
				if (!regions[i].Locked && regions[i].Left < t.x && regions[i].Left + regions[i].Width > t.x &&
					regions[i].Top < t.y && regions[i].Top + regions[i].Height > t.y) {
					this.set_currentRegion(regions[i].Name);
					break;
				}
			}
		}
    },
    
    _onCurrentRegionChanged: function() {
		this._updateRegionStyle();
		
		var h = this.get_events().getHandler("CurrentRegionChanged");
		if (h)
		    h(this);
    },
    
    add_currentRegionChanged : function(h) {
		this.get_events().addHandler("CurrentRegionChanged", h);
	},
	
	remove_currentRegionChanged : function(h) {
		this.get_events().removeHandler("CurrentRegionChanged", h);
	},
	
	_onVObjectCollectionChanged: function(layer, arg) {
		var h = this.get_events().getHandler("VObjectCollectionChanged");
		if (h)
			h(this, layer);
    },
    
    add_vObjectCollectionChanged : function(h) {
		this.get_events().addHandler("VObjectCollectionChanged", h);
	},
	
	remove_vObjectCollectionChanged : function(h) {
		this.get_events().removeHandler("VObjectCollectionChanged", h);
	},
	
	get_regionVisible: function() {
		return this.get_regionLayer().get_visible();
	},
	
	set_regionVisible: function(v) {
		var cv = this.get_canvasViewer().get_canvas();
		var regionLayer = this.get_regionLayer();
		regionLayer.set_visible(v);
		this.pendingRedraw(300);
	},
	
	get_regionLayer: function() {
		var regionLayer = this.get_canvasViewer().get_canvas().get_layers().getLayersByName(
			this._regionLayerName);
		if (regionLayer.length > 0) {
			regionLayer = regionLayer[0];
			this.get_regionLayer = function() { return regionLayer; };
			return this.get_regionLayer();
		} else {
			return null;
		}
    },
    
    pendingRedraw: function(interval) {
		interval = new Number(interval);
		if (isNaN(interval))
			interval = 700;
		if (!this._redrawAllFunction) {
			var cv = this.get_canvasViewer().get_canvas();
			var _this = this;
			this._redrawAllFunction = function() { 
				cv.redraw(true);
				clearTimeout(this._rewrawTimer);
				_this._rewrawTimer = null;
			};
		}
		//wait some time before redrawing
		if (!this._rewrawTimer)
			this._rewrawTimer = setTimeout(this._redrawAllFunction, interval);
    },
    
    initialize : function() {
        PhotoLabel.PhotoLabelControl.callBaseMethod(this, 'initialize');
        
        var lastRegion = this._get_lastRegion();
        if (lastRegion != null)
            this.set_currentRegion(lastRegion.Name);

        if (!this._onMouseDownDelegate)
			this._onMouseDownDelegate = Function.createDelegate(this, this._onMouseDown);
        this.get_canvasViewer().add_workspaceMouseDown(this._onMouseDownDelegate);

		var lc = this.get_canvasViewer().get_canvas().get_layers();
        var self = this;
        var createHandler = function(layer) { return function(sender, e) { self._onVObjectCollectionChanged(layer, e); }; };
        for (var i=0; i<lc.get_count(); i++) {
			var l = lc.get_item(i);
			if (l.get_name() != this._photoLayerName && l.get_name() != this._regionLayerName) {
				var voc = l.get_vObjects();
				var handler = createHandler(l);
				voc.add_itemAdded(handler);
				voc.add_itemRemoved(handler);
				voc.add_itemMoved(handler);
			}
        }
        
		Type.registerNamespace("Aurigma.GraphicsMill.AjaxControls.VectorObjects.Graphics");
        //override drawSelection function for our design purposes: don't need rectangle around selected object
		Aurigma.GraphicsMill.AjaxControls.VectorObjects.Graphics.drawSelection = function(ctx, rectangle, properties) {
			/*var gr = Aurigma.GraphicsMill.AjaxControls.VectorObjects.Graphics;
			//doesn't zoom selection rectangle width
			var mul = (properties.mul) ? properties.mul : 1;
			//draw black + white + black rectangles
			var d = properties.width / mul;
			gr.drawRectangle(ctx, rectangle, d, "rgba(0, 0, 0, 1);");
			rectangle.Width += 1.5*d;
			rectangle.Height += 1.5*d;
			gr.drawRectangle(ctx, rectangle, d, "rgba(255, 255, 255, 1);");
			rectangle.Width += 2*d;
			rectangle.Height += 2*d;
			gr.drawRectangle(ctx, rectangle, d, "rgba(0, 0, 0, 1);");*/
		}
    },
    
    dispose : function() {
		if (this._onMouseDownDelegate) {
			this.get_canvasViewer().remove_workspaceMouseDown(this._onMouseDownDelegate);
			delete this._onMouseDownDelegate;	
        }
		
		PhotoLabel.PhotoLabelControl.callBaseMethod(this, 'dispose');
    }
}
PhotoLabel.PhotoLabelControl.registerClass('PhotoLabel.PhotoLabelControl', Sys.UI.Control);

if (typeof(Sys) !== 'undefined') Sys.Application.notifyScriptLoaded();
