import React, { useState } from "react";
import PublicRoute from "src/api/auth/PublicRoute"; 
import "./usuario.css";
import { useAuth } from "src/api/auth/AuthProvider";
import CommerceCard from "src/components/CommerceCard";
import PopupCreateCompany from "./variations/PopUpCreateCompany";
import type { Company } from "./variations/PopUpCreateCompany";

function Usuario() {
  const { user } = useAuth();
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
            {/* linha superior: 3 cards */}
            <div className="commerce-row commerce-row-top">
              <CommerceCard onClick={() => setModalOpen(true)} />
              <CommerceCard onClick={() => setModalOpen(true)} />
              <CommerceCard onClick={() => setModalOpen(true)} />
            </div>

            {/* linha inferior: 2 cards */}
            <div className="commerce-row commerce-row-bottom">
              <CommerceCard onClick={() => setModalOpen(true)} />
              <CommerceCard onClick={() => setModalOpen(true)} />
            </div>
          </div>
        </div>

        <PopupCreateCompany
          isOpen={modalOpen}
          onClose={() => {setModalOpen(false);}}
          onCreated={(c: Company) => { console.log(c); setModalOpen(false); }}
        />
      </div>
    </PublicRoute>
  );
}

export default Usuario;
