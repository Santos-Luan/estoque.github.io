# 📦 Sistema de Controle de Estoque – Protótipo  

Este é um **projeto extensionista acadêmico** desenvolvido como protótipo de um sistema de **controle de estoque integrado ao Google Sheets**, voltado para pequenos comércios.  

## ✨ Funcionalidades  

- ✅ **Cadastro de produtos** com código, nome, quantidade inicial, preço e estoque mínimo.  
- ✅ **Movimentação de estoque** (entrada e saída), com registro em histórico.  
- ✅ **Atualização automática do estoque** com validação para não permitir quantidades negativas.  
- ✅ **Histórico completo de movimentações**, com origem/destino e observações.  
- ✅ **Interface web simples e responsiva** (HTML, CSS e JavaScript).  
- ✅ **Integração com Google Apps Script** para persistência de dados em planilhas.  

## 🛠️ Tecnologias Utilizadas  

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Google Apps Script  
- **Banco de Dados:** Google Sheets  

## 📂 Estrutura do Projeto  

- `index.html` → Página inicial  
- `produtos.html` → Cadastro e listagem de produtos  
- `movimentacao.html` → Registro de entradas e saídas  
- `historico.html` → Histórico de movimentações  
- `estoque.html` → Estoque atual  
- `script.js` → Lógica de integração com o Apps Script  
- `styles.css` → Estilos da aplicação  
- `APP SCRIPT.pdf` → Código backend em Google Apps Script  

## 🚀 Como Usar  

1. Publique o código do `APP SCRIPT.pdf` no **Google Apps Script** e gere a URL de execução (`/exec`).  
2. Cole a URL gerada no arquivo `script.js`, na constante `URL_APPS_SCRIPT`.  
3. Abra os arquivos `.html` no navegador (ou hospede em qualquer servidor estático).  
4. Comece a cadastrar produtos, registrar movimentações e acompanhar o estoque em tempo real!  

---

👨‍💻 Desenvolvido como parte de um **projeto extensionista acadêmico**.  
