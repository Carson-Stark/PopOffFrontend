import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { loginAction } from '../store/actions';
import PrimaryStyles from '../styles/primaryStyles';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native';
import { Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

const RegisterScreen = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [agreed, setAgreed] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error_message, setError] = useState(null);

    const dispatch = useDispatch();

    const createAccount = () => {
        console.log('create account');
        handleResponse(false);
    }

    const navigation = useNavigation();

    const handleResponse = async (login) => {

        console.log('username:', username);
        console.log('password:', password);

        setLoading(true);
        setError(null);

        const response = await axios.post(`/auth/register/`, { username, email, password, phoneNumber })
            .then(response => {
                console.log(response.data);
                const { token, user } = response.data;
                axios.defaults.headers.common['Authorization'] = `Token ${token}`;
                dispatch(loginAction({ username })); // Set the Redux state with the username
                navigation.navigate("Inside")
            })
            .catch(error => {
                console.log(error);

                user_message = error.message;

                if (!error.response) {
                    setError("Network Error");
                    setLoading(false);
                    return;
                }

                const message = error.response.data;
                console.log(message);
                if (message['non_field_errors']) {
                    user_message = message['non_field_errors'][0];
                }
                else if (message['username']) {
                    user_message = "Username not specified";
                }
                else if (message['email']) {
                    if (message['email'][0] === "Enter a valid email address.")
                        user_message = "Invalid email address";
                    else
                        user_message = "Email not specified";
                }
                else if (message['password']) {
                    user_message = "Password not specified";
                }
                else if (error.code === 'ERR_BAD_RESPONSE') {
                    // could be other things
                    user_message = "Account with username or email already exists";
                }

                setError(user_message);
            });
        
        setLoading(false);
    }

    return (
        <SafeAreaView style={[PrimaryStyles.screen_container, {justifyContent: 'center', alignItems: 'center'}]}>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView style={[PrimaryStyles.centered_stack,{justifyContent: 'center', alignItems: 'center', width: '90%'}]}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>

                {/*input fields*/}        
                <TextInput placeholder='Username' value={username} style={PrimaryStyles.input} onChangeText={text => setUsername(text)} />
                <TextInput placeholder='Email' value={email} style={PrimaryStyles.input} onChangeText={text => setEmail(text)} />
                <TextInput placeholder='Phone Number' value={phoneNumber} style={PrimaryStyles.input} onChangeText={text => setPhoneNumber(text)} inputMode='numeric' keyboardType='numeric' />
                <TextInput placeholder='Password' value={password} style={PrimaryStyles.input} secureTextEntry={true} onChangeText={text => setPassword(text)} />
                {/* Terms of Service Checkbox */}
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}
                    onPress={() => setAgreed(!agreed)}
                    disabled={loading}
                >
                    <View style={{
                        width: 24, height: 24, borderWidth: 2, borderColor: '#ccc', borderRadius: 6, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: agreed ? 'rgb(255,36,83)' : 'white'
                    }}>
                        {agreed && <Ionicons name="checkmark" size={18} color="white" />}
                    </View>
                    <Text style={{ color: 'white', flex: 1, flexWrap: 'wrap' }}>
                        I agree to the{' '}
                        <Text style={{ color: 'rgb(255, 36, 83)', textDecorationLine: 'underline' }} onPress={() => {
                            Linking.openURL('https://alder-phlox-1e6.notion.site/PopOff-Terms-of-Service-1f95bd204ac180049762d7257a6880c0');
                        }}>
                            Terms of Service
                        </Text>
                        {' '}and{' '}
                        <Text style={{ color: 'rgb(255, 36, 83)', textDecorationLine: 'underline' }} onPress={() => {
                            Linking.openURL('https://alder-phlox-1e6.notion.site/Privacy-Policy-1f65bd204ac18055ad65db63b46b677a');
                        }}>
                            Privacy Policy
                        </Text>
                    </Text>
                </TouchableOpacity>

                {error_message && <Text style={PrimaryStyles.error}>{error_message}</Text>}                    

                <TouchableOpacity onPress={() => createAccount()} disabled={loading || !agreed} style={[PrimaryStyles.button, (!agreed ? { opacity: 0.5 } : {})]}>
                    {loading ? <ActivityIndicator size="large" color="white" style={{ margin: 10 }} /> : <Text style={PrimaryStyles.button_text} > Create Account </Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                    <Text style={PrimaryStyles.button_text} > I already have an account </Text>
                </TouchableOpacity>
                    
                {/*loading and error messages*/}
                {loading && <ActivityIndicator size="large" color="black" style={{ margin: 10, marginRight: "auto"  }} />}

            </KeyboardAvoidingView>
            </TouchableWithoutFeedback>

        </SafeAreaView>
    );
}

export default RegisterScreen;
