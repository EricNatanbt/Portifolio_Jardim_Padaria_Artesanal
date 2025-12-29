// Dados fake apenas para testar o fluxo antes do backend
function preencherFormulario(prod) {
productName.value = prod.nome;
productPrice.value = prod.preco;
productStatus.value = prod.status;
availableDate.value = prod.data;
}


btnSearch.onclick = () => {
const termo = searchInput.value.toLowerCase();
const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(termo));
renderLista(filtrados);
};


btnSave.onclick = () => {
if (produtoSelecionado) {
// editar
produtoSelecionado.nome = productName.value;
produtoSelecionado.preco = parseFloat(productPrice.value);
produtoSelecionado.status = productStatus.value;
produtoSelecionado.data = availableDate.value;
} else {
// cadastrar novo
produtos.push({
id: produtos.length + 1,
nome: productName.value,
preco: parseFloat(productPrice.value),
status: productStatus.value,
data: availableDate.value
});
}


window.showNotification("Produto salvo!", 3000, "success");
renderLista(produtos);
limparFormulario();
};


btnDelete.onclick = () => {
if (produtoSelecionado) {
produtos = produtos.filter(p => p.id !== produtoSelecionado.id);
window.showNotification("Produto excluído!", 3000, "success");
renderLista(produtos);
limparFormulario();
}
};


btnNew.onclick = limparFormulario;


function limparFormulario() {
produtoSelecionado = null;
productName.value = "";
productPrice.value = "";
productStatus.value = "sim";
availableDate.value = "";
}


// Render inicial
renderLista(produtos);