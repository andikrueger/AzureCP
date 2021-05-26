---
title: How to install AzureCP
redirect_to: https://azurecp.yvand.net/docs/usage/install/
---

## How to install AzureCP

### Important

> **Always start a new PowerShell process** to ensure using up to date persisted objects and avoid nasty errors.  
> AzureCP 17 requires at least .NET 4.6.1 [(released in 2015)](https://docs.microsoft.com/en-us/lifecycle/products/microsoft-net-framework-461).  
> AzureCP 18 (or newer) requires at least **.NET 4.7.2** [(released in 2018)](https://docs.microsoft.com/en-us/lifecycle/products/microsoft-net-framework-472) to fix issues when referencing .NET Standard 2.0 libraries (more details [here](https://docs.microsoft.com/en-us/dotnet/standard/library-guidance/cross-platform-targeting) and [there](https://docs.microsoft.com/en-us/dotnet/standard/net-standard)).  
> If something goes wrong, [check this page](Fix-setup-issues.html) to fix issues.  

### Installation procedure

SharePoint (especially 2019) has unaddressed reliability issues when deploying farm solutions on farms with multiple servers. The more servers the farm has, the bigger the risk that deployment fails. To mitigate this, cmdlet `Install-SPSolution` can be used with `-Local` but it requires more operations.  
This page will guide you through the steps to install AzureCP in a safe and reliable way. Make sure to complete all of them:

- Download AzureCP.wsp.
- Install and deploy the solution, using either the "simple" or the "safe" method:
  - Simple method: Recommended for single-server farms only:

```powershell
# Run this script on the server running central administration, in a new PowerShell process
Add-SPSolution -LiteralPath "C:\Data\AzureCP.wsp"
# Wait for some time (until solution is actually added)
# Then run Install-SPSolution (without -Local) to deploy solution globally (on all servers that run service "Microsoft SharePoint Foundation Web Application"):
Install-SPSolution -Identity "AzureCP.wsp" -GACDeployment
```

  - Safe method: Recommended for production environments with multiple servers:

```powershell
<#
.SYNOPSIS
    Deploy "AzureCP.wsp" in a reliable way, to address reliability issues that may occur when deploying solutions in SharePoint (especially 2019) (and especially if there are many servers):
.DESCRIPTION
    Run this script on ALL SharePoint servers which run the service "Microsoft SharePoint Foundation Web Application", sequentially (not in parallel), starting with the one running central administration (even if it does not run the service):
.LINK
    https://yvand.github.io/AzureCP/Install-AzureCP.html
#>

# To use this script, you only need to edit the $fullpath variable below
$claimsprovider = "AzureCP"
$fullpath = "C:\Data\$claimsprovider.wsp"
$packageName = "$claimsprovider.wsp"

# Perform checks to detect and prevent potential problems
# Test 1: Install-SPSolution will fail if claims provider is already installed on the current server
if ($null -ne (Get-SPClaimProvider -Identity $claimsprovider -ErrorAction SilentlyContinue)) {
    Write-Error "Cannot continue because current server already has claims provider $claimsprovider, which will cause an error when running Install-SPSolution."
    throw ("Cannot continue because current server already has claims provider $claimsprovider, which will cause an error when running Install-SPSolution.")
    Get-SPClaimProvider| ?{$_.DisplayName -like $claimsprovider}| Remove-SPClaimProvider
}

# Test 2: Install-SPSolution will fail if any feature in the WSP solution is already installed on the current server
if ($null -ne (Get-SPFeature| ?{$_.DisplayName -like "$claimsprovider*"})) {
    Write-Error "Cannot continue because current server already has features of $claimsprovider, Visit https://yvand.github.io/AzureCP/Fix-setup-issues.html to fix this."
    throw ("Cannot continue because current server already has features of $claimsprovider, Visit https://yvand.github.io/AzureCP/Fix-setup-issues.html to fix this.")
}

# Add the solution if it's not already present (only the 1st server will do it)
if ($null -eq (Get-SPSolution -Identity $packageName -ErrorAction SilentlyContinue)) {
    Write-Host "Adding solution $packageName to the farm..."
    Add-SPSolution -LiteralPath $fullpath
}

$count = 0
while (($count -lt 20) -and ($null -eq $solution))
{
    Write-Host "Waiting for the solution $packageName to be available..."
    Start-Sleep -Seconds 5
    $solution = Get-SPSolution -Identity $packageName
    $count++
}

if ($null -eq $solution) {
    Write-Error "Solution $packageName could not be found."
    throw ("Solution $packageName could not be found.")
}

# Always wait at least 5 seconds to avoid that Install-SPSolution does not actually trigger deployment
Start-Sleep -Seconds 5
Write-Host "Deploying solution $packageName to the farm..."
# If -local is omitted, solution files will be deployed in all servers that run service "Microsoft SharePoint Foundation Web Application", but it may fail due to reliability issues in SharePoint
Install-SPSolution -Identity $packageName -GACDeployment -Local
```

- Visit central administration > System Settings > Manage farm solutions: Confirm the solution is "Globally deployed".

> If you run cmdlet `Install-SPSolution` with `-Local`, but not on every SharePoint server that run service "Microsoft SharePoint Foundation Web Application", solution won't be "Globally deployed" and SharePoint won't activate AzureCP features.

- For all other SharePoint servers that **do NOT run the service "Microsoft SharePoint Foundation Web Application"**, you must manually add AzureCP DLLs to their GAC. Complete the steps below on each of those servers to do so:
  - Download the package 'AzureCP-XXXX-dependencies.zip' corresponding to your version from the [GitHub releases page](https://github.com/Yvand/AzureCP/releases) (expand the "Assets" to find it)
  - Unzip it in a local directory
  - Run the script below to add the DLLs to the GAC:

```powershell
<#
.SYNOPSIS
    Check if assemblies in the directory specified are present in the GAC, and add them if not.
.DESCRIPTION
    This script needs to be executed each time you install/update AzureCP, on all SharePoint servers that do not run SharePoint service “Microsoft SharePoint Foundation Web Application”.
    Set $assemblies to the path where 'AzureCP-XXXX-dependencies.zip' was unzipped
.LINK
    https://yvand.github.io/AzureCP/Install-AzureCP.html
#>

$assemblies = Get-ChildItem -Path "C:\AzureCP-XXXX-dependencies-unzipped\*.dll"
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

- Associate AzureCP with a SPTrustedIdentityTokenIssuer:

```powershell
$trust = Get-SPTrustedIdentityTokenIssuer "SPTRUST NAME"
$trust.ClaimProviderName = "AzureCP"
$trust.Update()
```

- Restart IIS service and SharePoint timer service (SPTimerV4) on all SharePoint servers.
- [Add an application](Register-App-In-AAD.html) in your Azure AD tenant to allow AzureCP to query it.
- [Configure](Configure-AzureCP.html) AzureCP for your environment.

### Other things to know

- Due to limitations of SharePoint API, do not associate AzureCP with more than 1 SPTrustedIdentityTokenIssuer. Developers can [bypass this limitation](For-Developers.html).
- You really have to manually add azurecp.dll and all its dependent assemblies in the GAC of SharePoint servers that do not run SharePoint service "Microsoft SharePoint Foundation Web Application".
