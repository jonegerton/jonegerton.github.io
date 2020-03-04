---
layout: post
title:  "A TinyIoC Bootstrapper"
date:   2015-02-18 15:39:00 +0000
categories: .Net C#
permalink: /dotnet/a-tinyioc-bootstrapper/
---

I really like the [TinyIoC Inversion of Control Container](https://github.com/grumpydev/TinyIoC). It's nice and straight forward to use, it's easily portable, and the auto registration feature does 99% of your work for you. In recent projects it has been an ideal choice, either because of the size of the project, or to introduce the concepts of DI to teams that weren't already familiar with it.

With a little work though we can help it punch a little above its weight.

The sidekick to an IoC container is the Bootstrapper. A good bootstrapper can make DI a simple painless exercise [that just works](https://github.com/NancyFx/Nancy#the-super-duper-happy-path), so I thought I'd share mine. It started life with the [DefaultNancyBootstrapper from the Nancy project](https://github.com/NancyFx/Nancy/blob/master/src/Nancy/DefaultNancyBootstrapper.cs) and evolved from there.

It's available and documented with examples on [GitHub here](https://github.com/jonegerton/TinyIoC.Bootstrapper), so I won't go into it in depth, but I will cover the main aspects I wanted to solve.

#### Auto Scanning
The DefaultNancyBootstrapper auto registration takes all types from `AppDomain.CurrentDomain.GetAssemblies`. In some scenarios though this isn't great, as it only picks up those assemblies that are already loaded. As the bootstrapping is usually done very early in the life of the application it may easily be that the bootstrapping omits many of the types. Any missed then need to be hooked up manually. I wanted to enhance this scanning to require less help.

#### Flexibility
The bootstrapping needs to be flexible enough to allow the developer control over which assemblies/types are not scanned, and to pass in extra assemblies for scanning which aren't available for pickup automatically.

#### Extensibility
The bootstrapping should be configurable across various layers in a more complex system (so maybe a solution wide base bootstrapper, and then specific overrides for MVC/WebApi/Service projects).

After a few iterations I ended up with a nice lightweight solution, which had the configurability I was looking for.

You can see the [whole project here](https://github.com/jonegerton/TinyIoC.Bootstrapper), or jump straight to the [bootstrapper class here](https://github.com/jonegerton/TinyIoC.Bootstrapper/blob/master/TinyIoC.Bootstrapper/Bootstrapper.cs).