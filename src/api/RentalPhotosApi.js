import axiosClient from "./axiosClient";

export const getRentalPhotosRequest = async (rentalId) => {
    const response = await axiosClient.get(`/rentals/${rentalId}/photos`);
    return response.data.data;
};

export const getRentalPhotosByTypeRequest = async (rentalId, photoType) => {
    const response = await axiosClient.get(`/rentals/${rentalId}/photos/${photoType}`);
    return response.data.data;
};

export const uploadRentalPhotoRequest = async (rentalId, photoType, image) => {
    const formData = new FormData();

    formData.append("photoType", photoType);
    formData.append("image", image);

    const response = await axiosClient.post(`/rentals/${rentalId}/photos`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data.data;
};

export const deleteRentalPhotoRequest = async (photoId) => {
    const response = await axiosClient.delete(`/rentals/photos/${photoId}`);
    return response.data;
};