import { StyleSheet } from "react-native";

export default StyleSheet.create({
    // container stylings
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

    // heading stylings
    h1: {
        fontSize: 32,
        fontWeight: "700",
        lineHeight: 40,
        marginBottom: 12,
    },
    h2: {
        fontSize: 26,
        fontWeight: "700",
        lineHeight: 34,
        marginBottom: 10,
    },
    h3: {
        fontSize: 22,
        fontWeight: "600",
        lineHeight: 30,
        marginBottom: 8,
    },
    h4: {
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 24,
        marginBottom: 6,
    },
    h5: {
        fontSize: 16,
        fontWeight: "500",
        lineHeight: 22,
        marginBottom: 4,
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
