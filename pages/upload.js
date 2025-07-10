import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, StyleSheet, ActivityIndicator } from 'react-native';
import PrimaryStyles from '../styles/primaryStyles';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import { Keyboard } from 'react-native';
import { Platform } from 'react-native';


const UploadScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { asset } = route.params;
    const [description, setDescription] = useState('');
    const [tagsList, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [thumbnailUri, setThumbnailUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const MAX_CHARACTERS = 50;
    const MAX_TAGS = 3;

    const ENABLE_COMPRESSION = true;

    useEffect(() => {
        if (ENABLE_COMPRESSION)
            generateThumbnail(asset.uri);
        else
            setThumbnailUri("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFSxxoFebm4n0mxtfXApVZ2_bqbAJIDTiYug&s");
    }, [asset.uri]);

    const generateThumbnail = async (fileUri) => {

        try {

            const thumbnailUri = `${FileSystem.cacheDirectory}thumbnail.jpg`;
            const fileInfo = await FileSystem.getInfoAsync(thumbnailUri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(thumbnailUri, { idempotent: true });
            }
            const localThumbnailPath = thumbnailUri.replace('file://', '');
            const command = `-y -i "${fileUri}" -ss 00:00:01 -frames:v 1 -update 1 -q:v 2 "${thumbnailUri}"`;
            const session = await FFmpegKit.execute(command);       

            const returnCode = await session.getReturnCode();
            console.log('Thumbnail generated at:', thumbnailUri);
            setThumbnailUri(`${thumbnailUri}?t=${Date.now()}`);

        } catch (error) {
            console.error('Error generating thumbnail:', error);
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && tagsList.length < MAX_TAGS) {
            setTags([...tagsList, newTag.trim()]);
            setNewTag('');
        } else if (tagsList.length >= MAX_TAGS) {
            Alert.alert('Error', 'You can only add up to 3 tags.');
        } else {
            Alert.alert('Error', 'Tag cannot be empty.');
        }
    };

    const handleRemoveTag = (index) => {
        const updatedTags = [...tagsList];
        updatedTags.splice(index, 1);
        setTags(updatedTags);
    };

    const handlePost = () => {
        navigation.navigate('UploadProgress', {
            asset,
            description,
            tagsList,
            thumbnailUri,
            ENABLE_COMPRESSION,
        });
    };

    return (
        <SafeAreaView style={PrimaryStyles.centered_screen}>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView style={PrimaryStyles.centered_stack}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>

                    <Text style={PrimaryStyles.title}>Upload</Text>
                    {thumbnailUri && <Image source={{ uri: thumbnailUri }} style={{ width: 200, height: 200, borderWidth: 2, borderColor: "#ccc" }} />}
                    <TextInput
                        style={[PrimaryStyles.input, { width: "100%", height: 100, textAlignVertical: 'top', borderColor: '#ccc', borderRadius: 5 }]}
                        multiline
                        maxLength={MAX_CHARACTERS}
                        placeholder="Enter caption..."
                        value={description}
                        onChangeText={setDescription}
                    />
                    <Text style={styles.tagLimit}>{description.length}/{MAX_CHARACTERS}</Text>
                    <View style={styles.tagsContainer}>
                        <View style={styles.tagsRow}>
                            <TextInput
                                style={[styles.tagInput, tagsList.length >= MAX_TAGS && styles.disabledInput]}
                                placeholder="Add a tag..."
                                value={newTag}
                                onChangeText={setNewTag}
                                editable={tagsList.length < MAX_TAGS}
                                maxLength={15}
                            />
                            <TouchableOpacity
                                onPress={handleAddTag}
                                style={[styles.addButton, tagsList.length >= MAX_TAGS && styles.disabledButton]}
                                disabled={tagsList.length >= MAX_TAGS}
                            >
                                <Text style={styles.addButtonText}>Add Tag</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tagList}>
                            {tagsList.map((tag, index) => (
                                <View key={index} style={styles.tagItem}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                                        <Ionicons name="close" size={16} style={styles.removeTag} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.tagLimit}>{tagsList.length}/{MAX_TAGS}</Text>
                    </View>
                    <TouchableOpacity onPress={handlePost} style={PrimaryStyles.button}>
                        {loading ? <ActivityIndicator size="large" color="white" style={{ margin: 10 }} /> : <Text style={PrimaryStyles.button_text}>Post</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={PrimaryStyles.secondary_button}>
                        <Text style={PrimaryStyles.secondary_button_text}>Cancel</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    tagsContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    tagInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        flex: 1,
        borderRadius: 5,
        marginRight: 10,
        backgroundColor: 'white',
    },
    disabledInput: {
        backgroundColor: '#f2f2f2',
        color: '#aaa',
    },
    addButton: {
        backgroundColor: 'rgb(255, 36, 83)',
        padding: 10,
        borderRadius: 5,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    addButtonText: {
        color: 'white',
    },
    tagLimit: {
        marginVertical: 5,
        color: '#aaa',
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        margin: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    tagText: {
        color: 'white',
    },
    removeTag: {
        marginLeft: 5,
        color: 'gray',
        fontWeight: 'bold',
    },
});

export default UploadScreen;
