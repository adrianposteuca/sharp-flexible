// server.js
const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');

const upload = multer(); 
const app    = express();

// 1) Serve folderul public (unde ai index.html)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 2) GET / → trimite index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3) POST /generate → primește fișierele, le redimensionează și face composite
app.post(
  '/generate',
  upload.fields([
    { name: 'background', maxCount: 1 },
    { name: 'template',   maxCount: 1 },
    { name: 'photo1',     maxCount: 1 },
    { name: 'photo2',     maxCount: 1 },
    { name: 'photo3',     maxCount: 1 },
    { name: 'photo4',     maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log('🔔 Received POST /generate');

      // 1. Buffer-urile originale
      const bgBuf  = req.files.background[0].buffer;
      const tplBuf = req.files.template[0].buffer;

      // 2. Definim slot-urile exact din template
      const slots = [
        { name: 'photo1', left: 118, top:  185, width: 530, height: 636 },
        { name: 'photo2', left: 767, top:  185, width: 565, height: 636 },
        { name: 'photo3', left: 118, top: 1140, width: 530, height: 669 },
        { name: 'photo4', left: 767, top: 1140, width: 565, height: 669 },
      ];

      // 3. Redimensionăm fiecare poză la exact dimensiunea slotului
      const resized = await Promise.all(
        slots.map(({ name, width, height }) =>
          sharp(req.files[name][0].buffer)
            .resize(width, height, { fit: 'cover' })
            .toBuffer()
        )
      );

      // 4. Construim array-ul de composite în ordinea sloturilor + template în final
      const compositeArr = slots.map((slot, i) => ({
        input: resized[i],
        left:  slot.left,
        top:   slot.top,
      }));
      // template-ul alfa deasupra tuturor
      compositeArr.push({ input: tplBuf, left: 0, top: 0 });

      // 5. Creăm imaginea finală
      const outputBuffer = await sharp(bgBuf)
        .composite(compositeArr)
        .png()
        .toBuffer();

      // 6. O trimitem direct ca răspuns
      res.set('Content-Type', 'image/png');
      return res.send(outputBuffer);

    } catch (err) {
      console.error('🔴 Sharp error:', err);
      return res
        .status(500)
        .send(`Eroare la generarea collage-ului: ${err.message}`);
    }
  }
);

// 4) Pornim serverul
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${port}`);
});
