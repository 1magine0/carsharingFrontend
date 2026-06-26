import axiosClient from "./axiosClient";

export const loginRequest = async (email, password) => {
    const response = await axiosClient.post("/auth/login", {
        email,
        password,
    });

    // FE-3: the JWT comes back as an HttpOnly Set-Cookie, not in the body. The
    // payload is just {email, role} for the UI to remember.
    return response.data.data;
};

// FE-3: clear the HttpOnly auth cookie server-side (JS can't delete it).
export const logoutRequest = async () => {
    await axiosClient.post("/auth/logout");
};

export const registerRequest = async (payload) => {
    const response = await axiosClient.post("/auth/register", payload);
    // FE-16: unwrap the ApiResponse envelope to match loginRequest and every other
    // data-returning call. The register endpoint returns ApiResponse<Void> (data=null),
    // so this is null by design; callers use it as a fire-and-forget success signal.
    return response.data.data;
};

// Request a password-reset email. The backend always responds with a generic
// success message (no account enumeration), so the resolved value is unused.
export const forgotPasswordRequest = async (email) => {
    const response = await axiosClient.post("/auth/forgot-password", { email });
    return response.data;
};

// Complete a password reset using the token from the emailed link.
export const resetPasswordRequest = async ({ token, newPassword, confirmPassword }) => {
    const response = await axiosClient.post("/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
    });
    return response.data;
};