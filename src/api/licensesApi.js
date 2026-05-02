import axiosClient from "./axiosClient";

export const getMyLicenseRequest = async () => {
    const response = await axiosClient.get("/licenses/me");
    return response.data.data;
};

export const uploadLicenseRequest = async (payload) => {
    const formData = new FormData();

    formData.append("documentNumber", payload.documentNumber);
    formData.append("issueDate", payload.issueDate);
    formData.append("expiryDate", payload.expiryDate);
    formData.append("image", payload.image);

    const response = await axiosClient.post("/licenses", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
};

export const getPendingLicensesRequest = async () => {
    const response = await axiosClient.get("/admin/licenses/pending");
    return response.data.data;
};

export const approveLicenseRequest = async (licenseId) => {
    const response = await axiosClient.post(`/admin/licenses/${licenseId}/approve`);
    return response.data;
};

export const rejectLicenseRequest = async (licenseId, reason) => {
    const response = await axiosClient.post(
        `/admin/licenses/${licenseId}/reject?reason=${encodeURIComponent(reason)}`
    );
    return response.data;
};