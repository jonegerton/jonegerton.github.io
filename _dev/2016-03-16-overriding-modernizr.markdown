---
layout: post
title:  "Overriding Modernizr"
date:   2016-03-16 08:53
categories: CSS Javascript Modernizr
permalink: /web/overriding-modernizr/
---

Modernizr is a great tool for browser feature detection, but there are times when it's useful to override Modernizr's detection and force the configuration of features that are available, both on the Javascript object and also the CSS marker classes. An example of this is when using Chrome Dev Tools to write fallback functionality for older mobile devices - Windows Mobile 7.5 and a Galaxy Ace with Android 2.3 have been problems for me lately.

To help with this I wrote a simple modernizr-override helper to take a predefined Modernizr configuration and inject it on top of the detected features in Chrome.

To get it, and see how to use it, head over to the [Github repo here](https://github.com/ja2/modernizr-override).