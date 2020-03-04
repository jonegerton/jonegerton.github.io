---
layout: post
title:  "ASP.Net Webforms - Dynamic UpdatePanels and UserControls issue"
date:   2013-12-09 14:12:00 +0000
categories: ASP.Net WebForms
permalink: /dotnet/asp-net-webforms-dynamic-updatepanels-and-usercontrols-issue/
---

I have come across an interesting issues in ASP.Net WebForms when migrating a project from 3.5 up to 4.5.

The site in question is extremely dynamic, the page is built up based on configuration in a CMS fashion.

However in 4.5 we have a problem - when more content is added into the page via a button click, not all the markup for the content appears.


### Setup
In order to demonstrate, the following path will setup a simple site that has the flaw. The steps work pretty much the same in either .net 3.5 or 4.5, and will show the difference between the versions. In my case I'm using the project templates in VS2013 for this, and I'm using the VB versions.

1: Start a new ASP.Net WebForms project (using the default template)

2: In .Net 3.5 add the following markup:

{% highlight html %}
<asp:ScriptManager runat="server"></asp:ScriptManager>
{% endhighlight %}

3: In Default.aspx add the following markup:

{% highlight html %}
<asp:UpdatePanel ID="udpTrigger" runat="server" UpdateMode="Always">
    <ContentTemplate>
        <asp:button id="btnGo" runat="server" Text ="Go" />
    </ContentTemplate>
</asp:UpdatePanel>
<asp:Panel ID="pnlContainer" runat="server">
</asp:Panel>
{% endhighlight %}

4: In Default.aspx.vb add the following code:

{% highlight vb %}
Dim _udp As UpdatePanel

Private Sub Page_Init(sender As Object, e As EventArgs) Handles Me.Init    
    _udp = New UpdatePanel()
    _udp.ID = "udpTarget"
    _udp.UpdateMode = UpdatePanelUpdateMode.Conditional

    pnlContainer.Controls.Add(_udp)        
End Sub

Private Sub btnGo_Click(sender As Object, e As EventArgs) Handles btnGo.Click    
    Dim ctrl = LoadControl("Control.ascx")        

    Dim pnlWrapper = New Panel With {.ID = "pnlWrapper"}
    pnlWrapper.Controls.Add(ctrl)

    _udp.ContentTemplateContainer.Controls.Add(pnlWrapper)        
    _udp.Update()            
End Sub
{% endhighlight %}

#### Note:
There is a wrapping panel here between the user control and the update panel. This serves to demonstrate what which markup is missing on output.

5: Add a new user control "Control.ascx" into the site root folder and add the following in the markup:

{% highlight html %}
<asp:Panel ID="pnlControl" runat="server"></asp:Panel>
{% endhighlight %}

### Results
So the portion of markup that we're insterested is the content of `pnlContainer` once we've hit `btnGo`.

The markup for the two versions is shown below:

### 3.5

{% highlight html %}
<div id="pnlContainer">                    
    <div id="udpTarget">
        <div id="pnlWrapper">
            <div id="ctl05_pnlControl">
            </div>
        </div>
    </div>
</div>
{% endhighlight %}

#### 4.5
{% highlight html %}
<div id="MainContent_pnlContainer">          
    <div id="MainContent_udpTarget">
       <div id="MainContent_ctl02_pnlControl">
       </div>
    </div>
</div>
{% endhighlight %}

As you can see, in the 4.5 version, `pnlWrapper` is omitted completely - the UpdatePanel update is only returning the content of the user control, not anything else that was added with it.

Checking the response body in fiddler2 shows that the wrapper panel is omitted at server side (ie we're not losing it in the client side ajax processing)

On investigation the 4.5 behaviour is also there in 4.0 (which isn't particularly surprising)

### Attempting to solve

#### 1: Use LoadControl(type,params) instead of LoadControl(virtualPath).

This method does reproduce the wrapping panel, but none of the content of the user control. See [here](http://forums.asp.net/t/1375976.aspx) for a reference to this.


#### 2: Put the update panel in the markup instead of creating dynamically

This works in theory - everything displays, however I'm not going to be able to use this in the project where I have the problem.


---

### Microsoft Connect
I've now logged this a Microsoft Connect [here](https://connect.microsoft.com/VisualStudio/feedback/details/811162) If you're able to reproduce too, then head over there and add a vote to the issue. Hopefully they'll feedback with something soon.

---

### Workaround
I've implemented a workaround which wraps the user control in a server control, and overrides the `RenderContent` method on the server control. This allows the user control to be rendered to a separate `HtmlTextWriter` and then the content transferred to the main writer instance.

Its a mucky work around, but is working so far in our existing large project (as well as in the above sample).

Here the content of the workaround servercontrol:

#### UserControlLoader

{% highlight vb %}
''' <summary>
''' UserControl Loader - loads a user control
''' Works around a problem with ASP.Net Webforms in 4.0/4.5
''' </summary>
<ToolboxData("<{0}:UserControlLoader runat=server></{0}:UserControlLoader>")> _
Public Class UserControlLoader
    Inherits WebControl

    Public ReadOnly Property Control As Control
        Get
            Return _control
        End Get
    End Property
    Private _control As Control

    Public Sub LoadControl(page As Page, virtualPath As String)
        _control = page.LoadControl(virtualPath)
        Me.Controls.Add(_control)
    End Sub

    Public Overrides Sub RenderBeginTag(writer As HtmlTextWriter)
        'Don't render anything
    End Sub

    Public Overrides Sub RenderEndTag(writer As HtmlTextWriter)
        'Don't render anything
    End Sub

    ''' <summary>
    ''' Overrides RenderContent to write the content to a separate writer,
    ''' then adds the rendered markup into the main HtmlTextWriter instance.
    ''' </summary>
    Protected Overrides Sub RenderContents(ByVal writer As HtmlTextWriter)

        If _control Is Nothing Then Return

        Using sw = New StringWriter()
            Using hw = New HtmlTextWriter(sw)

                MyBase.RenderContents(hw)

                writer.Write(sw.ToString)

            End Using
        End Using

    End Sub

End Class
{% endhighlight %}

#### Usage:
To implement this into the above example the `btnGo` event handler becomes:

{% highlight vb %}
Private Sub btnGo_Click(sender As Object, e As EventArgs) Handles btnGo.Click

    Dim loader = new UserControlLoader()
    loader.LoadControl(Page,"Control.ascx")      

    Dim pnlWrapper = New Panel With {.ID = "pnlWrapper"}
    pnlWrapper.Controls.Add(loader)

    _udp.ContentTemplateContainer.Controls.Add(pnlWrapper)        
    _udp.Update()   

End Sub
{% endhighlight %}
