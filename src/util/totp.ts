import * as OTPAuth from 'otpauth';
// tslint:disable-next-line:no-duplicate-imports
import { TOTP } from 'otpauth';

export class Totp {
    public static generateSecretToken(secretCode: string): string {
        const totp: TOTP = new OTPAuth.TOTP({
            issuer: 'Generator',
            label: 'Test',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secretCode
        });

        return totp.generate();
    }
}
