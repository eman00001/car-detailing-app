import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { View, TextInput, Text, Pressable, KeyboardAvoidingView, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

import styles from '../../stylesheet';
import { getFirebaseAuthErrorMessage } from '../../firebaseUtils';
import { firebase_auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registerError, setRegisterError] = useState('');

    const navigationHeaderHeight = useHeaderHeight();

    const handleRegister = async () => {
        setRegisterError(''); // reset error message
        setLoading(true); // begin loading

        // if name field is empty, show error and cancel register
        if (name.trim().length === 0) {
            setRegisterError('Please enter your name');
            return;
        }

        // if passwords do not match, show error and cancel register
        if (password !== confirmPassword) {
            setRegisterError('Passwords do not match');
            return;
        }

        try {
            const response = await createUserWithEmailAndPassword(firebase_auth, email, password);
            const docRef = doc(db, 'users', response.user.uid); // store user's name in Firestore
            await setDoc(docRef, { name });
            console.log('Created user!');
            // loading finishes when App.js handles auth, so do not change here
        } catch (error) {
            console.warn(error);
            // if error, display error message on screen and log to console
            const errorMessage = getFirebaseAuthErrorMessage(error);
            setRegisterError(errorMessage);
            setLoading(false); // finish loading
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior='padding'
                keyboardVerticalOffset={navigationHeaderHeight}
            >
                <ScrollView contentContainerStyle={styles.paddedScrollContainer}>
                    <View style={styles.authContainer}>
                        <Image
                            style={styles.logo}
                            source={require('../../../assets/pereclean-logo.png')}
                        />
                        <Text style={styles.errorMessage}>
                            {registerError}
                        </Text>
                        <View>
                            <Text style={styles.inputLabel}>
                                Name
                            </Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                style={styles.textInput}
                            />
                        </View>
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
                        <View>
                            <Text style={styles.inputLabel}>
                                Confirm Password
                            </Text>
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={true}
                                style={styles.textInput}
                            />
                        </View>
                        <Pressable
                            style={[styles.button, loading ? styles.buttonDisabled : styles.buttonPrimary]}
                            disabled={loading}
                            onPress={handleRegister}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Register
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
