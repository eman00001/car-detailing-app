import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { View, TextInput, Text, Pressable, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import styles from '../../stylesheet';

import { getFirebaseAuthErrorMessage } from '../../firebaseUtils';
import { firebase_auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const navigation = useNavigation();
    const navigationHeaderHeight = useHeaderHeight();
    const handleSignIn = async () => {
        setLoginError(''); // reset error message
        setLoading(true); // begin loading

        try {
            const response = await signInWithEmailAndPassword(firebase_auth, email, password);
            // loading finishes when App.js handles auth, so do not change here
        } catch (error) {
            console.warn(error);
            // if error, display error message on screen and log to console
            const errorMessage = getFirebaseAuthErrorMessage(error);
            setLoginError(errorMessage);
            setLoading(false); // finish loading
        }
    }

    const navigateToRegister = () => {
        navigation.navigate('Register');
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior='padding'
                keyboardVerticalOffset={navigationHeaderHeight}
            >
                <ScrollView>
                    <View style={styles.authContainer}>
                        <Image
                            style={styles.logo}
                            source={require('../../../assets/pereclean-logo.png')}
                        />
                        <Text style={styles.errorMessage}>
                            {loginError}
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
                            style={{...styles.button, ...(loading ? styles.buttonDisabled : styles.buttonPlain)}}
                            disabled={loading}
                            onPress={handleSignIn}
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
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}