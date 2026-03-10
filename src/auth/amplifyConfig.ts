import type { ResourcesConfig } from 'aws-amplify';

// Configuration for AWS Cognito Auth.
export const authConfig: ResourcesConfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
            userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
        }
    }
};
