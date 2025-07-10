import React from 'react';
import { useEffect } from 'react';
import 'react-native-gesture-handler';
import MainRouter from './navigation/MainRouter';
import { Provider } from 'react-redux';
import store from './store';
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { FFmpegKitConfig } from 'ffmpeg-kit-react-native';
import NavigationBarColor from 'react-native-navigation-bar-color';

export default function App() {

  //NavigationBarColor('#000000', true); // black color, light icons

  useEffect(() => {
        // Set log level for debugging
        FFmpegKitConfig.enableLogCallback(log => {
            console.log('FFmpeg Log:', log.getMessage());
        });

        // Set statistics callback for progress updates
        FFmpegKitConfig.enableStatisticsCallback(statistics => {
            console.log(`Time: ${statistics.getTime()}`);
        });

        console.log('FFmpegKit initialized successfully');
    }, []);

  useEffect(() => {
    const webUrl = 'http://127.0.0.1:8000/api';
    const androidUrl = 'http://10.0.2.2:8000/api';
    const expoUrl = 'http://10.0.100.147:8000/api';
    const awsUrl = 'https://api.popoffapp.com/api';
    //192.168.1.161
    
    axios.defaults.baseURL = awsUrl;
    console.log (axios.defaults.baseURL)
    axios.defaults.timeout = 5000;
    axios.defaults.headers.common['content-type'] = 'multipart/form-data';
  }, []);

  return (
    <Provider store={store}>
      <MainRouter/>
    </Provider>
  );
}
