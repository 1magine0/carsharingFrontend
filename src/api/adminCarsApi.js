import axiosClient from "./axiosClient";

export const createCarRequest = async (payload) => {
    const response = await axiosClient.post("/admin/cars", payload);
    return response.data.data;
};

export const updateCarRequest = async (carId, payload) => {
    const response = await axiosClient.put(`/admin/cars/${carId}`, payload);
    return response.data.data;
};

export const uploadCarImageRequest = async (carId, image, isMain = false) => {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("isMain", isMain);

    const response = await axiosClient.post(`/admin/cars/${carId}/images`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
};

export const getCarImagesRequest = async (carId) => {
    const response = await axiosClient.get(`/admin/cars/${carId}/images`);
    return response.data.data;
};

export const setMainCarImageRequest = async (imageId) => {
    const response = await axiosClient.post(`/admin/cars/images/${imageId}/main`);
    return response.data;
};

export const deleteCarImageRequest = async (imageId) => {
    const response = await axiosClient.delete(`/admin/cars/images/${imageId}`);
    return response.data;
};