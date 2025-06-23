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
      console.log('🔔 Received POST /generate');
      // Bufferele imaginilor
      const bg   = req.files.background[0].buffer;
      const tpl  = req.files.template[0].buffer;
      const photos = ['photo1','photo2','photo3','photo4'].map(name => ({
        input: req.files[name][0].buffer,
        left:  parseInt(req.body[`${name}_x`], 10) || 0,
        top:   parseInt(req.body[`${name}_y`], 10) || 0,
      }));

      // Compozitie finală (photos + template pe ultimul loc)
      const compositeArr = [
        ...photos,
        { input: tpl, left: 0, top: 0 }
      ];

      // Sharp → Buffer PNG
      const outputBuffer = await sharp(bg)
        .composite(compositeArr)
        .png()
        .toBuffer();

      // Răspundem cu imaginea
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
