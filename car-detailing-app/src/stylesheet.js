import { StyleSheet } from "react-native";

export const SECONDARY_BG_COLOR = 'rgba(255, 251, 249, 1)';
export const SECONDARY_FILL_LIGHT_COLOR = 'rgba(238, 223, 216, 1)';

export const PRIMARY_COLOR = 'hsla(195, 100%, 71%, 1.00)';
export const PRIMARY_BG_COLOR = 'hsla(193, 100%, 98%, 1.00)';
export const PRIMARY_FILL_LIGHT_COLOR = 'hsla(195, 77%, 90%, 1.00)';
export const PRIMARY_FILL_DARK_COLOR = 'rgba(52, 171, 210, 1)';
export const PRIMARY_BORDER_COLOR = 'hsla(196, 54%, 66%, 1.00)';
export const PRIMARY_TEXT_COLOR = 'hsla(196, 100%, 23%, 1.00)';

export default StyleSheet.create({
    // container stylings
    container: {
        flex: 1,
        backgroundColor: SECONDARY_BG_COLOR,
    },
    containerCentered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: SECONDARY_BG_COLOR,
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: 20,
        marginInline: 30,
    },
    paddedContainer: {
        flex: 1,
        padding: 18,
        paddingBottom: 18,
        backgroundColor: SECONDARY_BG_COLOR,
    },
    paddedScrollContainer: {
        paddingBottom: 18, // scroll views don't apply padding to bottom, so new additional rule
    },
    listContainer: {
        gap: 12,
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
        backgroundColor: '#FFF',
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 5,
        fontSize: 20,
        padding: 10,
    },

    // button stylings
    button: {
        borderColor: PRIMARY_BORDER_COLOR,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
    },
    buttonText: {
        color: PRIMARY_TEXT_COLOR,
        fontSize: 20,
        fontWeight: 700,
        textAlign: 'center',
    },
    buttonPlain: {
        backgroundColor: PRIMARY_FILL_LIGHT_COLOR,
    },
    buttonPrimary: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    buttonDisabled: {
        backgroundColor: PRIMARY_BORDER_COLOR,
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
        borderColor: PRIMARY_FILL_LIGHT_COLOR,
        borderWidth: 1,
        padding: 18,
        borderRadius: 14,
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
    detailActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 18,
    },
    cardPressed: {
        opacity: 0.7,
    },
    map: {
        flex: 1
    },
    logo: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        borderColor: PRIMARY_COLOR,
        borderWidth: 5,
        borderRadius: 5,
    }
});
