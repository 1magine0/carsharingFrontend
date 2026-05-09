import axiosClient from "./axiosClient";

export const createMockPaymentRequest = async (rentalId) => {
    const response = await axiosClient.post(`/rentals/${rentalId}/payments/mock`);
    return response.data.data;
};

export const mockPayRequest = async (paymentId) => {
    const response = await axiosClient.post(`/payments/${paymentId}/mock-success`);
    return response.data.data;
};

export const getRentalPaymentsRequest = async (rentalId) => {
    const response = await axiosClient.get(`/rentals/${rentalId}/payments`);
    return response.data.data;
};

export const createLiqPayPaymentRequest = async (rentalId) => {
    const response = await axiosClient.post(`/rentals/${rentalId}/payments/liqpay`);
    return response.data.data;
};