---
layout: post
title:  "EditorFor and Interfaces Pt1 - Display"
date:   2012-12-11 16:03:00 +0000
categories: C# MVC MVC4 HTML
permalink: /dotnet/editorfor-and-interfaces-pt1-display/
---


This is a two part piece on working with Interfaces in MVC via the Html.EditorFor helper.

The first part - "Display" - just covers one of those things I tried on the off chance, and was rather surprised that it worked right out of the box.

In the [second part](http://www.jonegerton.com/dotnet/editorfor-and-interfaces-pt2-binding/) I'll have a look at the next step of the process - binding these interfaces back to their models.

For reference, I'm working with MVC4, in VS 2012 For Web. I think this will also work in MVC3 at least.

### Background

For a slightly messy user interface I'm working on, I wanted to be able to have a Model that holds a list of classes that implement an interface.

There is a possibility that all the classes might not be the same, and I was concerned that I was going to end up with a messy `switch` statement in my View that called the right Partial depending on which class I found in the list, and that this switch might need to be maintained on an on-going basis.

On the off chance I tried outputting the list using `EditorFor` and an EditorTemplate for each of the types that might occur in the list.

I was expecting either that, most likely, `EditorFor` wouldn't like to be passed a `List<>` declared against an interface, or that it might complain that the concrete model type didn't resolve to a single type in the list.

Instead, just outputting the List using a single `EditorFor` turned out to automatically select the right EditorTemplate for each item in the list with no further intervention.

### Example

This simple example shows a what happens:

Lets define some simple models:

{% highlight csharp %}
public interface IModel {}

    public class FooModel : IModel {
        public string MyName { get; set; }
    }

    public class BarModel : IModel {
        public bool MyCheck { get; set; }
    }
}
{% endhighlight %}

In the controller we make a simple list of these models:

{% highlight csharp %}
public ActionResult Index()
{
    var m = new List<IModel>() {
        new FooModel() {MyName="Jon"},
        new FooModel() {MyName="Bob"},
        new BarModel() {MyCheck=true},
        new FooModel() {MyName="Pippa"},
    };
    return View(m);
}
{% endhighlight %}

We need EditorTemplates for the models:

{% highlight csharp %}
@model FooModel   
<div>
    @Html.LabelFor(m => m.MyName)
    @Html.EditorFor(m => m.MyName)
</div>
//---
@model BarModel
<div>
    @Html.LabelFor(m => m.MyCheck)
    @Html.CheckBoxFor(m => m.MyCheck)
</div>
{% endhighlight %}

The main View is as minimal as can be:

{% highlight csharp %}
@model IEnumerable<IModel>
@Html.EditorForModel()
{% endhighlight %}

Finally, when we put all this together we get the following in the browser:

<img src="/images/EditorForAndInterfacesPt1.png" alt="EditorFor And Interfaces Pt1 Result">

### Conclusion

Here I've shown that it's easy to use a combination of EditorFor and Interfaces to vary the output of a list to the page. Nothing earth-shattering in setting it up, but it is one of those things that's nice to have working right out of the box.

In [Part 2](http://www.jonegerton.com/dotnet/editorfor-and-interfaces-pt2-binding) I'll have a look at the next step of the process - binding these interfaces back to their models.