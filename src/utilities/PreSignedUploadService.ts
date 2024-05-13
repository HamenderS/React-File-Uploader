import axios from 'axios';

import { ImageProcessing } from 'hooks/useImageProcessing';
import { CHUNK_SIZE, API_KEY, STAGING_URL, PROCESS_URL, STATUS_URL } from 'utilities/Constant';

export class PreSignedUploadService {

  item: ImageProcessing;
  uploadId: string;
  uploadKey: string;
  chunkSize: number;
  numberOfParts: number;
  preSignedUrl: PreSignedResp;
  processResp: ProcessApiResp;

  onProgressFn: (progress: any) => void;
  onErrorFn: (err: any) => void;
  onSuccessFn: (resp: any) => void;

  aborted: boolean;

  constructor(options: ImageUploadProps) {

    this.item = options?.item;
    this.uploadId = '';
    this.uploadKey = '';
    this.chunkSize = CHUNK_SIZE;
    this.numberOfParts = 0;
    this.preSignedUrl = {key: "", url:""};
    this.processResp = {key: "", taskId:""};

    this.onProgressFn = () => {};
    this.onErrorFn = () => {};
    this.onSuccessFn = () => {};

    this.aborted = false;
  }

  // Starting the multipart (chunk) upload
  start() {
    this.initUpload();
  }

  // Initiate a multipart upload request
  async initUpload() {
    try {

      this.numberOfParts = Math.ceil(this.item?.size / this.chunkSize);
      this.getSignedUrls();
    } catch (error) {
      this.complete(error);
    }
  }

  // Create pre-signed URL
  async getSignedUrls() {
    try {

      const numberOfParts = this.numberOfParts;
      const axiosInstant = axios.create({
          headers: {
            Authorization: API_KEY
          }
      });


      const resp: any = await axiosInstant.post(STAGING_URL);
      this.preSignedUrl = resp;

      this.onStartChunkUpload();
    } catch (error) {
      this.complete(error);
    }
  }

  // Uploading start
  async onStartChunkUpload() {
    try {
      const axiosInstant = axios.create();
      delete axiosInstant.defaults.headers.put['Content-Type'];

      const signedUrl: any = this.preSignedUrl;
      const file = this.item?.originalImage;
      const fileName = this.item?.name;
      const numberOfParts = this.numberOfParts;
      const chunkSize = this.chunkSize;
      let _progressList: IProgressList[]= [];
      for (let i = 0; i < numberOfParts; i++) {
        let list = {
          fileName,
          numberOfParts,
          partNumber: i+1,
          percentage: 0
        }
        _progressList.push(list);
      }


      const cancelRequest = axios.CancelToken.source();

      const chunkUploadedPromises = await _progressList?.map(async (part: any, index: number) => {
        const chunkStartFrom = index * chunkSize;
        const chunkEndTo = (index + 1) * chunkSize;
        const blobSlice = index < numberOfParts ? file.slice(chunkStartFrom, chunkEndTo) : file.slice(chunkStartFrom);
        const resp = await axiosInstant.put(signedUrl.url, blobSlice, {
          onUploadProgress: async (progressEvent: any) => {
            if (this.aborted) {
              cancelRequest.cancel(`${fileName} uploading canceled.`);
            }

            const { loaded, total } = progressEvent;
            let percentage = Math.floor((loaded * 100) / total);

            _progressList[
              _progressList.findIndex(
                (el: IProgressList) => el?.fileName === this.item?.name && el?.partNumber === part?.partNumber
              )
            ] = {
              fileName,
              numberOfParts,
              partNumber: part?.partNumber,
              percentage,
            };

            this.onProgressFn(_progressList);
          },
          cancelToken: cancelRequest.token,
        });
        return resp;
      });
      
      const respParts = await Promise.all(chunkUploadedPromises);

      this.finalizeMultipartUpload();
    } catch (error) {
      this.complete(error);
    }
  }

  // Finalize multipart upload
  async finalizeMultipartUpload() {
    try {

      const signedUrl = this.preSignedUrl;
      const axiosInstant = axios.create({
        headers: {
          Authorization: API_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      const urlencoded = new URLSearchParams();
      urlencoded.append("key", `${signedUrl.key}`);
      urlencoded.append("pipeline", "dragonfly-img-basic");

      const resp: any = await axiosInstant.post(PROCESS_URL, urlencoded);
      this.processResp = resp;
      this.checkUploadStatus();
    } catch (error) {
      this.complete(error);
    }
  }

  // Check upload status
  async checkUploadStatus() {
    try {

      const processApiResponse = this.processResp;
      const axiosInstant = axios.create({
        headers: {
          Authorization: API_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      let data = {
        "taskId": processApiResponse.taskId
      };


      const resp: any = await axiosInstant.post(STATUS_URL, data);
      this.processResp = resp;
      this.complete();
    } catch (error) {
      this.complete(error);
    }
  }

  // Complete the multipart upload request on success or fail.
  async complete(error?: any) {
    try {
      if (error) {
        this.onErrorFn(error);

        return;
      }

      this.onSuccessFn(`${this.item?.name} successfully uploaded.`);
    } catch (error) {
      this.onErrorFn(error);
    }
  }

  onProgress(onProgress: any) {
    this.onProgressFn = onProgress;
    return this;
  }

  onError(onError: any) {
    this.onErrorFn = onError;
    return this;
  }

  onSuccess(resp: any) {
    this.onSuccessFn = resp;
    return this;
  }

}

interface PreSignedResp {
  key: string;
  url: string;
}

interface ProcessApiResp {
  key: string;
  taskId: string;
}

interface IProgressList {
  fileName: string;
  numberOfParts: number;
  partNumber: number;
  percentage: number;
}

export interface ImageUploadProps {
  item: ImageProcessing;
}
