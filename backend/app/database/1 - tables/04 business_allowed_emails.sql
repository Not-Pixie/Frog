CREATE TABLE business_allowed_emails (
    business_id     INTEGER         NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    email_id        INTEGER         NOT NULL REFERENCES email(id)    ON DELETE CASCADE,
    password_hash   TEXT            NOT NULL,
    PRIMARY KEY (business_id, email_id)
);