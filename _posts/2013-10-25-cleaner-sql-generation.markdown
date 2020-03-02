---
layout: post
title:  "Techniques for cleaner dynamic SQL generation"
date:   2013-10-25 09:55:00 +0000
categories: MS SQL Server, T-SQL
---

Very often when working in databases we have to resort to dynamic SQL generation to solve a problem. For example, common instances of this would be when performing an action across a number of different tables, or performing a `PIVOT` on a data set where the set of pivot results is not pre-determined. This latter example is one which I'll take through this walk through.

The scenario is that we have a table of Person data and a table of Payslip data, and the requirement is to return each Person with the salaries listed out year on year. Its a simple example, but not unlike a real-world problem.

First up we need some data to work with. See the appendix for some setup scripts, but below is the basic data.

#### Person Table

<img src="/images/dynsql_person_table.png" alt="Person Table Data">

#### Payslip Table

<img src="/images/dynsql_payslip_table.png" alt="Payslip Table Data">

The results we're after should have one line per Person, with the years listed in the as columns, with the values being the salary for that person/year:

<img src="/images/dynsql_results.png" alt="Pivot Results">

### Static (ie non-dynamic) query

So we'll look at the query needed to get this results set, in its static form, and make clear the limitation with the static version.

Here's the static pivot:

{% highlight sql %}
SELECT PersonId,Surname,
       [2010] as [2010/2011],[2011] as [2011/2012],
       [2012] as [2012/2014],[2013] as [2013/2014]
FROM   (
    SELECT p.PersonId,Surname,Year,Salary
    FROM   person p
           JOIN payslip s ON p.personid = s.personid
   ) sub
   PIVOT (SUM(salary)
         FOR year IN ([2010],[2011],[2012],[2013])) pvt
{% endhighlight %}


This is fairly standard as a pivot goes, however it has the major limitation that in two separate places we need to enumerate the years - once for the pivot itself, and once for the output of results. Any change to the list of years requires the sql to be updated to include the new years.

A dirty workaround for this limitation would be to include lots of possible years in the SQL, however this would always be a limited range, and would cause there to be unecessary columns output into the results for those years that didn't have any data yet.

What we need is to output exactly the years that have data in the results, which is where the dynamic SQL is useful. We can generate the list of years in the pivot from the years that have entries in the Payslip table.

### Cursor based dynamic SQL

Very often, a piece of dynamic SQL like this would be generated using a loop through the list of years. This would either be done using a cursor, or using a temp table and a while loop through the rows.

Here is what a cursor version looks like:

{% highlight sql %}
--Define cursor and variables
DECLARE years CURSOR read_only fast_forward FOR
SELECT DISTINCT 
    year = CONVERT(VARCHAR(10), year),
    yearnext = CONVERT(VARCHAR(10), year + 1) 
FROM payslip

DECLARE @year NVARCHAR(10),@yearnext NVARCHAR(10),
        @years NVARCHAR(1000) = '',@yearcols NVARCHAR(1000) = '', 
        @sql NVARCHAR(max)

--Build the lists of years/aliases
OPEN years
FETCH next FROM years INTO @year, @yearnext

WHILE @@fetch_status = 0
    BEGIN
        SELECT 
            @years += CASE WHEN Len(@yearcols)&gt;0 THEN ',' ELSE '' END 
                      + '[' + @year + ']',
            @yearcols += ',[' + @year + '] as [' + @year + '/' + @yearnext + ']'

      FETCH next FROM years INTO @year, @yearnext
  END

CLOSE years
DEALLOCATE years

--Build the main sql
SET @sql = '
SELECT
    PersonId,Surname' + @yearcols + '
FROM
    (
        SELECT p.PersonId,Surname,Year,Salary
        FROM person p
        JOIN payslip s ON p.personid = s.personid
    ) sub
    PIVOT (SUM(Salary) FOR Year IN (' + @years + ')) pvt
'

--Print/Execute
PRINT @sql
EXEC sp_executesql @sql
{% endhighlight %}

### So what's wrong with this then?

- It's non-linear - it requires the dyn sql to be built in a sequence different to that in which you'd write normal sql. With large dyn sql jobs this becomes a problem for understanding/debugging.
- It's rather long - we've gone from around a dozen lines (depending on formatting) to nearer 40-50 lines, quite a lot of which is more to do with maintenance of the cursor instead of actually generating our results.

