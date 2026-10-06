// Lê o índice de textos (posts/posts.json) e monta as páginas do blog.

const URL_INDICE = "posts/posts.json";

function formatarData(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

async function carregarIndice() {
  const resp = await fetch(URL_INDICE);
  if (!resp.ok) throw new Error("Não foi possível abrir " + URL_INDICE);
  const posts = await resp.json();
  // mais novos primeiro
  return posts.sort((a, b) => b.data.localeCompare(a.data));
}

function criar(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto) e.textContent = texto;
  return e;
}

/* ---------- blog.html: lista de textos ---------- */
async function montarLista() {
  const lista = document.getElementById("lista");
  try {
    const posts = await carregarIndice();
    lista.innerHTML = "";

    if (posts.length === 0) {
      lista.appendChild(criar("p", "aviso", "Ainda não há textos publicados."));
      return;
    }

    posts.forEach((p) => {
      const link = "post.html?p=" + encodeURIComponent(p.slug);
      const item = criar("article", "item" + (p.capa ? "" : " sem-capa"));

      if (p.capa) {
        const a = criar("a");
        a.href = link;
        const img = criar("img");
        img.src = p.capa;
        img.alt = p.altCapa || "";
        img.loading = "lazy";
        a.appendChild(img);
        item.appendChild(a);
      }

      const texto = criar("div");
      const h2 = criar("h2");
      const t = criar("a", "", p.titulo);
      t.href = link;
      h2.appendChild(t);

      texto.appendChild(h2);
      texto.appendChild(criar("p", "data", formatarData(p.data)));
      texto.appendChild(criar("p", "resumo", p.resumo || ""));
      const ler = criar("a", "ler", "Ler o texto completo");
      ler.href = link;
      texto.appendChild(ler);

      item.appendChild(texto);
      lista.appendChild(item);
    });
  } catch (erro) {
    console.error(erro);
    lista.innerHTML = "";
    lista.appendChild(
      criar("p", "aviso", "Não foi possível carregar os textos. Se você abriu o arquivo direto no navegador, use um servidor local (veja as instruções).")
    );
  }
}

/* ---------- post.html: texto completo ---------- */
async function montarPost() {
  const area = document.getElementById("post");
  const slug = new URLSearchParams(location.search).get("p");

  if (!slug) {
    area.innerHTML = "";
    area.appendChild(criar("p", "aviso", "Texto não encontrado."));
    return;
  }

  try {
    const posts = await carregarIndice();
    const meta = posts.find((p) => p.slug === slug);
    if (!meta) throw new Error("Slug não encontrado no índice: " + slug);

    const resp = await fetch("posts/" + encodeURIComponent(slug) + ".md");
    if (!resp.ok) throw new Error("Arquivo do texto não encontrado");
    const markdown = await resp.text();

    document.title = meta.titulo + " — AUTARKES";
    area.innerHTML = "";
    area.appendChild(criar("h1", "", meta.titulo));
    area.appendChild(criar("p", "data", formatarData(meta.data)));

    const corpo = criar("div", "corpo");
    corpo.innerHTML = marked.parse(markdown);
    area.appendChild(corpo);
  } catch (erro) {
    console.error(erro);
    area.innerHTML = "";
    area.appendChild(criar("p", "aviso", "Não foi possível abrir este texto."));
  }
}

/* ---------- início ---------- */
document.getElementById("ano").textContent = new Date().getFullYear();
if (document.getElementById("lista")) montarLista();
if (document.getElementById("post")) montarPost();
