-- Update: colocar em configurações níveis de permissões de membros
CREATE POLICY produtos_select ON produtos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu
      WHERE cu.comercio_id = produtos.comercio_id
        AND cu.usuario_id = app_current_user_id()
    )
  );

CREATE POLICY produtos_update ON produtos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu
      WHERE cu.comercio_id = produtos.comercio_id
        AND cu.usuario_id = app_current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu
      WHERE cu.comercio_id = products.comercio_id
        AND cu.usuario_id = app_current_user_id()
    )
  );

CREATE POLICY produtos_insert ON produtos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios_usuarios cu
      WHERE cu.comercio_id = produtos.comercio_id
        AND cu.usuario_id = app_current_user_id()
    )
  );
