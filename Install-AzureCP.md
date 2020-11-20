## How to install AzureCP

> **Important:**  
> **Always start a new PowerShell console** to ensure using up to date persisted objects, which avoids nasty errors.  
> AzureCP 17 requires at least .NET 4.6.1 [(released in 2015)](https://docs.microsoft.com/en-us/lifecycle/products/microsoft-net-framework-461).  
> **AzureCP 18 (or newer) requires at least .NET 4.7.2** [(released in 2018)](https://docs.microsoft.com/en-us/lifecycle/products/microsoft-net-framework-472).  
> If something goes wrong, [check this page](Fix-setup-issues.html) to fix issues.  

Follow all the steps below to ensure the correct installation of AzureCP:

- Download AzureCP.wsp.
- Install and deploy the solution, using either the "simple" or the "safe" way:
  - Simple way, recommended for single-server farms only:

```powershell
Add-SPSolution -LiteralPath "C:\Data\AzureCP.wsp"
# Wait for some time (until solution is actually added) before running Install-SPSolution
Install-SPSolution -Identity "AzureCP.wsp" -GACDeployment
```

  - Safe way: Highly recommended for production environments with multiple servers:

Run this script on **ALL SharePoint servers which run the service "Microsoft SharePoint Foundation Web Application"**, sequentially (not in parallel), and **start with the one running central administration** (even if that one does not run the service):

```powershell
<#
.SYNOPSIS
    Deploy "AzureCP.wsp" in a reliable way, to address reliability issues that may occur when deploying solutions in SharePoint (especially 2019) (and especially if there are many servers):
.DESCRIPTION
    Run this script on ALL SharePoint servers which run the service "Microsoft SharePoint Foundation Web Application", sequentially (not in parallel), and start with the one running central administration (even if that one does not run the service):
    Set the correct path in Add-SPSolution cmdlet
.LINK
    https://yvand.github.io/AzureCP/Install-AzureCP.html
#>

$packageName = "AzureCP.wsp"
if ($null -eq (Get-SPSolution -Identity $packageName -ErrorAction SilentlyContinue)) {
    Write-Host "Adding solution $packageName to the farm..."
    Add-SPSolution -LiteralPath "C:\Data\$packageName"
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

- In all cases, for all other SharePoint servers that **do NOT run the service "Microsoft SharePoint Foundation Web Application"**: You must manually add AzureCP DLLs to the GAC of SharePoint servers:
  - Download the package 'AzureCP-XXXX-dependencies.zip' corresponding to your version from the [GitHub releases page](https://github.com/Yvand/AzureCP/releases) (expand the "Assets" to find it)
  - Unzip it in a local directory on the SharePoint server
  - Run the script below to add the DLLs to the GAC:

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

## Important

- Due to limitations of SharePoint API, do not associate AzureCP with more than 1 SPTrustedIdentityTokenIssuer. Developers can [bypass this limitation](For-Developers.html).
- You really have to manually add azurecp.dll and all its dependend assemblies in the GAC of SharePoint servers that do not run SharePoint service "Microsoft SharePoint Foundation Web Application".
