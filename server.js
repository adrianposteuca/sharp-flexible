// server.js
const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');

const upload = multer();
const app    = express();

// 1) Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 2) GET / → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3) POST /generate → primește cele 4 poze
app.post(
  '/generate',
  upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 },
    { name: 'photo4', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log('🔔 Received POST /generate');

      // Path-urile către static
      const backgroundPath = path.join(__dirname, 'public', 'background.png');
      const templatePath   = path.join(__dirname, 'public', 'template.png');

      // Încarcă buffer-urile celor 4 poze
      const names = ['photo1','photo2','photo3','photo4'];
      const photosBuf = names.map(n => req.files[n][0].buffer);

      // Slot-urile extrase din template
      const slots = [
        { left: 118, top:  185, width: 531, height: 637 },
        { left: 767, top:  185, width: 566, height: 637 },
        { left: 118, top: 1140, width: 531, height: 670 },
        { left: 767, top: 1140, width: 566, height: 670 },
      ];

      // Redimensionează fiecare poza la dimensiunea slotului
      const resized = await Promise.all(
        photosBuf.map((buf, i) =>
          sharp(buf)
            .resize(slots[i].width, slots[i].height, { fit: 'cover' })
            .toBuffer()
        )
      );

      // Construiește array-ul de composite
      const compositeArr = resized.map((buf, i) => ({
        input: buf,
        left:  slots[i].left,
        top:   slots[i].top,
      }));
      // adaugă template-ul cu transparență deasupra
      compositeArr.push({ input: templatePath, left: 0, top: 0 });

      // Aplică composite
      const outputBuffer = await sharp(backgroundPath)
        .composite(compositeArr)
        .png()
        .toBuffer();

      // Răspunde cu PNG-ul rezultat
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

// 4) Pornește serverul
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${port}`);
});
