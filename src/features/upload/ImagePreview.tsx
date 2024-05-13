import { memo } from 'react';

import Icon from 'components/Icon';
import Loader from 'components/Loader';
import { ImageProcessing } from 'hooks/useImageProcessing';

interface ImagePreviewProps {
    isProcessing: boolean;
    processingMessage: string;
    images: ImageProcessing[];
    imageRemoveHandler: Function;
}

const ImagePreview = (props: ImagePreviewProps) => {
    const { isProcessing, processingMessage, images, imageRemoveHandler } = props;

    if (isProcessing)
        return (
            <div className="img-thumbnail overflow-hidden shadow-lg rounded-2"  style={{maxHeight: "200px"}}>
                <div className="d-flex justify-content-center h-100 py-4 red">
                    <Loader /> <span>{ processingMessage}</span>
                </div>
            </div>
        );

    return (
        <>
        {!!images.length && (
            <div className="w-100 img-thumbnail overflow-hidden overflow-y-auto border-1 shadow-lg p-2 rounded-2 mb-2" style={{maxHeight: "200px", minHeight: "90px"}}>
                <div className="d-flex">
                    {images.map((item: ImageProcessing, index: number) => {
                        return (
                            <div key={index} className="float-start position-relative mx-1">
                                <div className="w-100 rounded " style={{height :"4.5rem"}}>
                                    <img
                                        src={URL.createObjectURL(item?.thumbnail)}
                                        alt={item?.name}
                                        className="img-thumbnail h-100 w-100 rounded-sm"
                                    />
                                </div>
                                <button
                                    className="btn position-absolute top-0 end-0 p-0 z-3 "
                                    type="button"
                                    onClick={() => imageRemoveHandler(index)}
                                >
                                    <p className="flex w-100 h-100 justify-content-center">
                                        <Icon name="trash" className="red bg-white rounded-5 p-1" />
                                    </p>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        </>
    );
};

export default memo(ImagePreview);
