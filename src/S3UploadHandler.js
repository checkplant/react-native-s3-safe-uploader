import Amplify, { Storage } from 'aws-amplify';

class S3UploadHandler {

  _isPaused = () => this._paused;

  config({ identityPoolId, region, bucket }) {
    Amplify.configure({
      Auth: { identityPoolId, region },
      Storage: { AWSS3: { bucket } }
    });
  }

  pause() {
    this._paused = true;
    console.log('[S3UPLOADHANDLER] activities paused');
  }

  resume() {
    this._paused = false;
    console.log('[S3UPLOADHANDLER] activities resumed');
  }

  async upload(key, content, options) {
    const { onProgress, onSuccess, onError, ...storageOptions } = options;

    const handleProgressCallback = (progress) => {
      const isPaused = this._isPaused();
      if (!isPaused) {
        if (onProgress)
          onProgress(progress);
      }
    };

    const handleError = (message, error) => {
      if (!this._isPaused()) {
        console.log(message, error);

        if (onError)
          onError(error);
      }
    };

    const handleSuccess = ({ key }) => {
      if (!this._isPaused()) {
        Storage.get(key)
          .then(url => onSuccess({ key, url }))
          .catch(error => handleError(`[S3UPLOADHANDLER] error on getting the remote URL for key ${key}`, error));
      }
    };

    if (!this._paused) {
      let data = content.data;

      if (!data) {
        try {
          console.log(`[S3UPLOADHANDLER] fetching file data key ${key} at URI ${content.uri}`);
          const response = await fetch(content.uri);
          data = await response.blob();
          console.log(`[S3UPLOADHANDLER] file data loaded for key ${key}`);
        } catch (error) {
          console.log(`[S3UPLOADHANDLER] no file data found for key ${key}`);
        }
      }

      Storage.put(key, data, { ...storageOptions, progressCallback: handleProgressCallback })
        .then(result => handleSuccess(result))
        .catch(error => handleError(`[S3UPLOADHANDLER] error uploading with key ${key}`, error));
    }
  }

}

const handlerInstance = new S3UploadHandler();
//Object.freeze(handlerInstance);

export default handlerInstance;