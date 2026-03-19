import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { firebase_auth, db } from './src/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import LogOutScreen from './src/screens/auth/LogOutScreen';
import DetailerDashboardScreen from './src/screens/detailer/DetailerDashboardScreen';
import DetailerJobsScreen from './src/screens/detailer/DetailerJobsScreen';
import CustomerDashboardScreen from './src/screens/customer/CustomerDashboardScreen';
import CustomerCreateRequestScreen from './src/screens/customer/CustomerCreateRequestScreen';
import ChatsListScreen from './src/screens/chat/ChatsListScreen';
import ChatMessagesScreen from './src/screens/chat/ChatMessagesScreen';
import ErrorScreen from './src/screens/ErrorScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import DetailerMapScreen from './src/screens/detailer/DetailerMapOfCustomersScreen';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isDetailer, setIsDetailer] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebase_auth, async (user) => {
            setLoading(true); // begin loading
            setErrorMessage(null); // remove error message
            if (user) {
                try {
                    const docSnapshot = await getDoc(doc(db, 'users', user.uid));
                    // store user ID in async storage for quick retrieval
                    await AsyncStorage.setItem('userUid', user.uid);
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        setIsDetailer(data.isDetailer ?? false); // if no isDetailer field, is customer
                        await AsyncStorage.setItem('userName', data.name); // store user name in async storage for quick retrieval
                    } else {
                        setIsDetailer(false); // if not found, default to customer
                    }
                    setIsSignedIn(true);

                // if something went wrong, show error message on screen
                } catch (error) {
                    console.warn(error);
                    setErrorMessage('Something went wrong');
                }
            } else {
                setIsSignedIn(false);
            }

            setLoading(false); // stop loading once finish
        });

        return unsubscribe;
    }, []); // setup listner on load only

    // if loading, show loading icon
    if (loading) {
        return (
            <SafeAreaProvider>
                <LoadingScreen />
            </SafeAreaProvider>
        );
    }

    // if an error is found, display it to screen
    if (errorMessage != null) {
        return (
            <SafeAreaProvider>
                <ErrorScreen errorMessage={errorMessage} />
            </SafeAreaProvider>
        );
    }

    let Navigation;

    if (isSignedIn) {
        const ChatNavigator = createNativeStackNavigator({
            initialRouteName: 'ChatsList',
            screens: {
                ChatsList: {
                    screen: ChatsListScreen,
                    options: {
                        title: 'Chats',
                    },
                },
                ChatMessages: {
                    screen: ChatMessagesScreen,
                    options: ({ route }) => ({
                        title: `Messages with ${route.params?.chatName ?? 'Unknown User'}`,
                    }),
                },
            },
        })

        if (isDetailer) {
            const TabNavigator = createBottomTabNavigator({
                initialRouteName: 'DetailerDashboard',
                screenOptions: {
                    headerShown: false,
                },
                screens: {
                    DetailerDashboard: {
                        screen: DetailerDashboardScreen,
                        options: {
                            title: 'Detailer Dashboard',
                        },
                    },
                    DetailerJobsScreen: {
                        screen: DetailerJobsScreen,
                        options: {
                            title: 'Jobs',
                        },
                    },
                    DetailerMapScreen: {
                        screen: DetailerMapScreen,
                        options: {
                            title: 'Map',
                        },
                    },
                    DetailerChats: {
                        screen: ChatNavigator,
                        options: {
                            title: 'Chats',
                        },
                    },
                    LogOut: {
                        screen: LogOutScreen,
                        options: {
                            title: 'Log Out',
                        },
                    },
                },
            });
            Navigation = createStaticNavigation(TabNavigator);

        } else {
            const TabNavigator = createBottomTabNavigator({
                initialRouteName: 'CustomerDashboard',
                screenOptions: {
                    headerShown: false,
                },
                screens: {
                    CustomerDashboard: {
                        screen: CustomerDashboardScreen,
                        options: {
                            title: 'Customer Dashboard',
                        },
                    },
                    CustomerChats: {
                        screen: ChatNavigator,
                        options: {
                            title: 'Chats',
                        },
                    },
                    LogOut: {
                        screen: LogOutScreen,
                        options: {
                            title: 'Log Out',
                        },
                    },
                },
            });
            const CreateRequestStack = createNativeStackNavigator({
                initialRouteName: 'Home',
                screens: {
                    Home: {
                        screen: TabNavigator,
                        options: {
                            title: 'Home',
                            headerShown: false,
                        },
                    },
                    CreateRequest: {
                        screen: CustomerCreateRequestScreen,
                        options: {
                            title: 'Create Request',
                        },
                    },
                }
            })
            Navigation = createStaticNavigation(CreateRequestStack);
        }

    } else {
        const StackNavigator = createNativeStackNavigator({
            initialRouteName: 'Login',
            screens: {
                Login: LoginScreen,
                Register: RegisterScreen,
            },
        });
        Navigation = createStaticNavigation(StackNavigator);
    }

    return (
        <SafeAreaProvider>
            <Navigation></Navigation>
        </SafeAreaProvider>
    )
}