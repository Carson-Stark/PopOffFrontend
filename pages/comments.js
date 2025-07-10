import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
    Pressable,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  View,
  Easing,                       // ← import Easing directly
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT   = SCREEN_HEIGHT * 0.55;
const COMPOSER_HGT   = 56;               // ≈ row height

export default function CommentSlider({ videoId, isVisible, onClose, updateStats }) {
  const [comments, setComments]   = useState([]);
  const [newComment, setComment]  = useState('');
  const [kbHeight, setKbHeight]   = useState(0);
  const translateY                = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  /* ——— open / close sheet ——— */
  useEffect(() => { isVisible ? open() : close(); }, [isVisible]);
  const open  = () => { fetchComments(); animateTo(0);  };
  const close = () => animateTo(SHEET_HEIGHT);
  const animateTo = to =>
    Animated.timing(translateY, {
      toValue: to,
      duration: 300,
      easing : Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  /* ——— keyboard listeners ——— */
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKbHeight(e.endCoordinates.height - 80),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbHeight(0),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  /* ——— data ——— */
  const fetchComments = async () => {
    try {
      const { data } = await axios.post('/post/get_comments/', { video_id: videoId });
      setComments(data.comments);
    } catch (err) { console.error(err); }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    Keyboard.dismiss();
    try {
      await axios.post('/post/add_comment/', { video_id: videoId, comment: newComment });
      setComment('');
      fetchComments();
      updateStats?.({ commented: true });
    } catch (err) { console.error(err); }
  };

  /* ——— UI ——— */
  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} />
        </TouchableOpacity>
      </View>

      {/* list + invisible overlay that dismisses the keyboard */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={comments}
          keyExtractor={i => i.id.toString()}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Text style={styles.user}>{item.user}</Text>
              <Text>{item.comment}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: COMPOSER_HGT }}
          style={{ flex: 1 }}
        />

        {/* overlay appears only when kb is up; composer row is above it */}
        {kbHeight > 0 && (
        <Pressable
            onPress={Keyboard.dismiss}
            style={[
            StyleSheet.absoluteFill,                 // full‑screen …
            { bottom: COMPOSER_HGT + kbHeight},     // … minus composer strip
            ]}
            pointerEvents="auto"
        />
        )}
      </View>

      {/* composer – absolutely positioned & slides up with the keyboard */}
      <Animated.View
        style={[
          styles.composer,
          { transform: [{ translateY: -kbHeight }] },
        ]}
        keyboardShouldPersistTaps={'always'}
      >
        <TextInput
          style={styles.input}
          placeholder="Add a comment"
          value={newComment}
          onChangeText={setComment}
          onSubmitEditing={addComment}
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={addComment} style={styles.send}>
          <Ionicons name="send" size={22} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  commentRow: { padding: 14 },
  user: { fontWeight: '600', marginBottom: 2 },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,                 //  <-- new line
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
},
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
  },
  send: {
    backgroundColor: 'rgb(255,36,83)',
    borderRadius: 6,
    padding: 8,
  },
});