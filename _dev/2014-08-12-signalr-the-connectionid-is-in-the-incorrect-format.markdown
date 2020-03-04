---
layout: post
title:  "SignalR: The ConnectionId is in the incorrect format – an alternative cause"
date:   2014-08-12 11:39:00 +0000
categories: ASP.Net SignalR
permalink: /dotnet/signalr-the-connectionid-is-in-the-incorrect-format-an-alternative-cause/
---
Recently, on an application using SignalR, we found that we were getting many exceptions (sometimes 10 per second) from the SignalR hubs in the site:

> System.InvalidOperationException: The ConnectionId is in the incorrect format

While there is plenty of discussion on the causes of this error in SignalR documentation and on Q&A sites, they mostly discuss problems with changing levels of authentication (SignalR defines a new connection when the auth level, or authorized user, changes). In this case though this wasn't relevant. The volume implied that this was unlikely to be the cause, and in anycase, the site was already written to cope with these changes on login.

The cause turned out to be search engine crawler services. 

### The culprit - search engine crawlers

On inspecting the logs from the site, and logged exception/context information, it was clear that the site was being visited by the crawlers for the various search engines, and that these were not interacting well with SignalR.

Modern crawlers, in addition to indexing static html, now investigate javascript within the site for possible sources of content to be indexed. When they hit the SignalR stuff things start to go wrong for two primary reasons:

- The crawler sends the wrong content to the SignalR endpoint. This is the root cause of the ConnectionId error.
- The crawler doesn't correctly handle the polling mechanisms used by SignalR, in particular long-polling, and just sit continuously calling against the endpoint, generating large volumes of requests and their related errors.

In the case of the site that had the issue in this case, this was causing severe performance problems due to the small scale of the site/web server and the number of requests that were coming in.

### The fix: robots.txt

Happily the solution is simple enough, and uses robots.txt, the text file that can be placed in a site to specify the required behaviour of visiting web crawlers. You can read more about this file on [this site](http://www.robotstxt.org/robotstxt.html) if you're not familiar with it.

The fix then is to add a robots.txt file to the site:

1. Create a robots.txt file in the root of the web application.
2. Add content to the file based on the options below
3. Check that the robots.txt file is visible by visiting the site using the site root url + "robots.txt" (eg http://jonegerton.com/robots.txt)
4. If your site uses authentication it may be necessary to make sure that robots.txt can be reached by a non-authenticated session

The content used in robots.txt is straightforward:

#### Allow indexing except for SignalR
Adding the following to robots.txt will tell the crawler to ignore SignalR, but index the rest of the site

    User-agent: *
    Disallow: /signalr/

#### No indexing

If you don't want your site to be crawled at all by search engines (say if its a member-login type site) then you can do this by adding:

    User-agent: *
    Disallow: /
    
While crawlers don't have to respect the contents of robots.txt (it's more of an advisory), the main search engines will do so, and you should see the exceptions stop occurring (and site performance improve if the load from the crawlers was causing any impact).