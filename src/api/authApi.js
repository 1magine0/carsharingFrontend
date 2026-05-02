import axiosClient from "./axiosClient";

export const loginRequest = async (email, password) => {
    const response = await axiosClient.post("/auth/login", {
        email,
        password,
    });

    return response.data.data;
};

export const registerRequest = async (payload) => {
    const response = await axiosClient.post("/auth/register", payload);
    return response.data;
};