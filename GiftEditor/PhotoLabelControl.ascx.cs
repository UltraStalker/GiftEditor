using System;
using System.Collections;
using System.Configuration;
using System.Data;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.IO;
using System.Drawing;
using Aurigma.GraphicsMill.AjaxControls.VectorObjects;
using System.Collections.Generic;
using System.Text;

public partial class PhotoLabelControl : System.Web.UI.UserControl, IScriptControl
{
	public class RegionStyle
	{
		private float _borderWidth = 1;

		public float BorderWidth
		{
			get { return _borderWidth; }
			set { _borderWidth = value; }
		}
		private Color _borderColor = System.Drawing.Color.Black;

		public Color BorderColor
		{
			get { return _borderColor; }
			set { _borderColor = value; }
		}
		private Color _fillColor = System.Drawing.Color.FromArgb((int)0x2054FFCB);

		public Color FillColor
		{
			get { return _fillColor; }
			set { _fillColor = value; }
		}

		public string GetJSON()
		{
			StringBuilder sb = new StringBuilder(100);

			sb.Append("{ ");

			sb.Append("BorderWidth: ");
			sb.Append(this.BorderWidth);
			sb.Append(", BorderColor: \"");
			sb.Append(Common.ConvertToWebColor(this.BorderColor));
			sb.Append("\", FillColor: \"");
			sb.Append(Common.ConvertToWebColor(this.FillColor));
			sb.Append("\" }");

			return sb.ToString();
		}
	}

	private Layer _photoLayer;
	private Layer _regionLayer;
	private const string _photoLayerName = "__backgroundImageLayer";
	private const string _regionLayerName = "__regionRectanglesLayer";

	protected void Page_Load(object sender, EventArgs e)
	{
		if (!this.IsPostBack)
		{
			LoadPhoto();
		}
		else
		{
			_photoLayer =  _canvasViewer.Canvas.Layers.GetLayersByName(_photoLayerName)[0];
			_regionLayer = _canvasViewer.Canvas.Layers.GetLayersByName(_regionLayerName)[0];
		}
	}

	protected override void OnInit(EventArgs e)
	{
		base.OnInit(e);

		if (!IsPostBack)
		{
			Clear();
		}
	}

	public void Clear()
	{
		CanvasViewer.Canvas.Clear();
		_photoLayer = new Layer();
		_photoLayer.Name = _photoLayerName;
		_photoLayer.Locked = true;
		CanvasViewer.Canvas.Layers.Add(_photoLayer);

		_regionLayer = new Layer();
		_regionLayer.Name = _regionLayerName;
		_regionLayer.Locked = true;
		CanvasViewer.Canvas.Layers.Add(_regionLayer);
	}

	protected override void OnPreRender(EventArgs e)
	{
		base.OnPreRender(e);

		if (!this.DesignMode)
		{
			// Test for ScriptManager and register if it exists
			ScriptManager sm = ScriptManager.GetCurrent(this.Page);

			if (sm == null)
				throw new HttpException("A ScriptManager control must exist on the current page.");

			sm.RegisterScriptControl(this);
		}
	}

	protected override void Render(HtmlTextWriter writer)
	{
		if (!this.DesignMode)
			ScriptManager.GetCurrent(this.Page).RegisterScriptDescriptors(this);

		base.Render(writer);
	}

	public override string ClientID
	{
		get
		{
			return container.ClientID;
		}
	}

