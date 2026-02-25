import { StyleSheet } from "react-native";

export default StyleSheet.create({
    // container stylings
    container: {
        flex: 1,
    },
    containerCentered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: 20,
        marginInline: 30,
    },

    // input stylings
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

    // button stylings
    button: {
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 700,
        textAlign: 'center',
    },
    buttonPlain: {
        backgroundColor: '#DDD',
    },
    buttonDisabled: {
        backgroundColor: '#AAA',
    },
    
    // link stylings
    linkText: {
        fontSize: 18,
        textDecorationLine: 'underline'
    },

    // misc stylings
    errorMessage: {
        color: '#B00',
        fontSize: 18,
    }
});
