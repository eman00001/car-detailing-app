import { View, Text, StyleSheet } from 'react-native';
import styles, { PRIMARY_FILL_DARK_COLOR, PRIMARY_TEXT_COLOR } from '../../stylesheet';

// the customer request has the following 4 steps
const STEPS = [
    {
        name: 'Basic Info',
        nameLong: 'Fill out Basic Information',
    },
    {
        name: 'Car Details',
        nameLong: 'Specify Details of Car',
    },
    {
        name: 'Photo',
        nameLong: 'Take Photo Of Car',
    },
    {
        name: 'Confirm',
        nameLong: 'Confirm Request',
    },
];

// currentStep holds which step (1-4) is currently being shown
export default function CustomerRequestStepIndicator({ currentStep }) {
    return (
        <View style={stepIndicatorStyles.container}>
            <View style={styles.row}>
                <View style={stepIndicatorStyles.currentStepIcon}>
                    <Text style={stepIndicatorStyles.currentStepIconText}>
                        {currentStep}
                    </Text>
                </View>
                <Text style={stepIndicatorStyles.currentStepText}>
                    {STEPS[currentStep-1].nameLong}
                </Text>
            </View>
            <View style={stepIndicatorStyles.stepsRow}>
                {STEPS.map(({ name }, stepIndex) => (
                    <View style={stepIndicatorStyles.stepContainer} key={name}>
                        <Text style={stepIndicatorStyles.stepText}>{name}</Text>
                        <View
                            style={[
                                stepIndicatorStyles.stepBar,
                                stepIndex < currentStep && stepIndicatorStyles.stepBarFilled
                            ]}
                        ></View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const stepIndicatorStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    currentStepIcon: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 99999,
        backgroundColor: PRIMARY_FILL_DARK_COLOR,
    },
    currentStepIconText: {
        fontSize: 15,
        fontWeight: 900,
        color: '#FFFFFF',
    },
    currentStepText: {
        fontSize: 18,
        fontWeight: 700,
        color: PRIMARY_TEXT_COLOR,
    },
    stepsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    stepContainer: {
        flex: 1,
        flexBasis: 0,
        alignItems: 'center',
    },
    stepText: {
        fontWeight: 700,
        color: PRIMARY_TEXT_COLOR,
    },
    stepBar: {
        width: '100%',
        height: 6,
        borderRadius: 2,
        backgroundColor: '#DDD',
    },
    stepBarFilled: {
        backgroundColor: PRIMARY_FILL_DARK_COLOR,
    }
});