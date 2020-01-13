---
layout: post
title:  "Crystal reports - setting login credentials through code"
date:   2012-08-06 10:30:45 +0000
categories: C#, Crystal Reports, VB.Net
---

I just answered a [http://stackoverflow.com/a/11825083/592111](stackoverflow question) regarding a common issue when using Crystal Reports as part of a wider application - setting login credentials through code. Its not as straight forward as it really ought to be.

Rather than simply setting the login/server/database details through a single call there are a number of things that are required:

First you setup a `ConnectionInfo` instance. In the example below I'm assuming that you already have a connection string instance in `cnString`:

```C#
var cn = new SqlConnectionStringBuilder(cnString)
var ci = ConnectionInfo() {
    Type = ConnectionInfoType.SQL,
    ServerName = cn.DataSource,
    IntegratedSecurity = cn.IntegratedSecurity,
    UserID = cn.UserID,
    Password = cn.Password,
    DatabaseName = cn.InitialCatalog};
```

```VB.Net
Dim cn As New SqlConnectionStringBuilder(cnString)
Dim ci As New ConnectionInfo() With {
    .Type = ConnectionInfoType.SQL, _
    .ServerName = cn.DataSource, _
    .IntegratedSecurity = cn.IntegratedSecurity, _
    .UserID = cn.UserID, _
    .Password = cn.Password, _
    .DatabaseName = cn.InitialCatalog}
```

Next you need to apply this connection info throughout your report. I have found that its necessary to do this on every database table, for both your main report and also all sub reports. To make this easy, I used a recursive method to do all the looping and assigning:

```C#
void SetConnection(
    ReportDocument rd,
    crConnectionInfo ci)
{

    foreach (CrystalDecisions.CrystalReports.Engine.Table tbl 
        in rd.Database.Tables)
    {
        TableLogOnInfo logon = tbl.LogOnInfo;
        logon.ConnectionInfo = ci;
        tbl.ApplyLogOnInfo(logon);
        tbl.Location = tbl.Location;
    }
    if (!rd.IsSubReport) {
        foreach {ReportDocument sd in rd.SubReports) {
            SetConnection(sd,ci)
        }
    }
}
```

```VB.Net
Public Sub SetConnection(
    ByVal rd As ReportDocument,
    ByVal ci As crConnectionInfo)

    For Each tbl 
        As CrystalDecisions.CrystalReports.Engine.Table
        In rd.Database.Tables

        Dim logon As TableLogOnInfo = tbl.LogOnInfo
        logon.ConnectionInfo = ci
        tbl.ApplyLogOnInfo(logon)
        tbl.Location = tbl.Location
    Next

    If Not rd.IsSubReport Then
        For Each sd As ReportDocument in rd.SubReport
            SetConnection(sd,ci)
        Next
    End If

End Sub
```

Notes:

- This method never needs to call `SetDatabaseLogon` on the `ReportDocument` class.
- The call that sets `tbl.Location` to itself is intended. In the version I was using it didn't work without this initialization (I assume there's some code in their property setter).

Caveat: I've hand coded all the above code, and don't have a means to test it out. If you find typos or other issues with it, let me know in the comments I'll make amendments. There are some additional line-breaks for formatting purposes.