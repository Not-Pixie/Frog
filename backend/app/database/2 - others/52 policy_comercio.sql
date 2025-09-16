-- Comercios
  -- SELECT (read)
  CREATE POLICY comercios_select ON comercios
    FOR SELECT
    USING (
      proprietario_id = app_usuario_id()
      OR EXISTS (
        SELECT 1 FROM comercios_usuarios cu 
        WHERE cu.comercio_id = comercios.comercio_id 
          AND cu.usuario_id = app_usuario_id()
      )
    );

  -- UPDATE (read + check)
  CREATE POLICY comercios_update ON comercios
    FOR UPDATE
    USING (
      proprietario_id = app_usuario_id()
      OR EXISTS (
        SELECT 1 FROM comercios_usuarios cu 
        WHERE cu.comercio_id = comercios.comercio_id 
          AND cu.usuario_id = app_usuario_id()
          AND cu.permissao IN ('operador')
      )
    )
    WITH CHECK (
      proprietario_id = app_usuario_id()
      OR EXISTS (
        SELECT 1 FROM comercios_usuarios cu 
        WHERE cu.comercio_id = comercios.comercio_id 
          AND cu.usuario_id = app_usuario_id()
          AND cu.permissao IN ('operador')
      )
    );

  -- INSERT
  CREATE POLICY comercios_insert ON comercios
    FOR INSERT
    WITH CHECK (proprietario_id = app_usuario_id());
