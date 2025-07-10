import React, { useEffect, useState, memo } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Modal, Platform, TouchableWithoutFeedback, Clipboard, Alert, ActivityIndicator, PermissionsAndroid } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Audio } from 'expo-av';
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CommentSlider from "./comments";
import PrimaryStyles from "../styles/primaryStyles";
import { useNavigation } from "@react-navigation/native";
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native';
import { InteractionManager } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as Progress from 'react-native-progress'; // if not already
import * as MediaLibrary from 'expo-media-library';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const VideoItem = memo(({ item, isActive, style, updateStats = null, setCommentsOpen = null }) => {
    const player = useVideoPlayer(item.link, (player) => {
        player.loop = true;
        player.preferredForwardBufferDuration = 60.0;
    });

    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [likedVideos, setLikedVideos] = useState([]); // Store liked videos
    const [videoLikes, setVideoLikes] = useState(item.likes);
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [shareDrawerVisible, setShareDrawerVisible] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(null);
    const [downloadVisible, setDownloadVisible] = useState(false);
    const [isDownloadCanceled, setIsDownloadCanceled] = useState(false); // Track cancellation

    // Ensure audio plays on first load (e.g., through silent switch on iOS)
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
            staysActiveInBackground: false,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            playThroughEarpieceAndroid: false,
        });
    }, []);

    useEffect(() => {
        if (isActive) {
            player.play();
        }
    }, []);

    useEffect(() => {
        if (isActive && isFocused) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, isFocused]);

    useEffect(() => {
        if (!isActive && player && player.load) {
            // Trigger video load without playing
            player.load(item.link);
        }
    }, []);

    useEffect(() => {
        if (item.liked && !likedVideos.includes(item.id)) {
            setLikedVideos([...likedVideos, item.id]);
        }
    }, []);

    const likeVideo = async (videoId) => {
        try {
            const unliked = !likedVideos.includes(videoId);
            if (unliked) {
                setLikedVideos([...likedVideos, videoId]);
                setVideoLikes(videoLikes + 1);
            } else {
                setLikedVideos(likedVideos.filter((id) => id !== videoId));
                setVideoLikes(videoLikes - 1);
            }

            if (updateStats)
                updateStats({ "liked": unliked });

            const response = await axios.post(`/post/like/`, { video_id: videoId, like: unliked });
            console.log(response.data);

        } catch (error) {
            console.error("Error liking video:", error);
        }
    };

    const toggleComments = () => {
        console.log("setcommentsOpen in VideoItem:", typeof setCommentsOpen);

        setCommentsVisible(!commentsVisible);
        if (setCommentsOpen != null) {
            console.log("comments open ", !commentsVisible);
            setCommentsOpen(!commentsVisible);
        }
        if (!commentsVisible && updateStats) {
            updateStats({ viewed_comments: true });
        }
    };

    const video_tapped = event => {
        event.stopPropagation();
        if (player.playing)
            player.pause();
        else
            player.play();
    }

    const format_number = (num) => {
        //round to 1 decimal place
        num = Math.round(num * 10) / 10;
    }

    const openShareDrawer = () => {
        setShareDrawerVisible(true);
    };

    const closeShareDrawer = () => {
        setShareDrawerVisible(false);
    };

    const getPlaylistDurationSec = async (url) => {
        const probeCmd = `-i "${url}" -show_entries format=duration -v quiet -of csv="p=0"`;
        const probe = await FFmpegKit.executeAsync(probeCmd);
        const out = (await probe.getOutput())?.trim();
        const dur = parseFloat(out);
        return isNaN(dur) ? null : dur;            // seconds
    };

    useEffect(() => {
    if (downloadVisible) {
        // yield one render frame first
        setTimeout(() => {
        runDownload();
        }, 100); // 1 frame delay lets modal show
    }
    }, [downloadVisible]);

    const cancelDownload = () => {
        setIsDownloadCanceled(true);
        FFmpegKit.cancel(); // Cancel the FFmpeg process
        setDownloadVisible(false);
    };

    const runDownload = async () => {
        const m3u8Url = item.link;
        const tempPath = `${FileSystem.documentDirectory}video.mp4`;

        setIsDownloadCanceled(false); // Reset cancellation state

        InteractionManager.runAfterInteractions(async () => {
            try {
                await FileSystem.deleteAsync(tempPath, { idempotent: true });
            } catch { }

            const duration = item.length || 1;
            console.log("Playlist duration:", duration);   

            console.log('File path valid:', await FileSystem.getInfoAsync(FileSystem.documentDirectory));

            FFmpegKitConfig.enableStatisticsCallback((stats) => {
                if (isDownloadCanceled) return; // Stop updating progress if canceled

                const tMs = stats.getTime();
                const ratio = duration ? Math.min(tMs / (duration), 1) : 0;
                setDownloadProgress(ratio);
                console.log("Download progress:", ratio);
            });

            const command = `-i "${m3u8Url}" -c copy "${tempPath}"`;

            try {
                console.log("Running FFmpeg command:", command);
                const session = await FFmpegKit.execute(command);
                const rc = await session.getReturnCode();

                if (isDownloadCanceled) return; // Exit if canceled

                if (!ReturnCode.isSuccess(rc)) {
                    console.log('FFmpegKit error:', rc);
                    setDownloadVisible(false);
                    Alert.alert('Error', 'Failed to download the video.');
                    return;
                }

                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    setDownloadVisible(false);
                    Alert.alert('Permission denied', 'Cannot save video without Photos / Media access.');
                    return;
                }

                console.log('Video downloaded to:', tempPath);

                try {
                    const asset = await MediaLibrary.createAssetAsync(tempPath);
                    const album = await MediaLibrary.getAlbumAsync('PopOff');
                    if (album) {
                        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                    } else {
                        await MediaLibrary.createAlbumAsync('PopOff', asset, false);
                    }

                    Alert.alert('Success', 'Video saved to your Photos Gallery.');
                } catch (e) {
                    console.error('MediaLibrary error:', e);
                    Alert.alert('Error', 'Downloaded, but could not save to gallery.');
                }

                setDownloadVisible(false);
                FFmpegKitConfig.disableStatisticsCallback();
            } catch (err) {
                FFmpegKitConfig.disableStatisticsCallback();
                if (!isDownloadCanceled) {
                    FFmpegKitConfig.disableStatisticsCallback();
                    console.error('FFmpegKit exception', err);
                    setDownloadVisible(false);
                    Alert.alert('Exception', err.message);
                }
            }
        });
    };

    // Helper to block a user
    const blockUser = async () => {
        try {
            const response = await axios.post('/user/block_user/', { username: item.user });
            if (response.data && response.data.message) {
                Alert.alert('Success', response.data.message);
            } else {
                Alert.alert('User blocked!');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to block user.');
        }
        closeShareDrawer();
    };

    // Helper to report a video
    const reportVideo = async () => {
        const reason = "Inappropriate content"; // You can customize this or get it from user input
        try {
            const response = await axios.post('/post/report_video/', { video_id: item.id, reason });
            if (response.data && response.data.message) {
                Alert.alert('Success', response.data.message);
            } else {
                Alert.alert('Reported!');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to report video.');
        }
        closeShareDrawer();
    };

    const handleShare = async (type) => {
        if (type === 'copy') {
            Clipboard.setString(item.link);
            Alert.alert('Link copied!');
            closeShareDrawer();
        } else if (type === 'download') {
            setDownloadProgress(0);
            setDownloadVisible(true);
            closeShareDrawer();
        } else if (type === 'report') {
            Alert.alert(
                'Report Video',
                'Are you sure you want to report this video for violating our community guidelines?',
                [
                    { text: 'Cancel', style: 'cancel', onPress: closeShareDrawer },
                    { text: 'Report', onPress: reportVideo, style: 'destructive' },
                ],
            );
        } else if (type === 'block') {
            Alert.alert(
                'Block User',
                `Are you sure you want to block @${item.user}? This cannot be undone.`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: closeShareDrawer,
                    },
                    {
                        text: 'Block',
                        style: 'destructive',
                        onPress: blockUser,
                    },
                ]
            );
        }
    };

    return (

        <View style={{ ...style }}>
            <VideoView
                style={styles.video}
                player={player}
                contentFit="contain"
                nativeControls={false}
                onPlaybackStatusUpdate={(status) => {
                    if (status.isBuffering) console.log("Buffering...");
                    if (status.didJustFinish) console.log("Playback finished.");
                }}
            />

            <TouchableOpacity style={styles.overlayContainer} onPress={video_tapped}>
                <View style={styles.textContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate("FeedProfile", { username: item.user })}>
                        <Text style={styles.title}>{"@" + item.user}</Text>
                    </TouchableOpacity>
                    <Text style={styles.description}>{item.description}</Text>
                    {/*<Text style={styles.interest_level}  >{"Video Score: " + Math.round(item.rank_score * 10) / 10}</Text>*/}
                    <Text style={styles.interest_level}  >{"Interest Score: " + Math.round(item.interest_score * 100) / 100}</Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => likeVideo(item.id)}>
                        <Ionicons
                            style={styles.buttonIcon}
                            name="heart"
                            size={32}
                            color={likedVideos.includes(item.id) ? "rgb(255, 36, 83)" : "white"}
                        />
                        <Text style={styles.buttonText}>{videoLikes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={toggleComments}>
                        <Ionicons
                            style={styles.buttonIcon}
                            name="chatbubble"
                            size={32}
                            color="white"
                        />
                        <Text style={styles.buttonText}>{item.comments}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => openShareDrawer()}>
                        <Ionicons
                            style={styles.buttonIcon}
                            name="arrow-redo"
                            size={32}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Share Drawer Modal */}
            <Modal
                visible={shareDrawerVisible}
                transparent
                animationType="slide"
                onRequestClose={closeShareDrawer}
            >
                <TouchableWithoutFeedback onPress={closeShareDrawer}>
                    <View style={styles.drawerOverlay} />
                </TouchableWithoutFeedback>
                <View style={styles.shareDrawer}>
                    <View style={styles.shareRow}>
                        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('copy')}>
                            <Ionicons name="copy" size={28} color="#333" />
                            <Text style={styles.shareButtonText}>Copy Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('download')}>
                            <Ionicons name="download" size={28} color="#333" />
                            <Text style={styles.shareButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('report')}>
                            <Ionicons name="flag" size={28} color="#333" />
                            <Text style={styles.shareButtonText}>Report</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('block')}>
                            <Ionicons name="remove-circle" size={28} color="#333" />
                            <Text style={styles.shareButtonText}>Block User</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.cancelButton} onPress={closeShareDrawer}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {commentsVisible && (
                <View style={styles.commentsContainer}>
                    <CommentSlider videoId={item.id} isVisible={commentsVisible} onClose={toggleComments} updateStats={updateStats} />
                </View>
            )}

            {/* Download Progress Modal */}
            <Modal visible={downloadVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, alignItems: 'center', minWidth: 100 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 18 }}>
                            {downloadProgress < 1 ? 'Downloading...' : 'Finishing...'}
                        </Text>
                        <Progress.Bar
                            progress={downloadProgress}
                            width={220}
                            borderRadius={4}
                            unfilledColor="#eee"
                            color="rgb(255, 36, 83)"
                            borderWidth={0}
                        />
                        <TouchableOpacity onPress={cancelDownload} style={{ marginTop: 20 }}>
                            <Ionicons name="close-circle" size={32} color="gray" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
});

