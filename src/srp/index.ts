import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';
// tslint:disable-next-line:no-duplicate-imports
import {
    AuthenticationDetails,
    CognitoUser,
    CognitoUserSession,
    IAuthenticationCallback,
    IAuthenticationDetailsData,
    ICognitoUserData,
    ICognitoUserPoolData
} from 'amazon-cognito-identity-js';

import { AuthResult, AmazonCognitoSrpType, Options } from './types';
import { Totp } from '../util/totp';
import { Constant } from './constant';
import { User } from '../util/user';

export class AmazonCognitoSrp implements AmazonCognitoSrpType {
    private readonly cognitoUser: CognitoUser;
    private readonly authenticationDetails: AuthenticationDetails;
    private totpSecretCode: string | undefined;

    public constructor(private readonly options: Options) {
        const poolData: ICognitoUserPoolData = {
            UserPoolId: this.options.userPoolId,
            ClientId: this.options.clientId
        };

        const userData: ICognitoUserData = {
            Username: options.username,
            Pool: new AmazonCognitoIdentity.CognitoUserPool(poolData)
        };

        this.cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        const authenticationData: IAuthenticationDetailsData = {
            Username: this.options.username,
            Password: this.options.password
        };

        this.authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    }

    public authenticate = async (): Promise<AuthResult> => {
        try {
            // tslint:disable-next-line:no-this-assignment
            const rootContext: AmazonCognitoSrp = this;

            return new Promise<AuthResult>((
                resolve: (value: (AuthResult | PromiseLike<AuthResult>)) => void,
                reject: (reason?: Error) => void): void => {
                try {
                    this.cognitoUser.authenticateUser(this.authenticationDetails, {
                        onFailure(err: Error): void {
                            reject(err);
                        },
                        onSuccess(session: CognitoUserSession): void {
                            if (session) {
                                const response: AuthResult = {
                                    cognitoUserSession: session
                                };

                                const totpSecretCode: string | undefined = rootContext.getTotpSecretCode();

                                if (totpSecretCode) {
                                    response.totp = {
                                        ...response.totp,
                                        secretCode: totpSecretCode
                                    };
                                }
                                resolve(response);
                            } else {
                                reject(new Error('A user session is empty'));
                            }

                        },
                        mfaSetup(): void {
                            // tslint:disable-next-line:no-this-assignment
                            const callbackContext: IAuthenticationCallback = this;

                            rootContext.cognitoUser.associateSoftwareToken({
                                associateSecretCode(secretCode: string): void {
                                    rootContext.setTotpSecretCode(secretCode);

                                    rootContext.cognitoUser.verifySoftwareToken(
                                        Totp.generateSecretToken(secretCode),
                                        Constant.DEVICE_NAME,
                                        {
                                            onSuccess: callbackContext.onSuccess,
                                            onFailure: callbackContext.onFailure
                                        }
                                    );
                                },
                                onFailure: callbackContext.onFailure
                            });
                        },
                        newPasswordRequired(userAttributes: { email: string }): void {
                            // tslint:disable-next-line:no-this-assignment
                            const callbackContext: IAuthenticationCallback = this;

                            if (userAttributes.email === '') {
                                userAttributes.email = User.generateUsername(['email']);
                            }

                            rootContext.cognitoUser.completeNewPasswordChallenge(
                                rootContext.options.password,
                                userAttributes,
                                callbackContext);
                        },
                        totpRequired(): void {
                            if (rootContext.totpSecretCode) {
                                return rootContext.cognitoUser.sendMFACode(
                                    Totp.generateSecretToken(rootContext.totpSecretCode),
                                    this,
                                    'SOFTWARE_TOKEN_MFA'
                                );
                            }

                            throw new Error(
                                'Initial \'secretCode\' should be provided '
                                + 'because TOTP authenticator has been already attached'
                            );
                        }
                    });
                } catch (err: unknown) {
                    reject(err as Error);
                }
            });
        } catch (err) {
            throw err;
        }
    }

    public setTotpSecretCode(totpSecretCode: string): void {
        this.totpSecretCode = totpSecretCode;
    }

    public getTotpSecretCode(): string | undefined {
        return this.totpSecretCode;
    }
}
