## Register an application in Azure Active Directory

An application must be registered in Azure AD to allow AzureCP to make queries in your tenant:

- Sign-in to the [Azure portal](https://portal.azure.com/) and browse to your Azure Active Directory tenant
- Go to "App Registrations" > "New registration" > Type the following information:
    > Name: e.g. AzureCP  
    > Supported account types: "Accounts in this organizational directory only (TenantName)"
- Click on "Register"
    > **Note:** Copy the "Application (client) ID": it is required by AzureCP to add a tenant.
- Click on "API permissions" and remove the permission added by default.
- Click on "Add a permission" > Select "Microsoft Graph" > "Application permissions" > Directory > Directory.Read.All > click "Add permissions"
- Click on "Grant admin consent for <TenantName>" > Yes
    > **Note:** "After this operation, you should have only the Microsoft Graph > Directory.Read.All permission, of type "Application", with admin consent granted.
- Click on "Certificates & secrets" > "New client secret": Type a description, choose a duration and validate.
    > **Note:** Copy the client secret value: it is required by AzureCP to add a tenant.
