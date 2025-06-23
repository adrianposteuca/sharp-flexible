# Sharp Flexible Collage Service

Un mic serviciu Express + Sharp care:
- Primește 6 fișiere (background, template alfa, 4 poze)
- Primește coordonatele X/Y pentru cele 4 poze
- Generează un PNG compus și-l servește direct

## Fișiere

- `public/form.html` – formularul web
- `server.js`         – codul Express + Sharp
- `package.json`      – dependințe și scripturi
- `.gitignore`        – fișiere care nu se urcă

## Instalare local

```bash
git clone https://github.com/<utilizator>/sharp-flexible.git
cd sharp-flexible
npm install
npm start
