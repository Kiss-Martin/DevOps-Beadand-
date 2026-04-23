# DevOps beadandó minta: Filmek és rendezők (Kubernetes + CI/CD)

Ez a minta egy egyszerű full-stack app:
- **backend API**: filmek és rendezők kezelése
- **frontend**: lista megjelenítés
- **CI/CD**: GitHub Actions
- **deploy cél**: Jedlik Kubernetes (`*.jcloud.jedlik.cloud`)

## 1) Javasolt stack

- Frontend: statikus HTML/CSS/JS
- Backend: Node.js + Express
- Adatbázis: SQLite
- Konténer: Docker
- Orchestration: Kubernetes (Deployment + Service + Ingress)
- Registry: GHCR (`ghcr.io`)
- CI/CD: GitHub Actions

## 2) MVP funkciók

- Filmek listázása (`GET /api/movies`)
- Rendezők listázása (`GET /api/directors`)
- Új film felvétele rendezőhöz (`POST /api/movies`)
- Film rendezőjének lekérdezése (`GET /api/movies/:id/director`)
- Frontenden film + rendező lista megjelenítés

## 3) Backend API röviden

- `GET /health`
- `GET /api/directors`
- `POST /api/directors`
- `GET /api/movies`
- `POST /api/movies`
- `GET /api/movies/:id/director`

A konkrét implementáció a `backend/src/index.js` fájlban van.

## 4) Lokális futtatás (gyors teszthez)

```bash
docker compose up -d --build
```

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`

## 5) Kubernetes deploy fájl (Jedlik mintára)

A `k8s/app.yaml` tartalmazza:
- Backend Deployment + Service
- Frontend Deployment + Service
- Ingress (`/api` -> backend, `/` -> frontend)

Állítsd át benne:
1. `REPLACE_WITH_OWNER` -> GitHub user/org
2. `REPLACE_WITH_YOUR_HOST.jcloud.jedlik.cloud` -> saját hoszt

## 6) GitHub Actions CI/CD

A `.github/workflows/deploy.yml` workflow:
1. Backend image build + push GHCR-be
2. Frontend image build + push GHCR-be
3. `KUBE_CONFIG` secretből kubeconfig beállítás
4. `k8s/app.yaml` image tagek cseréje aktuális `github.run_id` értékre
5. `kubectl apply -f k8s/app.yaml`

## 7) Szükséges GitHub Secrets

- `KUBE_CONFIG`: base64 kódolt kubeconfig
- (opcionális) külön token nem kell GHCR-hez, mert a workflow `GITHUB_TOKEN`-t használ

## 8) Jedlik oldali előkészítés

A klaszterben legyen:
- nginx ingress controller
- `ghcr-auth-secrets` imagePullSecret a namespace-ben

Példa imagePullSecret készítésre:
```bash
kubectl create secret docker-registry ghcr-auth-secrets \
  --docker-server=ghcr.io \
  --docker-username=GITHUB_USERNAME \
  --docker-password=GHCR_PAT \
  --docker-email=you@example.com
```

## 9) Ellenőrzés deploy után

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
kubectl describe ingress movies-ingress
```

Ha a host jól van DNS-ben beállítva, böngészőből az ingress hoston az app elérhető.
