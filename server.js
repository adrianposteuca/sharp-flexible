const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');

const upload = multer(); // stocare în memorie
const app    = express();

// 1) Serve static din /public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 2) GET / → form-ul index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3) POST /generate → generează collage
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
      // 1. Bufferele imaginilor
      const bgBuf  = req.files.background[0].buffer;
      const tplBuf = req.files.template[0].buffer;
      const rawPhotos = ['photo1','photo2','photo3','photo4'].map(
        name => req.files[name][0].buffer
      );

      // 2. Citește meta-background (opțional, pentru slot dinamic)
      const bgMeta = await sharp(bgBuf).metadata();
      const slotW = Math.floor(bgMeta.width  / 2);
      const slotH = Math.floor((bgMeta.height - 200) / 2); // dacă ai header de 200px

      // 3. Redimensionează fiecare poză ca să nu depășească background-ul
      const photos = await Promise.all(
        rawPhotos.map(buf =>
          sharp(buf)
            .resize(slotW, slotH, { fit: 'cover' })
            .toBuffer()
        )
      );

      // 4. Pregătește array-ul de composite
      const compositeArr = [
        { input: photos[0], left:  50,  top:  80  },
        { input: photos[1], left: 430,  top:  80  },
        { input: photos[2], left:  50,  top: 480  },
        { input: photos[3], left: 430,  top: 480  },
        { input: tplBuf,    left:   0,  top:   0  },
      ];

      // 5. Aplică composite-ul
      const outputBuffer = await sharp(bgBuf)
        .composite(compositeArr)
        .png()
        .toBuffer();

      // 6. Răspunde cu imaginea finală
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
