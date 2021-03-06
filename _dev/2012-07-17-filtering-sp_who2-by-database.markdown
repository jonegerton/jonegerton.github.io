---
layout: post
title:  "Filtering sp_who2 by database"
date:   2012-07-17 10:45:42 +0000
categories: MS SQL Server, T-SQL
permalink: /sql/filtering-sp_who2-by-database/
---

An easy way to improve the usability of `sp_who2` is to make a database specific version.

The idea is to leverage the information provided by `sp_who2`, but provide a filter for a given database name. This is really handy on either production or development SQL servers with large numbers of databases.

Lets call our version `sp_who2db`. The following should be run into your `master` database.


{% highlight sql %}
    CREATE PROC [dbo].[sp_who2db] (@DBName VARCHAR(200))
    AS
    BEGIN

        DECLARE @who2 TABLE(
                [SPID] INT,
                [Status] VARCHAR(200),
                [Login] VARCHAR(200),
                [HostName] VARCHAR(200),
                [BlkBy] VARCHAR(20),
                [DBName] VARCHAR(200),
                [Command] VARCHAR(200),
                [CPUTime] BIGINT,
                [DiskIO] BIGINT,
                [LastBatch] VARCHAR(20),
                [ProgramName] VARCHAR(200),
                [SPID2] INT,
                [RequestID] INT
        )

        INSERT @who2
        EXEC sp_who2

        SELECT * FROM @who2 WHERE DBName = @DBName

    END
{% endhighlight %}

You can mark it is a system object using the undocumented `sp_MS_MarkSystemObject` proc:

{% highlight sql %}
    EXEC sp_MS_MarkSystemObject '[dbo].[sp_who2db]'
{% endhighlight %}

Finally, to use it, just call it as normal:

{% highlight sql %}
    EXEC sp_who2db 'MyDatabase'
{% endhighlight %} 

A similar strategy could be used to filter by blocks, hosts, logins, high CPU or Disk IO etc.

NOTE: The above is tested on MS SQL Server 2008 R2. The columns defined on the `@who2` table may need modification for versions other than this, depending on what information `sp_who2` provides on those versions.