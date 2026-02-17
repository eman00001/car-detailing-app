export function getFirebaseAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-exists':
            return 'This email has already registered for an account';
        
        case 'auth/invalid-email':
            return 'Invalid email';
        
        case 'auth/missing-password':
            return 'Please enter your password';

        case 'auth/invalid-password':
            return 'Invalid password';

        case 'auth/weak-password':
            return 'Please choose a stronger password';

        case 'auth/invalid-credential':
            return 'Invalid credentials';

        default:
            return 'Something went wrong';
    }
}