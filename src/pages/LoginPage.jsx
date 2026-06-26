import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api/authApi";
import { saveAuthData } from "../utils/auth";
import { AuthScreen } from "../components/auth/AuthScreen";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = async ({ email, password }) => {
    try {
      const data = await loginRequest(email, password);
      // FE-3: token is now an HttpOnly cookie; we only store {email, role}.
      saveAuthData(data);
      navigate("/");
    } catch {
      // Surface a single friendly message; AuthScreen renders it as topError.
      throw new Error("Невірний email або пароль");
    }
  };

  return <AuthScreen mode="login" onSubmit={handleSubmit} />;
}
