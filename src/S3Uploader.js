import Amplify, { Storage } from 'aws-amplify';

class S3Uploader {

  config({ identityPoolId, region, bucket }) {
    Amplify.configure({
      Auth: { identityPoolId, region },
      Storage: { AWSS3: { bucket } }
    });
  }

  upload(key, content, options) {
    const { onProgress, onSuccess, onError, ...storageOptions } = options;

    const handleProgressCallback = (progress) => {
      console.log(`Uploaded: ${progress.loaded}/${progress.total}`, progress);

      if (onProgress)
        onProgress(progress);
    };

    const handleError = (message, error, callback) => {
      console.log(message, error);

      if (callback)
        callback(error);
    };

    const handleSuccess = ({ key }) => {
      Storage.get(key)
        .then(url => onSuccess({ key, url }))
        .catch(error => handleError('ERROR WHILE GETTING REMOTE FILE', error, onError));
    };

    Storage.put(key, content, { progressCallback: handleProgressCallback, ...storageOptions })
      .then(result => handleSuccess(result))
      .catch(error => handleError('ERROR WHILE UPLOADING FILE', error, onError));
  }

}

export default new S3Uploader();