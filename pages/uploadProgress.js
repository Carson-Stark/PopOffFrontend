import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import * as Progress from 'react-native-progress';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { FFmpegKitConfig } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import PrimaryStyles from '../styles/primaryStyles';
import { Ionicons } from '@expo/vector-icons';


const UploadProgressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { asset, description, tagsList, thumbnailUri, ENABLE_COMPRESSION } = route.params;
  const [progress, setProgress] = useState(0);

  const [compressing, setCompressing] = useState(true);

  const ffmpegSessionRef = useRef(null); // To track the FFmpeg session
  const isCancelledRef = useRef(false); // To track cancellation state

  /**
   * Aborts and returns to the previous screen.
   * Also stops any ongoing FFmpeg session or uploads.
   */
  const cancelUpload = () => {
    isCancelledRef.current = true;
    FFmpegKit.cancel(); // Cancel any running FFmpeg session
    navigation.goBack();
  };

  /**
   * Converts the original video into an HLS VOD package.
   * Returns the directory containing segments + the master playlist.
   */
  const convertToHLS = async (fileUri) => {
    const outputDir = `${FileSystem.cacheDirectory}hls_output/`;
    const playlistFile = `${outputDir}playlist.m3u8`;

    const dirInfo = await FileSystem.getInfoAsync(outputDir);
    if (dirInfo.exists) {
      // Delete the directory and all its contents
      await FileSystem.deleteAsync(outputDir, { idempotent: true });
    }

    await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });

    FFmpegKitConfig.enableStatisticsCallback((stats) => {
      if (isCancelledRef.current) return;
      const perc = Math.min(stats.getTime() / (asset.duration || 1), 1);
      setProgress(perc * 0.5);
    });

    // const command = `-y -i "${fileUri}" -vf "scale=-2:'min(1920, ih)'" -g 48 -sc_threshold 0 -map 0:v:0 -map 0:a:0 -b:v 2000k -b:a 128k -hls_time 5 -hls_playlist_type vod -hls_segment_filename "${outputDir}segment_%03d.ts" "${playlistFile}"`;

    const hwCommand = `
      -y -i "${fileUri}" \
      -vf "scale=w=min(1920\\,iw):h=-2,format=yuv420p" \
      -g 48 -sc_threshold 0 -b:v 5000k \
      -c:a aac -b:a 128k \
      -hls_time 5 -hls_playlist_type vod \
      -hls_flags independent_segments \
      -hls_segment_filename "${outputDir}segment_%03d.ts" \
      "${playlistFile}"
    `.trim();

    const swCommand = `
      -y -i "${fileUri}" \
      -vf "scale=w='min(1920,iw)':h=-2" \
      -c:v libopenh264 -profile:v 66 -pix_fmt yuv420p -b:v 2000k -maxrate 1500k -bufsize 3000k -g 60 \
      -c:a aac -b:a 96k \
      -hls_time 5 -hls_playlist_type vod \
      -hls_flags independent_segments \
      -hls_segment_filename "${outputDir}segment_%03d.ts" \
      "${playlistFile}"
    `.trim();


    // 4. Try hardware/software, falling back on failure
    const session = await FFmpegKit.execute(hwCommand);
    ffmpegSessionRef.current = session;
    let returnCode = await session.getReturnCode();
    let logs = await session.getLogsAsString();
    const hwFailed = !ReturnCode.isSuccess(returnCode) || logs.toLowerCase().includes('error');

    if (hwFailed) {
      console.warn('Hardware HLS conversion failed, falling back to software:', logs);

      const swSession = await FFmpegKit.execute(swCommand);
      ffmpegSessionRef.current = swSession;
      returnCode = await swSession.getReturnCode();

      if (!ReturnCode.isSuccess(returnCode)) {
        const logs2 = await swSession.getLogsAsString();
        console.error('Software HLS conversion also failed:', logs2);
        throw new Error('This device is missing video encoding support required for uploading.');
      }
    }

    return { outputDir, playlistFile };
  };

  /**
   * Upload helper against a single pre-signed URL.
   */
  const S3_upload = async (upload_url, fileUri, mime) => {
    if (isCancelledRef.current) throw new Error('Upload cancelled');
    const res = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': mime },
      body: await (await fetch(fileUri)).blob(),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  /**
   * Uploads every HLS asset (segments + .m3u8) and the thumbnail.
   * Progress: 0.5 ‑ 0.95
   */
  const uploadMedia = async (outputDir, hlsFiles) => {
    if (isCancelledRef.current) throw new Error('Upload cancelled');
    const baseName = asset.uri.split('/').pop().split('.')[0];
    const res = await axios.post('/media/upload_hls/', {
      base_name: baseName,
      files: hlsFiles,
      type: 'application/x-mpegURL',
    });

    const { upload_urls, video_file_path, thumb_url, thumb_file_path } = res.data;

    let uploaded = 0;
    for (const file of hlsFiles) {
      if (isCancelledRef.current) throw new Error('Upload cancelled');
      const mime = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
      await S3_upload(upload_urls[file], `${outputDir}${file}`, mime);
      uploaded += 1;
      setProgress(0.5 + (uploaded / (hlsFiles.length + 1)) * 0.45);
    }

    // Upload thumbnail last
    if (isCancelledRef.current) throw new Error('Upload cancelled');
    await S3_upload(thumb_url, thumbnailUri, 'image/jpeg');
    setProgress(0.95);

    return { video_file_path, thumb_file_path };
  };

    /**
     * Finally, upload DB metadata and finish.
     */
    const uploadMetadata = async (video_file_path, thumb_file_path) => {
        const tags = tagsList.join(',');
        const payload = {
            file_path: video_file_path,
            thumbnail_path: thumb_file_path,
            file_size: asset.fileSize,
            length: asset.duration,
            width: asset.width,
            height: asset.height,
            description,
            tags,
        };
        await axios.post('/media/post/', payload);
        setProgress(1);
    };

    const startUpload = async () => {
        try {
            // 1. HLS encode
            setCompressing(true);
            const { outputDir } = await convertToHLS(asset.uri);

            setCompressing(false);

            // 2. Figure out which files need to go
            const manifest = await FileSystem.readDirectoryAsync(outputDir);
            const hlsFiles = manifest.filter(name => name.endsWith('.m3u8') || name.endsWith('.ts'));

            // 3. Upload all media
            const mediaResult = await uploadMedia(outputDir, hlsFiles);
            const { video_file_path, thumb_file_path } = mediaResult;

            // 4. Metadata
            await uploadMetadata(video_file_path, thumb_file_path);

            Alert.alert('Success', 'Upload complete!', [
                { text: 'OK', onPress: () => navigation.popToTop() },
            ]);
        } catch (err) {
           if (isCancelledRef.current) {
             return; // do nothing if cancelled
           }
           console.error(err);
           Alert.alert('Error', err.message || 'Something went wrong during upload.');
           navigation.goBack();
        }
    };

  useEffect(() => {
    startUpload();
  }, []);

  return (
    <View style={styles.container}>
      {!compressing ?
        <>
        <Text style={PrimaryStyles.title}>Uploading...</Text>
        </>
        :
        <Text style={PrimaryStyles.title}>Processing...</Text>
      }

      <Progress.Bar progress={progress} width={200} animated color="rgb(255, 36, 83)"/>
       <TouchableOpacity onPress={cancelUpload} style={styles.cancelButton}>
            <Ionicons name="close" size={28} color="rgb(150, 150, 150)" />
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor:"black"},
  text: { fontSize: 20, marginBottom: 20, color: "white"},
    cancelButton: {
        margin:20
    },
});

export default UploadProgressScreen;