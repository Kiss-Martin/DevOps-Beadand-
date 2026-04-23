# DevOps beadandó minta: Filmek és rendezők

Ez a minta egy **egyszerű full-stack alkalmazást** mutat be, amely filmeket és rendezőket kezel, és automatikusan deployolható GitHub Actions segítségével a Jedlik szerverre.

## 1) Javasolt technológiai stack

- **Frontend:** statikus HTML + CSS + JavaScript (kezdéshez gyors és egyszerű)
- **Backend:** Node.js + Express
- **Adatbázis:** SQLite (egy fájlban tárolja az adatokat, minimális üzemeltetés)
- **Konténerizáció:** Docker + Docker Compose
- **CI/CD:** GitHub Actions + SSH deploy a Jedlik szerverre

Miért ez jó beadandóhoz?
- Kevés konfiguráció
- Gyorsan érthető
- Mégis tartalmaz valódi DevOps elemeket (konténer, pipeline, automatikus deploy)

## 2) Alap funkciók (MVP)

1. Filmek listázása
2. Rendezők listázása
3. Új film felvétele rendezőhöz
4. Film rendezőjének lekérdezése (`/api/movies/:id/director`)
5. Frontenden lista megjelenítése

## 3) Backend API példa (REST)

### Egészségügyi endpoint
- `GET /health`

### Rendezők
- `GET /api/directors` – összes rendező
- `POST /api/directors` – új rendező létrehozása
  - body: `{ "name": "Denis Villeneuve" }`

### Filmek
- `GET /api/movies` – filmek listája rendezőnévvel
- `POST /api/movies` – új film létrehozása
  - body: `{ "title": "Dune", "year": 2021, "director_id": 3 }`
- `GET /api/movies/:id/director` – adott film rendezője

## 4) Lépésről lépésre elkészítés

### 4.1 Projekt inicializálás
```bash
mkdir movies-app && cd movies-app
git init
```

### 4.2 Backend létrehozás
- `backend/src/index.js` fájlban:
  - SQLite táblák létrehozása (`directors`, `movies`)
  - seed adatok betöltése
  - REST endpointok

### 4.3 Frontend létrehozás
- `frontend/index.html` + `frontend/app.js`
- A JS a `/api/movies` endpointot hívja, és kirendereli listába

### 4.4 Dockerizálás
- `backend/Dockerfile` – Node API image
- `frontend/Dockerfile` – Nginx statikus kiszolgáláshoz
- `docker-compose.yml` – két service és perzisztens volume a DB-nek

Futtatás helyben:
```bash
docker compose up -d --build
```

Elérés:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`

## 5) GitHub Actions CI/CD pipeline

A `.github/workflows/deploy.yml` workflow push-ra fut a `main` ágon.

Fő lépések:
1. Repo checkout
2. SSH kapcsolat a Jedlik szerverhez
3. Kód frissítése szerveren (`git fetch`, `git reset --hard origin/main`)
4. Konténerek újraépítése és indítása (`docker compose up -d --build`)

## 6) Jedlik szerveres deploy (jcloud.jedlik.eu)

> Fontos: az alábbiakat a Jedlik szerveren kell egyszer beállítani.

### 6.1 Szerver előkészítés
1. Docker és Docker Compose telepítés
2. SSH kulcsos belépés beállítása
3. Egy deploy mappa létrehozása, pl. `~/movies-app`

### 6.2 GitHub Secrets beállítás
A repóban: **Settings → Secrets and variables → Actions**

Szükséges secret-ek:
- `JEDLIK_HOST` (pl. `jcloud.jedlik.eu`)
- `JEDLIK_PORT` (általában `22`)
- `JEDLIK_USER` (szerver felhasználó)
- `JEDLIK_SSH_KEY` (privát kulcs tartalma)
- `REPO_SSH_URL` (pl. `git@github.com:felhasznalo/repo.git`)

### 6.3 Első deploy
1. Push a `main` branch-re
2. GitHub Actions fülön ellenőrizd a workflow futását
3. Siker esetén a konténerek újraindulnak a szerveren

### 6.4 Ellenőrzés szerveren
```bash
docker ps
docker compose logs -f
curl http://localhost:3000/health
```

## 7) Értékelésnél jól mutató pluszok

- Egyszerű README architektúra ábrával
- Rövid API dokumentáció
- Healthcheck endpoint
- Rollback terv (pl. előző commitra reset)
- Verziózott release tagek

## 8) Gyors hibakeresés

- Ha a frontend nem látja a backendet: ellenőrizd a CORS-t és az API URL-t.
- Ha deploy nem fut: nézd a GitHub Actions logot és az SSH secret-eket.
- Ha DB elvész: ellenőrizd, hogy a `movies_data` volume tényleg csatolva van-e.

---

Ez a minta tudatosan egyszerű, hogy beadandóban gyorsan bemutatható legyen a **full stack + DevOps + CI/CD** teljes folyamat.
