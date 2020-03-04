---
layout: post
title:  "Cloudflare DDNS Updates"
date:   2015-02-25 17:39:00 +0000
categories: Cloudflare DDNS
permalink: /raspberrypi/cloudflare-ddns-updates/
---

This blog is hosted on a Raspberry Pi under my TV at home. As is common with this scenario I have a dynamic WAN IP, updating intermittently at the whim of my ISP/router.

After a few attempts I've finally got a stable DDNS update that works with CloudFlare (having had trouble with various bits of ddclient+patches etc) in the form of some scripts that call `curl` against the Api directly. This seems nice and neat, and the scripts can be scheduled using cron.

I've posted the [scripts used here](https://github.com/jonegerton/cloudflare-ddns). I'll try to keep these updated as the CloudFlare Api changes (as I'll have to to keep the site running!).

I've included the script required to download details of the dns records from CloudFlare, as this is required to get the rec_id value for the dns entry, which is then sent back for the update. My version of the main update script also maintains a simple log file of updates.

The repo is [here](https://github.com/jonegerton/cloudflare-ddns), the update script is [here](https://github.com/jonegerton/cloudflare-ddns/blob/master/cf-ddns.sh)
and the read script is [here](https://github.com/jonegerton/cloudflare-ddns/blob/master/cf-ddns-read.sh)