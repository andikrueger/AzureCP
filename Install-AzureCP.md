## How to install AzureCP

> **Important:**  
> Start a **new PowerShell console** to ensure the use of up to date persisted objects, which avoids concurrency update errors.  
> If something goes wrong, [check this page](Fix-setup-issues.html) to fix issues.

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

- [Read this page](Configure-AzureCP.html) to configure AzureCP for your environment.

## Important

- Due to limitations of SharePoint API, do not associate AzureCP with more than 1 SPTrustedIdentityTokenIssuer. Developers can [bypass this limitation](For-Developers.html).

- You must manually install azurecp.dll in the GAC of SharePoint servers that do not run SharePoint service "Microsoft SharePoint Foundation Web Application".

You can extract azurecp.dll from AzureCP.wsp using [7-zip](https://www.7-zip.org/), and install it in the GAC using this PowerShell script:

```powershell
[System.Reflection.Assembly]::Load("System.EnterpriseServices, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")
$publish = New-Object System.EnterpriseServices.Internal.Publish

try
{
    # Method Publish.GacRemove() removes the assembly from the GAC if it exists (for update scenarios)
    $existingAssembly = [System.Reflection.Assembly]::Load("AzureCP, Version=1.0.0.0, Culture=neutral, PublicKeyToken=65dc6b5903b51636").Location
    $publish.GacRemove($existingAssembly)
} catch {}

# Adds assembly to the GAC
$publish.GacInstall("F:\Data\Dev\azurecp.dll")
```
