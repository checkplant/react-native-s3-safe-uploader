import AsyncStorage from '@react-native-community/async-storage';
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";

import UploadHandler from './S3UploadHandler';


const ASYNC_STORAGE_QUEUE_KEY = '@S3Uploader_queue';

const States = {
  PAUSED: 'paused',
  RESUMING: 'resuming',
  UPLOADING: 'uploading',
  IDDLE: 'iddle'
};

class S3UploadAPI {

  state = States;

  constructor() {
    this._state = States.IDDLE;
    this._queue = [];
    this._eventEmitter = new EventEmitter();
    this._eventEmitter.addListener('stateChange', this._stateWatcher);
  }

  _stateWatcher = (newState, oldState) => {
    console.log(`[S3UPLOADAPI] state is now ${newState}`);

    if (newState == States.PAUSED)
      this._pauseAndSaveQueue();
    else if (newState == States.RESUMING)
      this._restoreQueue();
    else if (newState == States.IDDLE)
      this._processQueue();
  };

  _changeState = (newState) => {
    if (newState !== this._state) {
      const oldState = this._state;
      this._state = newState;
      this._eventEmitter.emit('stateChange', newState, oldState);
    }
  };

  _pauseAndSaveQueue = async () => {
    UploadHandler.pause();
    this._queue.forEach(job => job.started = false);
    const storageValue = JSON.stringify({ queue: this._queue });
    await AsyncStorage.setItem(ASYNC_STORAGE_QUEUE_KEY, storageValue);

    console.log(`[S3UPLOADAPI] queue saved, all ${this._queue.length} jobs marked as pending`, this._queue);
  };

  _restoreQueue = async () => {
    try {
      UploadHandler.resume();
      const storageValue = await AsyncStorage.getItem(ASYNC_STORAGE_QUEUE_KEY);
      if(storageValue !== null) {
        const { queue = [] } = JSON.parse(storageValue);
        this._queue = queue;

        console.log(`[S3UPLOADAPI] previous queue restored with ${this._queue.length} jobs pending`, this._queue);

        this._changeState(States.IDDLE);
      }
    } catch (error) {
      console.log('[S3UPLOADAPI] error restoring previous queue:', error);
    }
  };

  _removeFromQueue = (key) => {
    this._queue = this._queue.filter(job => job.key != key);
  };

  _jobsToStart = () => {
    return this._queue.filter(({ started }) => !started);
  };

  _processQueue = () => {
    if (!this._queue.length) {
      console.log('[S3UPLOADAPI] queue is empty, no job to start');
      return;
    }

    if (this._state == States.PAUSED) {
      console.log(`[S3UPLOADAPI] state is ${this._state}; jobs will not be started`);
      return;
    }

    console.log('[S3UPLOADAPI] processing queue...');

    this._changeState(States.UPLOADING);

    this._jobsToStart().forEach(job => {
      try {
        this._startJob(job);
        job.started = true;

        console.log(`[S3UPLOADAPI] upload job for key ${job.key} started! (${this._jobsToStart().length} jobs left)`);
      } catch(error) {
        this._handleJobError(job, error);
      }
    });
  };

  _startJob = (job) => {
    const { key, content } = job;
    const options = {
      ...job.options,
      onProgress: progress => this._handleJobProgress(job, progress),
      onError: error => this._handleJobError(job, error),
      onSuccess: result => this._handleJobSuccess(job, result),
    };

    UploadHandler.upload(key, content, options);
  };

  _handleJobProgress = (job, progress) => {
    console.log(`[S3UPLOADAPI] upload job for key ${job.key} progress: ${progress.loaded}/${progress.total}`);

    // TODO: emitt progress events (a single general progress event or individual progress events for each key?)
  };

  _handleJobError = (job, error) => {
    console.log(`[S3UPLOADAPI] upload job for key ${job.key} had an error`, error);

    job.started = false;
    // TODO: emitt error events (a single general error event or individual error events for each key?)
  };

  _handleJobSuccess = (job, result) => {
    console.log(`[S3UPLOADAPI] upload job for key ${job.key} successfully finished`, result);

    const { key } = result;
    this._removeFromQueue(key);
    this._eventEmitter.emit('success', key);

    if (!this._queue.length)
      this._changeState(States.IDDLE);
  };



  config(configs) {
    UploadHandler.config(configs);
  }

  resume() {
    if (this._state == States.PAUSED)
      this._changeState(States.RESUMING);
  }

  pause() {
    if (this._state !== States.PAUSED)
      this._changeState(States.PAUSED);
  }

  put(key, content, options) {
    this._queue.push({ key, content, options, started: false });

    if (this._state == States.PAUSED) {
      console.log(`[S3UPLOADAPI] new job of key ${key} scheduled for later (${(this._queue.length)} jobs pending)`);
      this._pauseAndSaveQueue();
    } else {
      console.log(`[S3UPLOADAPI] new job of key ${key} on queue (${(this._queue.length)} on total)`);
      this._processQueue();
    }
  }

  onSuccess(callback) {
    this._eventEmitter.addListener('success', callback);
    console.log('[S3UPLOADAPI] a "onSuccess" listener was registered');
  }

  onStateChange(callback) {
    this._eventEmitter.addListener('stateChange', callback);
    console.log('[S3UPLOADAPI] a "stateChange" listener was registered');
  }

  clearListeners() {
    this._eventEmitter.removeAllListeners();
    this._eventEmitter.addListener('stateChange', this._stateWatcher);
    console.log('[S3UPLOADAPI] listeners cleared');
  }

}

const APIInstance = new S3UploadAPI();
// Object.freeze(APIInstance);

export default APIInstance;