import { memo, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import Icon from 'components/Icon';
import Loader from 'components/Loader';
import { ImageProcessing } from 'hooks/useImageProcessing';
import { PreSignedUploadService, ImageUploadProps } from 'utilities/PreSignedUploadService';

const s3UploaderInstList: any[] = [];

interface Props {
  images: ImageProcessing[];
  setImages: Function;
  setIsUploading: Function;
}

const ImageUploadProgressBar = (props: Props) => {
  const { images, setImages, setIsUploading } = props;

  const isUploadingStartRef = useRef(false);
  const [progressList, setProgressList] = useState<any>({ list: [] });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [completedProcessCount, setCompletedProcessCount] = useState<number>(0);

  useEffect(() => {
    if (!!isUploadingStartRef?.current) {
      setCompletedProcessCount(0);
      isMinimized ? setIsMinimized(true) : setIsMinimized(false);

      let _progressList: ImageProcessing[] = images;
      setProgressList({ list: _progressList });
      startUploadingImages(0, _progressList);
    }

    return () => {
      isUploadingStartRef.current = true;
    };
  }, [images]);

  const startUploadingImages = async (currentProcessIndex: number, _progressList: ImageProcessing[]) => {
    try {
      const item: any = images?.find((el, index) => currentProcessIndex === index && !el?.isCompleted);

      if (!!item?.id) {
        const s3UploaderPayload: ImageUploadProps = { item };
        const s3Uploader = new PreSignedUploadService(s3UploaderPayload);
        s3UploaderInstList.push(s3Uploader);

        let _updatedProgressList = [..._progressList];

        await s3Uploader
          .onProgress((progress: any) => {
            const sumTotal = progress.reduce((acc: number, cv: { percentage: number }) => acc + cv.percentage, 0);
            const percentage = Math.floor(sumTotal / progress[0].numberOfParts);
            if (percentage < 100 && percentage % 2 === 0) {
              _updatedProgressList[currentProcessIndex] = { ...item, progress: percentage };
              setProgressList({ list: _updatedProgressList });
            }
          })
          .onError((error: any) => {
            _updatedProgressList[currentProcessIndex] = { ...item, isCanceled: true, isProcessing: false };
            setProgressList({ list: _updatedProgressList });

            setCompletedProcessCount((prevCount) => prevCount + 1);
            startUploadingImages(currentProcessIndex + 1, _updatedProgressList);

            toast.error(error?.message);
          })
          .onSuccess((resp: any) => {
            _updatedProgressList[currentProcessIndex] = { ...item, isCompleted: true, progress: 100 };
            setProgressList({ list: _updatedProgressList });

            setCompletedProcessCount((prevCount) => prevCount + 1);
            startUploadingImages(currentProcessIndex + 1, _updatedProgressList);

            toast.success(`${item?.fileName} successfully uploaded.`);
          });

        s3Uploader.start();
      }
    } catch (error: any) {
      toast.error(error);
    }
  };

  const onCancelHandler = (cancelIndex: number) => {
    s3UploaderInstList.filter((el: ImageProcessing, index) => cancelIndex === index)[0].abort();
  };

  const onCloseHandler = () => {
    setIsUploading(false);
    setImages([]);
  };

  return (
    <div className="position-absolute end-0 bottom-0 w-25 h-auto bg-light shadow me-1">
      <div className="">
        <h5 className="d-flex justify-content-between fw-semibold red p-2 bg-dark">
          {`${completedProcessCount} out of ${progressList?.list?.length} uploads complete`}
          <button onClick={() => setIsMinimized(!isMinimized)} className="btn">
            <Icon name={isMinimized ? 'go-back' : 'minus'} className="red" style={{height:"1rem", width: "1rem"}} />
          </button>
          <button onClick={() => onCloseHandler()} className="btn">
            <Icon name="x" className="red" style={{height:"1rem", width: "1rem"}} />
          </button>
        </h5>
        <div className={`w-100 overflow-hidden overflow-y-auto ${isMinimized ? 'd-none' : ''}`}>
          {progressList?.list.map((item: ImageProcessing, index: number) => (
            <div key={item?.id}>
              <div className="d-flex justify-content-center text-black p-1">
                <div className="w-100 d-flex justify-content-between ">
                  <div className="d-flex justify-content-between">
                    <span>
                      <Icon name='photo' style={{height:"1rem", width: "1rem"}} />
                    </span>
                    <span className="fs-6 ps-1">
                      {item?.name} - (<span className="red">{item?.progress}%</span>)
                    </span>
                  </div>
                  <div className="pe-2">
                    {item?.isProcessing && item?.progress > 0 && item?.progress < 100 && (
                      <button onClick={() => onCancelHandler(index)} className="text-red-600">
                        <Icon name="x" style={{height:".5rem", width: ".5rem"}} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="d-flex justify-center w-auto">
                  {item?.isProcessing && item?.progress <= 0 && <Loader />}
                  {item?.isProcessing && item?.progress > 0 && item?.progress < 100 && (
                    <div className="w-3 d-flex justify-content-center">
                      <span className="red"> {item?.progress} % </span>
                    </div>
                  )}
                  {item?.progress >= 100 && <Icon name="check" className="text-success" style={{height:"1rem", width: "1rem"}} />}
                  {item?.isCanceled && <Icon name="error" className="text-danger" style={{height:"1rem", width: "1rem"}} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(ImageUploadProgressBar);
