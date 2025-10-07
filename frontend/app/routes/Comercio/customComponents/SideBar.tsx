// Sidebar.tsx
import React, { useState } from "react";
import { NavLink } from "react-router";

export function Sidebar({ baseUrl }: { baseUrl: string }) {
  const [openSubMenu, setOpenSubMenu] = useState(false);
  const submenuId = "movimentacoes-submenu";

  return (
    <div className="sideBar">
      <div className="logo">
        <img src="/img/frog.jpeg" alt="Logo" />
      </div>

      <nav className="menu">
        <ul>
          {/* Dashboard */}
          <li className="opcao">
            <NavLink to={baseUrl} end>
              <img src="/vectors/chart-histogram.png" alt="Dashboard" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* Movimentações (toggle submenu) */}
          <li
            className="opcao movimentacoes-toggle"
            role="button"
            tabIndex={0}
            aria-expanded={openSubMenu}
            aria-controls={submenuId}
            onClick={() => setOpenSubMenu((s) => !s)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenSubMenu((s) => !s);
              }
              if (e.key === "Escape") setOpenSubMenu(false);
            }}
          >
            <div className="alinhar">
              <img src="/vectors/clock-three.png" alt="Movimentação" />
              <span>Movimentação</span>
            </div>
          </li>
          <ul
            id={submenuId}
            className={`sub-menu ${openSubMenu ? "open" : ""}`}
            aria-hidden={!openSubMenu}
          >
            <li className="sub-opcao">
              <NavLink to={`${baseUrl}/entradas`}>Entradas</NavLink>
            </li>
            <li className="sub-opcao">
              <NavLink to={`${baseUrl}/saidas`}>Saídas</NavLink>
            </li>
            <li className="sub-opcao">
              <NavLink to={`${baseUrl}/historico`}>Histórico</NavLink>
            </li>
          </ul>

          {/* Produtos */}
          <li className="opcao">
            <NavLink to={`${baseUrl}/produtos`}>
              <img src="/vectors/box.png" alt="Produtos" />
              <span>Produtos</span>
            </NavLink>
          </li>

          <li className="opcao">
            <NavLink to={`${baseUrl}/fornecedores`}>
            <img src="/vectors/user.png" alt="Fornecedores" />
            <span>Fornecedores</span>
            </NavLink>
          </li>


            {/* Configurações */}
          <li className="opcao">
            <NavLink to={`${baseUrl}/configurações`}>
            <img src="/vectors/settings-sliders.png" alt="Configurações" />
            <span>Configurações</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