	private void LoadPhoto()
	{
		_photoLayer.VObjects.Clear();

		if (!string.IsNullOrEmpty(this.BackgroundImage))
		{
			if (File.Exists(this.BackgroundImage))
			{
				Size imageSize;
				float hRes, vRes;
				Common.GetImageSize(this.BackgroundImage, out imageSize, out hRes, out vRes);
				_canvasViewer.Canvas.WorkspaceHeight = Common.ConvertPixelsToPoints(vRes, imageSize.Height);
				_canvasViewer.Canvas.WorkspaceWidth = Common.ConvertPixelsToPoints(hRes, imageSize.Width);

				//we change canvas size, so we need update zoom to save ZoomMode
				_canvasViewer.ZoomMode = _canvasViewer.ZoomMode;

				ImageVObject vo = new ImageVObject(new FileInfo(this.BackgroundImage));
				vo.BorderWidth = 0;
				vo.Locked = true;
				Aurigma.GraphicsMill.AjaxControls.VectorObjects.Math.RotatedRectangleF r = vo.Rectangle;
				r.Width = _canvasViewer.Canvas.WorkspaceWidth;
				r.Height = _canvasViewer.Canvas.WorkspaceHeight;
				r.Location = new Aurigma.GraphicsMill.AjaxControls.VectorObjects.Math.PointF(0, 0);
				vo.Rectangle = r;
				_photoLayer.VObjects.Insert(0, vo);
			}
			else
			{
				throw new FileNotFoundException("Image file not found.", this.BackgroundImage);
			}
		}
	}

	#region Public Properties

	public string BackgroundImage
	{
		get { return (string)this.ViewState["BackgroundImage"]; }
		set
		{
			this.ViewState["BackgroundImage"] = value;
			LoadPhoto();
		}
	}

	/// <summary>
	/// Whether or not draw rectangle on region places
	/// </summary>
	public bool IsHighlightRegion
	{
		get
		{
			if (this.ViewState["HighlightRegion"] != null)
				return (bool)this.ViewState["HighlightRegion"];
			else
				return false;
		}
		set { this.ViewState["HighlightRegion"] = value; }
	}

	[PersistenceModeAttribute(PersistenceMode.InnerProperty)]
	public RegionStyle CurrentRegionDisplayStyle
	{
		get
		{
			if (this.ViewState["CurrentRegionDisplayStyle"] != null)
				return (RegionStyle)this.ViewState["CurrentRegionDisplayStyle"];
			else
				return null;
		}
		set { this.ViewState["CurrentRegionDisplayStyle"] = value; }
	}

	[PersistenceModeAttribute(PersistenceMode.InnerProperty)]
	public RegionStyle RegionDisplayStyle
	{
		get
		{
			if (this.ViewState["RegionDisplayStyle"] != null)
				return (RegionStyle)this.ViewState["RegionDisplayStyle"];
			else
				return null;
		}
		set { this.ViewState["RegionDisplayStyle"] = value; }
	}

	public VObject CurrentVObject
	{
		get { return _canvasViewer.Canvas.CurrentVObject; }
	}

	public NamedRectangleRegion CurrentRegion
	{
		get
		{
			Layer l = _canvasViewer.Canvas.CurrentLayer;
			if (l == null || l.Region == null && !string.IsNullOrEmpty(l.Name))
				return null;
			else
				return new NamedRectangleRegion(l.Name, new RectangleF(l.Region.Left, l.Region.Top, l.Region.Width, l.Region.Height));
		}
		set
		{
			if (!string.IsNullOrEmpty(value.Name))
			{
				Layer[] l = _canvasViewer.Canvas.Layers.GetLayersByName(value.Name);
				if (l.Length > 0)
					_canvasViewer.Canvas.CurrentLayerIndex = l[0].Index;
			}
			//set current style
			if (this.CurrentRegionDisplayStyle != null)
			{
				RegionStyle currentStyle = this.CurrentRegionDisplayStyle;
				RegionStyle regionStyle = this.RegionDisplayStyle ?? new RegionStyle();

				foreach (RectangleVObject vo in _regionLayer.VObjects)
				{
					if (vo.Name == value.Name)
					{
						vo.BeginUpdate();
						vo.BorderWidth = currentStyle.BorderWidth;
						vo.BorderColor = currentStyle.BorderColor;
						vo.FillColor = currentStyle.FillColor;
						vo.EndUpdate();
					}
					else
					{
						vo.BeginUpdate();
						vo.BorderWidth = regionStyle.BorderWidth;
						vo.BorderColor = regionStyle.BorderColor;
						vo.FillColor = regionStyle.FillColor;
						vo.EndUpdate();
					}
				}
			}
		}
	}

