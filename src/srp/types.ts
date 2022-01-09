import { CognitoUserSession } from 'amazon-cognito-identity-js';

export interface Options {
    clientId: string;
    password: string;
    username: string;
    userPoolId: string;
}

export interface AuthResult {
    cognitoUserSession: CognitoUserSession;
    totp?: {
        secretCode: string;
    };
}

export interface AmazonCognitoSrpType {
    authenticate(): Promise<AuthResult>;
}
