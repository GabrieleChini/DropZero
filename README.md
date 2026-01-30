# DropZero

**Sistema di Monitoraggio Idrico Intelligente per la Municipalità di Trento**

DropZero è una piattaforma web completa per la gestione efficiente delle risorse idriche. Offre una dashboard utente per il monitoraggio dei consumi domestici e una dashboard amministrativa per la gestione territoriale del comune di Trento.

---

## 🚀 Caratteristiche Principali

### 👤 Per i Cittadini (User Dashboard)
*   **Monitoraggio in Tempo Reale**: Grafici interattivi per visualizzare i consumi settimanali, mensili e annuali.
*   **AI Smart Advice**: Consigli personalizzati generati dall'intelligenza artificiale per ridurre gli sprechi (es. rilevamento picchi anomali).
*   **Gestione Letture**: Inserimento manuale delle letture del contatore con validazione istantanea.
*   **Previsione Spesa**: Stima dei costi in base alle tariffe vigenti.

### 🏢 Per il Comune (Admin Dashboard)
*   **Mappa Interattiva di Trento**: Visualizzazione vettoriale (SVG) delle 12 circoscrizioni (Gardolo, Povo, Bondone, ecc.) con indicatori di stato.
*   **Rilevamento Anomalie**: Tabella in tempo reale delle utenze con consumi critici (> 8m³/settimana) o perdite sospette.
*   **Statistiche Aggregate**: Vista globale su contatori attivi e consumo totale del comune.

---

## 🛠 Tecnologia

Il progetto è sviluppato utilizzando lo stack **MERN**:
*   **Frontend**: React, Vite, TailwindCSS (Glassmorphism UI), Recharts.
*   **Backend**: Node.js, Express.
*   **Database**: MongoDB (Mongoose) con script di seeding avanzato.

---

## 📦 Installazione e Avvio

### Prerequisiti
*   Node.js (v18+)
*   MongoDB (Locale o Atlas)

### 1. Setup Backend
```bash
cd backend
npm install
# Creare file .env con:
# PORT=5001
# MONGODB_URI=...
# JWT_SECRET=...

# (Opzionale) Popolare il database con dati realistici
node seed.js

# Avvio server
npm run dev
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Accesso Demo
*   **Utente**: `mario.rossi@email.com` / `password123`
*   **Admin**: `admin@dropzero.com` / `password123`

---

## 👨‍💻 Autore
**Gabriele Chini**
Ingegneria del Software - Università di Trento
