import type { ResourcesConfig } from 'aws-amplify';

// Placeholder configuration for AWS Cognito Auth.
// The user will need to supply these values to connect to their User Pool.
export const authConfig: ResourcesConfig = {
    Auth: {
        Cognito: {
            userPoolId: '',
            userPoolClientId: '',
            identityPoolId: '', // Optional
        }
    }
};
