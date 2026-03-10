import * as amplifyAuth from 'aws-amplify/auth';
import { authConfig } from '../auth/amplifyConfig';

// Check if we have real AWS credentials provided
const isConfigured = !!authConfig.Auth?.Cognito?.userPoolId;

// In-memory mock state for local testing without AWS
const mockUsers = new Map<string, any>();
let currentMockSession = false;

// Pre-seed a test user so login works immediately if needed
mockUsers.set('test@example.com', {
    username: 'test@example.com',
    password: 'Password123!',
    verified: true
});

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const signIn = async (input: any) => {
    if (isConfigured) return amplifyAuth.signIn(input);
    await delay(800);

    const user = mockUsers.get(input.username);
    if (!user || user.password !== input.password) {
        throw new Error('Incorrect username or password');
    }
    if (!user.verified) {
        return { nextStep: { signInStep: 'CONFIRM_SIGN_UP' } };
    }

    currentMockSession = true;
    return { isSignedIn: true, nextStep: { signInStep: 'DONE' } };
};

export const signUp = async (input: any) => {
    if (isConfigured) return amplifyAuth.signUp(input);
    await delay(800);

    if (mockUsers.has(input.username)) {
        throw new Error('User already exists');
    }

    mockUsers.set(input.username, { ...input, verified: false });
    return { isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } };
};

export const confirmSignUp = async (input: any) => {
    if (isConfigured) return amplifyAuth.confirmSignUp(input);
    await delay(800);

    const user = mockUsers.get(input.username);
    if (!user) throw new Error('User not found');
    if (input.confirmationCode !== '123456') {
        throw new Error('Invalid verification code. Please use 123456 for the demo.');
    }

    user.verified = true;
    return { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } };
};

export const resendSignUpCode = async (input: any) => {
    if (isConfigured) return amplifyAuth.resendSignUpCode(input);
    await delay(800);
    return { nextStep: { signUpStep: 'DONE' } };
};

export const resetPassword = async (input: any) => {
    if (isConfigured) return amplifyAuth.resetPassword(input);
    await delay(800);

    if (!mockUsers.has(input.username)) {
        throw new Error('User not found');
    }

    return { nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' } };
};

export const confirmResetPassword = async (input: any) => {
    if (isConfigured) return amplifyAuth.confirmResetPassword(input);
    await delay(800);

    const user = mockUsers.get(input.username);
    if (!user) throw new Error('User not found');
    if (input.confirmationCode !== '123456') {
        throw new Error('Invalid verification code. Please use 123456 for the demo.');
    }

    user.password = input.newPassword;
    return { nextStep: { resetPasswordStep: 'DONE' } };
};

export const fetchAuthSession = async () => {
    if (isConfigured) return amplifyAuth.fetchAuthSession();
    await delay(100);

    if (currentMockSession) {
        return { tokens: { idToken: 'mock-token' } } as any;
    }
    return {} as any;
};

export const signOut = async () => {
    if (isConfigured) return amplifyAuth.signOut();
    await delay(400);
    currentMockSession = false;
};
