## Troubleshoot AzureCP

### Check SharePoint logs

AzureCP records all its activity in the SharePoint logs, including performance, queries and number of results returned per Azure AD tenant. They can be retrieved by filtering on Product/Area "AzureCP":

```powershell
Merge-SPLogFile -Path "C:\Temp\AzureCP_logging.log" -Overwrite -Area "AzureCP" -StartTime (Get-Date).AddDays(-1)
```

You may also use [ULSViewer](https://www.microsoft.com/en-us/download/details.aspx?id=44020) to apply the same filter and monitor the logs in real time.

### Run Graph queries in Postman

You can import the collection below in [Postman](https://www.postman.com/) to replay the queries sent by AzureCP and understand the results it returns:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/7f2fca601fa9be1d8bb8)

### Test connectivity with Azure AD

This script connects to the sites required by Microsoft Graph, it can be run on the SharePoint servers to ensure that they can be reached:

```powershell
Invoke-WebRequest -Uri https://login.windows.net
Invoke-WebRequest -Uri https://login.microsoftonline.com
Invoke-WebRequest -Uri https://graph.microsoft.com
```


### Obtain the access token using PowerShell

This PowerShell script requests an access token to Microsoft Graph, as done by AzureCP:

```powershell
$clientId = "<CLIENTID>"
$clientSecret = "<CLIENTSECRET>"
$tenantName = "TENANTNAME.onmicrosoft.com"
$headers = @{ "Content-Type" = "application/x-www-form-urlencoded" }
$body = "grant_type=client_credentials&client_id=$clientId&client_secret=$clientSecret&resource=https%3A//graph.microsoft.com/"
$response = Invoke-RestMethod "https://login.microsoftonline.com/$tenantName/oauth2/token" -Method "POST" -Headers $headers -Body $body
$response | ConvertTo-Json
```
