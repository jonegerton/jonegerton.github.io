---
layout: post
title:  "AutoMapper and EntityFramework Proxies - a workaround"
date:   2013-02-21 16:43:00 +0000
categories: C# MVC
permalinks: /dotnet/automapper-and-entityframework-proxies-a-workaround/
---

This is a quick workaround for an issue I came across when working with AutoMapper on EF. Its one of those blog posts that's as much a reminder for the writer as anything else.

I was trying to repopulate an entity instance from a corresponding model instance using a line similar to the following:

{% highlight csharp %}
Mapper.Map<MyModel,MyEntity>(model, ent);
{% endhighlight %}

At this line I got an `AutoMapper.AutoMapperMappingException` accompanied by the following message:

> Missing type map configuration or unsupported mapping. Mapping types: MyModel-> MyEntity_238F6DF9C0DAD0768B6BF2E9... MyProject.MyModel-> System.Data.Entity.DynamicProxies.MyEntity_238F6DF9C0DAD0768B6BF2E9...

Take as read that I certainly did have a `Mapper.Create<MyModel,MyEntity>()` type line in place.

Plainly the problem is that what we're passing back in is an instance of an EF proxy class based on the entity (these are generated to accomodate lazy loading and other EF niceties).

Despite the fact that I tell AutoMapper which type it is to be mapped to (in the second type parameter), this didn't seem to help.

Having a hunt around on StackOverflow I came across [this answer that explains the issue very nicely](http://stackoverflow.com/a/14271304/592111").

The problem lies in this section of the AutoMapper code (I've added line breaks to keep it fitting nicely):

{% highlight csharp %}
public TDestination Map<TSource, TDestination>(
    TSource source, TDestination destination)
{
    return Map(source, destination, opts => { });
}

public TDestination Map<TSource, TDestination>(
    TSource source, 
    TDestination destination,
    Action<IMappingOperationOptions> opts)
{
    Type modelType = typeof(TSource);
    ***Type destinationType = (Equals(destination, default(TDestination)) ? 
                                                typeof(TDestination) : 
                                                destination.GetType());

    return (TDestination)Map(source, destination, 
                             modelType, destinationType, opts);
}
{% endhighlight %}

The first method above is the the entry point for my call, and the issue occurs at the line highlighted with the `***`. As you can see, it resolves the type of the destination. Where the input value is not the type default (as in our example), it takes the type of the input, and not the type we told it to.

I'm sure there are good reasons for this generally, but it's not going to work for EF's proxies. The good news is that the work around is simple - we need to make the call as AutoMapper does in the last line above, but tell it exactly which types we want it to use.

When calling `Mapper.Map` we simply need to specify the types manually:

{% highlight csharp %}
Mapper.Map(model,ent,typeof(MyModel),typeof(MyEntity));
{% endhighlight %}

This isn't as nice a way to execute the mapping, we can write a helper method to wrap this and get the use of Generic Type parameters back instead of needing to use `typeof`:

{% highlight csharp %}
public static class MapperHelper
{
    public static TDestination Map<TSource, TDestination>(
              TSource source, TDestination destination
    ) where TDestination : POCOBase
    {
        return (TDestination)Mapper.Map(source, destination, 
                              typeof(TSource), typeof(TDestination));
    }
}
{% endhighlight %}

In my case my Entity POCOs inherit from a base class, so I can include that type constraint to help ensure that the helper is only called where it is appropriate not to use the more usual `Mapper.Map` method.