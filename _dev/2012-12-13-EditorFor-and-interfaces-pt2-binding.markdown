---
layout: post
title:  "EditorFor and Interfaces Pt2 - Binding"
date:   2012-12-11 16:43:00 +0000
categories: C# MVC
permalink: /dotnet/editorfor-and-interfaces-pt2-binding/
---

This is a two part piece on working with Interfaces in MVC via the Html.EditorFor helper.

In the [first part – “Display”]({{ site.url }}/dotnet/editorfor-and-interfaces-pt1-display/) just covers one of those things I tried on the off chance, and was rather surprised that it worked right out of the box.

In this second part I’ll have a look at the next step of the process – binding these interfaces back to their models.

For reference, I’m working with MVC4, in VS 2012 For Web. I think this will also work in MVC3 at least.

### Background

When model data is posted back from the client, an instance of the model class is automatically created for it and passed to the handling action. The process of converting the data into a model instance is called binding, and, normally, this is handled for us automatically.

If, as in [Part 1]({{ site.url }}/dotnet/editorfor-and-interfaces-pt1-display/), we're using an interface as a model, and then allowing `EditorFor` to automatically render the correct controls this processes stops working, as the automatic binding isn't able to resolve our interface into a concrete class to instantiate and fill.

Instead we have to implement a custom binding. In the case of interfaces we can make this fairly simple with Generic `BaseInterfaceBinder` that will work for all interfaces we might want to work with.

### Implementation

This first listing shows my `BaseInterfaceBinder`. This I can use for all interfaces, with a small amount of work to do later for each different interface:

{% highlight csharp %}
public abstract class BaseInterfaceBinder<TIface> 
    : DefaultModelBinder
{
    protected override object CreateModel(
            ControllerContext controllerContext,
            ModelBindingContext bindingContext, Type modelType)
    {

        //Need to create an instance of the model 
        //to use in the next few steps
        TIface model;
        model = MakeModelInstance(controllerContext, bindingContext);

        //Extract the metadata for the model
        bindingContext.ModelMetadata = ModelMetadataProviders
            .Current
            .GetMetadataForType(() => model, model.GetType());

        //Do the binding using our resolved concrete type
        return base.CreateModel(controllerContext, 
                                bindingContext, 
                                model.GetType());

    }

    protected abstract TIface MakeModelInstance(
            ControllerContext controllerContext, 
            ModelBindingContext bindingContext);
}
{% endhighlight %}

In the listing above, were are getting an instance of the Model, just to use it to get the MetaData. You can use `typeof(<<SomeType>>)` or `Type.GetType('SomeTypeName')` instead, but this case I prefer the instance as I can constraint the returned type to being one that matches TIface.

`MakeModelInstance` is where the messy business happens - it will need to test the returned data to sort out which implentation of the interface is required. There are a couple of ways to approach this, either include a field in the postback data identifying the type in some way, or look for a combination of fields that uniquely identifies a class.

As such an implementation of `BaseInterfaceBinder` for a specific interface might look like this:

{% highlight csharp %}
[ModelBinder(typeof(IModel))]
public class IModelBinder : BaseInterfaceBinder<IModel>
{
    protected override IModel MakeModelInstance(
            ControllerContext controllerContext, 
            ModelBindingContext bindingContext)
    {
        var modelType = ((string[])bindingContext.ValueProvider
                                   .GetValue("ModelType").RawValue)[0];

        switch (modelType)
        {
            case "FooModel":
                return new FooModel();
            case "BarModel":
                return new BarModel();
            default:
                throw new InvalidOperationException();
        }
    }
}
{% endhighlight %}

In this case there is a `ModelType` field being returned in the postback data.

Finally the only thing that remains is to register the custom binder in `Global.asax.cs`:

{% highlight csharp %}
protected void Application_Start()
{
    ...
    ModelBinders.Binders.Add(typeof(IModel), new IModelBinder());
}
{% endhighlight %}

### Conclusion

We've show here how to bind back to a model when only the interface is actually use in the view. Using this ability, and the EditorFor trick in Pt1 we can easily build flexible interfaces where the content can be switched around, and now need laborious code/model structures to support it.