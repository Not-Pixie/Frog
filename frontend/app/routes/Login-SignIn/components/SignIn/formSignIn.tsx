import "./formSignIn.css";
import { useState } from "react";

function formSignIn () {

  return (
    <div className="divFormCriar">
      <h2 className="tituloCriar">Crie sua conta</h2>
      <div className="formCriarWrapper">
        <form className="formCriar">
          <div className="formWrapThree">
            <div className="etapaHeader">
              <button type="button" className="btnVoltar esconder">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <p className="descricaoEtapa">Adicione mais informações</p>
            </div>
            <div className="formGroupCriar">
              <label className="lblCriarConta" htmlFor="nomeComercio">
                Nome do comércio
              </label>
              <div className="inputWithError">
                <input
                  className="inputCriarConta"
                  type="text"
                  placeholder="Nome do comércio"
                />
              </div>
            </div>
            <div className="formGroupCriar">
              <label className="lblCriarConta" htmlFor="nomeProprietario">
                Nome do(a) proprietário(a)
              </label>
              <div className="inputWithError">
                <input
                  className="inputCriarConta"
                  type="text"
                  placeholder="Nome do(a) proprietário(a)"
                />
              </div>
            </div>
            <div className="btnNextCriarConta">
              <button type="submit" id="next">
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
          <div className="formWrapThree">
            <div className="etapaHeader">
              <button type="button" className="btnVoltar">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <p className="descricaoEtapa">Adicione mais informações</p>
            </div>
            <div className="formGroupCriar">
              <label className="lblCriarConta" htmlFor="numero">
                Número
              </label>
              <div className="inputWithError">
                <input
                  className="inputCriarConta"
                  type="number"
                  placeholder="Número"
                />
              </div>
            </div>
            <div className="formGroupCriar">
              <label className="lblCriarConta" htmlFor="email">
                Email
              </label>
              <div className="inputWithError">
                <input
                  className="inputCriarConta"
                  type="email"
                  placeholder="Email"
                />
              </div>
            </div>
            <div className="btnNextCriarConta">
              <button type="submit" id="next">
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
          <div className="formWrapThree">
            <div className="etapaHeader">
              <button type="button" className="btnVoltar">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <p className="descricaoEtapa">Agora crie uma senha</p>
            </div>
            <div className="formGroupCriar">
              <label className="lblCriarConta" htmlFor="senha">
                Senha
              </label>
              <div className="inputWithError">
                <input
                  className="inputCriarConta"
                  type="password"
                  placeholder="Senha"
                />
              </div>
            </div>
            <div className="formGroupCriar">
              <label className="lblCriarConta" htmlFor="validarSenha">
                Validar senha
              </label>
              <div className="inputWithError">
                <input
                  className="inputCriarConta"
                  type="password"
                  placeholder="Senha"
                />
              </div>
            </div>
            <div className="btnCentro">
              <button type="submit" className="btnCriarConta">
                Criar conta
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default formSignIn;
