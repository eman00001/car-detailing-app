import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: 20,
        marginInline: 30,
    },
    inputLabel: {
        fontSize: 18,
        fontWeight: 700,
    },
    textInput: {
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 5,
        fontSize: 20,
        padding: 10,
    },
    button: {
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#DDD',
        padding: 10,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 700,
        textAlign: 'center',
    },
    linkText: {
        fontSize: 18,
        textDecorationLine: 'underline'
    },
    errorMessage: {
        color: '#B00',
        fontSize: 18,
    }
});
