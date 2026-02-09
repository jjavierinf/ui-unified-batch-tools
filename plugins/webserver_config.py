import logging
import os
from airflow.providers.fab.auth_manager.security_manager.override import FabAirflowSecurityManagerOverride
from flask_appbuilder.security.manager import AUTH_OAUTH
from flask_appbuilder.security.views import AuthOAuthView

log = logging.getLogger(__name__)

# -------------------------------
# Flask AppBuilder / Airflow Auth Settings
# -------------------------------
AUTH_TYPE = AUTH_OAUTH
AUTH_ROLES_SYNC_AT_LOGIN = True  # Sync roles every login

# Auto-create users if they don't exist in the DB
AUTH_USER_REGISTRATION = True

AUTH_USER_REGISTRATION_ROLE = "Public"

AUTH_ROLES_MAPPING = {
    "Viewer": ["Viewer"],
    "Admin": ["Admin"],
    "Op": ["Op"],
    "User": ["User"],
    "RoleUserTeamDBAs":["RoleUserTeamDBAs"]
}

# -------------------------------
# OAuth Provider Config (v2.0)
# -------------------------------
OAUTH_PROVIDERS = [
    {
    "name": "azure",
    "icon": "fa-windows",
    "token_key": "access_token",  # The key in the token JSON where the actual token is stored
    "remote_app": {
        "client_id": os.environ.get("AZURE_CLIENT_ID", ""),
        "client_secret": os.environ.get("AZURE_CLIENT_SECRET", ""),

        "server_metadata_url": f"https://login.microsoftonline.com/{os.environ.get('AZURE_TENANT_ID')}/v2.0/.well-known/openid-configuration",

        # Microsoft Graph base URL for retrieving user info
        "api_base_url": "https://graph.microsoft.com/v1.0/",

        # Request required scopes (v2.0 style).
        # "User.Read" ensures we can call /me on Microsoft Graph.
        # "openid profile email" are typical OIDC claims.
        "client_kwargs": {
        "scope": "openid profile email offline_access User.Read Directory.Read.All"
        },
    },
    }
]

class AzureADSecurityManager(FabAirflowSecurityManagerOverride):
    """
    Custom Security Manager to handle the Azure AD OAuth login flow
    and map returned user data into Airflow (Flask AppBuilder) fields.
    """
    GROUP_ROLE_MAP = {
        "5569798b-7658-457d-a761-03667ef13c0a": "Admin",
        "d8997967-de3d-44be-b2d0-088858a31269": "Op", 
        "2314797a-56c7-459a-a27b-82f532f0fb94": "User",
        "022b91ff-3f28-4298-bcfa-e4d0d3b4ab5d": "RoleUserTeamDBAs"
    }
    
    def get_oauth_user_info(self, provider, resp):
        if provider != "azure":
            return {}
        # Retrieve the remote app (i.e., Azure AD config) from AppBuilder
        remote_app = self.appbuilder.sm.oauth_remotes[provider]

        # Use the Microsoft Graph /me endpoint to fetch user info
        me_response = remote_app.get("me")

        if not me_response or not me_response.ok:
            log.error("Failed to fetch user info from Microsoft Graph: %s", me_response.text if me_response else "No response")
            return {}

        user_data = me_response.json()

        log.debug("Azure AD /me response: %s", user_data)

        # Get user groups from Microsoft Graph
        groups_response = remote_app.get("me/memberOf")
        if not groups_response or not groups_response.ok:
            log.error("Failed to fetch user groups from Microsoft Graph.")
            return {}
            
        groups_data = groups_response.json()
        
        # Extract group object IDs from the response
        user_group_ids = []
        for group in groups_data.get("value", []):
            if group.get("@odata.type", "") == "#microsoft.graph.group":
                user_group_ids.append(group.get("id", ""))
        
        log.info(f"User is a member of group IDs: {user_group_ids}")
        
        # Map Azure AD group IDs to Airflow roles
        role_names = []
        for group_id in user_group_ids:
            if group_id in self.GROUP_ROLE_MAP:
                role_name = self.GROUP_ROLE_MAP[group_id]
                role_names.append(role_name)
                log.info(f"Mapped group ID {group_id} to role {role_name}")
        
        # Attempt to get an email. If 'mail' is empty, fallback to 'userPrincipalName'
        email = user_data.get("mail") or user_data.get("userPrincipalName", "")
        first_name = user_data.get("givenName", "")
        last_name = user_data.get("surname", "")

        # Return the fields that FAB / Airflow needs with role_keys as STRINGS
        roles_mapped = {
            "username": email,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "role_keys": role_names,  # Changed: Return role names, not role objects
        }

        log.debug(f"return {roles_mapped}")

        return roles_mapped

# Point Airflow at our custom Security Manager
SECURITY_MANAGER_CLASS = AzureADSecurityManager