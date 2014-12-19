<%@ Page Language="C#" AutoEventWireup="true"
	Inherits="PhotoLabelSample"  Codebehind="PhotoLabelSample.aspx.cs" %>

<%@ Register Assembly="System.Web.Extensions, Version=1.0.61025.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35"
	Namespace="System.Web.UI" TagPrefix="asp" %>
<%@ Import Namespace="System.Collections.Generic" %>
<%@ Register Src="~/PhotoLabelControl.ascx" TagPrefix="aur" TagName="PhotoLabel" %>
<%@ Register Src="~/ImageListControl.ascx" TagPrefix="aur" TagName="ImageList" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
	<title>Sample</title>
    
    <link rel="stylesheet" type="text/css" href="Styles/Default/_reset.css"/>
    <link rel="stylesheet" type="text/css" href="Styles/Default/main.css"/>
    <link rel="stylesheet" type="text/css" href="Styles/Default/style.css"/>

	<!-- Color picker -->
	<link rel="stylesheet" media="screen" type="text/css" href="Scripts/colorpicker/css/colorpicker.css" />
	<style type="text/css">
		.fontNameCell {
			width: 150px;
		}
		.fontSizeCell {
			width: 100px;
		}
	</style>
</head>
<body>
	<div id="wrapper">
		<h1>
			Personalize Your Gift</h1>
		<form id="sampleForm" runat="server">
		<asp:ScriptManager ID="ScriptManager1" runat="server" EnablePartialRendering="true"
			EnablePageMethods="true" ScriptMode="Release">
			<Scripts>
				<%--main sample script--%>
				<asp:ScriptReference Path="Scripts/Sample.js" />
				<%--JQuery--%>
				<asp:ScriptReference Path="Scripts/jquery-1.3.2.min.js" />
				<%--JQuery UI: Draggable, Droppable, Selectable, Tabs--%>
				<asp:ScriptReference Path="Scripts/jquery-ui-1.7.2.custom.min.js" />
				<%--Image carousel script--%>
				<asp:ScriptReference Path="Scripts/carousel/jcarousellite_1.0.1.pack.js" />
				<%--Color picker--%>
				<asp:ScriptReference Path="Scripts/colorpicker/colorpicker.js" />
			</Scripts>
		</asp:ScriptManager>
		<div class="Ab">
			<div class="Ab-A">
				<ul class="toolbar">
					<li class="group1 selected"><a href="#" class="move" rel="move" onclick="return false;">
					</a></li>
					<li class="group1"><a href="#" class="hand" rel="pan" onclick="return false;"></a>
					</li>
					<li class="delimeter"></li>
					<li class="group4 disabled"><a href="#" class="undo" onclick="return false;"></a>
					</li>
					<li class="group4 disabled"><a href="#" class="redo" onclick="return false;"></a>
					</li>
					<li class="delimeter"></li>
					<li class="group3"><a href="#" class="vt" rel="top" onclick="return false;"></a>
					</li>
					<li class="group3"><a href="#" class="vc" rel="verticalCenter" onclick="return false;">
					</a></li>
					<li class="group3"><a href="#" class="vb" rel="bottom" onclick="return false;"></a>
					</li>
					<li class="delimeter"></li>
					<li class="group3"><a href="#" class="hl" rel="left" onclick="return false;"></a>
					</li>
					<li class="group3"><a href="#" class="hc" rel="horizontalCenter" onclick="return false;">
					</a></li>
					<li class="group3"><a href="#" class="hr" rel="right" onclick="return false;"></a>
					</li>
					<li class="delimeter"></li>
					<li class="group2 selected"><a href="#" class="resize" rel="resize" onclick="return false;">
					</a></li>
					<li class="group2"><a href="#" class="rotate" rel="rotate" onclick="return false;"></a>
					</li>
					<li class="right"><a href="#" class="zoomout" rel="zoomOut" onclick="return false;">
					</a></li>
					<li class="right"><a href="#" class="zoom1" onclick="return false;"></a></li>
					<li class="right"><a href="#" class="zoomin" rel="zoomIn" onclick="return false;"></a>
					</li>
				</ul>
				<div class="editor-wrapper">
					<div class="loading-info">
						loading...</div>
					<div id="zoomInfo" class="zoom-info">
						140%</div>
					<div class="editor">
						<aur:PhotoLabel runat="server" ID="photoLabel" IsHighlightRegion="true">
							<CurrentRegionDisplayStyle BorderWidth="1" BorderColor="Red" FillColor="#00000000" />
							<RegionDisplayStyle BorderColor="Black" BorderWidth="1" FillColor="#00000000" />
						</aur:PhotoLabel>
						<div id="ajaxLoader">
						</div>
					</div>
				</div>
			</div>
			<div class="Ab-b regions">
				<ul class="tabs">
					<% 
						List<NamedRectangleRegion> regions = new List<NamedRectangleRegion>(photoLabel.GetRegions());
						regions.Reverse();
						foreach (NamedRectangleRegion region in regions)
						{ 
					%>
					<li><a href="#region<%=region.Name.GetHashCode().ToString() %>">
						<%=region.Name %></a></li>
					<%
						} %>
				</ul>
				<div class="sidebar">
					<div class="buttons">
						<a rel="imageMenu" href="#" onclick="return false;" class="button menuToggleButton">
							<span class="icon addimage">image ▼</span></a>
						<div id="imageMenu" class="menu">
							<aur:ImageList runat="server" ID="imageList" />
						</div>
						<a rel="textMenu" href="#" onclick="return false;" class="button menuToggleButton"><span
							class="icon addtext">text ▼</span></a>
						<div id="textMenu" class="menu text-options">
							<table>
								<tr>
									<th colspan="2">
										Text
									</th>
								</tr>
								<tr>
									<td colspan="2">
										<input id="textInput" type="text" style="width: 225px;" maxlength="200" />
									</td>
								</tr>
								<tr>
									<th class="fontNameCell">
										Font name
									</th>
									<th class="fontSizeCell">
										Font size
									</th>
								</tr>
								<tr>
									<td class="fontNameCell">
										<select id="fontSelect" style="width: 130px">
											<option style="font-family: Arial" value="Arial">Arial</option>
											<option style="font-family: Times New Roman" value="Times New Roman">Times New Roman</option>
											<option style="font-family: Verdana" value="Verdana">Verdana</option>
											<option style="font-family: Lucida Console" value="Lucida Console">Lucida Console</option>
										</select>
									</td>
									<td class="fontSizeCell">
										<input type="text" id="fontSizeInput" style="width: 75px" value="12" maxlength="5" />
									</td>
								</tr>
							</table>
							<table>
								<tr>
									<th style="width: 150px">
										Text color
									</th>
									<th class="checkbox">
										<label for="textBold" style="font-weight: bold;">
											B</label>
									</th>
									<th class="checkbox">
										<label for="textItalic" style="font-style: italic;">
											I</label>
									</th>
									<th class="checkbox">
										<label for="textUnderline" style="text-decoration: underline;">
											U</label>
									</th>
								</tr>
								<tr>
									<td>
										<div id="textColor" class="TextColor" style="background-color: #000000">
											&nbsp;</div>
										<input type="hidden" id="textColorValue" value="rgba(0, 0, 0, 1);" />
									</td>
									<td class="checkbox">
										<input id="textBold" type="checkbox" />
									</td>
									<td class="checkbox">
										<input id="textItalic" type="checkbox" />
									</td>
									<td class="checkbox">
										<input id="textUnderline" type="checkbox" />
									</td>
								</tr>
							</table>
							<div class="buttons">
								<a id="editTextButton" title="Apply changes" class="button" href="#"><span>Apply</span></a><a
									class="button" id="addTextButton" title="Add new text object" href="#" onclick="return false;"><span>Add</span></a></div>
						</div>
					</div>
					<% 
						foreach (NamedRectangleRegion region in regions)
						{%>
					<div class="tabPanel" id="region<%=region.Name.GetHashCode().ToString() %>">
						<ul class="layers">
						</ul>
					</div>
					<script type="text/javascript">
						$('#region<%= region.Name.GetHashCode().ToString() %>').data('regionName', '<%= region.Name %>');
					</script>
					<%
						} %>
				</div>
			</div>
		</div>
		<div id="templateList" runat="server">
			<div class="pageLeft">
			</div>
			<div class="horizontalContainer">
				<ul class="horizontalList">
					<asp:Repeater ID="templateRepeater" runat="server" OnItemCommand="templateRepeater_ItemCommand"
						OnItemDataBound="templateRepeater_ItemDataBound">
						<ItemTemplate>
							<li runat="server" id="listItem">
								<asp:LinkButton ID="templateButton" runat="server"></asp:LinkButton>
							</li>
						</ItemTemplate>
					</asp:Repeater>
				</ul>
			</div>
			<div class="pageRight">
			</div>
		</div>
		</form>
	</div>

	<script type="text/javascript">

		var Sample = Sample ? Sample : {};

		Sample.photoLabelId = '<%= photoLabel.ClientID %>';
		Sample.imageListId = '<%= imageList.ClientID %>';

		Sys.Application.add_load(function() {
			Sample.init();

			$("#templateList .horizontalContainer ").jCarouselLite({
				btnNext: "#templateList .pageRight",
				btnPrev: "#templateList .pageLeft",
				circular: false,
				visible: 5
			});

			$(".draggable").draggable({ appendTo: "body", helper: Sample.getDragHelper, iframeFix: true,
				addClasses: false, revert: true, cursorAt: { left: 5, top: 5 }, revertDuration: 0,
				drag: Sample.onImageDragging, start: Sample.onImageStartDrag, stop: Sample.onImageStopDrag
			});

			var el = Sample.get_photoLabel().get_canvasViewer().get_element();

			$(el).droppable({ addClasses: false, drop: Sample.onImageDrop });

			$("#textColor").ColorPicker({ livePreview: false, onSubmit: Sample.onColorSelected,
				onBeforeShow: Sample.setColorPickerColor
			});

			$("#testButton").bind("click", function(event) {
				var cv = Sample.get_photoLabel().get_canvasViewer().get_canvas();
				var lc = cv.get_layers();
				var l = lc.move(1, 0);

			});
		});

	</script>

</body>
</html>
