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

public partial class ImageListControl : System.Web.UI.UserControl, IScriptControl
{
	protected class ImageItem
	{
		private string _imageName;
		private int _imageId;
		private string _thumbnailUrl;

		public ImageItem(string imageFilePath)
		{
			_imageId = imageFilePath.GetHashCode();
			_imageName = Path.GetFileNameWithoutExtension(imageFilePath);
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

		private string CreateThumbnail(string filePath)
		{
			if (File.Exists(filePath))
			{
				var fc = Aurigma.GraphicsMill.AjaxControls.FileCache.GetInstance();
				string thumbnailFileName = fc.GetPublicTempFileName(".jpg");
				ThumbnailHelper.CreateThumbnail(filePath,
					fc.GetAbsolutePublicCachePath(thumbnailFileName),
					new System.Drawing.Size(40, 40), true);
				return fc.GetRelativePublicCachePath(thumbnailFileName);
			}
			else
			{
				return null;
			}
		}
	}

	public List<string> Images
	{
		get
		{
			if (this.ViewState["Images"] == null)
				this.ViewState["Images"] = new List<string>();
			return (List<string>)this.ViewState["Images"];
		}
		set
		{
			this.ViewState["Images"] = value;
		}
	}

	public string ParentControlClientID
	{
		get { return (string)this.ViewState["ParentControlClientID"]; }
		set { this.ViewState["ParentControlClientID"] = value; }
	}

	protected void Page_Load(object sender, EventArgs e)
	{

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
			return imageListControlContainer.ClientID;
		}
	}

	#region IScriptControl Members

	public IEnumerable<ScriptDescriptor> GetScriptDescriptors()
	{
		ScriptControlDescriptor scd = new ScriptControlDescriptor("Aurigma.ImageListControl", imageListControlContainer.ClientID);
		scd.AddProperty("_parentControlId", this.ParentControlClientID);
		scd.AddProperty("_okButtonId", okButton.ClientID);
		scd.AddProperty("_cancelButtonId", cancelButton.ClientID);
		return new ScriptDescriptor[] { scd };
	}

	public IEnumerable<ScriptReference> GetScriptReferences()
	{
		ScriptReference sr = new ScriptReference("Scripts/ImageListControl.js");
		return new ScriptReference[] { sr };
	}

	#endregion
}