import { Outlet } from "react-router-dom";
import Navbar from "./layout/Navbar";

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 24px 56px" }}>
        <Outlet />
      </main>
    </>
  );
}
