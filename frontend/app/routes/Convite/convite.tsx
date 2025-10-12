import "./convite.css"
import React, { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router";
import ProtectedRoute from "src/api/auth/ProtectedRoute";
import api from "src/api/axios";
import { CONVITES } from "src/api/enpoints";
import type { Comercio } from "../MeusComercios/customComponents/schemas";
import CommerceCard from "src/components/CommerceCard";
import Button from "src/components/Button";

interface GetConviteResponse {
  comercio?: Comercio;
  isValid: boolean;
  message?: string;
}

export default function Convite() {
  const { inviteCode } = useParams<{ inviteCode?: string }>();
  const [comercio, setComercio] = useState<Comercio | undefined>();
  const [isRefreshing, setRefreshing] = useState<boolean>(false);
  const [isAccepting, setAccepting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const fetchConvite = useCallback(async () => {
    setError("");
    setRefreshing(true);
    try {
      const res = await api.get<GetConviteResponse>(
        `${CONVITES}/${inviteCode}`
      );
      const data = res.data;

      if (data.isValid && data.comercio) {
        setComercio(data.comercio);
      } else {
        setComercio(undefined);
        setError(data.message ?? "Convite inválido ou não encontrado");
      }
    } catch (err: unknown) {
      let serverError = "Erro inesperado na requisição";
      if (isAxiosError(err)) {
        serverError =
          (err?.response?.data as any)?.message ?? err.message ?? serverError;
      } else if (err instanceof Error) {
        serverError = err.message;
      }
      setComercio(undefined);
      setError(serverError);
    } finally {
      setRefreshing(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    fetchConvite();
  }, [fetchConvite]);

  const handleRecusar = () => {
    navigate("/meus-comercios");
  };

  const handleAceitar = async () => {
    const code = inviteCode;
    if (!code) {
      setError("inviteCode ausente");
      return;
    }

    setAccepting(true);
    setError("");
    try {
      await api.post(CONVITES, { inviteCode: code });
      navigate("/meus-comercios");
    } catch (err: unknown) {
      let serverError = "Erro ao aceitar convite";
      if (isAxiosError(err)) {
        serverError =
          (err?.response?.data as any)?.message ?? err.message ?? serverError;
      } else if (err instanceof Error) {
        serverError = err.message;
      }
      setError(serverError);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="convite-page">
        {isRefreshing ? (
          <div className="carregando">Carregando...</div>
        ) : (
          <div className="convite">
            {comercio ? (
              <>
                <h3 className="titulo">
                  Você foi convidado para{" "}
                  {comercio.nome ?? comercio.comercio_id}
                </h3>
                <CommerceCard comercio={comercio} clickable={false} />
                <div className="botoes">
                  <Button
                    theme="light"
                    onClick={handleRecusar}
                    disabled={isAccepting || isRefreshing}
                  >
                    Recusar
                  </Button>
                  <Button
                    theme="green"
                    onClick={handleAceitar}
                    disabled={isAccepting || isRefreshing}
                  >
                    {isAccepting ? "Aceitando..." : "Aceitar"}
                  </Button>
                </div>
                {error ? <div className="erro">{error}</div> : null}
              </>
            ) : (
              <div className="vazio">
                {error ? error : "Convite inválido ou não encontrado"}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
