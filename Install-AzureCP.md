## How to install AzureCP

> **Important:**  
> Start a **new PowerShell console** to ensure the use of up to date persisted objects, which avoids concurrency update errors.  
> If something goes wrong, [check this page](Fix-setup-issues.html) to fix issues.  
> Due to its dependency to [Microsoft.Graph 3+](https://www.nuget.org/packages/Microsoft.Graph), AzureCP 17 (or newer) requires at least [.NET 4.6.1](https://support.microsoft.com/en-us/lifecycle/search?alpha=.net%20framework) (SharePoint requires only .NET 4.5).

- Download AzureCP.wsp.
- Install and deploy the solution:

```powershell
Add-SPSolution -LiteralPath "F:\Data\Dev\AzureCP.wsp"
Install-SPSolution -Identity "AzureCP.wsp" -GACDeployment
```

- Associate AzureCP with a SPTrustedIdentityTokenIssuer:

```powershell
$trust = Get-SPTrustedIdentityTokenIssuer "SPTRUST NAME"
$trust.ClaimProviderName = "AzureCP"
$trust.Update()
```

- Visit central administration > System Settings > Manage farm solutions: Wait until solution status shows "Deployed".
- Update assembly manually on SharePoint servers that do not run the service "Microsoft SharePoint Foundation Web Application" (see below for more details).
- Restart IIS service and SharePoint timer service on each SharePoint server.
- [Add an application](Register-App-In-AAD.html) in your Azure AD tenant to allow AzureCP to query it.
- [Configure](Configure-AzureCP.html) AzureCP for your environment.

## Important

- Due to limitations of SharePoint API, do not associate AzureCP with more than 1 SPTrustedIdentityTokenIssuer. Developers can [bypass this limitation](For-Developers.html).

- You must manually install azurecp.dll and all its dependend assemblies in the GAC of SharePoint servers that do not run SharePoint service "Microsoft SharePoint Foundation Web Application".

You can extract the assemblies from AzureCP.wsp using [7-zip](https://www.7-zip.org/), and add them to the GAC using this PowerShell script:

```powershell
<#
.SYNOPSIS
    Check if assemblies in the directory specified are present in the GAC, and add them if not.
.DESCRIPTION
    This script needs to be executed each time you install/update AzureCP, on all SharePoint servers that do not run SharePoint service “Microsoft SharePoint Foundation Web Application”.
    Set $assemblies to the path where AzureCP.wsp was unzipped
.LINK
    https://yvand.github.io/AzureCP/Install-AzureCP.html
#>

$assemblies = Get-ChildItem -Path "C:\AzurecpWSPUnzipped\*.dll"
[System.Reflection.Assembly]::Load("System.EnterpriseServices, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")
$publish = New-Object System.EnterpriseServices.Internal.Publish
foreach ($assembly in $assemblies)
{
    $filePath = $assembly.FullName
    $assemblyFullName = [System.Reflection.AssemblyName]::GetAssemblyName($filePath).FullName

    try
    {
        $assemblyInGAC = [System.Reflection.Assembly]::Load($assemblyFullName)
        Write-Host "Assembly $assemblyFullName is already present in the GAC"

        if ($assemblyInGAC.FullName -match "AzureCP, Version=1.0.0.0, Culture=neutral, PublicKeyToken=65dc6b5903b51636")
        {
            # AzureCP must always be overwritten because each version has the same full name
            $publish.GacRemove($assemblyInGAC)
            $publish.GacInstall($filePath)
            Write-Host "Assembly $assemblyFullName sucessfully re-added to the GAC" -ForegroundColor Green
        }
    }
    catch [System.IO.FileNotFoundException] 
    {
        # Assembly.Load throws a FileNotFoundException if assembly is not found in the GAC: https://docs.microsoft.com/en-us/dotnet/api/system.io.filenotfoundexception?view=netframework-4.8
        Write-Host "Adding assembly $assemblyFullName to the GAC"
        $publish.GacInstall($filePath)
        Write-Host "Assembly $assemblyFullName sucessfully added to the GAC" -ForegroundColor Green
    }
}
```
