import { useNavigate } from "react-router-dom";
import { loginRequest, registerRequest } from "../api/authApi";
import { saveAuthData } from "../utils/auth";
import { AuthScreen } from "../components/auth/AuthScreen";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSubmit = async ({ fullName, email, phone, password, confirmPassword, referralCode }) => {
    try {
      // Backend RegisterRequest requires confirmPassword; referralCode is optional.
      await registerRequest({
        fullName,
        email,
        phone,
        password,
        confirmPassword,
        referralCode: referralCode?.trim() || null,
      });
      // Auto-login right after a successful registration.
      const loginData = await loginRequest(email, password);
      // FE-3: token is set as an HttpOnly cookie; store only {email, role}.
      saveAuthData(loginData);
      navigate("/");
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Не вдалося зареєструватися";
      throw new Error(backendMessage);
    }
  };

  return <AuthScreen mode="register" onSubmit={handleSubmit} />;
}
