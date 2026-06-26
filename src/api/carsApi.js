import axiosClient from "./axiosClient";

export const getCarsRequest = async () => {
    const response = await axiosClient.get("/cars");
    return response.data.data;
};

export const getCarByIdRequest = async (id) => {
    const response = await axiosClient.get(`/cars/${id}`);
    return response.data.data;
};