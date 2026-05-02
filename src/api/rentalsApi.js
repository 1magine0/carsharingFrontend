import axiosClient from "./axiosClient";

export const previewRentalRequest = async (payload) => {
    const response = await axiosClient.post("/rentals/preview", payload);
    return response.data.data;
};

export const createRentalRequest = async (payload) => {
    const response = await axiosClient.post("/rentals", payload);
    return response.data;
};

export const getMyRentalsRequest = async () => {
    const response = await axiosClient.get("/rentals/my");
    return response.data.data;
};

export const getMyActiveRentalRequest = async () => {
    const response = await axiosClient.get("/rentals/my/active");
    return response.data.data;
};

export const finishRentalRequest = async (rentalId) => {
    const response = await axiosClient.post(`/rentals/${rentalId}/finish`);
    return response.data;
};