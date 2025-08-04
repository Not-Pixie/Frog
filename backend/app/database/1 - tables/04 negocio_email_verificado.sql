CREATE TABLE negocio_email_verificado (
    negocio_id     INTEGER         NOT NULL REFERENCES negocio(id) ON DELETE CASCADE,
    email_id        INTEGER         NOT NULL REFERENCES email(id)    ON DELETE CASCADE,
    senha_hash   TEXT            NOT NULL,
    PRIMARY KEY (negocio_id, email_id)
);