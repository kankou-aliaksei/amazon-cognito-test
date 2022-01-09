import { CognitoAuthOutput, CognitoAuthOptions, CreateUserOptions, CreateUserOutput } from './types';
import {
    AdminAddUserToGroupCommand,
    AdminAddUserToGroupCommandInput,
    AdminAddUserToGroupCommandOutput,
    AdminCreateUserCommand,
    AdminCreateUserCommandInput,
    AdminCreateUserCommandOutput,
    AdminDeleteUserCommand,
    AdminDeleteUserCommandInput,
    AdminDeleteUserCommandOutput,
    CognitoIdentityProviderClient,
    DescribeUserPoolCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {
    DescribeUserPoolCommandInput,
    DescribeUserPoolCommandOutput
} from '@aws-sdk/client-cognito-identity-provider/dist-types/commands/DescribeUserPoolCommand';
import { AmazonCognitoSrpType, AuthResult } from './srp/types';
import { AmazonCognitoSrp } from './srp';
import { User } from './util/user';

export class CognitoTest {
    private isUserCreated: boolean = false;
    private password: string | undefined;
    private username: string | undefined;
    private cognitoSrp: AmazonCognitoSrpType | undefined;
    private readonly cognitoIdp: CognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

    public constructor(private readonly userPoolId: string, private readonly clientId: string) {
    }

    public async auth(options?: CognitoAuthOptions): Promise<CognitoAuthOutput> {
        try {
            let userOptions: CreateUserOptions | undefined;

            if (options && options.userGroups && options.userGroups.length) {
                userOptions = {
                    groups: options.userGroups
                };
            }

            await this.createUser(userOptions);

            if (!this.password || !this.username) {
                throw new Error('Username/Password is missing. Try to run createUser method before');
            }

            this.cognitoSrp = new AmazonCognitoSrp({
                clientId: this.clientId,
                password: this.password,
                username: this.username,
                userPoolId: this.userPoolId
            });

            const authResult: AuthResult = await this.cognitoSrp.authenticate();

            return {
                user: {
                    username: this.username
                },
                cognitoUserSession: authResult.cognitoUserSession
            };
        } catch (e) {
            if (this.isUserCreated) {
                await this.destroy();
            }
            throw e;
        } finally {
            if (this.isUserCreated) {
                await this.destroy();
            }
        }
    }

    private async destroy(): Promise<void> {
        if (this.userPoolId && this.username) {
            const adminDeleteUserCommand: AdminDeleteUserCommand = new AdminDeleteUserCommand({
                UserPoolId: this.userPoolId,
                Username: this.username
            });

            await this.cognitoIdp.send<AdminDeleteUserCommandInput,
                AdminDeleteUserCommandOutput>(adminDeleteUserCommand);
        }
    }

    private async createUser(options?: CreateUserOptions): Promise<CreateUserOutput> {
        try {
            this.password = User.generatePassword();

            const describeUserPoolCommand: DescribeUserPoolCommand = new DescribeUserPoolCommand({
                UserPoolId: this.userPoolId
            });
            const describeUserPoolOutput: DescribeUserPoolCommandOutput =
                await this.cognitoIdp
                    .send<DescribeUserPoolCommandInput, DescribeUserPoolCommandOutput>(describeUserPoolCommand);

            this.username = User.generateUsername(describeUserPoolOutput.UserPool?.UsernameAttributes);

            const adminCreateUserCommand: AdminCreateUserCommand = new AdminCreateUserCommand({
                TemporaryPassword: this.password,
                UserPoolId: this.userPoolId,
                Username: this.username,
                MessageAction: 'SUPPRESS'
            });
            await this.cognitoIdp.send<AdminCreateUserCommandInput,
                AdminCreateUserCommandOutput>(adminCreateUserCommand);

            if (options) {
                await this.addUserToGroups(options.groups);
            }

            this.isUserCreated = true;

            if (this.username && this.password) {
                return {
                    password: this.password,
                    username: this.username,
                    groups: options && options.groups && options.groups.length ? options.groups : []
                };
            }

            throw new Error('Username/Password is missing');
        } catch (e) {
            throw e;
        }
    }

    private async addUserToGroups(groups: string[]): Promise<void> {
        if (groups && groups.length) {
            const addToGroups: Array<Promise<AdminAddUserToGroupCommandOutput>> =
                groups.map<Promise<AdminAddUserToGroupCommandOutput>>(
                    (group: string): Promise<AdminAddUserToGroupCommandOutput> => {
                        const adminAddUserToGroupCommand: AdminAddUserToGroupCommand =
                            new AdminAddUserToGroupCommand({
                                GroupName: group,
                                UserPoolId: this.userPoolId,
                                Username: this.username
                            });
                        return this.cognitoIdp.send<AdminAddUserToGroupCommandInput,
                            AdminAddUserToGroupCommandOutput>(adminAddUserToGroupCommand);
                    });
            await Promise.all<AdminAddUserToGroupCommandOutput>(addToGroups);
        }
    }
}
