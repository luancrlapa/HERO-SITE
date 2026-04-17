const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

const API_KEY = "79e458a3991167919464b909605602a0";

// filtro
function filtrar(n) {
  if (!n.title) return false;

  const t = n.title.toLowerCase();

  const negativas = [
    "acidente","morte","tragédia","crime",
    "corrupção","explosão","desastre","prisão"
  ];

  if (negativas.some(x => t.includes(x))) return false;

  const valeOk =
    t.includes("vale s.a") ||
    t.includes("mineradora vale") ||
    (t.includes("vale") && t.includes("miner"));

  const outras =
    t.includes("indústria") ||
    t.includes("industria") ||
    t.includes("economia") ||
    t.includes("petrobras") ||
    t.includes("fiat");

  return valeOk || outras;
}

// busca API
fetch("/.netlify/functions/news")
  .then(res => res.json())
  .then(data => {
    console.log(data);
    // aqui você renderiza as notícias
  })
  .catch(err => console.log("ERRO:", err));

// fallback
function fallbackNoticias() {
  return [
    {
      title: "Mercado brasileiro segue em alta no setor industrial",
      url: "https://example.com",
      image: "",
      source: "Sistema Interno"
    },
    {
      title: "Empresas do setor de mineração mantêm crescimento estável",
      url: "https://example.com",
      image: "",
      source: "Sistema Interno"
    },
    {
      title: "Economia nacional apresenta sinais de recuperação",
      url: "https://example.com",
      image: "",
      source: "Sistema Interno"
    }
  ];
}

// gerar imagem
function gerarImagem(title) {
  return `https://images.unsplash.com/featured/?news,economy,${encodeURIComponent(title || "noticias")}`;
}

// tratar imagem
function tratarImagem(img, title) {
  if (
    img &&
    typeof img === "string" &&
    img.trim() !== "" &&
    !img.includes("null") &&
    !img.includes("undefined")
  ) {
    return img;
  }

  return gerarImagem(title);
}

// rota principal
app.get("/api/news", async (req, res) => {
  try {
    let noticias = await buscar(
      "vale s.a OR mineradora vale OR petrobras OR economia OR industria OR fiat"
    );

    let filtradas = noticias.filter(filtrar);

    if (filtradas.length < 3) {
      const mais = await buscar(
        "economia OR brasil OR mercado OR industria OR mineração"
      );
      filtradas = filtradas.concat(mais.filter(filtrar));
    }

    const unique = [];
    const titles = new Set();

    for (let n of filtradas) {
      if (!titles.has(n.title)) {
        titles.add(n.title);
        unique.push(n);
      }
    }

    let final = unique.slice(0, 3);

    if (final.length < 3) {
      const faltando = 3 - final.length;
      final = final.concat(fallbackNoticias().slice(0, faltando));
    }

    res.json(
      final.map(n => ({
        title: n.title,
        url: n.url?.trim(),
        image: tratarImagem(n.image, n.title),
        source: n.source?.name || "GNews"
      }))
    );

  } catch (e) {
    console.log(e);

    res.json(
      fallbackNoticias().map(n => ({
        ...n,
        image: gerarImagem(n.title)
      }))
    );
  }
});

// teste
app.get("/", (req, res) => {
  res.send("Servidor de notícias funcionando 🚀");
});

app.listen(3000, () => {
  console.log("Rodando em http://localhost:3000");
});