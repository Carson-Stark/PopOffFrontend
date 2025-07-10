import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Platform, Dimensions, RefreshControl, ActivityIndicator, Text, SafeAreaView, TouchableOpacity } from "react-native";
import VideoItem from "./video";
import axios from "axios";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { current } from "@reduxjs/toolkit";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MAX_VIDEOS = 20; // Maximum number of feed to keep in memory
const BATCH_SIZE = 5;

const Feed = () => {
    const navigation = useNavigation();
    const [feed, setFeed] = useState([]);
    const flatListRef = useRef(null); // attach to FlatList
    const [currentVideoId, setCurrentVideoId] = useState(0);
    const currentVideoIdRef = useRef(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isFetchingNextBatch, setIsFetchingNextBatch] = useState(false);
    const [videoStats, setVideoStats] = useState({video_id: null, watch_time: 0, liked: false, commented: false, viewed_comments: false});
    const watchTimeRef = useRef(0);
    const watchTimeIntervalRef = useRef(null);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [noMoreVideos, setNoMoreVideos] = useState(false);
    const [followersOnly, setFollowersOnly] = useState(false);

    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();

    const extraOffset = Platform.OS === 'android' ? 50 : 0;
    const PLAYER_HEIGHT = Dimensions.get("window").height - tabBarHeight - insets.top;

    const blockedUsers = useSelector(state => state.blockedUsers);
    const filteredFeed = feed.filter(item => !blockedUsers.includes(item.user));

    const updateVideoStats = (new_stat) => {
        setVideoStats((prevStats) => ({ ...prevStats, ...new_stat }));
    };

    useEffect(() => {
        console.log(PLAYER_HEIGHT);
        if (feed.length == 0) {
            fetchFeedBatch(true); // Initial fetch
            startTrackingWatchTime(); // Start tracking watch time for the first video
        }
    }, []);

    const resetVideoStats = () => {
        setVideoStats({ video_id: null, watch_time: 0, liked: false, commented: false, viewed_comments: false });
    }

    useEffect(() => {
        // Reset watch time and start tracking when the visible index changes
        watchTimeRef.current = 0; // Reset the watch time reference
        stopTrackingWatchTime();  // Stop any previous tracking
        startTrackingWatchTime(); // Start tracking for the new video

        if (videoStats["video_id"])
        sendVideoStats(); // Send stats for the previous video
        resetVideoStats();
        const index = feed.findIndex(v => v.id === currentVideoId);
        const currentVideo = feed[index];
        if (currentVideo)
            updateVideoStats({video_id: currentVideo.id});

        return () => {
            stopTrackingWatchTime(); // Cleanup interval when the component unmounts or index changes
        };
    }, [currentVideoId]); // Trigger effect when visibleIndex changes

    const startTrackingWatchTime = () => {
        watchTimeIntervalRef.current = setInterval(() => {
            watchTimeRef.current += 0.1; // Increment watch time by 1 second
        }, 100);
    };

    const stopTrackingWatchTime = () => {
        if (watchTimeIntervalRef.current) {
            clearInterval(watchTimeIntervalRef.current); // Clear the interval
            watchTimeIntervalRef.current = null; // Reset the interval reference
        }
    };

    const fetchFeedBatch = async (isInitialFetch = false, overrideFollowersOnly) => {
        console.log("Loading new Batch...");

        setIsFetchingNextBatch(true);
        if (isInitialFetch) {
            setNoMoreVideos(false);
        }
     
         try {

             const useFollowersOnly = overrideFollowersOnly !== undefined ? overrideFollowersOnly : followersOnly;
             const response = await axios.get(`/media/get_feed/`, {
                params: {
                    batch_size: BATCH_SIZE,
                    exclude_ids: isInitialFetch ? [] : feed.map(video => video.id),
                    followers_only: useFollowersOnly,
                },
             });

             console.log("Fetched feed:", response.data.feed);

             if (!response.data.feed) {
                 console.log("No more videos to fetch");
                 return;
             }

             const newVideos = response.data.feed;
             setFeed(prev => [...prev, ...newVideos]);
             if (newVideos.length < BATCH_SIZE) {
                setNoMoreVideos(true);
            }
             if (isInitialFetch && newVideos.length > 0) {
                // Ensure first video is set active after initial fetch
                setCurrentVideoId(newVideos[0].id);
                currentVideoIdRef.current = newVideos[0].id;
             }
         
             console.log("Total feed:", feed.length + newVideos.length);

         } catch (error) {
             console.error("Error fetching feed:", error);
         }

         setIsFetchingNextBatch(false);
     };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchFeedBatch(true);
        setRefreshing(false);
    };

    const preloadNextBatch = async () => {
        await fetchFeedBatch();
    };

    const sendVideoStats = async () => {
        try {
            if (!videoStats.video_id || videoStats.watch_time < 1) return; // No video to send stats for
            console.log("Sending video stats: ", videoStats);
            const response = await axios.post(`/post/update_posts_engagement/`, videoStats, { headers: { "Content-Type": "application/json" } });
            console.log("Stats updated:", response.data);
        } catch (error) {
            console.error("Error updating video stats:", error);
        }
    }

    const handleViewableItemsChanged = ({ viewableItems }) => {
        //swiped to next video

        console.log("Viewable items changed:", viewableItems);

        if (noMoreVideos && viewableItems.length == 0) {
                setCurrentVideoId(null);
                currentVideoIdRef.current = null;

                const previousVideo = feed[feed.length - 1];
                if (previousVideo) {
                    const cappedWatchTime = Math.min(watchTimeRef.current, previousVideo.duration * 2);
                    updateVideoStats({watch_time: cappedWatchTime});
                };
                return;
            }

        const visibleItem = viewableItems[0];
        if (visibleItem && !isFetchingNextBatch) {
            // If the last item is visible and no more videos, deactivate video
            setCurrentVideoId(visibleItem.item.id);
            currentVideoIdRef.current = visibleItem.item.id;

            const currentVideo = feed[visibleItem.index];
            const previousVideo = feed[visibleItem.index - 1];

            if (previousVideo) {
                const cappedWatchTime = Math.min(watchTimeRef.current, previousVideo.duration * 2);
                updateVideoStats({watch_time: cappedWatchTime});
            };

            // Preload when the user approaches the end of the list
            console.log("fetching: ", isFetchingNextBatch);
            console.log("Displaying video id:", currentVideo.id, "index:", visibleItem.index);
            if (visibleItem.index >= feed.length - 2 && !isFetchingNextBatch) {
                preloadNextBatch();
            }
        }
    };

    const viewabilityConfig = {
        viewAreaCoveragePercentThreshold: 50,
    };

    const renderItem = ({ item, index }) => {
        const isActive = item.id === currentVideoId;
        return (
            <VideoItem
                item={item}
                isActive={isActive}
                style={{ height: PLAYER_HEIGHT }}
                updateStats={(stats) => updateVideoStats(stats)}
                setCommentsOpen={setCommentsOpen}
            />
        );
    };

    const renderFooter = useMemo(() => {
        if (isFetchingNextBatch) {
            return (
                <View style={[styles.videoInstanceContainer, { height: PLAYER_HEIGHT, justifyContent: "center", alignItems: "center" }]}> 
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color="white" />
                    </View>
                </View>
            );
        }
        if (noMoreVideos) {
            return (
                <View style={[styles.videoInstanceContainer, { height: PLAYER_HEIGHT, justifyContent: "center", alignItems: "center" }]}> 
                    <Text style={styles.centered_text}>You're all caught up!</Text>
                </View>
            );
        }
        return null;
     }, [isFetchingNextBatch, noMoreVideos]);


    const keyExtractor = useCallback((item, index) => 
        item.id.toString() + "_" + index.toString(),
        []
    );

    // Handler to switch between For You and Following modes
    const handleModeChange = (newFollowersOnly) => {
        if (newFollowersOnly !== followersOnly) {
            setFollowersOnly(newFollowersOnly);
            setFeed([]);
            setNoMoreVideos(false);
            setCurrentVideoId(0);
            if (flatListRef.current) flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            // pass overrideFollowersOnly to use updated flag immediately
            fetchFeedBatch(true, newFollowersOnly);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { height: PLAYER_HEIGHT }]}>  
            <View style={[styles.modeToggleContainer, { top: Platform.OS == 'ios' ? insets.top + 10 : 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>  
                <TouchableOpacity style={styles.searchButton} onPress={() => navigation.navigate('Search')}>
                    <Ionicons name="search" size={30} color="rgba(255, 255, 255, 0.7)"
                    textShadowColor="rgba(0, 0, 0, 0.5)" textShadowRadius={5} textShadowOffset={{ width: 1, height: 1 }} />
                </TouchableOpacity>
                <Pressable style={{ flex: 1, alignItems: 'flex-end', paddingRight: 10 }} onPress={() => handleModeChange(false)}>
                    <Text style={[styles.modeText, !followersOnly && styles.modeTextActive]}>For You</Text>
                </Pressable>
                <View style={{ height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.5)' }} />
                <Pressable style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 10 }} onPress={() => handleModeChange(true)}>
                    <Text style={[styles.modeText, followersOnly && styles.modeTextActive]}>Following</Text>
                </Pressable>
            </View>
             <FlatList
                data={filteredFeed}
                ref={flatListRef}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                pagingEnabled
                snapToInterval={PLAYER_HEIGHT}
                decelerationRate={"fast"}
                horizontal={false}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0,            // keep the 1st visible row stable
                    autoscrollToTopThreshold: -1      // never auto‑scroll back to top
                }}
                windowSize={5}
                maxToRenderPerBatch={BATCH_SIZE}
                initialNumToRender={BATCH_SIZE}
                ListFooterComponent={renderFooter}
                keyboardShouldPersistTaps={"always"}
                scrollEnabled={!commentsOpen}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    centered_text: {
        color: "white",
        textAlign: "center",
        justifyContent: "center",
        fontSize: 18,
        fontWeight: "bold",
    },
    centeredWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        width: "100%",
        height: "100%",
    },
    videoInstanceContainer: {
        flex: 1,
    },
    modeToggleContainer: {
        position: 'absolute',
        top: 5,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        zIndex: 10,
    },
    modeText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 'normal',
        marginHorizontal: 20,
        fontSize: 16,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5
    },
    modeTextActive: {
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5
    },
    searchButton: {
        position: 'absolute',
        top: 10,
        right: 20,
        zIndex: 10,
    },
});

export default Feed;
