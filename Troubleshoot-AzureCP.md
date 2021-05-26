---
title: How to troubleshoot AzureCP
redirect_to: https://azurecp.yvand.net/docs/help/troubleshooting/
---

## Troubleshoot AzureCP

### Check SharePoint logs

AzureCP records all its activity in the SharePoint logs, including performance, queries and results returned by Azure AD. They can be displayed by filtering on Product/Area "AzureCP", for example:

```powershell
Merge-SPLogFile -Path "C:\Temp\AzureCP_logging.log" -Overwrite -Area "AzureCP" -StartTime (Get-Date).AddDays(-1)
```

You may use [ULSViewer](https://www.microsoft.com/en-us/download/details.aspx?id=44020) to apply this filter and monitor the logs in real time.

### Test Microsoft Graph queries in Postman

You can import the collection below in [Postman](https://www.postman.com/) to replay the typical queries issued by AzureCP:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/7f2fca601fa9be1d8bb8)

### Test connectivity with Azure AD

AzureCP may fail to connect to Azure AD for various reasons. The PowerShell script below connects to the typical Azure endpoints and may be run on the SharePoint servers to test the connectivity:

```powershell
Invoke-WebRequest -Uri https://login.windows.net -UseBasicParsing
Invoke-WebRequest -Uri https://login.microsoftonline.com -UseBasicParsing
Invoke-WebRequest -Uri https://graph.microsoft.com -UseBasicParsing
```

### Obtain the access token using PowerShell

This PowerShell script requests an access token to Microsoft Graph, as done by AzureCP:

```powershell
$clientId = "<CLIENTID>"
$clientSecret = "<CLIENTSECRET>"
$tenantName = "<TENANTNAME>.onmicrosoft.com"
$headers = @{ "Content-Type" = "application/x-www-form-urlencoded" }
$body = "grant_type=client_credentials&client_id=$clientId&client_secret=$clientSecret&resource=https%3A//graph.microsoft.com/"
$response = Invoke-RestMethod "https://login.microsoftonline.com/$tenantName/oauth2/token" -Method "POST" -Headers $headers -Body $body
$response | ConvertTo-Json
```

### Inspect the actual traffic between AzureCP and Azure AD

You can redirect the traffic between AzureCP and Azure AD through Fiddler to inspect it.
Once Fiddler was installed locally and its root certificate trusted, you can do it per web application by updating the web.config:

```xml
<system.net>
    <defaultProxy useDefaultCredentials="True">
        <proxy proxyaddress="http://localhost:8888" bypassonlocal="False" />
    </defaultProxy>
</system.net>
```
