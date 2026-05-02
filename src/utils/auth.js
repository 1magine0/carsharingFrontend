export const TOKEN_KEY = "token";
export const ROLE_KEY = "role";

export const saveAuthData = (token, role) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
};

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const getRole = () => {
    return localStorage.getItem(ROLE_KEY);
};

export const isAdmin = () => {
    return getRole() === "ADMIN";
};

export const removeAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
};

export const isAuthenticated = () => {
    return !!getToken();
};