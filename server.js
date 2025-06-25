const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Folosim multer în memorie
const upload = multer();

// Încarcă template-ul PNG cu transparență
const templatePath = path.join(__dirname, 'static', 'template.png');
const templateBuffer = fs.readFileSync(templatePath);

const app = express();

// Route POST /generate
// Așteaptă 4 fișiere: photo1…photo4 + 8 câmpuri text p1Left,p1Top…p4Left,p4Top
app.post(
  '/generate',
  upload.fields([
    { name: 'photo1' },
    { name: 'photo2' },
    { name: 'photo3' },
    { name: 'photo4' },
  ]),
  async (req, res) => {
    try {
      // Parsează pozițiile din body
      const positions = ['1','2','3','4'].map(i => ({
        left:  parseInt(req.body[`p${i}Left`], 10)  || 0,
        top:   parseInt(req.body[`p${i}Top`], 10)   || 0,
      }));

      // Buffer-urile celor 4 poze
      const photos = ['photo1','photo2','photo3','photo4'].map(name =>
        req.files[name][0].buffer
      );

      // Înălțime și lățime a fiecărui „slot” (ajustează dacă e necesar)
      const SLOT = { width: 384, height: 384 };

      // Pornim un fundal alb de dimensiunea template-ului
      const base = sharp({
        create: {
          width: 1280,
          height: 1920,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      }).png();

      // Compozit: mai întâi fotografiile scalate în slot-uri
      let pipeline = base;
      for (let i = 0; i < 4; i++) {
        const resized = await sharp(photos[i])
          .resize(SLOT.width, SLOT.height, { fit: 'cover' })
          .toBuffer();
        pipeline = pipeline.composite([
          {
            input: resized,
            left: positions[i].left,
            top: positions[i].top,
          },
        ]);
      }

      // Apoi adăugăm template-ul deasupra
      pipeline = pipeline.composite([
        { input: templateBuffer, left: 0, top: 0 },
      ]);

      // Generăm PNG-ul final
      const outputBuffer = await pipeline.toBuffer();

      // Trimitem înapoi
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="collage.png"');
      res.send(outputBuffer);

    } catch (err) {
      console.error('Eroare la generarea collage-ului:', err);
      res.status(500).send('Eroare internă');
    }
  }
);

// Pornim serverul
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sharp collage service ascultă pe portul ${PORT}`);
});
