---
layout: post
title:  "Loading generic types with Assembly.LoadFrom"
date:   2012-08-20 11:00:18 +0000
categories: Assembly, C#, Late Binding, VB.Net
---

I thought I'd write up a question I posed today on StackOverflow here: [Loading a generic type using Assembly.LoadFrom](http://stackoverflow.com/q/12036247/592111)

I had a pre-existing method that I use to get a type based on a full assembly path and a class name. This resides in a `Utils` namespace.

```C#
    public Type GetTypeOf(string assemblyPath, string className)
    {
        //open assembly 
        var asmbly = System.Reflection.Assembly.LoadFrom(assemblyPath); 
        //throws error, not case sensitive
        return asmbly.GetType(className, true, true); 
    }
```

```VB.Net
    Public Function GetTypeOf(ByVal assemblyPath As String,
        ByVal className As String) As Type

        Dim asmbly = System.Reflection.Assembly.LoadFrom(assemblyPath)
        Return asmbly.GetType(className, True, True)
    End Function
```

I was hoping to use this as follows:

```C#
    string genName = "MyNamespace.Generic";
    string itemName = "System.String";

    //Get the types
    var genTyp = GetTypeOf(genPath,genName);
    var itemTyp = GetTypeOf(itemPath,itemName);

    //Put them together:
    var typ = getType.MakeGenericType(itemTyp);
```

```VB.Net
    Dim genName = "MyNamespace.Generic"
    Dim itemName = "System.String"

    Dim genTyp = GetTypeOf(genPath,genName)
    Dim itemTyp = GetTypeOf(itemPath,itemName)

    Dim typ = getType.MakeGenericType(itemTyp)
```

This falls over on the first line with a `System.TypeLoadException` stating:

> Could not load type <TypeName here> from assembly <AssemblyName here>

I tried a number of permutations of the Generic and Item types, for example `MyNamespace.Generic<System.String>`

## Solution

The answer, as suggested by [Carsten](http://stackoverflow.com/users/1423981/carsten-schutte) on the SO question, is that the item type needs to use the fully qualified name to be loaded.

The example Carsten gave was in this format:

    TestType`1[[System.Object, mscorlib, Version=4.0.0.0,
        Culture=neutral, PublicKeyToken=b77a5c561934e089]]

Using this template I setup a different version of `GetTypeOf`, which I named `GetGenericTypeOf` just to make its purpose clear:

```C#
    public Type GetGenericTypeOf(string assemblyPath, 
        string genericClass, string itemQualifiedClass)
    {
        string typString = String.Format("{0}`1[[{1}]]",
            genericClass,itemQualifiedClass);

        //open assembly
        var asmbly = System.Reflection.Assembly.LoadFrom(assemblyPath);
        //throws error, not case sensitive 
        return asmbly.GetType(typString, true, true); 
    }
```

```VB.Net
    Public Function GetGenericTypeOf(ByVal assemblyPath As String,
        ByVal className As String,
        ByVal itemQualifiedClass as string) As Type

        Dim typString = String.Format("{0}`1[[{1}]]",
            genericClass,
            itemQualifiedClass)

        Dim asmbly = System.Reflection.Assembly.LoadFrom(assemblyPath)
        Return asmbly.GetType(typString , True, True) 
    End Function
```

This new function is then applied in conjunction with the original to get all the information required to create an instance of the generic type:

```C#
    //Get the types of the item and the generic
    var itemTyp = GetTypeOf(itemPath,itemName);
    var genTyp = GetGenericTypeOf(genPath,genName,
        temTyp.AssemblyQualifiedName);

    //This genTyp is then good to go: 
    var genInst = Activator.CreateInstance(genTyp);
```

```VB.Net
    Dim itemTyp = GetTypeOf(itemPath,itemName);
    Dim genTyp = GetGenericTypeOf(genPath,genName,
        temTyp.AssemblyQualifiedName);

    var genInst = Activator.CreateInstance(genTyp);
````
