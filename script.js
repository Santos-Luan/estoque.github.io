// ===============================
// CONFIG
// ===============================
const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwNbPBp8BSntRxL2dwxLpPyeaRDqFM2IbL2ZBINQD7vxZdtSS9f130gkTd8eahgZB9w/exec"; // <- coloque aqui a URL publicada

// ===============================
// PRODUTOS
// ===============================
if (document.getElementById("add-product-form")) {
  document
    .getElementById("add-product-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const senha = prompt("Digite a senha para cadastrar produto:");
      if (!senha) return;

      const data = new URLSearchParams();
      data.append("action", "addProduct");
      data.append("codigo", document.getElementById("p-codigo").value);
      data.append("produto", document.getElementById("p-nome").value);
      data.append("quantidade", document.getElementById("p-quantidade").value);
      data.append("preco", document.getElementById("p-preco").value);
      data.append("minimo", document.getElementById("p-minimo").value);
      data.append("key", senha);

      try {
        const res = await fetch(URL_APPS_SCRIPT, {
          method: "POST",
          body: data,
        });
        const result = await res.json();
        document.getElementById("msg-add").innerText =
          result.result === "success"
            ? "✅ Produto cadastrado!"
            : "❌ " + result.message;
      } catch (err) {
        document.getElementById("msg-add").innerText = "❌ Erro: " + err;
      }
    });
}

// ===============================
// MOVIMENTAÇÃO
// ===============================
if (document.getElementById("move-form")) {
  document.getElementById("move-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const senha = prompt("Digite a senha para registrar movimentação:");
    if (!senha) return;

    const data = new URLSearchParams();
    data.append("action", "updateStock");
    data.append("codigo", document.getElementById("m-codigo").value);
    data.append("type", document.getElementById("m-type").value);
    data.append("quantidade", document.getElementById("m-quantidade").value);
    data.append("origem", document.getElementById("m-origem").value);
    data.append("observacoes", document.getElementById("m-obs").value);
    data.append("key", senha);

    try {
      const res = await fetch(URL_APPS_SCRIPT, { method: "POST", body: data });
      const result = await res.json();
      document.getElementById("msg-move").innerText =
        result.result === "success"
          ? "✅ Movimentação registrada!"
          : "❌ " + result.message;
    } catch (err) {
      document.getElementById("msg-move").innerText = "❌ Erro: " + err;
    }
  });
}

// ===============================
// ESTOQUE
// ===============================
async function carregarProdutos() {
  try {
    const res = await fetch(URL_APPS_SCRIPT + "?action=listProducts");
    const result = await res.json();
    const tabela = document.querySelector("#products-table tbody");
    if (!tabela) return;

    tabela.innerHTML = "";
    if (result.result === "success") {
      result.products.forEach((p) => {
        const row = `<tr>
          <td><input type="checkbox" class="chk-del" data-codigo="${p.Código}"></td>
          <td>${p.Código}</td>
          <td>${p.Produto}</td>
          <td>${p.Quantidade}</td>
          <td>${p.Preço}</td>
          <td>${p["Última Atualização"]}</td>
          <td>${p.Minimo}</td>
        </tr>`;
        tabela.innerHTML += row;
      });
    } else {
      tabela.innerHTML =
        "<tr><td colspan='7'>❌ Erro ao listar produtos</td></tr>";
    }
  } catch (err) {
    console.error(err);
  }
}

if (document.getElementById("btn-refresh")) {
  document
    .getElementById("btn-refresh")
    .addEventListener("click", carregarProdutos);
  carregarProdutos();
}

// exclusão múltipla
if (document.getElementById("btn-delete")) {
  document.getElementById("btn-delete").addEventListener("click", async () => {
    const senha = prompt("Digite a senha para excluir produtos:");
    if (!senha) return;

    const selecionados = [...document.querySelectorAll(".chk-del:checked")];
    if (selecionados.length === 0) {
      alert("Nenhum produto selecionado!");
      return;
    }

    for (let chk of selecionados) {
      const codigo = chk.dataset.codigo;
      const data = new URLSearchParams();
      data.append("action", "deleteProduct");
      data.append("codigo", codigo);
      data.append("key", senha);

      await fetch(URL_APPS_SCRIPT, { method: "POST", body: data });
    }

    carregarProdutos();
  });
}

// ===============================
// HISTÓRICO
// ===============================
async function carregarMovimentos() {
  try {
    const res = await fetch(URL_APPS_SCRIPT + "?action=listMovements");
    const result = await res.json();
    const tabela = document.querySelector("#mov-table tbody");
    if (!tabela) return;

    tabela.innerHTML = "";
    if (result.result === "success") {
      result.movements.forEach((m) => {
        const row = `<tr>
          <td>${m.Timestamp}</td>
          <td>${m.Código}</td>
          <td>${m.Tipo}</td>
          <td>${m.Quantidade}</td>
          <td>${m["Origem/Destino"]}</td>
          <td>${m.Observações}</td>
        </tr>`;
        tabela.innerHTML += row;
      });
    } else {
      tabela.innerHTML =
        "<tr><td colspan='6'>❌ Erro ao listar movimentos</td></tr>";
    }
  } catch (err) {
    console.error(err);
  }
}

if (document.getElementById("btn-refresh-mov")) {
  document
    .getElementById("btn-refresh-mov")
    .addEventListener("click", carregarMovimentos);
  carregarMovimentos();
}
