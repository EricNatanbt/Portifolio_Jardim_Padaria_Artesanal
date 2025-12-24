// Abrir/Fechar Modals
const createModal = document.getElementById('createModal');
const editModal = document.getElementById('editModal');

document.getElementById('addProductBtn').onclick = () => { createModal.style.display = 'block'; };
document.getElementById('closeCreateModal').onclick = () => createModal.style.display = 'none';
document.getElementById('cancelCreateBtn').onclick = () => createModal.style.display = 'none';
document.getElementById('closeEditModal').onclick = () => editModal.style.display = 'none';
document.getElementById('cancelEditBtn').onclick = () => editModal.style.display = 'none';

window.onclick = e => {
    if(e.target==createModal) createModal.style.display='none';
    if(e.target==editModal) editModal.style.display='none';
};

// Product Manager
class ProductManager {
    constructor(){
        this.products = [];
        this.loadProducts();
    }

    async loadProducts(){
        const tbody = document.getElementById('productsBody');
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">Carregando produtos...</td></tr>`;
        try{
            const res = await fetch('/.netlify/functions/get-products');
            const data = await res.json();
            this.products = data.products || [];
            this.renderProducts();
        }catch(e){
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;padding:2rem;">Erro ao carregar produtos</td></tr>`;
        }
    }

    renderProducts(){
        const tbody = document.getElementById('productsBody');
        tbody.innerHTML='';
        if(!this.products.length){
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">Nenhum produto encontrado</td></tr>`;
            return;
        }
        this.products.forEach(p=>{
            const row = tbody.insertRow();
            const price = parseFloat(p.preco||0);
            row.innerHTML = `
                <td>${p.id?.substring(0,8) || ''}...</td>
                <td><img src="${p.imagem||'/img/logos/Logo.png'}" class="product-image" alt="${p.nome}"></td>
                <td>${p.nome || ''}</td>
                <td>${p.categoria || '-'}</td>
                <td>R$ ${price.toFixed(2).replace('.',',')}</td>
                <td>${(p.dias_disponiveis||[]).join(', ')}</td>
                <td>
                    <button class="btn-edit" onclick="window.productManager.openEdit('${p.id}')">Editar</button>
                    <button class="btn-delete" onclick="window.productManager.deleteProduct('${p.id}')">Excluir</button>
                </td>`;
        });
    }

    openEdit(productId){
        const product = this.products.find(p=>p.id===productId);
        if(!product) return alert('Produto não encontrado');
        document.getElementById('editId').value = product.id;
        document.getElementById('editNome').value = product.nome;
        document.getElementById('editPreco').value = product.preco;
        document.getElementById('editDescricao').value = product.descricao;
        document.getElementById('editCategoria').value = product.categoria;
        document.querySelectorAll('input[name="editDias"]').forEach(cb => cb.checked = product.dias_disponiveis.includes(cb.value));
        editModal.style.display = 'block';
    }

    async deleteProduct(productId){
        if(!confirm('Tem certeza que deseja excluir este produto?')) return;
        try{
            const res = await fetch(`/.netlify/functions/delete-product?id=${productId}`, {method:'DELETE'});
            const data = await res.json();
            if(!res.ok||!data.success) throw new Error(data.message||'Erro ao deletar');
            this.products = this.products.filter(p=>p.id!==productId);
            this.renderProducts();
            alert('Produto excluído com sucesso!');
        }catch(e){ alert('Erro: '+e.message); }
    }
}

const pm = new ProductManager();
window.productManager = pm;

// Criar Produto
document.getElementById('createForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const nome = document.getElementById('createNome').value;
    const preco = parseFloat(document.getElementById('createPreco').value);
    const descricao = document.getElementById('createDescricao').value;
    const categoria = document.getElementById('createCategoria').value;
    const dias_disponiveis = Array.from(document.querySelectorAll('input[name="createDias"]:checked')).map(cb=>cb.value);

    try{
        const res = await fetch('/.netlify/functions/create-product', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({nome,preco,descricao,categoria,dias_disponiveis})
        });
        const data = await res.json();
        if(!res.ok || !data.success) throw new Error(data.message||'Erro ao criar produto');
        alert('Produto criado com sucesso!');
        createModal.style.display='none';
        pm.loadProducts();
    }catch(err){ alert('Erro: '+err.message); }
});

// Editar Produto
document.getElementById('editForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const nome = document.getElementById('editNome').value;
    const preco = parseFloat(document.getElementById('editPreco').value);
    const descricao = document.getElementById('editDescricao').value;
    const categoria = document.getElementById('editCategoria').value;
    const dias_disponiveis = Array.from(document.querySelectorAll('input[name="editDias"]:checked')).map(cb=>cb.value);

    try{
        const res = await fetch('/.netlify/functions/update-product', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({id,nome,preco,descricao,categoria,dias_disponiveis})
        });
        const data = await res.json();
        if(!res.ok || !data.success) throw new Error(data.message||'Erro ao atualizar produto');
        alert('Produto atualizado com sucesso!');
        editModal.style.display='none';
        pm.loadProducts();
    }catch(err){ alert('Erro: '+err.message); }
});
