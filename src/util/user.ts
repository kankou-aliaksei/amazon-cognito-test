import * as generatorPassword from 'generate-password';

export class User {
    public static generateUsername(usernameAttributes?: Array<'phone_number' | 'email' | string>): string {
        if (usernameAttributes) {
            if (
                (usernameAttributes.includes('phone_number') && usernameAttributes.includes('email'))
                || usernameAttributes.includes('email')) {
                return `test-${Date.now()}@test.com`;
            }
            if (usernameAttributes.includes('phone_number')) {
                return `+1${Date.now()}`;
            }
            throw new Error('Username attribute for a User pool should be \'phone_number\' | \'email\'');
        }
        return `test-${Date.now()}`;
    }

    public static generatePassword(): string {
        return generatorPassword.generate({
            length: 99,
            numbers: true,
            symbols: true,
            uppercase: true,
            lowercase: true
        });
    }
}
