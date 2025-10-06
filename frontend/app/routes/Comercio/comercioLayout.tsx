import { Outlet, NavLink, useParams } from "react-router";
import { useState } from "react";
import "./comercioLayout.css";
import ProtectedRoute from "src/api/auth/ProtectedRoute";

export default function ComercioLayout() {
  const [openSubMenu, setOpenSubMenu] = useState(false);
  const {comercioId} = useParams();
  const baseUrl = `/comercio/${comercioId}`;

  return (
    <ProtectedRoute>
      <div className="layout">
        <div className="sideBar">
          <div className="logo"><img src="../../../public/img/frog2.jpeg" height="175" width="175"></img></div>
          <nav className="menu">
            <ul>
              {/* Dashboard */}
              <li className="opcao">
                <NavLink to={baseUrl} end>
                  <img src="/vectors/chart-histogram.png" alt="Dashboard" />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              {/* Movimentações */}
              <li className="opcao" onClick={() => setOpenSubMenu(!openSubMenu)}>
                <div className="alinhar">
                  <img src="/vectors/clock-three.png" alt="Movimentação" />
                  <span>Movimentação</span>
                </div>
              </li>
              {openSubMenu && (
                <ul className="sub-menu show">
                  <li className="sub-opcao">
                    <NavLink to="/telaPrincipal/movimentacoes/entradas">
                      Entradas
                    </NavLink>
                  </li>
                  <li className="sub-opcao">
                    <NavLink to="/telaPrincipal/movimentacoes/saidas">
                      Saídas
                    </NavLink>
                  </li>
                  <li className="sub-opcao">
                    <NavLink to="/telaPrincipal/movimentacoes/relatorios">
                      Relatórios
                    </NavLink>
                  </li>
                </ul>
              )}
              {/* Produtos */}
              <li className="opcao">
                <NavLink to={`${baseUrl}/produtos`}>
                  <img src="/vectors/box.png" alt="Produtos" />
                  <span>Produtos</span>
                </NavLink>
              </li>
              {/* Fornecedores */}
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
        {/* Onde as páginas vão renderizar */}
        <div className="conteudo">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
