import axiosClient from "./axiosClient";

export const getCarsRequest = async () => {
    const response = await axiosClient.get("/cars");
    return response.data.data;
};