import axiosClient from "./axiosClient";

export const getCurrentUserRequest = async () => {
    const response = await axiosClient.get("/users/me");
    return response.data.data;
};

export const updateCurrentUserRequest = async (payload) => {
    const response = await axiosClient.put("/users/me", payload);
    return response.data.data;
};