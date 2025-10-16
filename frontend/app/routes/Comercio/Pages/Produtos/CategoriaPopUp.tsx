import React, { useState } from "react";
import PopUp from "src/components/PopUp";
import Input from "src/components/Input";
import Button from "src/components/Button/button.tsx";
import {CATEGORIAS} from "src/api/enpoints";
import api from "src/api/axios";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";

interface Category {
    id: string;
    nome: string;
}

interface Props {
    isOpen: boolean;
    onClose?: () => void;
    onCreated?: (c: Category) => void;
}

type FormValues = {
    nome: string;
};

export default function CategoriaPopUp({ isOpen, onClose, onCreated }: Props) {
    const [generalError, setGeneralError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: { nome: "" },
    });

    if (!isOpen) return null;

    async function onSubmit(data: FormValues) {
        setGeneralError(null);

        try {
            const res = await api.post(CATEGORIAS, { nome: data.nome });
            const resData = res.data;

            const created: Category = {
                id: resData?.id ?? resData?.categoria_id ?? `temp-${Date.now()}`,
                nome: resData?.nome ?? data.nome,
            };

            onCreated?.(created);
            reset();
            onClose?.();
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const body = err.response?.data;
                const message = body?.msg ?? body?.message ?? `Erro ${status ?? ""}`;

                setGeneralError(message);
            } else {
                const message = err?.message ?? "Erro ao criar categoria.";
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
            ariaLabel="Criar categoria"
            containerClassName="popup-container"
            className="popup-content"
            showCloseButton={false}
        >
            <h3 style={{ margin: 0, marginBottom: 8 }}>Criar Categoria</h3>

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
                        {isSubmitting ? "Criando..." : "Criar"}
                    </Button>
                </div>
            </form>
        </PopUp>
    );
}