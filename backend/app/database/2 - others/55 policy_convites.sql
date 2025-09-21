CREATE POLICY convites_select ON convites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu
      WHERE cu.comercio_id = convites.comercio_id
        AND cu.usuario_id = app_usuario_id()
    )
  );

CREATE POLICY convites_insert ON convites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu
      WHERE cu.comercio_id = convites.comercio_id
        AND cu.usuario_id = app_usuario_id()
        AND cu.permissao IN ('operador')
    )
  );
