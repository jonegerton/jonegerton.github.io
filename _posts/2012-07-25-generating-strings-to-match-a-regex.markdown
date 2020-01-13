---
layout: post
title:  "Generating strings to match a regex"
date:   2012-07-25 11:06:54 +0000
categories: .net
---

In a recent project I used regular expressions to format a 2 factor login token. Using a Regex for this is great as it allows plenty of easy flexibility of the implementation when setting up for different client's preferences.

It does however lead to a problem - in this case we needed to generate a load of user logins, including passwords and 2nd factor authentication tokens. How can we go about this, given no knowledge of what Regex might be used at implementation time.

## The traditional approach

The most obvious way forward is to disect the regular expression and understand it, then create a string on that basis.

There are a few libaries available that attempt this, one being [Xeger: "A Java library for generating random text from regular expressions"](http://code.google.com/p/xeger/).

This approach will have limitations as deciphering a regex can be very complex. Xeger has a [wiki page](http://code.google.com/p/xeger/wiki/XegerLimitations) detailing its limitations and the scope of its regex implementation. I'm not saying that Xeger is limited - far from it, but it would be very difficult to get a complete solution to the problem by going down this road.

I had some particular problems with this:

- I couldn't find an implementation for .Net,
- Not being any sort of Regex expert, I couldn't be sure that the limitations would not apply to regular expressions that might be used in implementations of my system.
- I wasn't particularly keen to be trying to re-implement anything into .Net

## An alternative

I came up with an alternative approach. It hinges on the idea that, at the point of specifying a regex, you can also supply a specimen string that matches that regex.

The randomization process then makes incremental changes to the specimen, all the while ensuring that the result still matches the regular expression.