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
    },
    closeIcon: {
        backgroundColor: '#DDD',
        color: '#555',
        position: 'absolute',
        right: 6,
        top: 6,
        width: 20,
        height: 20,
        fontSize: 18,
        lineHeight: 20,
        fontWeight: 700,
        borderRadius: '50%',
        textAlign: 'center',
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 18,
        borderRadius: 14,
        marginBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    left: {
        flex: 1,
    },
    right: {
        justifyContent: "center",
        alignItems: "flex-end",
    },
    service: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
    },
    vehicle: {
        fontSize: 16,
        color: "#444",
        marginBottom: 6,
    },
    date: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    status: {
        fontSize: 14,
        fontWeight: "700",
    },
    detailScroll: {
        padding: 16,
    },
    detailSection: {
        marginBottom: 18,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
    },
    detailImage: {
        width: '100%',
        height: 220,
        borderRadius: 14,
        marginTop: 10,
    },
    detailMapContainer: {
        height: 260,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 18,
    },
    cardPressed: {
        opacity: 0.7,
    },
    map: {
        flex: 1
    }
});
