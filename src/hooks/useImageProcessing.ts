import { useState } from 'react';
import { toast } from 'react-toastify';

import { randomNumber } from 'utilities/genericFunctions';

export interface ImageProcessing {
  id: number;
  name: string;
  extension: string;
  size: number;
  thumbnail: any;
  originalImage: any;
  progress: number;
  isProcessing: boolean;
  isCompleted: boolean;
  isCanceled: boolean;
}

const useImageProcessing = () => {
  const [processedImages, setProcessedImages] = useState<ImageProcessing[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');

  const startImageProcessing = async (images: any, oldProcessedImages: ImageProcessing[] = []) => {
    const startProcessingTime = performance.now();
    const queueList: ImageProcessing[] = [];
    setIsProcessing(true);
    await queueProcessing(0);

    async function queueProcessing(nextProcessIndex: number) {
      const image = images[nextProcessIndex];
      setProcessingMessage(`Processing left ${images?.length - nextProcessIndex} out of ${images?.length}`);

      if (!!image?.name) {

        let queueItem: ImageProcessing = {
          id: randomNumber(),
          name: image?.name,
          extension: image?.name?.split('.').pop(),
          size: image?.size,
          thumbnail: '',
          originalImage: image,
          progress: 0,
          isCompleted: false,
          isProcessing: true,
          isCanceled: false,
        };

        await generateThumbnail(image)
          .then((newImage: any) => {
            const newQueueItem = {
              ...queueItem,
              thumbnail: newImage?.thumbnail
            };
            queueItem = newQueueItem;
          })
          .catch((error) => console.log(`Thumbnail and preview generation failed. ${error}`));

        queueList.push(queueItem);
        await queueProcessing(nextProcessIndex + 1);
      }
    }

    await Promise.resolve([...oldProcessedImages, ...queueList])
      .then((result) => {
        setProcessedImages(result.filter((el) => !!el?.thumbnail));
        setIsProcessing(false);
        const endProcessingTime = performance.now();
        console.info(
          `Total processing time: ${((endProcessingTime - startProcessingTime) / 1000).toFixed(3)} seconds.`
        );
      })
      .catch(() => setProcessedImages([...oldProcessedImages]));
  };

  return [
    (images: any[], oldProcessedImage: ImageProcessing[] = []) =>
      startImageProcessing(images, oldProcessedImage),
    processedImages,
    isProcessing,
    processingMessage,
  ] as const;
};

// Generate low resolution thumbnail for preview image
const generateThumbnail = async (image: File) => {
  let thumbnail: any = '';
  try {
    thumbnail = await generateCanvas(image, 2, 0.5);
    return { thumbnail };
  } catch (error) {
    toast.error(`${error}`);
    return { thumbnail };
  }
};

const generateCanvas = (image: any, divisionBy = 5, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    let canvas: any = document.createElement('canvas');
    canvas.imageSmoothingQuality = 'medium';
    let context: any = canvas.getContext('2d');
    let img = document.createElement('img');
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      canvas.width = img.width / divisionBy;
      canvas.height = img.height / divisionBy;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      return context.canvas.toBlob((blob: any) => resolve(blob), 'image/jpeg', quality);
    };

    img.onerror = () => reject(`${image.name} is invalid image format.`);
  });
};

export default useImageProcessing;
