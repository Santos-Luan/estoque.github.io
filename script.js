const API_URL =
  "https://script.google.com/macros/s/AKfycbxnb9kKyleiV5cYlTN8xtp7OZxYmMy38eP4F6j8cR7P-Qvd6mHhn1cakn7OOxQPubaU/exec";

// utilitários
function safe(v) {
  return v === undefined || v === null ? "" : v;
}
function getField(obj, ...names) {
  if (!obj) return "";
  for (const n of names) {
    if (
      Object.prototype.hasOwnProperty.call(obj, n) &&
      obj[n] !== undefined &&
      obj[n] !== null
    )
      return obj[n];
  }
  return "";
}

// formata timestamps de várias formas sem aplicar deslocamento indevido
function formatTimestamp(ts) {
  if (ts === undefined || ts === null || ts === "") return "";
  // Date object
  if (ts instanceof Date) return ts.toLocaleString("pt-BR");

  const s = String(ts).trim();

  // formato brasileiro dd/MM/yyyy [HH:mm:ss]
  const brazilRegex = /^\d{2}\/\d{2}\/\d{4}/;
  if (brazilRegex.test(s)) {
    const parts = s.split(" ");
    const datePart = parts[0];
    const timePart = parts[1] || "00:00:00";
    const [d, m, y] = datePart.split("/").map((x) => parseInt(x, 10));
    const [h, mi, se] = timePart.split(":").map((x) => parseInt(x, 10) || 0);
    const dateObj = new Date(y, m - 1, d, h, mi, se);
    if (!isNaN(dateObj.getTime())) return dateObj.toLocaleString("pt-BR");
    return s;
  }

  // número epoch (segundos ou ms)
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    const dateObj = s.length === 10 ? new Date(n * 1000) : new Date(n);
    if (!isNaN(dateObj.getTime())) return dateObj.toLocaleString("pt-BR");
    return s;
  }

  // ISO ou outras strings que Date reconhece
  const dateIso = new Date(s);
  if (!isNaN(dateIso.getTime())) return dateIso.toLocaleString("pt-BR");

  // fallback: exibir como veio
  return s;
}

// =========================
// Helpers HTTP
// =========================
async function postData(params) {
  const body = new URLSearchParams();
  for (const k in params)
    if (Object.prototype.hasOwnProperty.call(params, k))
      body.append(k, params[k]);
  const res = await fetch(API_URL, { method: "POST", body: body });
  return await res.json();
}

async function getData(params = {}) {
  const url = new URL(API_URL);
  Object.keys(params).forEach((k) => url.searchParams.append(k, params[k]));
  const res = await fetch(url);
  return await res.json();
}

// =========================
// CACHES
// =========================
let produtosCache = [];
let movimentosCache = [];

// =========================
// UTILIDADES DOM (compatibilidade com diferentes HTMLs)
function getInputValue(...ids) {
  for (const id of ids) {
    if (!id) continue;
    const el = document.getElementById(id);
    if (el && "value" in el) return (el.value || "").toString().trim();
  }
  return "";
}
function setInputValue(value, ...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && "value" in el) el.value = value;
  }
}

