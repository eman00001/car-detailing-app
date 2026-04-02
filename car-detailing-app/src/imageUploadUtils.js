import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const CLOUDINARY_CLOUD_NAME = 'dtvuvzxf5';
const CLOUDINARY_UPLOAD_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

export const CLOUDINARY_CHAT_MESSAGE_ATTACHMENT_UPLOAD_PRESET = 'chat-message-attachment-preset';
export const CLOUDINARY_CUSTOMER_REQUEST_CAR_PHOTO_UPLOAD_PRESET = 'car-photo-preset';

// function uploads an array of image files to Cloudinary, with the given upload preset
export async function uploadImages(imageURIs, uploadPreset) {
    const fileURLs = await Promise.all(
        imageURIs.map(async (uri) => {
            // reduce data load by compressing image
            const compressContext = ImageManipulator.manipulate(uri);
            const compressRender = await compressContext.renderAsync();
            const compressResult = await compressRender.saveAsync({
                compress: 0.5, // heavily compress
                format: SaveFormat.JPEG, // save as JPG which supports better compression
            });

            // get base64 file content to upload to Cloudinary
            const imageFileRef = new File(compressResult.uri);
            const imageFileBase64 = await imageFileRef.base64();
            const imageFile = `data:image/jpeg;base64,${imageFileBase64}`;

            // send POST request to upload to Cloudinary
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', uploadPreset);
            const response = await fetch(CLOUDINARY_UPLOAD_API_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            return data?.secure_url;
        })
    );
    return fileURLs.filter(url => url != null); // remove failed uploads
}

// function adds transformations to a cloudinary URI by using the transformation URL API
export function addTransformationsToCloudinaryUri(uri, transformations) {
    const uriComponents = uri.split('/'); // separate out components of URI
    uriComponents.splice(-3, 0, transformations); // add new section at third from last component, with transformations
    return uriComponents.join('/'); // return reconstructed URI
}
