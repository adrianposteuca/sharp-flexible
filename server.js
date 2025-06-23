// server.js
const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');

const upload = multer();
const app    = express();

// Serve static din /public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Root → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /generate
app.post(
  '/generate',
  upload.fields([
    { name: 'background', maxCount: 1 },
    { name: 'template',   maxCount: 1 },  // must be transparent PNG
    { name: 'photo1',     maxCount: 1 },
    { name: 'photo2',     maxCount: 1 },
    { name: 'photo3',     maxCount: 1 },
    { name: 'photo4',     maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // 1) Încarcă buffer-ele
      const bgBuf   = req.files.background[0].buffer;
      const tplBuf  = req.files.template[0].buffer;
      const names   = ['photo1','photo2','photo3','photo4'];

      // 2) Slot-urile (coordonate + dimensiuni extrase din template_alpha.png)
      const slots = [
        { left: 118, top:  185, width: 531, height: 637 },  // photo1
        { left: 767, top:  185, width: 566, height: 637 },  // photo2
        { left: 118, top: 1140, width: 531, height: 670 },  // photo3
        { left: 767, top: 1140, width: 566, height: 670 },  // photo4
      ];

      // 3) Redimensionează fiecare poza la dimensiunea slot-ului
      const resized = await Promise.all(
        slots.map(({ width, height }, i) =>
          sharp(req.files[names[i]][0].buffer)
            .resize(width, height, { fit: 'cover' })
            .toBuffer()
        )
      );

      // 4) Construiește array-ul de composite
      const compositeArr = resized.map((buf, i) => ({
        input: buf,
        left:  slots[i].left,
        top:   slots[i].top,
      }));
      // apoi template-ul cu transparență peste tot
      compositeArr.push({ input: tplBuf, left: 0, top: 0 });

      // 5) Generează imaginea finală
      const out = await sharp(bgBuf)
        .composite(compositeArr)
        .png()
        .toBuffer();

      res.set('Content-Type', 'image/png');
      return res.send(out);

    } catch (e) {
      console.error('🔴 Sharp error:', e);
      return res
        .status(500)
        .send(`Eroare la generarea collage-ului: ${e.message}`);
    }
  }
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${port}`);
});
