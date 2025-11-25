import { Outlet, useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import "./comercioLayout.css";
import ProtectedRoute from "src/api/auth/ProtectedRoute";
import { Sidebar } from "./customComponents/SideBar";
import { useAuth } from "src/api/auth/AuthProvider";
import LoadingPage from "src/pages/LoadingPages";
import * as authServices from "src/api/auth/authServices";

export default function ComercioLayout() {
  const { comercioId } = useParams();
  const { user, loading, checkAuth, setUser } = useAuth();
  const navigate = useNavigate();

  const baseUrl = `/comercio/${comercioId}`;
  const id = comercioId ? Number(comercioId) : NaN;
  const validId = !isNaN(id);

  const [authChecked, setAuthChecked] = useState(false);
  const [updatingComercios, setUpdatingComercios] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (loading) {
      if (typeof checkAuth === "function") {
        Promise.resolve(checkAuth()).finally(() => {
          if (mounted) setAuthChecked(true);
        });
      } else {
        setAuthChecked(true);
      }
    } else {
      setAuthChecked(true);
    }

    return () => { mounted = false };
  }, [loading, checkAuth]);

  useEffect(() => {
    let mounted = true;
    // se não há setUser disponível, cai fora (defensivo)
    if (!setUser) return;

    (async () => {
      try {
        setUpdatingComercios(true);
        const data = await authServices.fetchCurrentUser();
        if (!mounted) return;
        const fetchedUser = data?.usuario ?? null;
        const newComercios = fetchedUser?.comercios ?? null;

        if (!user && fetchedUser) {
          setUser(fetchedUser);
        } else if (user) {
          setUser({ ...user, comercios: newComercios });
        }
      } catch (err) {} 
      finally {
        if (mounted) setUpdatingComercios(false);
      }
    })();

    return () => { mounted = false };
  }, [comercioId, setUser]);

  const validUser =
    authChecked &&
    !loading &&
    !updatingComercios &&
    Boolean(user) &&
    validId &&
    Array.isArray(user?.comercios) &&
    user.comercios!.includes(id);

  useEffect(() => {
    if (loading || !authChecked || updatingComercios) return;
    if (!validUser && user) {
      navigate('/meus-comercios', { replace: true });
    }
  }, [loading, authChecked, updatingComercios, validUser, user, navigate]);

  if (loading || updatingComercios) return <LoadingPage />;

  if (!validUser)
    return (
      <ProtectedRoute>
        <div>
          Acesso Negado
        </div>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      <div className="layout">
        <Sidebar baseUrl={baseUrl} />
        {/* Onde as páginas vão renderizar */}
        <div className="conteudo">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
