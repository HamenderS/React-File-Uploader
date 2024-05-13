import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

import Icon from 'components/Icon';
import useImageProcessing, { ImageProcessing } from 'hooks/useImageProcessing';
import ImagePreview from './ImagePreview';
import ImageUploadProgressBar from './ImageUploadProgressBar';


const UploadFile = () => {
    const [images, setImages] = useState<ImageProcessing[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // File processing
    const [imageProcessingFn, processedImages, isProcessing, processingMessage] = useImageProcessing();
    useEffect(() => {
        if (!!processedImages?.length && !isProcessing) {
            setImages(processedImages);
        }
    }, [processedImages, isProcessing]);

    // React-dropzone
    const onDrop = useCallback(
        async (acceptedFiles: any) => await imageProcessingFn(acceptedFiles, images),
        [images, imageProcessingFn]
    );

    const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/jpg': [], 'image/png': [], 'image/gif': []},
        noClick: true,
        noKeyboard: true,
        onDropRejected: (fileRejections: FileRejection[]) => {
            fileRejections?.forEach((item: any) => {
                toast.error(`${item?.errors[0]?.message}. ${item?.file?.name}.`);
            });
        },
    });

    const imageRemoveHandler = useMemo(
        () => (itemIndex: number) => {
            images.splice(itemIndex, 1);
            setImages([...images]);
        },
        [images]
    );

    const onSubmitHandler = async (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setIsUploading(true);
        } catch (error: any) {
            toast.error(error);
        }
    };

    return (
        <div className="relative px-5 py-2">
            <div className="flex justify-center">
                <form method="POST" onSubmit={onSubmitHandler} encType="multipart/form-data" className="vh-100">
                <div className="d-flex justify-content-between mb-2">
                    <h3 className="fw-semibold red">
                        Upload Media
                    </h3>
                        <button
                            disabled={!images?.length || isUploading}
                            className="flex justify-content-center btn-primary py-1 rounded fw-semibold"
                        >
                            <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                        </button>
                </div>
                    <div className="flex w-100 h-75 justify-content-center border-red border-2 text-white p-4">
                        <div className="d-flex w-100 h-100 flex-column">
                            <ImagePreview
                                isProcessing={isProcessing}
                                processingMessage={processingMessage}
                                images={images}
                                imageRemoveHandler={imageRemoveHandler}
                            />
                            <div {...getRootProps()} className="w-100 h-100 align-self-center text-center border pt-4">
                                <input {...getInputProps()} />
                                <div className="w-100 h-auto mb-5 py-5">
                                        <button type="button" onClick={open} className="btn text-white position-relative">
                                            <Icon name="photo" style={{height:"5rem", width: "5rem"}}/>
                                            <Icon
                                                name="plus-circle"
                                                className="position-absolute z-2 end-0 bottom-0 mb-2 me-2 rounded-5 text-black bg-white"
                                                style={{height:"2rem", width: "2rem"}}
                                            />
                                        </button>
                                    <p className="text-xs">
                                        Upload your image by <span className="fw-bold">add button</span>
                                    </p>
                                    {isDragActive ? (
                                        'Drop them here ...'
                                    ) : (
                                        <>
                                        Drop photos to upload or{' '}
                                        <button type="button" onClick={open} className="btn btn-link text-white p-0">
                                            Choose files
                                        </button>
                                        </>
                                    )}
                                    <p className="">{!!images?.length && `${images?.length} files selected`}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {!!images?.length && isUploading && (
                <ImageUploadProgressBar images={images} setImages={setImages} setIsUploading={setIsUploading} />
                )}
        </div>
    );
};

export default UploadFile;
