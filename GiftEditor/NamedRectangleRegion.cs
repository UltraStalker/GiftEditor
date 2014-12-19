using System;
using System.Data;
using System.Configuration;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using Aurigma.GraphicsMill.AjaxControls.VectorObjects;
using System.Drawing;

public class NamedRectangleRegion : RectangleRegion
{
	private string _name;

	public NamedRectangleRegion(string regionName, float left, float top, float width, float height)
		: base(left, top, width, height)
	{
		if (string.IsNullOrEmpty(regionName))
			throw new ArgumentNullException("regionName");

		_name = regionName;
	}

	public NamedRectangleRegion(string regionName, RectangleF rectangle)
		: base(rectangle)
	{
		if (string.IsNullOrEmpty(regionName))
			throw new ArgumentNullException("regionName");

		_name = regionName;
	}

	public string Name
	{
		get { return _name; }
		set { _name = value; }
	}
}