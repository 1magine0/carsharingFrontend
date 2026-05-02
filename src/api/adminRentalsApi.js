import axiosClient from "./axiosClient";

export const getAdminRentalsRequest = async () => {
    const response = await axiosClient.get("/admin/rentals");
    return response.data.data;
};

export const getAdminActiveRentalsRequest = async () => {
    const response = await axiosClient.get("/admin/rentals/active");
    return response.data.data;
};

export const getAdminRentalPhotosByTypeRequest = async (rentalId, photoType) => {
    const response = await axiosClient.get(`/admin/rentals/${rentalId}/photos/${photoType}`);
    return response.data.data;
};