const styles = StyleSheet.create({
    video: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    overlayContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flex: 1,
        flexDirection: "column-reverse",
        justifyContent: "flex-start",
        alignItems: "stretch",
        padding: 10,
    },
    textContainer: {
        marginTop: 50,
        width: "100%",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginBottom: 10,
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    description: {
        fontSize: 16,
        color: "white",
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowRadius: 5,
        textShadowOffset: { width: 1, height: 1 },
        marginBottom: 10,
    },
    interest_level: {
        fontSize: 16,
        color: "rgb(255, 75, 144)",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5
    },
    buttonsContainer: {
        flexDirection: "column",
        alignItems: "flex-end",
        marginBottom: 20,
        width: "100%",
    },
    button: {
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 20,
        width: 40,
        opacity: 0.8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 8,
    },
    buttonIcon: {
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowRadius: 4,
        textShadowOffset: { width: 1, height: 1 },
    },
    commentsContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    drawerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.0)',
    },
    shareDrawer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        padding: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    shareRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    shareButton: {
        alignItems: 'center',
        marginHorizontal: 16,
    },
    shareButtonText: {
        marginTop: 8,
        fontSize: 14,
        color: '#333',
    },
    cancelButton: {
        marginTop: 10,
        padding: 10,
        width: '100%',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
});

export default VideoItem;