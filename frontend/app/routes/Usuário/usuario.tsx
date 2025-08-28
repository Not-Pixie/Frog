import PublicRoute from "src/api/auth/PublicRoute"; 
import "./usuario.css";
import { useAuth } from "src/api/auth/AuthProvider";

function Usuario() {
  const { user } = useAuth();

  return (
    <PublicRoute>
      <div className="user-page">
        <header>
          <h1 className="user-page_title">Seja bem-vindo, {user?.nome}</h1>
          <p className="user-page_subtitle">
            Escolha um comércio para acessar, ou crie um novo
          </p>
        </header>
        <div className="commerce-grid-wrapper">
          <div className="commerce-grid">
            <div className="commerce-row-1">
              <div className="commerce-card">a</div>
              <div className="commerce-card">a</div>
              <div className="commerce-card">a</div>
            </div>
            <div className="commerce-row-2">
              <div className="commerce-card">a</div>
              <div className="commerce-card">a</div>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}

export default Usuario;
