import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { View, TextInput, Text, Pressable } from 'react-native';

import styles from '../../stylesheet';
import { getFirebaseAuthErrorMessage } from '../../firebaseUtils';
import { firebase_auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setError(''); // reset error message
        setIsLoading(true); // begin loading

        try {
            const response = await signInWithEmailAndPassword(firebase_auth, email, password);
            // loading finishes when App.js handles auth, so do not change here
        } catch (error) {
            console.warn(error);
            // if error, display error message on screen and log to console
            const errorMessage = getFirebaseAuthErrorMessage(error);
            setError(errorMessage);
            setIsLoading(false); // finish loading
        }
    }

    const navigateToRegister = () => {
        navigation.navigate('Register');
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.authContainer}>
                <Text style={styles.errorMessage}>
                    {error}
                </Text>
                <View>
                    <Text style={styles.inputLabel}>
                        Email Address
                    </Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        style={styles.textInput}
                    />
                </View>
                <View>
                    <Text style={styles.inputLabel}>
                        Password
                    </Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                        style={styles.textInput}
                    />
                </View>
                <Pressable
                    onPress={handleSignIn}
                    style={{...styles.button, ...(isLoading ? styles.buttonDisabled : styles.buttonPlain)}}
                >
                    <Text style={styles.buttonText}>
                        Sign In
                    </Text>
                </Pressable>
                <Pressable
                    onPress={navigateToRegister}
                >
                    <Text style={styles.linkText}>
                        Don't have an account? Register here
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}