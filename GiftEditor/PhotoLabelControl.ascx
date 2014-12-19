<%@ Control Language="C#" AutoEventWireup="true"
	Inherits="PhotoLabelControl" Codebehind="PhotoLabelControl.ascx.cs" %>
<%@ Register Assembly="Aurigma.GraphicsMill.AjaxControls.VectorObjects" Namespace="Aurigma.GraphicsMill.AjaxControls"
	TagPrefix="aur" %>
<%@ Register Assembly="Aurigma.GraphicsMill.AjaxControls.VectorObjects" Namespace="Aurigma.GraphicsMill.AjaxControls.VectorObjects"
	TagPrefix="aur" %>
<%@ Register Assembly="Aurigma.GraphicsMill.AjaxControls" Namespace="Aurigma.GraphicsMill.AjaxControls"
	TagPrefix="aur" %>
<div runat="server" id="container">
	<aur:CanvasViewer runat="server" ID="_canvasViewer" ZoomMode="BestFit" Width="565px"
		Height="565px" ViewportAlignment="CenterCenter" BackColor="Gray" BorderWidth="2px"
		RulerScale="1" ZoomQuality="High">
		<Canvas ID="canvas" runat="server" IsSquaredBackground="true" MarginWidth="0" WorkspaceWidth="400" WorkspaceHeight="400" />
	</aur:CanvasViewer>
	<aur:ZoomInNavigator runat="server" ID="zoomInNavigator" />
	<aur:ZoomOutNavigator runat="server" ID="zoomOutNavigator" />
	<aur:PanNavigator runat="server" ID="panNavigator" />
</div>
