import ProtectedRoute from "src/api/auth/ProtectedRoute"; 
import "./usuario.css";
import { useAuth } from "src/api/auth/AuthProvider";
import CommerceCard from "src/components/CommerceCard";

function Usuario() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
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
              <CommerceCard></CommerceCard>
              <CommerceCard></CommerceCard>
              <CommerceCard></CommerceCard>
            </div>
            <div className="commerce-row-2">
              <CommerceCard></CommerceCard>
              <CommerceCard></CommerceCard>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Usuario;