// =========================
// NORMALIZAÇÃO (remoção de acentos / lowercase)
function normalizeText(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// =========================
// PRODUTOS
// =========================
function gerarCodigoProduto() {
  // Gera um código simples incremental tipo P001, P002...
  const base = (produtosCache || [])
    .map((p) =>
      String(getField(p, "Código", "codigo", "Codigo") || "").replace(/\D/g, "")
    )
    .map((num) => parseInt(num, 10) || 0);
  const maxNum = base.length ? Math.max(...base) : 0;
  const novo = (maxNum + 1).toString().padStart(3, "0");
  return "P" + novo;
}

async function cadastrarProduto() {
  let codigo = getInputValue("codigo", "codigo-produto");
  const produto = getInputValue("produto");
  const quantidade = getInputValue("quantidade");
  const preco = getInputValue("preco");
  const minimo = getInputValue("minimo");
  const senha = getInputValue("senha-produto", "senha");

  if (!produto) {
    alert("Nome do produto é obrigatório.");
    return;
  }
  if (!senha) {
    alert("Digite a senha para cadastrar.");
    return;
  }

  // Gera automaticamente se campo estiver vazio
  if (!codigo) {
    codigo = gerarCodigoProduto();
  }

  try {
    const res = await postData({
      action: "addProduct",
      key: senha,
      codigo,
      produto,
      quantidade,
      preco,
      minimo,
    });
    if (res.result === "success") {
      alert("Produto cadastrado com sucesso.");
      const form = document.getElementById("form-produto");
      if (form) form.reset();
      carregarProdutos();
    } else {
      alert("Erro: " + res.message);
    }
  } catch (err) {
    console.error(err);
    alert("Erro de conexão: " + (err.message || err));
  }
}

async function carregarProdutos() {
  const tb = document.querySelector("#products-table tbody");
  if (tb) tb.innerHTML = "<tr><td colspan='7'>Carregando...</td></tr>";
  try {
    const res = await getData({ action: "listProducts" });
    produtosCache =
      res.result === "success" && Array.isArray(res.products)
        ? res.products
        : [];
    // expõe globalmente também (compatibilidade com eventuais scripts inline)
    try {
      window.produtosCache = produtosCache;
    } catch (e) {}
    renderizarProdutos(produtosCache);
  } catch (err) {
    console.error(err);
    if (tb)
      tb.innerHTML = "<tr><td colspan='7'>Erro ao carregar produtos</td></tr>";
  }
}

function renderizarProdutos(lista) {
  const tb = document.querySelector("#products-table tbody");
  if (!tb) return;
  tb.innerHTML = "";
  if (!lista || lista.length === 0) {
    tb.innerHTML = "<tr><td colspan='7'>Nenhum produto encontrado</td></tr>";
    return;
  }

  lista.forEach((p) => {
    const codigo = safe(getField(p, "Código", "codigo", "Codigo"));
    const nome = safe(getField(p, "Produto", "produto", "Produto"));
    const qtd = safe(getField(p, "Quantidade", "quantidade"));
    const preco = safe(
      getField(p, "Preço", "preco", "Preço") || getField(p, "Preco")
    );
    const ultimaRaw = getField(
      p,
      "Última Atualização",
      "Última Atualizacao",
      "ultimaAtualizacao",
      "ÚltimaAtualização",
      "Última"
    );
    const ultima = formatTimestamp(ultimaRaw);
    const minimo = safe(getField(p, "Mínimo", "Minimo"));

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="chk-del" data-codigo="${codigo}"></td>
      <td>${codigo}</td>
      <td>${nome}</td>
      <td>${qtd}</td>
      <td>${preco}</td>
      <td>${ultima}</td>
      <td>${minimo}</td>
    `;
    tb.appendChild(tr);
  });
}

async function excluirProdutos() {
  const senha = getInputValue("senha-excluir", "senha");
  if (!senha) {
    alert("Digite a senha para excluir produtos.");
    return;
  }

  const checks = Array.from(
    document.querySelectorAll(
      "#products-table tbody input[type='checkbox']:checked"
    )
  );
  if (checks.length === 0) {
    alert("Selecione ao menos um produto para excluir.");
    return;
  }

  if (
    !confirm(
      `Confirma exclusão de ${checks.length} item(ns)? Esta ação é irreversível.`
    )
  )
    return;

  for (const c of checks) {
    const codigo = c.dataset.codigo;
    try {
      const res = await postData({
        action: "deleteProduct",
        key: senha,
        codigo,
      });
      if (res.result !== "success") {
        alert(`Erro ao excluir ${codigo}: ${res.message}`);
      }
    } catch (err) {
      console.error("Erro excluir", codigo, err);
      alert(`Erro ao excluir ${codigo}: ${err.message || err}`);
    }
  }

  setTimeout(carregarProdutos, 500);
}

// =========================
// MOVIMENTAÇÃO
async function registrarMovimentacao() {
  // tentamos vários ids para compatibilidade com seus HTMLs
  let codigo = getInputValue("mov-codigo", "codigo-movimentacao", "codigo");
  const tipoRaw = getInputValue("mov-tipo", "tipo");
  const quantidadeRaw = getInputValue(
    "mov-quantidade",
    "quantidade-movimentacao",
    "quantidade"
  );
  const origem = getInputValue("mov-origem", "origem-destino", "origem");
  const observacoes = getInputValue("mov-observacoes", "observacoes", "obs");
  const senha = getInputValue("mov-senha", "senha-movimentacao", "mov-senha");

  if (!senha) {
    alert("Digite a senha para registrar a movimentação.");
    return;
  }

  // mapear tipo para valores aceitos pelo servidor (entrada / saida)
  const tipoNorm = normalizeText(tipoRaw || "");
  let type = "";
  if (tipoNorm.includes("entr")) type = "entrada";
  else if (
    tipoNorm.includes("said") ||
    tipoNorm.includes("saID") ||
    tipoNorm.includes("saida")
  )
    type = "saida";
  else type = tipoNorm; // fallback (já lowercase sem acento)

  // permite buscar por nome no campo código
  if (codigo && produtosCache && produtosCache.length > 0) {
    const termo = normalizeText(codigo);
    const encontrado = produtosCache.find((p) => {
      const c = normalizeText(getField(p, "Código", "codigo", "Codigo") || "");
      const nome = normalizeText(
        getField(p, "Produto", "produto", "Produto") || ""
      );
      return c === termo || nome.includes(termo);
    });
    if (encontrado) {
      codigo = String(
        getField(encontrado, "Código", "codigo", "Codigo") || codigo
      );
    }
  }

  const quantidade = Number(quantidadeRaw || 0);
  if (!codigo || !type || !quantidade || Number(quantidade) <= 0) {
    alert("Preencha código, tipo e quantidade válidos.");
    return;
  }

  try {
    const res = await postData({
      action: "updateStock",
      key: senha,
      codigo,
      type,
      quantidade,
      origem,
      observacoes,
    });

    if (res.result === "success") {
      alert("Movimentação registrada com sucesso.");
      const form = document.getElementById("form-movimentacao");
      if (form) form.reset();
      carregarProdutos();
      carregarHistorico();
    } else {
      // repassa a mensagem do servidor
      alert("Erro: " + res.message);
    }
  } catch (err) {
    console.error(err);
    alert("Erro de conexão: " + (err.message || err));
  }
}

// =========================
// HISTÓRICO
async function carregarHistorico() {
  const tb = document.querySelector("#mov-table tbody");
  if (tb) tb.innerHTML = "<tr><td colspan='7'>Carregando...</td></tr>";
  try {
    const res = await getData({ action: "listMovements" });
    movimentosCache =
      res.result === "success" && Array.isArray(res.movements)
        ? res.movements
        : [];
    renderizarMovimentos(movimentosCache);
  } catch (err) {
    console.error(err);
    if (tb)
      tb.innerHTML = "<tr><td colspan='7'>Erro ao carregar histórico</td></tr>";
  }
}

function renderizarMovimentos(lista) {
  const tb = document.querySelector("#mov-table tbody");
  if (!tb) return;
  tb.innerHTML = "";

  if (!lista || lista.length === 0) {
    tb.innerHTML = "<tr><td colspan='7'>Nenhum registro</td></tr>";
    return;
  }

  lista.forEach((m) => {
    const ts = formatTimestamp(
      getField(m, "Timestamp", "timestamp", "Timestamp")
    );
    const codigo = safe(getField(m, "Código", "codigo", "Codigo"));
    const produto = safe(getField(m, "Produto", "produto", "Produto"));
    const tipo = safe(getField(m, "Tipo", "tipo", "Tipo"));
    const qtd = safe(getField(m, "Quantidade", "quantidade", "Quantidade"));
    const origem = safe(getField(m, "Origem/Destino", "Origem", "origem"));
    const obs = safe(getField(m, "Observações", "Observacoes", "observacoes"));

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ts}</td>
      <td>${codigo}</td>
      <td>${produto}</td>
      <td>${tipo}</td>
      <td>${qtd}</td>
      <td>${origem}</td>
      <td>${obs}</td>
    `;
    tb.appendChild(tr);
  });
}

// =========================
// FILTROS DO HISTÓRICO
function applyHistoryFilter() {
  const searchEl = document.getElementById("search-historico");
  const startEl = document.getElementById("f-data-inicio");
  const endEl = document.getElementById("f-data-fim");

  const termo =
    searchEl && searchEl.value ? searchEl.value.trim().toLowerCase() : "";
  const inicio = startEl && startEl.value ? startEl.value : "";
  const fim = endEl && endEl.value ? endEl.value : "";

  let dInicio = null,
    dFim = null;
  if (inicio) dInicio = new Date(inicio + "T00:00:00");
  if (fim) dFim = new Date(fim + "T23:59:59.999");

  let lista = movimentosCache.slice();

  if (dInicio || dFim) {
    lista = lista.filter((m) => {
      const raw = getField(m, "Timestamp", "timestamp");
      if (!raw) return false;
      const dt = new Date(raw);
      if (isNaN(dt.getTime())) return false;
      if (dInicio && dt < dInicio) return false;
      if (dFim && dt > dFim) return false;
      return true;
    });
  }

  if (termo) {
    const termoNorm = normalizeText(termo);
    lista = lista.filter((m) => {
      const codigo = normalizeText(getField(m, "Código", "codigo") || "");
      const produto = normalizeText(getField(m, "Produto", "produto") || "");
      const origem = normalizeText(
        getField(m, "Origem/Destino", "Origem", "origem") || ""
      );
      const obs = normalizeText(
        getField(m, "Observações", "Observacoes", "observacoes") || ""
      );
      const tipo = normalizeText(getField(m, "Tipo", "tipo") || "");
      return (
        codigo.includes(termoNorm) ||
        produto.includes(termoNorm) ||
        origem.includes(termoNorm) ||
        obs.includes(termoNorm) ||
        tipo.includes(termoNorm)
      );
    });
  }

  renderizarMovimentos(lista);
}

// =========================
// INICIALIZAÇÃO / BIND EVENTS
document.addEventListener("DOMContentLoaded", async () => {
  // Carregar listagens
  await carregarProdutos();
  await carregarHistorico();

  // Preenche campo #codigo se existir (produtos.html)
  const codigoInput = document.getElementById("codigo");
  if (codigoInput && codigoInput.readOnly) {
    codigoInput.value = gerarCodigoProduto();
  }

  // Estoque: botões
  const btnRefresh = document.getElementById("btn-refresh");
  if (btnRefresh) btnRefresh.addEventListener("click", carregarProdutos);

  const btnDelete = document.getElementById("btn-delete");
  if (btnDelete) btnDelete.addEventListener("click", excluirProdutos);

  const btnSearch = document.getElementById("btn-search");
  if (btnSearch)
    btnSearch.addEventListener("click", () => {
      const termoEl = document.getElementById("search-input");
      const termo = normalizeText(termoEl?.value || "");

      const rows = Array.from(
        document.querySelectorAll("#products-table tbody tr")
      );

      rows.forEach((r) => {
        const cols = r.querySelectorAll("td");
        const codigo = normalizeText(cols[1]?.innerText || "");
        const nome = normalizeText(cols[2]?.innerText || "");
        r.style.display =
          codigo.includes(termo) || nome.includes(termo) ? "" : "none";
      });
    });

  const btnClear = document.getElementById("btn-clear");
  if (btnClear)
    btnClear.addEventListener("click", () => {
      const el = document.getElementById("search-input");
      if (el) el.value = "";
      carregarProdutos();
    });

  // Histórico: bind filtros
  const btnFilterDate = document.getElementById("btn-filter-date");
  if (btnFilterDate)
    btnFilterDate.addEventListener("click", applyHistoryFilter);

  const btnClearHist = document.getElementById("btn-clear-historico");
  if (btnClearHist)
    btnClearHist.addEventListener("click", () => {
      const si = document.getElementById("search-historico");
      if (si) si.value = "";
      const s1 = document.getElementById("f-data-inicio");
      if (s1) s1.value = "";
      const s2 = document.getElementById("f-data-fim");
      if (s2) s2.value = "";
      renderizarMovimentos(movimentosCache);
    });

  const btnRefreshMov = document.getElementById("btn-refresh-mov");
  if (btnRefreshMov) btnRefreshMov.addEventListener("click", carregarHistorico);

  // opção: permitir Enter no campo de pesquisa do histórico
  const searchHistEl = document.getElementById("search-historico");
  if (searchHistEl) {
    searchHistEl.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        applyHistoryFilter();
      }
    });
  }

  // compatibilidade: preencher #codigo-movimentacao quando usuário digitar nome (script inline do HTML pode usar window.produtosCache)
  try {
    window.produtosCache = produtosCache;
  } catch (e) {}
});
