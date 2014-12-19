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
using System.Collections.Generic;
using System.IO;
using Aurigma.GraphicsMill.AjaxControls;
using Aurigma.GraphicsMill;
using Aurigma.GraphicsMill.AjaxControls.VectorObjects;
using System.Xml.XPath;

public partial class PhotoLabelSample : System.Web.UI.Page
{
	private static readonly string _templateFolder = HttpContext.Current.Server.MapPath("~/Images/Templates");

	private static readonly string _imageFolder = HttpContext.Current.Server.MapPath("~/Images/Labels");

	private const int defaultImageSize = 50;

	protected class ImageItem
	{
		private string _imageName;
		private int _imageId;
		private string _thumbnailUrl;
		private string _fullFileName;

		public ImageItem(string imageFilePath, bool createThumbnail)
		{
			_imageId = imageFilePath.GetHashCode();
			_imageName = Path.GetFileNameWithoutExtension(imageFilePath);

			if (createThumbnail)
				_thumbnailUrl = CreateThumbnail(imageFilePath);
		}

		public int ImageId
		{
			get { return _imageId; }
			set { _imageId = value; }
		}

		public string ImageName
		{
			get { return _imageName; }
			set { _imageName = value; }
		}

		public string ThumbnailUrl
		{
			get { return _thumbnailUrl; }
			set { _thumbnailUrl = value; }
		}

		public string FullFileName
		{
			get { return _fullFileName; }
			set { _fullFileName = value; }
		}

		private string CreateThumbnail(string filePath)
		{
			if (File.Exists(filePath))
			{
				var fc = FileCache.GetInstance();

				var thumbnailFileName = fc.GetPublicTempFileName(".gif");
				ThumbnailHelper.CreateThumbnail(filePath,
				    fc.GetAbsolutePublicCachePath(thumbnailFileName),
				    new System.Drawing.Size(150, 100), false);

				return fc.GetRelativePublicCachePath(thumbnailFileName);
			}
			else
			{
				return null;
			}
		}
	}

	protected void Page_Load(object sender, EventArgs e)
	{
		if (!IsPostBack && !IsCallback)
		{
			templateRepeater.DataSource = new List<ImageItem>(GetTemplates());
			templateRepeater.DataBind();
			if (templateRepeater.Items.Count > 0)
			{
				RepeaterItem item = templateRepeater.Items[0];
				LinkButton lb = (LinkButton)item.FindControl("templateButton");
				RepeaterCommandEventArgs arg = new RepeaterCommandEventArgs(item, lb,
					new CommandEventArgs(lb.CommandName, lb.CommandArgument));
				templateRepeater_ItemCommand(templateRepeater, arg);
			}

			LoadImageList();
		}
	}

	private void LoadImageList()
	{
		//add jpg and png images
		Array.ForEach(Directory.GetFiles(_imageFolder, "*.jpg"), delegate(string s) { imageList.Images.Add(s); });
		Array.ForEach(Directory.GetFiles(_imageFolder, "*.png"), delegate(string s) { imageList.Images.Add(s); });
	}

	protected void templateRepeater_ItemCommand(object source, RepeaterCommandEventArgs e)
	{
		ClearTemplateSelection();

		//change style of selected item
		HtmlControl li = (HtmlControl)e.Item.FindControl("listItem");
		if (string.IsNullOrEmpty(li.Attributes["class"]))
			li.Attributes["class"] = "selectedTemplate";
		else
			li.Attributes["class"] += " selectedTemplate";

		//get image file and regions
		string file = null;
		List<NamedRectangleRegion> regions = new List<NamedRectangleRegion>();

		System.Globalization.NumberFormatInfo numberInfo = new System.Globalization.NumberFormatInfo();
		numberInfo.NumberDecimalSeparator = ".";

		string templatesListFile = Path.Combine(_templateFolder, "Templates.xml");
		if (File.Exists(templatesListFile))
		{
			using (FileStream fs = new FileStream(templatesListFile, FileMode.Open, FileAccess.Read))
			{
				System.Xml.XPath.XPathDocument doc = new System.Xml.XPath.XPathDocument(fs);
				foreach (XPathNavigator nav in
					doc.CreateNavigator().Select("/Templates/TemplateItem"))
				{
					string fileName = Path.IsPathRooted(nav.GetAttribute("FileName", nav.NamespaceURI)) ? nav.Value : Path.Combine(_templateFolder, nav.GetAttribute("FileName", nav.NamespaceURI));
					if (fileName.GetHashCode().ToString() == e.CommandArgument.ToString())
					{
						file = fileName;
						foreach (XPathNavigator regionNavigator in nav.Select("Regions/Region"))
						{
							string name = regionNavigator.GetAttribute("Name", regionNavigator.NamespaceURI);
							float left = float.Parse(
								regionNavigator.GetAttribute("Left", regionNavigator.NamespaceURI), numberInfo);
							float top = float.Parse(
								regionNavigator.GetAttribute("Top", regionNavigator.NamespaceURI), numberInfo);
							float width = float.Parse(
								regionNavigator.GetAttribute("Width", regionNavigator.NamespaceURI), numberInfo);
							float height = float.Parse(
								regionNavigator.GetAttribute("Height", regionNavigator.NamespaceURI), numberInfo);

							regions.Add(new NamedRectangleRegion(name,
								new System.Drawing.RectangleF(left, top, width, height)));
						}
						break;
					}
				}
			}
		}

		if (!string.IsNullOrEmpty(file) && File.Exists(file))
		{
			photoLabel.CanvasViewer.Canvas.History.Enable = photoLabel.CanvasViewer.Canvas.History.TrackingEnabled = false;

			photoLabel.BackgroundImage = file;

			//remove previous regions
			photoLabel.RemoveAllRegions();

			//add new regions
			photoLabel.AddRegions(regions);
			//select last region
			photoLabel.CurrentRegion = regions[regions.Count - 1];

			//clear canvas history
			photoLabel.CanvasViewer.Canvas.History.Clear();
			photoLabel.CanvasViewer.Canvas.History.Enable = photoLabel.CanvasViewer.Canvas.History.TrackingEnabled = true;
		}
	}

