using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Web;
using Aurigma.GraphicsMill;
using Aurigma.GraphicsMill.AjaxControls;
using System.IO;
using Aurigma.GraphicsMill.Codecs;
using Aurigma.GraphicsMill.Transforms;
using ResizeMode = Aurigma.GraphicsMill.Transforms.ResizeMode;

public static class ThumbnailHelper
{
	public static void CreateThumbnail(string imageFilePath, string thumbnailFilePath, System.Drawing.Size size, bool removeTransparency)
	{
		if (string.IsNullOrEmpty(imageFilePath))
		{
			throw new ArgumentNullException("imageFilePath");
		}
		if (string.IsNullOrEmpty(thumbnailFilePath))
		{
			throw new ArgumentNullException("thumbnailFilePath");
		}
		if (size.IsEmpty)
		{
			throw new ArgumentException("Thumbnail size can not be empty", "size");
		}

		if (File.Exists(imageFilePath))
		{
			var pipeline = new Pipeline();

			var reader = ImageReader.Create(imageFilePath);

			pipeline.Add(reader);

			var resizer = new Resize(size.Width, size.Height) {InterpolationMode = ResizeInterpolationMode.High, ResizeMode = ResizeMode.Fit};

			pipeline.Add(resizer);

			if (removeTransparency && reader.PixelFormat.HasAlpha)
			{
				var cc = new ColorConverter(PixelFormat.DiscardAlpha(reader.PixelFormat));
				cc.BackgroundColor = cc.ConvertColor(new RgbColor(255, 255, 255));

				pipeline.Add(cc);
			}

			var writer = ImageWriter.Create(thumbnailFilePath);

			if (writer is GifWriter)
			{
				ColorPalette palette = null;

				using (var bitmap = reader.Frames[0].GetBitmap())
					palette = ColorPalette.Create(bitmap);

				pipeline.Add(new ColorConverter(PixelFormat.Format8bppIndexed) { Palette = palette });
			}

			pipeline.Add(writer);

			pipeline.Run();

			pipeline.DisposeAllElements();
		}
	}

}