So what can we do to improve this? Here are a couple of alternative approaches to dynamic SQL generation that may help.

### 1: Using a select concatenation

This uses the ability to add/concatenate to a sql variable for each row of a select statement.

{% highlight sql %}
--Define variables
DECLARE @years NVARCHAR(1000) = '',@yearcols NVARCHAR(1000) = '', 
        @sql NVARCHAR(max)

--Build the lists of years/aliases
SELECT @years += CASE WHEN Len(@years)&gt;0 THEN ',' ELSE '' END 
                 + '[' + year + ']',
       @yearcols += ',[' + year + '] as [' + year + '/' + yearnext + ']'
FROM   (
    SELECT DISTINCT 
        year = CONVERT(VARCHAR(10), year), 
        yearnext = CONVERT(VARCHAR(10), year + 1) 
    FROM payslip) sub

--Build the main sql
SET @sql = '
    SELECT
        PersonId,Surname' + @yearcols + '
    FROM
        (
            SELECT p.PersonId,Surname,Year,Salary
            FROM person p
            JOIN payslip s ON p.personid = s.personid
        ) sub
        PIVOT (SUM(Salary) FOR Year IN (' + @years + ')) pvt
    '

PRINT @sql
EXEC sp_executesql @sql
{% endhighlight %}

That's better! - much fewer lines, and very little sql that isn't actually generating the sql/results. It's still non-linear though - we're still compiling some sql out of place and inserting it lower down.

### 2: Using XML Path Trick

This version uses the ability to contatenate strings together by using the `SELECT ... FROM ... FOR XML PATH ('')` pattern. Often this is paired with `STUFF` to remove any extra code added in the loop that isn't wanted in the final string.

{% highlight sql %}
DECLARE @sql NVARCHAR(MAX)

--Get the list of years
WITH CTE_Years AS (
    SELECT DISTINCT 
        year = CONVERT(VARCHAR(10), year), 
        yearnext = CONVERT(VARCHAR(10), year + 1) 
    FROM payslip
)
SELECT @sql = '
    SELECT
        PersonId,Surname' 
            + (SELECT ',[' + year + '] AS [' + year + '/' + yearnext + ']' 
              FROM CTE_Years FOR XML PATH ('')) + '
    FROM
        (
            SELECT p.PersonId,Surname,Year,Salary
            FROM person p
            JOIN payslip s on p.personid = s.personid
        ) sub
        PIVOT (sum(Salary) FOR Year IN (' 
            + (STUFF((SELECT ',[' + year + ']' 
               FROM CTE_Years FOR XML PATH ('')),1,1,'')) + ')
        ) pvt
    '
PRINT @sql
EXEC sp_executesql @sql
{% endhighlight %}

Wow! - now we've only got a handful more rows than the original static sql, but most importantly, the dynamic sql build reads like the original static sql too.

This method is very flexible, as each such sub select can come from a completely different source, and yet still remain in line within the overall flow.

### Wrapping up:

Personally I prefer the latter of these two options, although there have been the odd occasions where the former has worked a little better.

Either though is far cleaner than the original cursor or temp table based pattern.

In setting up these queries I've tried to be consistent with the formtating of the SQL to that you can a true impression of the difference between them.

### Appendix: Setup Scripts

If you want to try the above yourself, the following will create the test data I used for the scripts:

{% highlight sql %}
--Create schema
CREATE TABLE person (
    PersonId INT IDENTITY(1, 1) PRIMARY KEY,
    Surname  VARCHAR(200))

CREATE TABLE payslip (
    Id INT IDENTITY(1, 1) PRIMARY KEY,
    PersonId INT,
    Year INT,
    Salary MONEY)

--Insert demo data
INSERT person (surname) VALUES ('Smith'),('Jones'),('Watson')

INSERT payslip (personid,year,salary)
VALUES  
(1,2010,10000),(1,2011,12500),(1,2012,15000),
(2,2011,12500),(2,2012,15000),(2,2013,25000),
(3,2010,20000),(3,2011,25000),(3,2012,25000),(3,2013,30000)
{% endhighlight %}