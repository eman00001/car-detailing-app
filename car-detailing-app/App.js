import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { firebase_auth, db } from './src/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import LogOutScreen from './src/screens/auth/LogOutScreen';
import DetailerDashboardScreen from './src/screens/detailer/DetailerDashboardScreen';
import DetailerJobsScreen from './src/screens/detailer/DetailerJobsScreen';
import CustomerDashboardScreen from './src/screens/customer/CustomerDashboardScreen';
import ChatScreen from './src/screens/chat/ChatScreen';

export default function App() {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isDetailer, setIsDetailer] = useState(false);

    useEffect(() => {
        onAuthStateChanged(firebase_auth, async (user) => {
            if (user) {
                console.log("Try Sign In");
                try {
                    const querySnapshot = await getDocs(
                        query(
                            collection(db, 'detailers'),
                            where('uid', '==', user.uid)
                        )
                    );
                    if (querySnapshot.empty) {
                        setIsDetailer(false);
                    } else {
                        setIsDetailer(true);
                    }
                    setIsSignedIn(true);

                } catch (error) {
                    console.warn(error);
                }
            } else {
                setIsSignedIn(false);
            }
        });
    }, []); // setup listner on load only

    if (isSignedIn) {
        const Tab = createBottomTabNavigator();
        if (isDetailer) {
            return (
                <SafeAreaProvider>
                    <NavigationContainer>
                        <Tab.Navigator initialRouteName="Detailer Dashboard">
                            <Tab.Screen name="Detailer Dashboard" component={DetailerDashboardScreen} />
                            <Tab.Screen name="Detailer Jobs" component={DetailerJobsScreen} />
                            <Tab.Screen name="Detailer Chat" component={ChatScreen} />
                            <Tab.Screen name="Log Out" component={LogOutScreen} />
                        </Tab.Navigator>
                    </NavigationContainer>
                </SafeAreaProvider>
            );
        } else {
            return (
                <SafeAreaProvider>
                    <NavigationContainer>
                        <Tab.Navigator initialRouteName="Customer Dashboard">
                            <Tab.Screen name="Customer Dashboard" component={CustomerDashboardScreen} />
                            <Tab.Screen name="Customer Chat" component={ChatScreen} />
                            <Tab.Screen name="Log Out" component={LogOutScreen} />
                        </Tab.Navigator>
                    </NavigationContainer>
                </SafeAreaProvider>
            );
        }
    } else {
        const Stack = createNativeStackNavigator();
        return (
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Login">
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        );
    }
}