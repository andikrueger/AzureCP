## Register the application for AzureCP in your Azure Active Directory tenant

AzureCP needs an application in your Azure AD tenant to be allowed to query it.  
Follow the steps below to create it with the required settings:

- Sign-in to your [Azure Active Directory tenant](https://aad.portal.azure.com/)
- Go to "App Registrations" > "New registration" > Type the following information:
    > Name: e.g. AzureCP  
    > Supported account types: "Accounts in this organizational directory only (Single tenant)"
- Click on "Register"
    > **Note:** Copy the "Application (client) ID": it is required by AzureCP to add a tenant.
- Click on "API permissions" and remove the permission added by default.
- Click on "Add a permission" > Select "Microsoft Graph" > "Application permissions" > Directory > Directory.Read.All > click "Add permissions"
- Click on "Grant admin consent for TenantName" > Yes
    > **Note:** "After this operation, you should have only the Microsoft Graph > Directory.Read.All permission, of type "Application", with admin consent granted.
- Click on "Certificates & secrets": AzureCP supports both using a certificate or a client secret, choose either option depending on your needs.
