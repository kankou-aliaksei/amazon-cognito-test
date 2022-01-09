import { CognitoUserSession } from 'amazon-cognito-identity-js';

export interface CreateUserOutput {
    password: string;
    username: string;
    groups?: string[];
}

export interface CreateUserOptions {
    groups: string[];
}

export interface CognitoAuthOptions {
    userGroups?: string[];
}

export interface CognitoAuthOutput {
    user: {
        username: string;
    };
    cognitoUserSession: CognitoUserSession;
}
