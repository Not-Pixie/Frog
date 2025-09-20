import React, { useState } from "react";
import PublicRoute from "src/api/auth/PublicRoute"; 
import "./usuario.css";
import { useAuth } from "src/api/auth/AuthProvider";
import PopupCreateCompany from "src/components/Input/PopUpComercio";
import type { Company } from "src/components/Input/PopUpComercio";

function Usuario() {
  const { user, token } = useAuth();

  // estado mínimo para abrir/fechar o modal
  const [modalOpen, setModalOpen] = useState(false);

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
              {/* Tornei os cards clicáveis: ao clicar abre o modal */}
              <div className="commerce-card" onClick={() => setModalOpen(true)}>a</div>
              <div className="commerce-card" onClick={() => setModalOpen(true)}>a</div>
              <div className="commerce-card" onClick={() => setModalOpen(true)}>a</div>
            </div>
            <div className="commerce-row-2">
              <div className="commerce-card" onClick={() => setModalOpen(true)}>a</div>
              <div className="commerce-card" onClick={() => setModalOpen(true)}>a</div>
            </div>
          </div>
        </div>

        {/* Modal com comportamento mínimo: recebe o estado e fecha ao onClose */}
        <PopupCreateCompany
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={(c: Company) => { console.log(c); setModalOpen(false); }}
          authToken={token ?? undefined}
        />
      </div>
    </PublicRoute>
  );
}

export default Usuario;
