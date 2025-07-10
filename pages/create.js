import React from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PrimaryStyles from '../styles/primaryStyles';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import UploadScreen from './upload';
import UploadProgressScreen from './uploadProgress';

const Stack = createStackNavigator();

const CreateScreenComponent = () => {
    const navigation = useNavigation();

    const [uploading, setUploading] = React.useState(false);

    const openGallery = async () => {
        // Request permissions to access the media library
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "You cannot upload a video without granting permission to access the media library.");
            return;
        }

        setUploading(true);

        // Launch the image picker
        try {
            const result = await ImagePicker.launchImageLibraryAsync(
                {
                    mediaTypes: ['videos'],
                    allowsMultipleSelection: false,
                    videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
                    quality: 0.7
                }
            );

            if (result != null && !result.cancelled) {
                const asset = result.assets[0];

                console.log("Selected File:", asset);

                if (asset.duration > 60000) {
                    Alert.alert("Upload Failed", "Video must be under 60 seconds.")
                }
                else {
                    // Navigate to UploadScreen with video data
                    navigation.navigate('Upload', { asset });
                }
            }
        }
        catch (error) {
            console.log("Error uploading video:", error);
        }

        setUploading(false);
    };

    return (
        <View style={PrimaryStyles.centered_screen}>
            {uploading ? (
                <>
                    <Text style={PrimaryStyles.title}>Processing Video...</Text>
                    <Text style={[PrimaryStyles.button_text, { color: '#aaa', marginTop: 0 }]}>This may take a while.</Text>
                    <ActivityIndicator size="large" color="#888" style={{ marginVertical: 20 }} />
                </>
            ) : (
                <>
                    <Text style={PrimaryStyles.title}>Create</Text>
                    <TouchableOpacity onPress={openGallery} style={PrimaryStyles.button}>
                        <Text style={PrimaryStyles.button_text}>Open Gallery</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const CreateScreen = () => {
    return (
        <Stack.Navigator initialRouteName="CreateScreenComponent" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CreateScreenComponent" component={CreateScreenComponent} />
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name = "UploadProgress" component={UploadProgressScreen} />
        </Stack.Navigator>
    );
};

export default CreateScreen;
