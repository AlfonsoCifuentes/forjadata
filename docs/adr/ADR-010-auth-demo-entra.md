# ADR-010: Autenticación demo y Microsoft Entra

- Estado: Aceptada
- Fecha: 2026-07-30

El acceso público usa identidades sintéticas y roles acotados. El modo enterprise utiliza MSAL
con Authorization Code + PKCE y validación JWT backend. Ambos implementan el mismo contrato de
sesión; el modo demo nunca se presenta como SSO real.
