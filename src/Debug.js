import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

import S3UploadAPI from './S3UploadAPI';


export const DebugButton = ({ label, style, ...otherProps }) => {
  return (
    <TouchableOpacity style={{ borderRadius: 99, backgroundColor: 'red', paddingVertical: 4, paddingHorizontal: 8, ...style }} { ...otherProps }>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};


export const DebugBar = ({ config, onSuccess, ...otherProps }) => {

  const [apiState, setApiState] = useState(S3UploadAPI._state);

  useEffect(() => S3UploadAPI.onStateChange(state => setApiState(state)), []);

  const addSampletextFile = () => {
    const fileName = new Date().toISOString().split(':').join('-');
    const data = 'Content for sample text file with name ' + fileName;
    S3UploadAPI.put(`tests/${fileName}.txt`, { data });
  };

  return (
    <View style={{ flexDirection: 'row', alignItens: 'center', padding: 8 }}>
      <DebugButton label="Upload sample text" onPress={addSampletextFile} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, color: 'balck', textAlign: 'center' }}>{apiState}</Text>
      </View>
      <DebugButton label="Pause" onPress={() => S3UploadAPI.pause()} />
      <DebugButton label="Resume" onPress={() => S3UploadAPI.resume()} style={{ marginLeft: 4 }} />
    </View>
  );
};