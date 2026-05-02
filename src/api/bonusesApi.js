import axiosClient from "./axiosClient";

export const getMyBonusBalanceRequest = async () => {
    const response = await axiosClient.get("/bonuses/me/balance");
    return response.data.data;
};

export const getMyBonusHistoryRequest = async () => {
    const response = await axiosClient.get("/bonuses/me/history");
    return response.data.data;
};