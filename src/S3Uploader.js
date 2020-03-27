import React, { useState, useEffect } from 'react';
import useAppState from 'react-native-appstate-hook';
import { useNetInfo } from '@react-native-community/netinfo';

import S3UploadAPI from './S3UploadAPI';
import { DebugBar } from './Debug';


const S3Uploader = ({ config, onSuccess, debug = false, ...otherProps }) => {

  const { appState } = useAppState();
  const [currentAppState, setCurrentAppState] = useState();
  const { isConnected } = useNetInfo();
  const [currentIsConnected, setCurrentIsConnected] = useState();


  useEffect(() => {
    if (config)
      S3UploadAPI.config(config);

    if (onSuccess)
      S3UploadAPI.onSuccess(onSuccess);

    return () => S3UploadAPI.clearListeners();
  }, []);

  useEffect(() => {
    const stateChangedToBackground = currentAppState != appState && appState == 'background';

    if (appState == 'active' && isConnected) {
      console.log('[S3UPLOADER] resuming functions...');
      S3UploadAPI.resume();
    } else if (stateChangedToBackground || !isConnected) {
      console.log(`[S3UPLOADER] pausing functions... ${(appState != 'active') ? 'app went background...' : ''} ${!isConnected ? 'internet connection lost...' : ''}`);
      S3UploadAPI.pause();
    }

    setCurrentAppState(appState);
    setCurrentIsConnected(isConnected);
  }, [appState, isConnected]);

  if (debug)
    return (<DebugBar />);
  else
    return null;

};

S3Uploader.config = (config) => S3UploadAPI.config(config);
S3Uploader.pause = () => S3UploadAPI.pause();
S3Uploader.resume = () => S3UploadAPI.resume();
S3Uploader.put = (key, content, options) => S3UploadAPI.put(key, content, options);
S3Uploader.onSuccess = (callback) => S3UploadAPI.onSuccess(callback);
S3Uploader.onStateChange = (calolback) => S3UploadAPI.onStateChange(callback);
S3Uploader.clearListeners = () => S3UploadAPI.clearListeners(callback);

export default S3Uploader;