import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';

import ImagePicker from 'react-native-image-picker';
import { S3Uploader } from 'react-native-s3-safe-uploader';

S3Uploader.config({ 
  identityPoolId: 'your-identityPoolId',
  region: 'your-region',
  bucket: 'your-bucket'
});

const PhotoUploader = () => {
  const defaultMessage = 'Take a photo or import one from your gallery.';

  const [photo, setPhoto] = useState();
  const [progress, setProgress] = useState();
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (progress) {
      setMessage(`Upload progress: ${progress.total}/${progress.loaded}`);
    }
  }, [progress && progress.loaded]);

  const addPhoto = () => {
    ImagePicker.showImagePicker({
      title: 'Pick an image',
      quality: 1.0,
      maxWidth: 1024,
      maxHeight: 1024,
      storageOptions: {
        skipBackup: true,
      },
      cancelButtonTitle: 'Cancel',
      takePhotoButtonTitle: 'Take photo',
      chooseFromLibraryButtonTitle: 'Import from gallery',
    }, response => {
      if (response.error) {
        console.log(response.error);
      } else if (response.uri) {
        setPhoto({ localURI: response.uri });
      }
    });
  }

  const uploadPhoto = async () => {
    const response = await fetch(photo.localURI);
    const blob = await response.blob();
    const fileName = photo.localURI.split("/").pop();

    S3Uploader.upload(`lib-test/${fileName}`, blob, {
      onProgress: progress => setProgress(progress),
      onError: error => console.log('error: ', error),
      onSuccess: result => {
        setPhoto(null);
        setProgress(null);
        setMessage('Success!');

        setTimeout(() => {
          setMessage(defaultMessage);
        }, 2500);
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {!photo && <Button title='Add Photo' onPress={addPhoto}/>}
      {photo && !progress && <Button title='Upload to S3' onPress={uploadPhoto}/>}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginTop: 150,
    flex: 1,
    alignItems: 'center'
  },

  text: {
    color: 'black',
    fontSize: 30,
  },
});

export default PhotoUploader;