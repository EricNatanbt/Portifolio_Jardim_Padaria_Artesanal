document.addEventListener('DOMContentLoaded', () => {
    // Abrir/Fechar Modals
    const createModal = document.getElementById('createModal');
    const editModal = document.getElementById('editModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeCreateModal = document.getElementById('closeCreateModal');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (addProductBtn) {
        addProductBtn.onclick = () => { 
            if (createModal) createModal.style.display = 'block'; 
            const preview = document.getElementById('createImagePreview');
            if (preview) {
                preview.innerHTML = '';
                preview.style.display = 'none';
            }
            const form = document.getElementById('createForm');
            if (form) form.reset();
        };
    }

    if (closeCreateModal) closeCreateModal.onclick = () => createModal.style.display = 'none';
    if (cancelCreateBtn) cancelCreateBtn.onclick = () => createModal.style.display = 'none';
    if (closeEditModal) closeEditModal.onclick = () => editModal.style.display = 'none';
    if (cancelEditBtn) cancelEditBtn.onclick = () => editModal.style.display = 'none';

    window.onclick = e => {
        if(e.target==createModal) createModal.style.display='none';
        if(e.target==editModal) editModal.style.display='none';
    };

    // Preview de Imagem
    function setupImagePreview(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        
        if (input && preview) {
            input.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                        preview.style.display = 'block';
                    }
                    reader.readAsDataURL(file);
                } else {
                    preview.style.display = 'none';
                }
            });
        }
    }

    setupImagePreview('createImagem', 'createImagePreview');
    setupImagePreview('editImagem', 'editImagePreview');

    // Função para upload de imagem
    async function uploadImage(file) {
        if (!file) return null;
        
        const reader = new FileReader();
        const fileData = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        const res = await fetch('/.netlify/functions/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                fileData: fileData
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Erro no upload da imagem');
        return data.imageUrl;
    }

    // Product Manager
    class ProductManager {
        constructor(){
            this.products = [];
            this.loadProducts();
        }

        async loadProducts(){
            const tbody = document.getElementById('productsBody');
            if (!tbody) return;
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;"><div style="color:var(--text-light);">Carregando produtos...</div></td></tr>`;
            try{
                const res = await fetch('/.netlify/functions/get-products');
                const data = await res.json();
                this.products = data.products || [];
                this.renderProducts();
            }catch(e){
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;padding:3rem;">Erro ao carregar produtos</td></tr>`;
            }
        }

        renderProducts(){
            const tbody = document.getElementById('productsBody');
            if (!tbody) return;
            tbody.innerHTML='';
            if(!this.products.length){
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;"><div style="color:var(--text-light);">Nenhum produto encontrado</div></td></tr>`;
                return;
            }
            this.products.forEach(p=>{
                const row = tbody.insertRow();
                const price = parseFloat(p.preco||0);
                
                // Formatar dias
                const diasHtml = (p.dias_disponiveis||[]).map(dia => `<span class="day-tag">${dia}</span>`).join('');
                
                row.innerHTML = `
                    <td class="td-image">
                        <div class="product-image-container">
                            <img src="${p.imagem || p.image_url || p.image || '/img/logos/Logo.png'}" class="product-image" alt="${p.nome}">
                        </div>
                    </td>
                    <td>
                        <div class="product-name-cell">${p.nome || ''}</div>
                        <div style="font-size:0.75rem; color:var(--text-light); margin-top:4px;">ID: ${p.id?.substring(0,8) || ''}</div>
                    </td>
                    <td><span class="category-badge">${p.categoria || '-'}</span></td>
                    <td><span class="price-tag">R$ ${price.toFixed(2).replace('.',',')}</span></td>
                    <td><div class="days-list">${diasHtml}</div></td>
                    <td style="text-align:right;">
                        <button class="btn-edit" data-id="${p.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Editar
                        </button>
                        <button class="btn-delete" data-id="${p.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            Excluir
                        </button>
                    </td>`;
                
                row.querySelector('.btn-edit').onclick = () => this.openEdit(p.id);
                row.querySelector('.btn-delete').onclick = () => this.deleteProduct(p.id);
            });
        }

        openEdit(productId){
            const product = this.products.find(p=>p.id===productId);
            if(!product) return alert('Produto não encontrado');
            
            const editId = document.getElementById('editId');
            const editNome = document.getElementById('editNome');
            const editPreco = document.getElementById('editPreco');
            const editDescricao = document.getElementById('editDescricao');
            const editCategoria = document.getElementById('editCategoria');
            
            if (editId) editId.value = product.id;
            if (editNome) editNome.value = product.nome;
            if (editPreco) editPreco.value = product.preco;
            if (editDescricao) editDescricao.value = product.descricao;
            if (editCategoria) editCategoria.value = product.categoria;
            
            document.querySelectorAll('input[name="editDias"]').forEach(cb => {
                cb.checked = product.dias_disponiveis && product.dias_disponiveis.includes(cb.value);
            });
            
            const preview = document.getElementById('editImagePreview');
            if (preview) {
                if (product.imagem) {
                    preview.innerHTML = `<img src="${product.imagem}" alt="Preview">`;
                    preview.style.display = 'block';
                } else {
                    preview.innerHTML = '';
                    preview.style.display = 'none';
                }
            }
            
            if (editModal) editModal.style.display = 'block';
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
    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', async e=>{
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Enviando...';
            submitBtn.disabled = true;

            try {
                const nome = document.getElementById('createNome').value;
                const preco = parseFloat(document.getElementById('createPreco').value);
                const descricao = document.getElementById('createDescricao').value;
                const categoria = document.getElementById('createCategoria').value;
                const dias_disponiveis = Array.from(document.querySelectorAll('input[name="createDias"]:checked')).map(cb=>cb.value);
                const imageFile = document.getElementById('createImagem').files[0];

                let imagem = '/img/logos/Logo.png';
                if (imageFile) {
                    imagem = await uploadImage(imageFile);
                }

                const res = await fetch('/.netlify/functions/create-product', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({nome,preco,descricao,categoria,dias_disponiveis,imagem})
                });
                const data = await res.json();
                if(!res.ok || !data.success) throw new Error(data.message||'Erro ao criar produto');
                alert('Produto criado com sucesso!');
                if (createModal) createModal.style.display='none';
                pm.loadProducts();
            } catch(err) { 
                alert('Erro: '+err.message); 
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Editar Produto
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async e=>{
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Salvando...';
            submitBtn.disabled = true;

            try {
                const id = document.getElementById('editId').value;
                const nome = document.getElementById('editNome').value;
                const preco = parseFloat(document.getElementById('editPreco').value);
                const descricao = document.getElementById('editDescricao').value;
                const categoria = document.getElementById('editCategoria').value;
                const dias_disponiveis = Array.from(document.querySelectorAll('input[name="editDias"]:checked')).map(cb=>cb.value);
                const imageFile = document.getElementById('editImagem').files[0];

                const product = pm.products.find(p => p.id === id);
                let imagem = product ? product.imagem : '/img/logos/Logo.png';

                if (imageFile) {
                    imagem = await uploadImage(imageFile);
                }

                const res = await fetch('/.netlify/functions/update-product', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({id,nome,preco,descricao,categoria,dias_disponiveis,imagem})
                });
                const data = await res.json();
                if(!res.ok || !data.success) throw new Error(data.message||'Erro ao atualizar produto');
                alert('Produto atualizado com sucesso!');
                if (editModal) editModal.style.display='none';
                pm.loadProducts();
            } catch(err) { 
                alert('Erro: '+err.message); 
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
