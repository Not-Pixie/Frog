import { useParams } from "react-router"
import ProtectedRoute from "src/api/auth/ProtectedRoute";
import api from "src/api/axios";
import { CONVITES } from "src/api/enpoints";


export default function Convite() {

    const {inviteCode} = useParams();

    const handleClick = async () => {
        const data = {inviteCode: inviteCode,
            token: 0,
        };

        api.post(CONVITES, data)
            .then((res) => {
                alert("Convite aceito com sucesso!");
                console.log("Convite aceito:", res.data);
            })
            .catch((error) => {
                console.error("Erro ao aceitar convite:", error);
                alert("Erro ao aceitar convite. Tente novamente.");
            });
       
    }
    
    if (!inviteCode)
        return (<div>Convite inválido</div>)

    return (<ProtectedRoute>
        <div>
            <h1>Convite</h1>
            <p>Você foi convidado a participar de um negócio com o código: {inviteCode}</p>
            <button onClick={handleClick}>Teste</button>
        </div>
    </ProtectedRoute>)
}