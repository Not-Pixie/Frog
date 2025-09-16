-- SELECT: usuário vê só suas linhas, e admins do comércio veem as linhas daquele comércio
CREATE POLICY comercios_usuarios_select ON comercios_usuarios
  FOR SELECT
  USING (
    usuario_id = app_usuario_id()
    OR EXISTS (
      SELECT 1 FROM comercios_usuarios cu2
      WHERE cu2.comercio_id = comercios_usuarios.comercio_id
        AND cu2.usuario_id = app_usuario_id()
        AND cu2.permissao IN ('operador')
    )
  );

-- INSERT/UPDATE/DELETE: só admins/owner do comercio
CREATE POLICY comercios_usuarios_manage ON comercios_usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu2
      WHERE cu2.comercio_id = comercios_usuarios.comercio_id
        AND cu2.usuario_id = app_usuario_id()
        AND cu2.permissao = 'operador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu2
      WHERE cu2.comercio_id = comercios_usuarios.comercio_id
        AND cu2.usuario_id = app_usuario_id()
        AND cu2.permissao = 'operador'
    )
  );
