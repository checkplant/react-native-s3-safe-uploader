import React, { useState, useEffect } from 'react';
import useAppState from 'react-native-appstate-hook';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

import S3UploadAPI from './S3UploadAPI';


const Button = ({ label, style, ...otherProps }) => {
  return (
    <TouchableOpacity style={{ borderRadius: 99, backgroundColor: 'red', paddingVertical: 4, paddingHorizontal: 8, ...style }} { ...otherProps }>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const S3Uploader = ({ config, onSuccess, ...otherProps }) => {

  const { appState } = useAppState();
  const { isConnected } = useNetInfo();
  const [state, setState] = useState(S3UploadAPI.state.IDDLE);


  useEffect(() => {
    if (config)
      S3UploadAPI.config(config);

    if (onSuccess)
      S3UploadAPI.onSuccess(onSuccess);

    S3UploadAPI.onStateChange((newState, oldState) => setState(newState));

    return () => S3UploadAPI.clearListeners();
  }, []);

  useEffect(() => {
    if (appState == 'active' && isConnected) {
      S3UploadAPI.resume();
      console.log('[S3UPLOADER] ready to resume functions!');
    } else {
      S3UploadAPI.pause();
      console.log(`[S3UPLOADER] pausing functions... ${(appState != 'active') ? 'app went background...' : ''} ${!isConnected ? 'no internet connection...' : ''}`);
    }
  }, [appState, isConnected]);


  const addSampletextFile = () => {
    const fileName = new Date().toISOString().split(':').join('-');
    const data = 'Content for sample text file with name ' + fileName;
    S3UploadAPI.put(`tests/${fileName}.txt`, { data });
  };

  return (
    <View style={{ flexDirection: 'row', alignItens: 'center', padding: 8 }}>
      <Button label="Upload sample text" onPress={addSampletextFile} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, color: 'balck', textAlign: 'center' }}>{state}</Text>
      </View>
      <Button label="Pause" onPress={() => S3UploadAPI.pause()} />
      <Button label="Resume" onPress={() => S3UploadAPI.resume()} style={{ marginLeft: 4 }} />
    </View>
  );

};

S3Uploader.config = (config) => S3UploadAPI.config(config);
S3Uploader.pause = () => S3UploadAPI.pause();
S3Uploader.resume = () => S3UploadAPI.resume();
S3Uploader.put = (key, content, options) => S3UploadAPI.put(key, content, options);
S3Uploader.onSuccess = (callback) => S3UploadAPI.onSuccess(callback);
S3Uploader.onStateChange = (calolback) => S3UploadAPI.onStateChange(callback);
S3Uploader.clearListeners = () => S3UploadAPI.clearListeners(callback);

export default S3Uploader;