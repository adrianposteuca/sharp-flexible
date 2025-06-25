# Sharp Collage Service

Microserviciu HTTP pentru generarea unui colaj „before/after” folosind [Sharp](https://github.com/lovell/sharp).

## Endpoint

### POST `/generate`

- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `photo1`, `photo2`, `photo3`, `photo4` — cele 4 imagini JPEG/PNG
  - `p1Left`, `p1Top`, `p2Left`, `p2Top`, `p3Left`, `p3Top`, `p4Left`, `p4Top` — pozițiile în pixeli ale fiecărei poze în șablon

#### Exemplu cu `curl`

```bash
curl -X POST http://localhost:3000/generate \
  -F "photo1=@/cale/catre/img1.jpg" \
  -F "photo2=@/cale/catre/img2.jpg" \
  -F "photo3=@/cale/catre/img3.jpg" \
  -F "photo4=@/cale/catre/img4.jpg" \
  -F "p1Left=120"  -F "p1Top=180"  \
  -F "p2Left=788"  -F "p2Top=180"  \
  -F "p3Left=120"  -F "p3Top=1140" \
  -F "p4Left=788"  -F "p4Top=1140" \
  --output collage.png
