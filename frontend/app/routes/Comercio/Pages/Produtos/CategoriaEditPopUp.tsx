// src/routes/Comercio/Pages/Produtos/CategoriaEditPopUp.tsx
import React, { useEffect, useState } from "react";
import PopUp from "src/components/PopUp";
import Input from "src/components/Input";
import Button from "src/components/Button/button.tsx";
import { COMERCIOS } from "src/api/enpoints";
import api from "src/api/axios";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { useParams } from "react-router";
import type { Categoria } from "src/types/categoria";

interface Props {
  isOpen: boolean;
  categoria?: Categoria | null; // se fornecida, abre em modo edição
  onClose?: () => void;
  onUpdated?: (c: Categoria) => void;
}

type FormValues = {
  nome: string;
};

export default function CategoriaEditPopUp({ isOpen, categoria, onClose, onUpdated }: Props) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { comercioId } = useParams();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { nome: "" },
  });

  // quando categoria muda (ou abre), preenche o form
  useEffect(() => {
    if (!isOpen) {
      reset();
      setGeneralError(null);
      return;
    }
    if (categoria) {
      setValue("nome", categoria.nome ?? "");
    } else {
      setValue("nome", "");
    }
  }, [isOpen, categoria, reset, setValue]);

  if (!isOpen) return null;

  async function onSubmit(data: FormValues) {
    setGeneralError(null);

    if (!comercioId) {
      setGeneralError("ID do comércio não encontrado.");
      return;
    }

    try {
      if (categoria && (categoria.categoria_id ?? (categoria as any).id)) {
        // modo edição -> PUT
        const id = categoria.categoria_id ?? (categoria as any).id;
        const res = await api.put(`${COMERCIOS}/${comercioId}/categorias/${id}`, { nome: data.nome });
        const resData = res.data;
        onUpdated?.(resData);
        reset();
        onClose?.();
      } else {
        // fallback: se categoria não fornecida, você pode reusar criação (POST)
        const res = await api.post(`${COMERCIOS}/${comercioId}/categorias`, { nome: data.nome });
        const resData = res.data;
        onUpdated?.(resData);
        reset();
        onClose?.();
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const body = err.response?.data;
        const message = body?.msg ?? body?.message ?? body?.error ?? `Erro ${status ?? ""}`;
        setGeneralError(message);
        // se backend retornar validação por campo, mapeie com setError('nome', { message: ... })
      } else {
        const message = err?.message ?? "Erro ao atualizar categoria.";
        setGeneralError(message);
      }
      console.error(err);
    }
  }

  function handleCancel() {
    reset();
    setGeneralError(null);
    onClose?.();
  }

  return (
    <PopUp
      isOpen={isOpen}
      onClose={handleCancel}
      ariaLabel={categoria ? "Editar categoria" : "Criar categoria"}
      containerClassName="popup-container"
      className="popup-content"
      showCloseButton={false}
    >
      <h3 style={{ margin: 0, marginBottom: 8 }}>{categoria ? "Editar Categoria" : "Criar Categoria"}</h3>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="nome"
          control={control}
          rules={{ required: "Nome é obrigatório." }}
          render={({ field }) => (
            <Input
              label="Nome"
              id="categoria-nome"
              type="text"
              placeholder="Nome da categoria"
              value={field.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                field.onChange((e as React.ChangeEvent<HTMLInputElement>).target.value)
              }
            />
          )}
        />

        {errors.nome && <div className="text-red-600 mt-2 text-sm">{errors.nome.message}</div>}
        {generalError && <div className="text-red-600 mt-2 text-sm">{generalError}</div>}

        <div className="modal-actions" style={{ marginTop: 12 }}>
          <Button type="button" onClick={handleCancel} theme="light" disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button type="submit" theme="green" disabled={isSubmitting}>
            {isSubmitting ? (categoria ? "Salvando..." : "Criando...") : (categoria ? "Salvar" : "Criar")}
          </Button>
        </div>
      </form>
    </PopUp>
  );
}
