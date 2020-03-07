---
layout: post
title:  "DropDownList Helper For"
date:   2012-12-18 15:08:00 +0000
categories: C# MVC
permalink: /dotnet/dropdownlist-helper-for-enums/
---

Its useful to be able to have a helper that converts a Enum typed property from an MVC Model directly into a drop down list without any messing about creating lists of possible values etc.

I found [this answer on StackOverflow](http://stackoverflow.com/a/4656800/592111) which has example code for just such a helper: `EnumDropDownListFor`. However, like a few who have tried it I found some issues around getting it to work to pre-select the value held in the Model's property.

There are a number of suggested tweaks in the comments to the above answer, but I believe the root of the problem is better described by [another answer on StackOverflow](http://stackoverflow.com/a/2410614/592111) that I came across while investigating.

As it says, the root of the issue is a misunderstanding of the behaviours of the different overloads on `DropDownList`. To quote from the linked answer:

> 1: Html.DropDownList(string name) looks for a view model property of name and type IEnumerable<selectlistitem>. It will use the selected item (SelectListItem.Selected == true) from the list, unless there is a form post value of the same name.</selectlistitem>
>
> 2: Html.DropDownList(string name, IEnumerable<selectlistitem> selectList) uses the items from selectList, but not their selected values. The selected is found by resolving name in the view model (or post data) and matching it against the SelectListItem.Value. Even if the value cannot be found (or is null), it still won't use the selected value from the list of SelectListItems.</selectlistitem>

So, to fix the `EnumDropDownListFor` helper we need to tweak it slightly to work with the second of these overloads. Happily we don't need a little of the code responsible for setting `Selected/SelectedValue` as the DropDownList overload does this for us.

My version follows. I've also added the extra overloads to allow for use of `htmlAttributes` etc:

{% highlight csharp %}
public static class EnumDropDownListForHelper
{

    public static MvcHtmlString EnumDropDownListFor&lt;TModel, TProperty&gt;(
            this HtmlHelper&lt;TModel&gt; htmlHelper, 
            Expression&lt;Func&lt;TModel, TProperty&gt;&gt; expression
        ) where TModel : class
    {
        return EnumDropDownListFor&lt;TModel, TProperty&gt;(htmlHelper, expression, null, null);
    }

    public static MvcHtmlString EnumDropDownListFor&lt;TModel, TProperty&gt;(
            this HtmlHelper&lt;TModel&gt; htmlHelper, 
            Expression&lt;Func&lt;TModel, TProperty&gt;&gt; expression, 
            object htmlAttributes
        ) where TModel : class
    {
        return EnumDropDownListFor&lt;TModel, TProperty&gt;(
                            htmlHelper, expression, null, htmlAttributes);
    }

    public static MvcHtmlString EnumDropDownListFor&lt;TModel, TProperty&gt;(
            this HtmlHelper&lt;TModel&gt; htmlHelper, 
            Expression&lt;Func&lt;TModel, TProperty&gt;&gt; expression, 
            IDictionary&lt;string, object&gt; htmlAttributes
        ) where TModel : class
    {
        return EnumDropDownListFor&lt;TModel, TProperty&gt;(
                            htmlHelper, expression, null, htmlAttributes);
    }

    public static MvcHtmlString EnumDropDownListFor&lt;TModel, TProperty&gt;(
            this HtmlHelper&lt;TModel&gt; htmlHelper, 
            Expression&lt;Func&lt;TModel, TProperty&gt;&gt; expression, 
            string optionLabel
        ) where TModel : class
    {
        return EnumDropDownListFor&lt;TModel, TProperty&gt;(
                            htmlHelper, expression, optionLabel, null);
    }

    public static MvcHtmlString EnumDropDownListFor&lt;TModel, TProperty&gt;(
            this HtmlHelper&lt;TModel&gt; htmlHelper, 
            Expression&lt;Func&lt;TModel, TProperty&gt;&gt; expression, 
            string optionLabel, 
            IDictionary&lt;string,object&gt; htmlAttributes
        ) where TModel : class
    {
        string inputName = GetInputName(expression);
        return htmlHelper.DropDownList(
                            inputName, ToSelectList(typeof(TProperty)), 
                            optionLabel, htmlAttributes);
    }

    public static MvcHtmlString EnumDropDownListFor&lt;TModel, TProperty&gt;(
            this HtmlHelper&lt;TModel&gt; htmlHelper, 
            Expression&lt;Func&lt;TModel, TProperty&gt;&gt; expression, 
            string optionLabel, 
            object htmlAttributes
        ) where TModel : class
    {
        string inputName = GetInputName(expression);
        return htmlHelper.DropDownList(
                            inputName, ToSelectList(typeof(TProperty)), 
                            optionLabel, htmlAttributes);
    }


    private static string GetInputName&lt;TModel, TProperty&gt;(
            Expression&lt;Func&lt;TModel, TProperty&gt;&gt; expression)
    {
        if (expression.Body.NodeType == ExpressionType.Call)
        {
            MethodCallExpression methodCallExpression 
                            = (MethodCallExpression)expression.Body;
            string name = GetInputName(methodCallExpression);
            return name.Substring(expression.Parameters[0].Name.Length + 1);

        }
        return expression.Body.ToString()
                            .Substring(expression.Parameters[0].Name.Length + 1);
    }

    private static string GetInputName(MethodCallExpression expression)
    {
        // p =&gt; p.Foo.Bar().Baz.ToString() =&gt; p.Foo OR throw...
        MethodCallExpression methodCallExpression 
                            = expression.Object as MethodCallExpression;
        if (methodCallExpression != null)
        {
            return GetInputName(methodCallExpression);
        }
        return expression.Object.ToString();
    }


    private static SelectList ToSelectList(Type enumType)
    {
        List&lt;SelectListItem&gt; items = new List&lt;SelectListItem&gt;();
        foreach (var item in Enum.GetValues(enumType))
        {
            FieldInfo fi = enumType.GetField(item.ToString());
            var attribute = fi.GetCustomAttributes(typeof(DescriptionAttribute), true)
                                            .FirstOrDefault();
            var title = attribute == null ? item.ToString() 
                                          : ((DescriptionAttribute)attribute).Description;
            var listItem = new SelectListItem
            {
                Value = item.ToString(),
                Text = title,
            };
            items.Add(listItem);
        }

        return new SelectList(items, "Value", "Text");
    }
}
{% endhighlight %}