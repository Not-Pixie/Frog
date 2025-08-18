import "./usuario.css";

function Usuario() {
  return (
    <div className="WrapAll">
      <header>
        <h1 className="TitleUserScreen">Seja bem-vindo,</h1>
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
  );
}

export default Usuario;