	private void ClearTemplateSelection()
	{
		//clear selection in template list
		foreach (RepeaterItem ri in templateRepeater.Items)
		{
			HtmlControl li = (HtmlControl)ri.FindControl("listItem");
			if (!string.IsNullOrEmpty(li.Attributes["class"]) && li.Attributes["class"].Contains("selectedTemplate"))
			{
				li.Attributes["class"] = li.Attributes["class"].Replace("selectedTemplate", string.Empty);
			}
		}
	}

	protected IEnumerable<ImageItem> GetTemplates()
	{
		return GetTemplates(true);
	}

	protected IEnumerable<ImageItem> GetTemplates(bool withThumbnails)
	{
		string templatesListFile = Path.Combine(_templateFolder, "Templates.xml");
		if (File.Exists(templatesListFile))
		{
			using (FileStream fs = new FileStream(templatesListFile, FileMode.Open, FileAccess.Read))
			{
				System.Xml.XPath.XPathDocument doc = new System.Xml.XPath.XPathDocument(fs);
				foreach (XPathNavigator nav in
					doc.CreateNavigator().Select("/Templates/TemplateItem/@FileName"))
				{
					string fileName = Path.IsPathRooted(nav.Value) ? nav.Value : Path.Combine(_templateFolder, nav.Value);
					yield return new ImageItem(fileName, withThumbnails);
				}
			}
		}
	}

	protected void templateRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
	{
		if (e.Item.ItemType == ListItemType.Item || e.Item.ItemType == ListItemType.AlternatingItem)
		{
			LinkButton lb = e.Item.FindControl("templateButton") as LinkButton;
			if (lb != null)
			{
				lb.CommandArgument = ((ImageItem)e.Item.DataItem).ImageId.ToString();
				lb.Style["background-image"] = ((ImageItem)e.Item.DataItem).ThumbnailUrl;
				lb.ToolTip = ((ImageItem)e.Item.DataItem).ImageName;
			}
		}
	}

	[System.Web.Services.WebMethod]
	public static string CreateImageVObject(string imageId)
	{
		string fileName = Array.Find(Directory.GetFiles(_imageFolder, "*.jpg"),
			delegate(string s) { return s.GetHashCode().ToString() == imageId; });
		if (fileName == null)
			fileName = Array.Find(Directory.GetFiles(_imageFolder, "*.png"),
			delegate(string s) { return s.GetHashCode().ToString() == imageId; });

		ImageVObject vo = new ImageVObject(new FileInfo(fileName));

		//proportional resize to "defaultImageSize"x"defaultImageSize"
		Aurigma.GraphicsMill.AjaxControls.VectorObjects.Math.RotatedRectangleF r = vo.Rectangle;
		float dx = defaultImageSize / r.Width;
		float dy = defaultImageSize / r.Height;
		float d = dx < dy ? dx : dy;
		r.Width = d * r.Width;
		r.Height = d * r.Height;

		r.Location = new Aurigma.GraphicsMill.AjaxControls.VectorObjects.Math.PointF(2, 2);
		vo.Rectangle = r;

		vo.FillColor = System.Drawing.Color.Transparent;

		//proportional resize only
		vo.Permissions.AllowArbitraryResize = false;
        vo.Permissions.AllowRotate = false;

		// Create thumbnail to show in the layers list
		vo.Tag = GenerateThumbnail(fileName);

		return vo.Data;
	}

	private static string GenerateThumbnail(string imageFileName)
	{
		var fc = FileCache.GetInstance();
		string thumbnailFileName = fc.GetPublicTempFileName(".jpg");
		ThumbnailHelper.CreateThumbnail(imageFileName,
			fc.GetAbsolutePublicCachePath(thumbnailFileName),
			new System.Drawing.Size(40, 40), true);
		return fc.GetRelativePublicCachePath(thumbnailFileName);
	}
}