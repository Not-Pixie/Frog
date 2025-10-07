import { Outlet, NavLink, useParams } from "react-router";
import { useState } from "react";
import "./comercioLayout.css";
import ProtectedRoute from "src/api/auth/ProtectedRoute";
import { Sidebar } from "./customComponents/SideBar";

export default function ComercioLayout() {
  const [openSubMenu, setOpenSubMenu] = useState(false);
  const {comercioId} = useParams();
  const baseUrl = `/comercio/${comercioId}`;

  return (
    <ProtectedRoute>
      <div className="layout">
        <Sidebar baseUrl={baseUrl}/>
        {/* Onde as páginas vão renderizar */}
        <div className="conteudo">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
