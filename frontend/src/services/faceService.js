import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export const loadModels = async () => {
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        console.log('Face-api models loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading face-api models:', error);
        return false;
    }
};

export const getFaceDescriptor = async (videoElement) => {
    try {
        const detection = await faceapi
            .detectSingleFace(videoElement)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            return detection.descriptor;
        }
        return null;
    } catch (error) {
        console.error('Error detecting face:', error);
        return null;
    }
};

export const compareFaces = (descriptor1, descriptor2, threshold = 0.6) => {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return distance < threshold;
};
