const fs = require("fs");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;
const usersFile = "users.json";

app.use(cors());
app.use(express.json());

// Bellekte stok verisi (görünürlük bilgisiyle)
let organStok = [
  { name: "Böbrek", adet: 5, visible: true },
  { name: "Kalp", adet: 3, visible: true },
  { name: "Akciğer", adet: 2, visible: true },
  { name: "Karaciğer", adet: 4, visible: true },
  { name: "Göz", adet: 7, visible: true },
  { name: "Dalak", adet: 2, visible: true },
  { name: "Pankreas", adet: 1, visible: true },
  { name: "Beyin", adet: 3, visible: true },
  { name: "Burun", adet: 5, visible: true },
  { name: "Kornea", adet: 1, visible: true },
  { name: "Deri", adet: 3, visible: true },
  { name: "Kemik", adet: 6, visible: true }
];

// Bağış verilerini geçici olarak bellekte sakla
let donationList = [];

// Anasayfa
app.get("/", (req, res) => {
  res.send("Backend çalışıyor 🚀");
});

// ✅ Görünür organları getir
app.get("/api/stoklar", (req, res) => {
  const gorunurStoklar = organStok.filter(item => item.visible);
  res.json(gorunurStoklar);
});

// ✅ Organ ekle/güncelle (visible true yapılır)
app.post("/api/stoklar", (req, res) => {
  const { name, adet } = req.body;
  if (!name || typeof adet !== "number") {
    return res.status(400).json({ error: "Geçersiz veri" });
  }

  const existing = organStok.find(o => o.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.adet = adet;
    existing.visible = true; // yeniden görünür yap
  } else {
    organStok.push({ name, adet, visible: true });
  }

  res.json({ success: true });
});

// 🗑 Silme yerine görünmez yapma
app.delete("/api/stoklar/:name", (req, res) => {
  const { name } = req.params;
  const organ = organStok.find(o => o.name.toLowerCase() === name.toLowerCase());
  if (organ) {
    organ.visible = false; // görünmez yap
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Organ bulunamadı" });
  }
});

//Bağış Formu
app.post("/api/bagis", (req, res) => {
  const { adSoyad, telefon, email, organlar, mesaj } = req.body;

  if (!adSoyad || !telefon || !email || !organlar) {
    return res.status(400).json({ error: "Eksik bilgi gönderildi." });
  }

  const yeniBagis = { adSoyad, telefon, email, organlar, mesaj };

  const fs = require("fs");
  const filePath = "donations.json";

  fs.readFile(filePath, "utf8", (err, data) => {
    let donations = [];

    if (!err && data) {
      try {
        donations = JSON.parse(data);
      } catch (e) {
        console.error("JSON parse hatası:", e);
      }
    }

    donations.push(yeniBagis);

    fs.writeFile(filePath, JSON.stringify(donations, null, 2), (err) => {
      if (err) {
        console.error("Yazma hatası:", err);
        return res.status(500).json({ error: "Veri yazılamadı." });
      }
      console.log("Yeni bağış kaydedildi:", yeniBagis);
      res.json({ success: true });
    });
  });
});

// ✅ Bağışları listele
app.get("/api/bagislar", (req, res) => {
  const fs = require("fs");
  fs.readFile("donations.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Veriler okunamadı." });
    }

    try {
      const bagislar = JSON.parse(data);
      res.json(bagislar);
    } catch (e) {
      res.status(500).json({ error: "JSON parse hatası." });
    }
  });
});

// ✅ Tüm kullanıcıları getir
app.get("/api/users", (req, res) => {
  fs.readFile(usersFile, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Kullanıcılar okunamadı." });
    try {
      const users = JSON.parse(data);
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: "JSON parse hatası." });
    }
  });
});

// ✅ Yeni kullanıcı ekle
app.post("/api/users", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Eksik bilgi." });
  }

  fs.readFile(usersFile, "utf8", (err, data) => {
    let users = [];
    if (!err && data) {
      try {
        users = JSON.parse(data);
      } catch (e) {
        console.error("parse hatası:", e);
      }
    }

    const newUser = {
      id: Date.now(),
      username,
      password,
      role,
      lastLogin: null
    };
    users.push(newUser);

    fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Yazma hatası." });
      res.json(newUser);
    });
  });
});

// ✅ Kullanıcıyı sil
app.delete("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);

  fs.readFile(usersFile, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Veri okunamadı." });

    let users = JSON.parse(data);
    const updatedUsers = users.filter(u => u.id !== userId);

    fs.writeFile(usersFile, JSON.stringify(updatedUsers, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Silme işlemi başarısız." });
      res.json({ success: true });
    });
  });
});

// ✅ Kullanıcıyı güncelle
app.put("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, role } = req.body;

  fs.readFile(usersFile, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Veri okunamadı." });

    let users = JSON.parse(data);
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    user.username = username;
    user.role = role;

    fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Güncelleme hatası." });
      res.json(user);
    });
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Kullanıcı adı ve parola gerekli." });
  }

  fs.readFile(usersFile, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Veri okunamadı." });

    let users = JSON.parse(data);
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: "Geçersiz kullanıcı adı veya parola." });
    }

    user.lastLogin = new Date().toISOString();

    // Güncellenmiş lastLogin'i kaydet
    fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Giriş kaydı yapılamadı." });
      res.json({ success: true, role: user.role });
    });
  });
});



app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