	public float Zoom
	{
		get { return _canvasViewer.Zoom; }
		set { _canvasViewer.Zoom = value; }
	}

	public Aurigma.GraphicsMill.AjaxControls.CanvasViewer CanvasViewer
	{
		get { return _canvasViewer; }
	}

	#endregion Public Properties

	private void DrawRegion(NamedRectangleRegion region)
	{
		RectangleVObject vo = new RectangleVObject(region.Left, region.Top, region.Width, region.Height);
		vo.BeginUpdate();
		vo.Name = region.Name;
		RegionStyle style = this.RegionDisplayStyle ?? new RegionStyle();
		vo.BorderWidth = style.BorderWidth;
		vo.BorderColor = style.BorderColor;
		vo.FillColor = style.FillColor;
		vo.Locked = true;
		vo.EndUpdate();
		_regionLayer.VObjects.Add(vo);
	}

	public void AddRegion(NamedRectangleRegion region)
	{
		Layer l = new Layer();
		l.Name = region.Name;
		l.Region = region;
		_canvasViewer.Canvas.Layers.Add(l);

		if (this.IsHighlightRegion)
			DrawRegion(region);
	}

	public void AddRegions(IEnumerable<NamedRectangleRegion> regions)
	{
		foreach (NamedRectangleRegion region in regions)
		{
			AddRegion(region);
		}
	}

	public void RemoveRegion(string regionName)
	{
		if (!string.IsNullOrEmpty(regionName))
		{
			//remove layer
			Layer[] layers = _canvasViewer.Canvas.Layers.GetLayersByName(regionName);
			Array.ForEach(layers, delegate(Layer l) { _canvasViewer.Canvas.Layers.Remove(l); });
			//remove highlight rectangle
			VObject[] voc = _regionLayer.VObjects.GetVObjectsByName(regionName);
			Array.ForEach(voc, delegate(VObject vo) { _regionLayer.VObjects.Remove(vo); });
		}
	}

	public void RemoveAllRegions()
	{
		for (int i = _canvasViewer.Canvas.Layers.Count - 1; i >= 0; i--)
		{
			Layer l = _canvasViewer.Canvas.Layers[i];
			if (l != _photoLayer && l != _regionLayer && !string.IsNullOrEmpty(l.Name))
			{
				_canvasViewer.Canvas.Layers.RemoveAt(i);
			}
		}
		_regionLayer.VObjects.Clear();
	}

	public IEnumerable<NamedRectangleRegion> GetRegions()
	{
		foreach (Layer l in _canvasViewer.Canvas.Layers)
		{
			if (l != _photoLayer && l != _regionLayer && !string.IsNullOrEmpty(l.Name))
				yield return new NamedRectangleRegion(l.Name, new RectangleF(l.Region.Left, l.Region.Top, l.Region.Width, l.Region.Height));
		}
	}

	public void AddVObject(VObject vo, string regionName)
	{
		if (string.IsNullOrEmpty(regionName))
			throw new ArgumentNullException("regionName");

		Layer[] layers = _canvasViewer.Canvas.Layers.GetLayersByName(regionName);
		if (layers.Length == 0)
		{
			// TODO: throw region not found exception
		}

		float dx = layers[0].Region.Left;
		float dy = layers[0].Region.Top;
		vo.Transform.TranslateX += dx;
		vo.Transform.TranslateY += dy;

		layers[0].VObjects.Add(vo);
	}

	public IEnumerable<VObject> GetVObjects()
	{
		foreach (Layer l in _canvasViewer.Canvas.Layers)
		{
			if (l != _photoLayer && l != _regionLayer && !string.IsNullOrEmpty(l.Name))
			{
				foreach (VObject vo in l.VObjects)
					yield return vo;
			}
		}
	}

	public IEnumerable<VObject> GetVObjects(NamedRectangleRegion region)
	{
		return GetVObjects(region.Name);
	}

