import ProtectedRoute from "src/api/auth/ProtectedRoute";
import "./usuario.css";
import { useAuth } from "src/api/auth/AuthProvider";

function Usuario() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <div className="WrapAll">
        <header>
          <h1 className="TitleUserScreen">Seja bem-vindo, {user?.name}</h1>
          <p className="PUserScreen">
            Escolha um comércio para acessar, ou crie um novo
          </p>
        </header>
        <div className="WrapComercios">
          <div className="item" id="1">
              <div className="info">a</div>
          </div>
          <div className="item" id="2">
              <div className="info">a</div>
          </div>
          <div className="item" id="3">
              <div className="info">a</div>
          </div>
          <div className="item" id="4">
              <div className="info">a</div>
          </div>
          <div className="item" id="5">
              <div className="info">a</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Usuario;
