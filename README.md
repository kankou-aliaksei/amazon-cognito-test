# amazon-cognito-test

Amazon Cognito Test helps to perform Integration tests for REST API using Amazon Cognito user pools as authorizer.

# Description

If you develop automated tests to check the correct operation of REST API and use Cognito as an authorizer, you need to authenticate your requests. Especially the difficulty in automating authentication increases if you have MFA enabled.

The Amazon Cognito Test:
1) Creates a temporary user.
2) Adds him to user groups if necessary.
3) Authenticates in Cognito.
4) Removes the temporary user.
5) Returns id token, access token, refresh token to authorize automation requests.

# Features
1) Add/Delete a temporary user into Cognito user groups.
2) Support Enabled SRP (secure remote password) protocol based authentication (ALLOW_USER_SRP_AUTH) for App Clients
3) Perform Time-based One-time Password (TOTP) Multi-Factor Authentication (MFA) automatically under the hood.
4) Return id token, access token, refresh token.

# Identity and Access Management (IAM)

This is a least privilege AWS Identity and Access Management (IAM) policy to attach.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:DescribeUserPool",
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminAddUserToGroup"
            ],
            "Resource": [
                "arn:aws:cognito-idp:<region>:<account-id>:userpool/<userpool-id>"
            ]
        }
    ]
}
```


# TypeScript example

```
import { expect } from 'chai';
import { CognitoTest } from 'amazon-cognito-test';
import { CognitoAuthOutput } from 'amazon-cognito-test-preview/src/types';

const axios = require('axios');

const userPoolId = 'us-east-1_xxxyyyzzz';
const clientId = '2ovsuja8foguupj2ixxxyyyzzz';
const url = 'https://yxxxyyyzzz.execute-api.us-east-1.amazonaws.com/prod';

describe('REST API Integration Test', () => {

    it('Should return 200 status code', async () => {
        const cognitoTest = new CognitoTest(userPoolId, clientId);

        const cognitoAuthOutput: CognitoAuthOutput = await cognitoTest.auth({
            userGroups: [
                'admin',
                'dev'
            ]
        });

        const idToken = cognitoAuthOutput.cognitoUserSession.getIdToken().getJwtToken();
        const accessToken = cognitoAuthOutput.cognitoUserSession.getAccessToken().getJwtToken();
        const refreshToken = cognitoAuthOutput.cognitoUserSession.getRefreshToken().getToken();

        const response = await axios({
            method: 'get',
            url,
            headers: {
                'Authorization': idToken
            }
        });

        console.log(response.status);

        expect(idToken).to.be.not.empty;
        expect(accessToken).to.be.not.empty;
        expect(refreshToken).to.be.not.empty;

        expect(response.status).eq(200);
    });
});

```

# JavaScript example

```
const { expect } = require('chai');
const { CognitoTest } = require('amazon-cognito-test');

const axios = require('axios');

const userPoolId = 'us-east-1_xxxyyyzzz';
const clientId = '2ovsuja8foguupj2ixxxyyyzzz';
const url = 'https://yxxxyyyzzz.execute-api.us-east-1.amazonaws.com/prod';

describe('REST API Integration Test', () => {

    it('Should return 200 status code', async () => {
        const cognitoTest = new CognitoTest(userPoolId, clientId);

        const cognitoAuthOutput = await cognitoTest.auth({
            userGroups: [
                'admin',
                'dev'
            ]
        });

        const idToken = cognitoAuthOutput.cognitoUserSession.getIdToken().getJwtToken();
        const accessToken = cognitoAuthOutput.cognitoUserSession.getAccessToken().getJwtToken();
        const refreshToken = cognitoAuthOutput.cognitoUserSession.getRefreshToken().getToken();

        const response = await axios({
            method: 'get',
            url,
            headers: {
                'Authorization': idToken
            }
        });

        console.log(response.status);

        expect(idToken).to.be.not.empty;
        expect(accessToken).to.be.not.empty;
        expect(refreshToken).to.be.not.empty;

        expect(response.status).eq(200);
    });
});

```
