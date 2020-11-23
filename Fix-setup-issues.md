## Fix setup issues

Unfortunately, SharePoint has unaddressed reliability issues that causes errors when performing install/uninstall/update operations on farm solutions.  
This page will help you restore the farm to a good state.

> **Important:**  
> **Always start a new PowerShell process** to ensure using up to date persisted objects and avoid nasty errors.  
> Complete all the steps below on the server that threw the error. If you're not sure, you can do it on each.

### Remove AzureCP claims provider

```powershell
# Remove the claims provider from the current server. There will be no confirmation on the remove
Get-SPClaimProvider| ?{$_.DisplayName -like "AzureCP"}| Remove-SPClaimProvider
```

### Identify AzureCP features still installed

```powershell
# Identify all AzureCP features still installed on the current server, that need to be manually uninstalled
Get-SPFeature| ?{$_.DisplayName -like 'AzureCP*'}| fl DisplayName, Scope, Id, RootDirectory
```

Usually, only AzureCP farm feature is listed:

```text
DisplayName   : AzureCP
Scope         : Farm
Id            : d1817470-ca9f-4b0c-83c5-ea61f9b0660d
RootDirectory : C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\Template\Features\AzureCP
```

### Recreate missing feature folder with its feature.xml

For each feature listed above, check if its "RootDirectory" actually exists in the file system of the current server. If it does not exist:

* Create the "RootDirectory" (e.g. "AzureCP" in "Features" folder)
* Use [7-zip](http://www.7-zip.org/) to open AzureCP.wsp and extract the feature.xml of the corresponding feature
* Copy the feature.xml into the "RootDirectory"

### Deactivate and remove the features

```powershell
# Deactivate AzureCP features (it may thrown an error if feature is already deactivated)
Get-SPFeature| ?{$_.DisplayName -like 'AzureCP*'}| Disable-SPFeature -Confirm:$false
# Uninstall AzureCP features on the current server
Get-SPFeature| ?{$_.DisplayName -like 'AzureCP*'}| Uninstall-SPFeature -Confirm:$false
```

Then, delete the "RootDirectory" folder(s) that was created above.

### Delete the AzureCP persisted object

AzureCP stores its configuration is its own persisted object. This stsadm command will delete it if it was not already deleted:

```
stsadm -o deleteconfigurationobject -id 0E9F8FB6-B314-4CCC-866D-DEC0BE76C237
```

### AzureCP solution may now be removed

```powershell
# Remove the solution globally (farm wide operation)
Remove-SPSolution "AzureCP.wsp" -Confirm:$false
```