	public IEnumerable<VObject> GetVObjects(string regionName)
	{
		if (string.IsNullOrEmpty(regionName))
			throw new ArgumentNullException("regionName");

		Layer[] layers = _canvasViewer.Canvas.Layers.GetLayersByName(regionName);
		if (layers.Length > 0)
			foreach (VObject vo in layers[0].VObjects)
				yield return vo;
	}

	public void RemoveVObject(VObject vo)
	{
		foreach (Layer l in _canvasViewer.Canvas.Layers)
		{
			bool deleted = l.VObjects.Remove(vo);
			if (deleted) // object has been deleted, no reason to continue
				break;
		}
	}

	/// <summary>
	/// Return canvas data in JSON format.
	/// </summary>
	/// <param name="serializeBinaryData">Include image and color profile binary files in serialized string.</param>
	/// <returns>Serialized string.</returns>
	public string SaveState(bool serializeBinaryData)
	{
		return _canvasViewer.Canvas.Data;
	}

	public void LoadState(string serializedData, bool withBinaryData)
	{
		_canvasViewer.Canvas.Data = serializedData;
	}

	public Aurigma.GraphicsMill.Bitmap RenderRegion(string regionName, float dpi)
	{
		Layer renderedLayer = null;
		List<Layer> hiddenLayers = new List<Layer>(_canvasViewer.Canvas.Layers.Count);
		foreach (Layer l in _canvasViewer.Canvas.Layers)
		{
			if (l.Name == regionName)
			{
				renderedLayer = l;
			}
			else if (l.Visible)
			{
				l.Visible = false;
				hiddenLayers.Add(l);
			}
		}
		if (renderedLayer == null)
		{
			//TODO: throw exception
		}

		// Temporary remove region from rendered layer.
		RectangleRegion rr = renderedLayer.Region;
		renderedLayer.Region = null;

		//render canvas
		Aurigma.GraphicsMill.Bitmap bp = _canvasViewer.Canvas.RenderWorkspace(dpi, Aurigma.GraphicsMill.ColorSpace.Rgb);

		// Restore region back.
		renderedLayer.Region = rr;

		//crop region
		Rectangle r = new Rectangle(Common.ConvertPointsToPixels(dpi, renderedLayer.Region.Left),
			Common.ConvertPointsToPixels(dpi, renderedLayer.Region.Top),
			Common.ConvertPointsToPixels(dpi, renderedLayer.Region.Width),
			Common.ConvertPointsToPixels(dpi, renderedLayer.Region.Height));
		bp.Transforms.Crop(r);

		//revert hidden layers
		hiddenLayers.ForEach(delegate(Layer l) { l.Visible = true; });
		return bp;
	}

	#region IScriptControl Members

	public System.Collections.Generic.IEnumerable<ScriptDescriptor> GetScriptDescriptors()
	{
		ScriptControlDescriptor scd = new ScriptControlDescriptor("PhotoLabel.PhotoLabelControl", container.ClientID);
		scd.AddComponentProperty("canvasViewer", _canvasViewer.ClientID);
		scd.AddProperty("_photoLayerName", _photoLayer.Name);
		scd.AddProperty("_regionLayerName", _regionLayer.Name);
		scd.AddProperty("_zoomInNavigatorId", zoomInNavigator.ClientID);
		scd.AddProperty("_zoomOutNavigatorId", zoomOutNavigator.ClientID);
		scd.AddProperty("_panNavigatorId", panNavigator.ClientID);

		RegionStyle style = this.RegionDisplayStyle ?? new RegionStyle();
		scd.AddScriptProperty("_regionDisplayStyle", style.GetJSON());

		style = this.CurrentRegionDisplayStyle ?? new RegionStyle();
		scd.AddScriptProperty("_currentRegionDisplayStyle", style.GetJSON());

		return new ScriptDescriptor[] { scd };
	}

	public System.Collections.Generic.IEnumerable<ScriptReference> GetScriptReferences()
	{
		ScriptReference sr = new ScriptReference("Scripts/PhotoLabelControl.js");
		return new ScriptReference[] { sr };
	}

	#endregion
}