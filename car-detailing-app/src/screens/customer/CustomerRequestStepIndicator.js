import { View, Text, StyleSheet } from 'react-native';

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
            <View style={stepIndicatorStyles.currentStepContainer}>
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

const STEP_INDICATOR_TEXT_COLOR = '#003BA9';
const STEP_INDICATOR_FILL_COLOR = '#577FCA';

const stepIndicatorStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    currentStepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,

    },
    currentStepIcon: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: STEP_INDICATOR_FILL_COLOR,
    },
    currentStepIconText: {
        fontSize: 15,
        fontWeight: 900,
        color: '#FFFFFF',
    },
    currentStepText: {
        fontSize: 18,
        fontWeight: 700,
        color: STEP_INDICATOR_TEXT_COLOR,
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
        color: STEP_INDICATOR_TEXT_COLOR,
    },
    stepBar: {
        width: '100%',
        height: 6,
        borderRadius: 2,
        backgroundColor: '#DDD',
    },
    stepBarFilled: {
        backgroundColor: STEP_INDICATOR_FILL_COLOR,
    }
});