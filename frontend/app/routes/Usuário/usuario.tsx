import React, { useEffect, useState } from "react";
import ProtectedRoute from "src/api/auth/ProtectedRoute"; 
import "./usuario.css";
import { useAuth } from "src/api/auth/AuthProvider";
import CommerceCard from "src/components/CommerceCard";
import PopupCreateCompany from "./customComponents/PopUpCreateCompany";
import type { Company, Comercio } from "./customComponents/schemas";
import api from "src/api/axios";
import { ME } from "src/api/enpoints";
import { AxiosError } from "axios";

function Usuario() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comercios, setComercios] = useState<Comercio[]>();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchComercios = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get(`${ME}/comercios`);
      const data = res.data;
      
      setComercios(data?.comercios);
    }
    catch (err:any)
    {
      if (err instanceof AxiosError)
      {
        setError(err.message ?? "Erro em requisição")
      }
      else
        setError("Erro inesperado aconteceu")
    }
    finally {
      setIsRefreshing(false);
    }
  }

  const openModal = () => setIsModalOpen(true);

  useEffect(() => {fetchComercios()}, [isModalOpen]);

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
            <div className="commerce-row comerce-row-top">
              {[0, 1, 2].map((idx) => {
                const comercio = comercios?.[idx];
                return comercio ? (
                  <CommerceCard
                    key={ `c-${idx}`}
                    comercio={comercio}
                  />
                ) : (
                  <CommerceCard key={`cn-${idx}`} onClick={openModal}/>
                );
              })}
            </div>
            <div className="commerce-row commerce-row-bottom">
              {[4, 5].map((idx) => {
                const comercio = comercios?.[idx];
                return comercio ? (
                  <CommerceCard
                    key={`c-${idx}`}
                    comercio={comercio}
                  />
                ) : (
                  <CommerceCard key={`cn-${idx}`} onClick={openModal}/>
                );
              })}
            </div>
          </div>
        </div>

        <PopupCreateCompany
          isOpen={isModalOpen}
          onClose={() => {setIsModalOpen(false);}}
          onCreated={(c: Company) => { console.log(c); setIsModalOpen(false); }}
        />
      </div>
    </ProtectedRoute>
  );
}

export default Usuario;
