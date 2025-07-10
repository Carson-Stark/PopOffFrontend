import { StyleSheet } from 'react-native';

const PrimaryStyles = StyleSheet.create({
    centered_screen: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        padding: 20,
    },
    screen_container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        alignItems: 'center',
        padding: 20,
    },
    centered_stack: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        backgroundColor: 'white',
    },
    button: {
        width: '100%',
        height: 40,
        margin: 12,
        backgroundColor: 'rgb(255, 36, 83)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button_text: {
        color: 'white',
        fontWeight: 'bold',
    },
    secondary_button: {
        width: '100%',
        height: 40,
        margin: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    secondary_button_text: {
        color: "black",
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
});

export default PrimaryStyles;