const API_URL =
  "https://script.google.com/macros/s/AKfycbxnb9kKyleiV5cYlTN8xtp7OZxYmMy38eP4F6j8cR7P-Qvd6mHhn1cakn7OOxQPubaU/exec";

// utilitários
function safe(v) {
  return v === undefined || v === null ? "" : v;
}
function getField(obj, ...names) {
  for (const n of names) {
    if (obj.hasOwnProperty(n) && obj[n] !== undefined && obj[n] !== null)
      return obj[n];
  }
  return "";
}
function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.toLocaleString();
  // se não for parseável, tenta exibir como string
  try {
    return String(ts);
  } catch (e) {
    return "";
  }
}

// =========================
// Helpers HTTP
// =========================
async function postData(params) {
  const body = new URLSearchParams();
  for (const k in params)
    if (params.hasOwnProperty(k)) body.append(k, params[k]);
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
// PRODUTOS
// =========================
async function cadastrarProduto() {
  const codigo = (document.getElementById("codigo") || {}).value?.trim() || "";
  const produto =
    (document.getElementById("produto") || {}).value?.trim() || "";
  const quantidade =
    (document.getElementById("quantidade") || {}).value?.trim() || 0;
  const preco = (document.getElementById("preco") || {}).value?.trim() || 0;
  const minimo = (document.getElementById("minimo") || {}).value?.trim() || 0;
  const senha =
    (document.getElementById("senha-produto") || {}).value?.trim() || "";

  if (!codigo || !produto) {
    alert("Código e produto são obrigatórios.");
    return;
  }
  if (!senha) {
    alert("Digite a senha para cadastrar.");
    return;
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
    alert("Erro de conexão: " + err.message);
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
    const nome = safe(getField(p, "Produto", "produto"));
    const qtd = safe(getField(p, "Quantidade", "quantidade"));
    const preco = safe(
      getField(p, "Preço", "preco", "Preço") ||
        getField(p, "Preço", "Preço") ||
        getField(p, "Preco")
    );
    const ultima = safe(
      getField(
        p,
        "Última Atualização",
        "Última Atualizacao",
        "ultimaAtualizacao"
      )
    );
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
  const senha =
    (document.getElementById("senha-excluir") || {}).value?.trim() || "";
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
      alert(`Erro ao excluir ${codigo}: ${err.message}`);
    }
  }

  // esperar um pouquinho e recarregar
  setTimeout(carregarProdutos, 500);
}

// =========================
// MOVIMENTAÇÃO
// =========================
async function registrarMovimentacao() {
  const codigo =
    (document.getElementById("mov-codigo") || {}).value?.trim() || "";
  const tipo = (document.getElementById("mov-tipo") || {}).value?.trim() || "";
  const quantidade =
    (document.getElementById("mov-quantidade") || {}).value?.trim() || "";
  const origem =
    (document.getElementById("mov-origem") || {}).value?.trim() || "";
  const observacoes =
    (document.getElementById("mov-observacoes") || {}).value?.trim() || "";
  const senha =
    (document.getElementById("mov-senha") || {}).value?.trim() || "";

  if (!senha) {
    alert("Digite a senha para registrar a movimentação.");
    return;
  }
  if (!codigo || !tipo || !quantidade || Number(quantidade) <= 0) {
    alert("Preencha código, tipo e quantidade válidos.");
    return;
  }

  try {
    const res = await postData({
      action: "updateStock",
      key: senha,
      codigo,
      type: tipo,
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
      alert("Erro: " + res.message);
    }
  } catch (err) {
    console.error(err);
    alert("Erro de conexão: " + err.message);
  }
}

// =========================
// HISTÓRICO
// =========================
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
    const ts = formatTimestamp(getField(m, "Timestamp", "timestamp"));
    const codigo = safe(getField(m, "Código", "codigo"));
    const produto = safe(getField(m, "Produto", "produto"));
    const tipo = safe(getField(m, "Tipo", "tipo"));
    const qtd = safe(getField(m, "Quantidade", "quantidade"));
    // Obs: cabeçalho na planilha deve conter exatamente "Origem/Destino"
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
// =========================
function applyHistoryFilter() {
  // IDs do HTML que fornecemos: search-historico, f-data-inicio, f-data-fim
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

  // filtra em memória (movimentosCache)
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
    lista = lista.filter((m) => {
      const codigo = String(
        getField(m, "Código", "codigo") || ""
      ).toLowerCase();
      const produto = String(
        getField(m, "Produto", "produto") || ""
      ).toLowerCase();
      const origem = String(
        getField(m, "Origem/Destino", "Origem", "origem") || ""
      ).toLowerCase();
      const obs = String(
        getField(m, "Observações", "Observacoes", "observacoes") || ""
      ).toLowerCase();
      const tipo = String(getField(m, "Tipo", "tipo") || "").toLowerCase();
      return (
        codigo.includes(termo) ||
        produto.includes(termo) ||
        origem.includes(termo) ||
        obs.includes(termo) ||
        tipo.includes(termo)
      );
    });
  }

  renderizarMovimentos(lista);
}

// =========================
// INICIALIZAÇÃO / BIND EVENTS
// =========================
document.addEventListener("DOMContentLoaded", () => {
  // Carregar listagens
  carregarProdutos();
  carregarHistorico();

  // Estoque: botões
  const btnRefresh = document.getElementById("btn-refresh");
  if (btnRefresh) btnRefresh.addEventListener("click", carregarProdutos);

  const btnDelete = document.getElementById("btn-delete");
  if (btnDelete) btnDelete.addEventListener("click", excluirProdutos);

  const btnSearch = document.getElementById("btn-search");
  if (btnSearch)
    btnSearch.addEventListener("click", () => {
      const termo =
        (document.getElementById("search-input") || {}).value
          ?.trim()
          .toLowerCase() || "";
      const rows = Array.from(
        document.querySelectorAll("#products-table tbody tr")
      );
      rows.forEach((r) => {
        const cols = r.querySelectorAll("td");
        const codigo = (cols[1]?.innerText || "").toLowerCase();
        const nome = (cols[2]?.innerText || "").toLowerCase();
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
});
