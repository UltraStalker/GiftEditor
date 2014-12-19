<%@ Control Language="C#" AutoEventWireup="true"
	Inherits="ImageListControl" ClassName="ImageListControl" Codebehind="ImageListControl.ascx.cs" %>
<asp:Panel runat="server" ID="imageListControlContainer">
	<div class="image-list">
		<% foreach (string imageFilePath in this.Images)
	 {
		 ImageItem ii = new ImageItem(imageFilePath); %>
		<a class="draggable image-item" href="#" onclick="return false;"><span class="imageId" style="display: none;" title="<%= ii.ImageId %>">
		</span>
			<img src="<%= ii.ThumbnailUrl %>" /></a>
		<%} %>
		&nbsp;
	</div>
	<div class="buttons">
		<a class="button" runat="server" id="okButton"><span>Add</span></a> <a class="CancelButton"
			runat="server" id="cancelButton" visible="false"><span>Cancel</span></a>
	</div>
</asp:Panel>
