import React, { useCallback, useEffect, useRef, useState } from "react";
import ProtectedRoute from "src/api/auth/ProtectedRoute";
import "./MeusComercios.css";
import { useAuth } from "src/api/auth/AuthProvider";
import CommerceCard from "src/components/CommerceCard";
import PopupCreateCompany from "./customComponents/PopUpCreateCompany";
import type { Company } from "./customComponents/schemas";
import type { Comercio } from "src/types/comercio";
import api from "src/api/axios";
import { ME } from "src/api/enpoints";
import { AxiosError } from "axios";

import { GoHomeFill } from "react-icons/go";
import { Link } from "react-router";

interface Response {
  comercios: Comercio[];
}

function MeusComercios() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const isMountedRef = useRef(false);

  const fetchComercios = useCallback(async () => {
    setError("");
    setIsRefreshing(true);

    try {
      const res = await api.get<Response>(`${ME}/comercios`);
      const data = res.data;

      if (!isMountedRef.current) { return; };
      setComercios(Array.isArray(data?.comercios) ? data.comercios : []);
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      const serverMessage =
        axiosErr?.response?.data?.message ??
        axiosErr?.message ??
        "Erro inesperado na requisição";
      if (isMountedRef.current) setError(serverMessage);
    } finally {
      if (isMountedRef.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true; //Resetando pro safemode; aumenta robustez
    return () => { isMountedRef.current = false }
  }, []);

  useEffect(() => {
    fetchComercios();
  }, [fetchComercios]);

  useEffect(() => {
    if (!isModalOpen) fetchComercios();
  }, [isModalOpen, fetchComercios]);


  const openModal = () => setIsModalOpen(true);


  return (
    <ProtectedRoute>
      <div className="user-page">

<div className="btn-home">
  <Link to="/">
  <GoHomeFill />
  </Link>
</div>
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
                    key={`c-${idx}`}
                    comercio={comercio}
                  />
                ) : (
                  <CommerceCard key={`cn-${idx}`} onClick={openModal} />
                );
              })}
            </div>
            <div className="commerce-row commerce-row-bottom">
              {[3, 4].map((idx) => {
                const comercio = comercios?.[idx];
                return comercio ? (
                  <CommerceCard
                    key={`c-${idx}`}
                    comercio={comercio}
                  />
                ) : (
                  <CommerceCard key={`cn-${idx}`} onClick={openModal} />
                );
              })}
            </div>
          </div>
        </div>

        <PopupCreateCompany
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); }}
          onCreated={(c: Company) => { setIsModalOpen(false); }}
        />
      </div>
    </ProtectedRoute>
  );
}

export default MeusComercios;
