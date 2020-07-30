## Troubleshoot AzureCP

### Check SharePoint logs

AzureCP records all its activity in the SharePoint logs, including performance, queries and number of results returned per Azure AD tenant. They can be retrieved by filtering on Product/Area "AzureCP":

```powershell
Merge-SPLogFile -Path "C:\Temp\AzureCP_logging.log" -Overwrite -Area "AzureCP" -StartTime (Get-Date).AddDays(-1)
```

Alternatively, you may also use [ULSViewer](https://www.microsoft.com/en-us/download/details.aspx?id=44020) and monitor the logs in real time while you reproduce the issue.

### Run Graph queries in Postman

A simple way to troubleshoot AzureCP is to run the Microsoft Graph queries outside of SharePoint / AzureCP.
You may import the Postman collection below to easily run them:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/7f2fca601fa9be1d8bb8)
