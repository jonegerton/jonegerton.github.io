---
layout: post
title:  "Cloudflare DDNS Updates (Aug 2018 version)"
date:   2018-08-08 09:44:00 +0000
categories: Cloudflare DDNS
---

In one of my [old blog posts](http://www.jonegerton.com/raspberrypi/cloudflare-ddns-updates/) I covered some scripts to update Cloudflare's DNS system. This is useful if you're hosting sites at home on a Raspberry PI (like this one still is!), where you might not have a static IP.

In the intervening 3 years, the API has changed, so I've revisited the scripts to update them to the new shiny "Cloudflare API V4". The updated scripts are tested on the current latest image of Raspbian Stretch at the time of writing. The new scripts are available on [GitHub here](https://github.com/jonegerton/cloudflare-ddns).

The structure of the scripts is still the same:

- cf-ddns.sh is the main update script, intended to be setup to run automatically via crontab or similar.
- cf-ddns-read.sh is used to read the host id value from the host record that needs updating (while Cloudflare mention some API details and stubs of requests in the API section of the DNS dash page, there still doesn't seem to be a nice way to get this id. Its just mentioned as ":identifier" in those stubs).

If they break again and I don't notice, or if there are any problems with the scripts, please raise an issue on the Github Repo.