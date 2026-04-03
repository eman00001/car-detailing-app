import { useEffect } from 'react';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../stylesheet';
import { useNavigation } from '@react-navigation/native';
import { Text } from 'react-native';

const ANIMATION_DURATION_MS = 2000; // success.lottie is a 2 second animation
const ANIMATION_COLOR = '#64BBBD'; // the color of the animation, so text can be matched

export default function SuccessTransitionScreen() {
    const navigation = useNavigation();

    // go to first screen in navigation once animation completes
    useEffect(() => {
        setTimeout(navigation.popToTop, ANIMATION_DURATION_MS);
    }, []);

    return (
        <SafeAreaView style={styles.containerCentered}>
            <LottieView
                autoPlay
                style={{
                    width: 300,
                    height: 300,
                }}
                source={require('../../assets/success.json')}
            />
            <Text
                style={{
                    color: ANIMATION_COLOR,
                    fontSize: 30,
                    textAlign: 'center',
                }}
            >
                Success!
            </Text>
        </SafeAreaView>
    );
}