# Fin de Año - App de Consumo (MongoDB + Admin)

## Requisitos
- Node.js 18+
- MongoDB (local o Atlas)

## Setup
1) Instalar deps:
   npm install

2) Crear .env:
   copiar .env.example a .env y completar:
   - MONGO_URI
   - ADMIN_TOKEN

3) Correr:
   npm run dev

## URLs
- Invitados: http://localhost:3000/
- Admin:     http://localhost:3000/admin.html

## Admin token
En admin.html te pide token. Usá el valor de ADMIN_TOKEN.