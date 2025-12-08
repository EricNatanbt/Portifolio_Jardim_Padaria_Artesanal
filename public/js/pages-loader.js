// ============================================
// CARREGADOR DE PÁGINAS
// ============================================

class PagesLoader {
    constructor() {
        this.pagesContent = {
            'inicio': this.getInicioContent(),
            'sobre': this.getSobreContent(),
            'cuidados': this.getCuidadosContent(),
            'feedbacks': this.getFeedbacksContent(),
            'pedidos': this.getPedidosContent()  // NOVO: Página de pedidos
        };
        this.footerContent = this.getFooterContent();
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadAllPages();
        });
    }

    loadAllPages() {
        // Carrega conteúdo em todas as páginas
        for (const [pageId, content] of Object.entries(this.pagesContent)) {
            const pageElement = document.getElementById(`page-${pageId}`);
            if (pageElement) {
                pageElement.innerHTML = content;
            }
        }

        // Inicializa a aplicação após carregar todo o conteúdo
        setTimeout(() => {
            if (typeof initializeApp === 'function') {
                initializeApp();
            }
            this.loadFooter();
        }, 100);
    }

    loadFooter() {
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = this.getFooterContent();
        }
    }

    getInicioContent() {
        return `
            <!-- Hero Section -->
            <section class="hero">
                <div class="container">
                    <div class="hero-content">
                        <h2 class="hero-title">Bem-vindo ao Jardim Padaria Artesanal</h2>
                        <p class="hero-subtitle">Produtos artesanais feitos com amor e ingredientes de qualidade. Cada pão é uma obra de arte, cada doce é um carinho especial.</p>
                    </div>
                    
                    <div class="hero-info">
                        <div class="info-card" onclick="abrirGoogleMaps()" style="cursor: pointer;">
                            <div class="info-icon">📍</div>
                            <div class="info-content">
                                <h4>Visite Nossa Loja</h4>
                                <p>Av. Joaquim Caroca, 266 - Universitário<br>Campina Grande - PB, 58429-120</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon">🕒</div>
                            <div class="info-content">
                                <h4>Horário de Funcionamento</h4>
                                <p>Quarta a Sexta: 14h – 18h<br>Sábado: 10h – 15h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Carrossel de Produtos -->
            <section class="products-carousel-section">
                <div class="container">
                    <h3>Nossas Delícias</h3>
                    <p class="section-subtitle">Conheça alguns dos nossos produtos artesanais</p>
                    
                    <div class="carousel-container products-carousel">
                        <div class="carousel-slide">
                            <img src="img/produtos/produto1.png" alt="cookies" class="carousel-image active">
                            <img src="img/produtos/produto2.png" alt="paos" class="carousel-image">
                            <img src="img/produtos/produto3.png" alt="pao com frutas" class="carousel-image">
                            <img src="img/produtos/produto4.png" alt="bolinhos" class="carousel-image">
                            <img src="img/produtos/produto5.png" alt="pao gigante" class="carousel-image">
                            <img src="img/produtos/produto6.png" alt="pizzas" class="carousel-image">
                            <img src="img/produtos/produto7.png" alt="bolinhos em formato de rosas" class="carousel-image">
                            <img src="img/produtos/produto8.png" alt="bolinhos verdes" class="carousel-image">
                            <img src="img/produtos/produto9.png" alt="bolo de chocolate" class="carousel-image">
                            <img src="img/produtos/produto10.png" alt="produto embalado" class="carousel-image">
                            <img src="img/produtos/produto11.png" alt="produtos embalados" class="carousel-image">
                            <img src="img/produtos/produto12.png" alt="bolinhos brancos" class="carousel-image">
                            <img src="img/produtos/produto13.png" alt="bolinhos coloridos" class="carousel-image">
                        </div>
                    </div>
                </div>
            </section>

            <!-- Benefits Section -->
            <section class="benefits-section">
                <div class="container">
                    <h3>Por que Escolher a Jardim Padaria?</h3>
                    <div class="benefits">
                        <div class="benefit">
                            <span class="benefit-icon">🌾</span>
                            <div>
                                <p class="benefit-title">Fermentação Natural</p>
                                <p class="benefit-desc">Processo artesanal e tradicional que realça o sabor e melhora a digestibilidade</p>
                            </div>
                        </div>
                        <div class="benefit">
                            <span class="benefit-icon">💚</span>
                            <div>
                                <p class="benefit-title">Ingredientes Selecionados</p>
                                <p class="benefit-desc">Utilizamos apenas ingredientes premium, muitos deles orgânicos e de produtores locais</p>
                            </div>
                        </div>
                        <div class="benefit">
                            <span class="benefit-icon">👨‍🍳</span>
                            <div>
                                <p class="benefit-title">Técnica Artesanal</p>
                                <p class="benefit-desc">Cada produto é feito manualmente com técnicas tradicionais aprimoradas</p>
                            </div>
                        </div>
                        <div class="benefit">
                            <span class="benefit-icon">🚚</span>
                            <div>
                                <p class="benefit-title">Entrega em Domicílio</p>
                                <p class="benefit-desc">Entregamos em Campina Grande e região, mantendo a qualidade e frescor</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            <!-- CTA Section -->
            <section class="cta-section">
                <div class="container">
                    <div class="cta-content">
                        <h3>Pronto para Experimentar?</h3>
                        <p>Venha nos visitar ou faça seu pedido pelo WhatsApp</p>
                        <div class="cta-buttons">
                            <button class="cta-button primary" data-page="menu">Ver Cardápio Completo</button>
                            <a href="https://api.whatsapp.com/send/?phone=558399204618&text&type=phone_number&app_absent=0" class="cta-button secondary" target="_blank">
                                <img style="width: 24px; height: 24px; margin-right: 0.5rem;" src="img/logos/whatsapp.png" alt="WhatsApp">
                                Pedir pelo WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    getSobreContent() {
        return `
            <section class="about-section">
                <div class="container">
                    <div class="about-content">
                        <div class="about-text">
                            <h2>Como Tudo Começou</h2>

                           <div class="text-carousel-container">

                            <button class="text-arrow text-prev">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </button>

                            <div class="text-slide-wrapper">
                                <div class="text-slide active">
                                    <p> A Padaria Jardim nasceu pequena, no quintal de casa em Campina Grande, mas carregando um sonho que sempre foi grande demais para ficar guardado.
                                        Somos Júlia e Washington, um casal que se conheceu na faculdade de Gastronomia (UFRPE) e descobriu, entre fornos e conversas, 
                                        que dividiríamos tanto a vida quanto os pães.
                                    </p>
                                </div>

                                <div class="text-slide">
                                    <p>Antes de existir como negócio, a Jardim existiu como desejo: o de criar alimentos honestos, 
                                    naturais e cheios de cuidado. Júlia sempre sonhou em ter uma padaria e encontrou na panificação 
                                    artesanal sua verdadeira vocação. Washington, que sempre foi um cozinheiro talentoso, 
                                    mergulhou no universo dos pães de fermentação natural ao seu lado e, juntos, desenvolvemos técnicas 
                                    próprias, afinamos receitas e construímos nossa identidade. </p>
                                </div>

                                <div class="text-slide">
                                    <p>Aqui, tudo é feito a quatro mãos. Do cultivo do fermento à última dobra da massa, cada etapa é 
                                    preparada por nós dois, com o tempo que o pão pede e o respeito que os ingredientes merecem. 
                                    Acreditamos que qualidade não se apressa e que nada é pequeno quando feito com amor: 
                                    nosso lema é a essência do Jardim. </p>
                                </div>

                                <div class="text-slide">
                                    <p>Ainda somos uma micro padaria artesanal, funcionando exclusivamente por delivery, 
                                    mais com o coração cheio de planos. Enquanto preparamos a chegada da nossa primeira filha, 
                                    seguimos alimentando também o sonho de abrir um espaço físico para acolher nossos clientes 
                                    como gostaríamos. </p>
                                </div>

                                <div class="text-slide">
                                    <p>A Padaria Jardim é isso: um projeto de vida, de família e de sabor. 
                                    Um lugar onde o que sai do forno é feito com propósito: para nutrir, 
                                    acolher e trazer um pouco mais de bem-estar ao dia de quem nos escolhe. </p>
                                </div>

                                <div class="text-slide">
                                    <p>Seja bem-vindo ao nosso Jardim. Aqui, cada pão é cuidado como merece, pois cada um é único! </p>
                                </div>
                            </div>


                            <button class="text-arrow text-next">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 18l6-6-6-6"/>
                                </svg>
                            </button>

                    
                        </div>
                        </div>
                        <div class="about-image">
                            <div class="carousel-container">
                                <div class="carousel-slide">
                                    <img src="img/sobre/sobre_nos_1.png" alt="Imagem 1 Sobre Nós" class="carousel-image active">
                                    <img src="img/sobre/sobre_nos_2.png" alt="Imagem 2 Sobre Nós" class="carousel-image">
                                    <img src="img/sobre/sobre_nos_6.png" alt="Imagem 6 Sobre Nós" class="carousel-image">
                                    <img src="img/sobre/sobre_nos_5.png" alt="Imagem 5 Sobre Nós" class="carousel-image">
                                    <img src="img/sobre/sobre_nos_4.png" alt="Imagem 4 Sobre Nós" class="carousel-image">
                                    <img src="img/sobre/sobre_nos_7.png" alt="Imagem 7 Sobre Nós" class="carousel-image">
                                </div>
                                
                                <!-- Controles de navegação -->
                                <button class="carousel-nav carousel-prev">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M15 18l-6-6 6-6"/>
                                    </svg>
                                </button>
                                <button class="carousel-nav carousel-next">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                </button>
                                
                                <!-- Indicadores -->
                                <div class="carousel-controls">
                                    <button class="carousel-dot active" data-slide="0"></button>
                                    <button class="carousel-dot" data-slide="1"></button>
                                    <button class="carousel-dot" data-slide="2"></button>
                                    <button class="carousel-dot" data-slide="3"></button>
                                    <button class="carousel-dot" data-slide="4"></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="purpose-section">
                        <h2>Nosso Propósito</h2>
                        <div class="purpose-cards">
                            <div class="purpose-card">
                                <h3>Paixão pela Qualidade</h3>
                                <p>Na Padaria Jardim, a produção artesanal é cultivada com a mesma paixão que um jardineiro apaixonado escolhe suas flores.</p>
                            </div>
                            <div class="purpose-card">
                                <h3>Fusão de Técnicas</h3>
                                <p>Cada pão e doce são colhidos com carinho, celebrando a fusão entre técnicas tradicionais e inovações contemporâneas.</p>
                            </div>
                            <div class="purpose-card">
                                <h3>Compromisso Sustentável</h3>
                                <p>Além dos sabores únicos, a padaria floresce com um compromisso sustentável, onde os valores se entrelaçam harmoniosamente com os sabores.</p>
                            </div>
                            <div class="purpose-card">
                                <h3>Experiência Sensorial</h3>
                                <p>Ao visitar a Padaria Jardim, os clientes são envolvidos por "Delícias que florescem, aroma que espalha e arte que encanta".</p>
                            </div>
                        </div>
                    </div>

                    <div class="differentials-section">
                        <h2>Nossos Diferenciais</h2>
                        <div class="differentials-grid">
                            <div class="differential">
                                <h3>O que é Fermentação Natural?</h3>
                                <p>O fermento natural é a <strong>essência da panificação</strong>! É a forma que os antigos faziam nos primeiros países, quando não se tinha o fermento industrializado como a gente conhece.</p>
                                <p>Ele nasce do cultivo de <strong>leveduras naturais</strong> que ao serem misturadas com farinha de trigo e água conseguem força e estrutura para fazer aquilo que precisamos: <strong>FERMENTAR!</strong></p>
                            </div>
                            <div class="differential">
                                <h3>Glúten Bom!</h3>
                                <p>O glúten é um conjunto de <strong>proteínas naturais</strong> encontradas na <strong>farinha de trigo</strong>.</p>
                                <p>Devido ao longo processo de fermentação, o glúten presente nos <strong>nossos pães</strong> sofre <strong>deterioração natural</strong> e as proteínas simples são quebradas no processo.</p>
                                <p>Ou seja, todo o <strong>trabalho que o nosso corpo</strong> iria realizar durante a digestão, <strong>não precisa mais!</strong> :) Por isso é tão gostoso e fácil de comer pão de fermentação natural <3</p>
                            </div>
                            <div class="differential">
                                <h3>Benefícios da Fermentação Natural</h3>
                                <ul class="benefits-list">
                                    <li>Seu sabor é incomparável ao do pão tradicional</li>
                                    <li>É um produto artesanal, sem adição alguma de produtos químicos</li>
                                    <li>Possui um índice glicêmico mais baixo do que outros pães</li>
                                    <li>Evita desconfortos abdominais e inchaço</li>
                                    <li>Possui uma série de nutrientes</li>
                                    <li>Fonte de vitaminas do complexo B</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    getCuidadosContent() {
        return `
            <section class="guia-cuidados-section">
                <div class="container">
                    <h2>Dicas dos Padeiros</h2>

                    <p class="guia-intro">Nossos pães chegam a vocês fresquinhos, todos os dias, alguns ainda quentes! 
                    E esse sabor saindo do forno é incomparável. Então, talvez você se pergunte: "como posso preservar esse sabor especial da melhor maneira possível?".</p>
                    <div class="guia-cards">


                      <div class="guia-card">
                            <h3>Consumo</h3>
                             <ul class="conservamento-list">
                                    <li> Temperatura ambiente: até 3 dias </li>
                                    <li> Na geladeira: até 15 dias </li>
                                    <li> No freezer: até 30 dias </li>
                            </ul>
                        </div>


                        <div class="guia-card">
                            <h3>Armazenamento Adequado</h3>
                            <ul class="armazenamento-list">
                                    <li> Embalagem bem fechada </li>
                                    <li> Recipiente com tampa </li>
                            </ul>
         
                        </div>

                       

                        <div class="guia-card">
                            <h3>Reaquecimento</h3>
                            <ul class="reaquecimento-list">
                                    <li> Para um pão congelado, indicamos que seja feito o descongelamento prévio na geladeira </li>
                                    <li>  use uma forma com água quente para umidificar o forno enquanto esquenta o pão e evitar que resseque. </li>
                                    <li> Siga o passo do Revitalizar </li>
                            </ul>
                
                        </div> 

                        <div class="guia-card">
                            <h3>Revitalizar</h3>
                            <ul class="revitalizar-list">
                                    <li> Molhe um pouco a superfície do pão com o auxílio de um spray para evitar que resseque muito.  </li>
                                    <li> Aquecimento em forno pré-aquecido (160ºC a 180 ºC) por cerca de 8 a 10 minutos.  </li>
                                   
                            </ul>
                        </div> 
                    </div>
                </div>
            </section>
        `;
    }

    getFeedbacksContent() {
        return `
            <section class="feedbacks-section">
                <div class="container">
                    <h2>O que Nossos Clientes Dizem</h2>
                    <p class="feedbacks-intro">Leia os depoimentos de quem já experimentou a magia da Padaria Jardim</p>

                    <div class="feedbacks-grid">
                        <div class="feedback-card">
                            <div class="feedback-header">
                                <div class="feedback-avatar">👩</div>
                                <div class="feedback-info">
                                    <h4>Maria Silva</h4>
                                    <p class="feedback-date">Há 2 meses</p>
                                </div>
                            </div>
                            <div class="feedback-rating">⭐⭐⭐⭐⭐</div>
                            <p class="feedback-text">Os pães de fermentação natural são simplesmente incríveis! Nunca comi algo tão saboroso e saudável. A qualidade é excepcional e entrega rápida!</p>
                        </div>

                        <div class="feedback-card">
                            <div class="feedback-header">
                                <div class="feedback-avatar">👨</div>
                                <div class="feedback-info">
                                    <h4>João Santos</h4>
                                    <p class="feedback-date">Há 1 mês</p>
                                </div>
                            </div>
                            <div class="feedback-rating">⭐⭐⭐⭐⭐</div>
                            <p class="feedback-text">Recomendo muito! Os bolos são frescos, deliciosos e feitos com muito cuidado. Já fiz vários pedidos e nunca decepcionou. Parabéns à Júlia e Washington!</p>
                        </div>

                        <div class="feedback-card">
                            <div class="feedback-header">
                                <div class="feedback-avatar">👩‍🦱</div>
                                <div class="feedback-info">
                                    <h4>Ana Costa</h4>
                                    <p class="feedback-date">Há 3 semanas</p>
                                </div>
                            </div>
                            <div class="feedback-rating">⭐⭐⭐⭐⭐</div>
                            <p class="feedback-text">Que experiência maravilhosa! Cada produto é uma obra de arte. O sabor, a textura, tudo perfeito. Definitivamente minha padaria favorita agora!</p>
                        </div>

                        <div class="feedback-card">
                            <div class="feedback-header">
                                <div class="feedback-avatar">👨‍💼</div>
                                <div class="feedback-info">
                                    <h4>Carlos Oliveira</h4>
                                    <p class="feedback-date">Há 1 semana</p>
                                </div>
                            </div>
                            <div class="feedback-rating">⭐⭐⭐⭐⭐</div>
                            <p class="feedback-text">Excelente qualidade! Sou cliente há alguns meses e sempre recebo produtos frescos e deliciosos. O atendimento é impecável. Muito obrigado!</p>
                        </div>

                        <div class="feedback-card">
                            <div class="feedback-header">
                                <div class="feedback-avatar">👩‍🍳</div>
                                <div class="feedback-info">
                                    <h4>Fernanda Lima</h4>
                                    <p class="feedback-date">Há 2 semanas</p>
                                </div>
                            </div>
                            <div class="feedback-rating">⭐⭐⭐⭐⭐</div>
                            <p class="feedback-text">Como chef, aprecio muito a qualidade dos ingredientes e o cuidado artesanal. Recomendo para todos que buscam produtos de excelência!</p>
                        </div>

                        <div class="feedback-card">
                            <div class="feedback-header">
                                <div class="feedback-avatar">👴</div>
                                <div class="feedback-info">
                                    <h4>Roberto Dias</h4>
                                    <p class="feedback-date">Há 1 mês</p>
                                </div>
                            </div>
                            <div class="feedback-rating">⭐⭐⭐⭐⭐</div>
                            <p class="feedback-text">Lembra o pão que minha avó fazia! Autêntico, saudável e delicioso. Vocês estão revivendo a tradição da boa padaria. Parabéns!</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    // NOVO: Método para carregar a página de pedidos
    getPedidosContent() {
    return `
        <div class="pedidos-page">
            <div class="pedidos-container">
                <div class="pedidos-header">
                    <h1>🍞 Meus Pedidos</h1>
                    <p>Jardim Padaria - Acompanhe seus pedidos</p>
                </div>
                
                <div class="pedidos-controls">
                    <div class="date-filter">
                        <input type="date" id="startDate">
                        <span>até</span>
                        <input type="date" id="endDate">
                        <button id="applyDateFilter" class="action-btn btn-primary">Filtrar</button>
                        <button id="clearDateFilter" class="action-btn btn-secondary">Limpar</button>
                    </div>
                </div>
                
                <div class="filter-controls">
                    <select id="statusFilter" class="filter-select">
                        <option value="">Todos os Status</option>
                        <option value="pendente">Pendente</option>
                        <option value="preparando">Preparando</option>
                        <option value="pronto">Pronto</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                    
                    <select id="paymentFilter" class="filter-select">
                        <option value="">Todos os Pagamentos</option>
                        <option value="pix">Pix</option>
                        <option value="cartao">Cartão</option>
                        <option value="dinheiro">Dinheiro</option>
                    </select>
                    
                    <input type="text" id="searchInput" class="filter-select search-input" placeholder="Buscar por ID do pedido...">
                </div>
                
                <div class="pedidos-table-container">
                    <div class="table-header">
                        <h3>Histórico de Pedidos</h3>
                        <span class="order-count" id="orderCount">0 pedidos</span>
                    </div>
                    <div class="pedidos-table">
                        <table id="pedidosTable">
                            <thead>
                                <tr>
                                    <th data-sort="order_id" class="sortable">ID</th>
                                    <th data-sort="total" class="sortable">Total</th>
                                    <th data-sort="status" class="sortable">Status</th>
                                    <th data-sort="delivery_option" class="sortable">Entrega</th>
                                    <th data-sort="payment_method" class="sortable">Pagamento</th>
                                    <th data-sort="created_at" class="sortable">Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="pedidosBody">
                                <tr>
                                    <td colspan="7" class="loading">
                                        <div class="loading-spinner"></div>
                                        <p>Carregando seus pedidos...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div id="noOrdersMessage" class="no-orders" style="display: none;">
                    <h3>Nenhum pedido encontrado</h3>
                    <p>Você ainda não fez nenhum pedido ou não há pedidos correspondentes aos filtros aplicados.</p>
                    <p>Que tal fazer seu primeiro pedido? <a href="#" data-page="menu" style="color: var(--primary); font-weight: bold;">Clique aqui para ver o cardápio!</a></p>
                </div>
                
                <div class="pedidos-footer">
                    <p>🍞 Jardim Padaria | Seus pedidos estão seguros conosco</p>
                </div>
            </div>
            
            <!-- Modal de Detalhes do Pedido -->
            <div class="modal" id="orderModal" style="display: none;">
                <div class="modal-overlay" onclick="window.PedidosPage?.closeModal()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalhes do Pedido</h3>
                        <button class="close-btn" onclick="window.PedidosPage?.closeModal()">×</button>
                    </div>
                    <div id="orderModalContent">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            <p>Carregando detalhes do pedido...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            /* Estilos específicos para a página de pedidos - EXATO MESMO DESIGN DA PÁGINA ANTIGA */
            :root {
                --primary: #1C3D2D;
                --primary-light: #2A5C42;
                --secondary: #A2B28E;
                --background: #FCF9F5;
                --card: #FFFFFF;
                --border: #D4E8DC;
                --success: #27AE60;
                --warning: #E67E22;
                --error: #E74C3C;
                --info: #3498DB;
                --text-primary: #333333;
                --text-secondary: #666666;
                --text-light: #888888;
            }
            
            .pedidos-page {
                min-height: calc(100vh - 200px);
                background: var(--background);
                color: var(--text-primary);
                line-height: 1.6;
                font-size: 14px;
                padding: 20px;
            }
            
            .pedidos-container {
                max-width: 1400px;
                margin: 0 auto;
                min-height: 100vh;
            }
            
            /* Header */
            .pedidos-header {
                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
                color: white;
                padding: 2rem;
                border-radius: 1rem;
                margin-bottom: 2rem;
                text-align: center;
                box-shadow: 0 4px 20px rgba(28, 61, 45, 0.2);
            }
            
            .pedidos-header h1 {
                color: white;
                margin-bottom: 0.5rem;
                font-size: 2rem;
            }
            
            /* Controls */
            .pedidos-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .refresh-btn {
                padding: 0.75rem 1.5rem;
                background: var(--success);
                color: white;
                border: none;
                border-radius: 0.5rem;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .refresh-btn:hover {
                background: #219653;
                transform: translateY(-2px);
            }
            
            .date-filter {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .date-filter input {
                padding: 0.5rem;
                border: 1px solid var(--border);
                border-radius: 0.25rem;
            }
            
            .filter-controls {
                display: flex;
                gap: 1rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            }
            
            .filter-select, .search-input {
                padding: 0.5rem;
                border: 1px solid var(--border);
                border-radius: 0.25rem;
                min-width: 180px;
            }
            
            .search-input {
                flex: 1;
                min-width: 250px;
            }
            
            /* Table */
            .table-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .order-count {
                background: var(--primary-light);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 2rem;
                font-size: 0.9rem;
            }
            
            .pedidos-table-container {
                background: var(--card);
                border-radius: 0.5rem;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                margin-bottom: 2rem;
            }
            
            .pedidos-table {
                overflow-x: auto;
            }
            
            .pedidos-table table {
                width: 100%;
                border-collapse: collapse;
                min-width: 1200px;
            }
            
            .pedidos-table th {
                background: #f8f9fa;
                color: var(--text-secondary);
                padding: 1rem;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid var(--border);
            }
            
            .pedidos-table th.sortable {
                cursor: pointer;
            }
            
            .pedidos-table td {
                padding: 1rem;
                border-bottom: 1px solid var(--border);
            }
            
            .pedidos-table tr:nth-child(even) {
                background: #fafbfc;
            }
            
            .pedidos-table tr:hover {
                background: #f0f7f2;
            }
            
            /* Status Badges */
            .status-badge {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                border-radius: 1rem;
                font-size: 0.8rem;
                font-weight: 600;
            }
            
            .status-pendente { background: #FFF3E0; color: #E67E22; }
            .status-preparando { background: #E3F2FD; color: #1976D2; }
            .status-pronto { background: #E8F5E9; color: #2E7D32; }
            .status-entregue { background: #E8F5E9; color: #1B5E20; }
            .status-cancelado { background: #FFEBEE; color: #C62828; }
            
            /* Action Buttons */
            .action-btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 0.25rem;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
                transition: all 0.3s;
                margin-right: 0.5rem;
                margin-bottom: 0.25rem;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .btn-primary { background: var(--primary); color: white; }
            .btn-secondary { background: var(--secondary); color: var(--primary); }
            .btn-success { background: var(--success); color: white; }
            .btn-info { background: var(--info); color: white; }
            
            /* Loading */
            .loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Footer */
            .pedidos-footer {
                text-align: center;
                padding: 2rem;
                color: var(--text-light);
                border-top: 1px solid var(--border);
                margin-top: 2rem;
            }
            
            /* Modal */
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                cursor: pointer;
            }
            
            .modal-content {
                background: white;
                padding: 2rem;
                border-radius: 0.5rem;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 1001;
                position: relative;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #666;
            }
            
            /* No orders message */
            .no-orders {
                background: #f9f9f9;
                padding: 3rem;
                border-radius: 0.5rem;
                text-align: center;
                margin-top: 2rem;
            }
            
            .no-orders h3 {
                margin-bottom: 1rem;
                color: var(--text-primary);
            }
            
            .no-orders p {
                margin-bottom: 1rem;
                color: var(--text-secondary);
            }
            
            @media (max-width: 768px) {
                .pedidos-controls {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .filter-controls {
                    flex-direction: column;
                }
                
                .filter-select, .search-input {
                    width: 100%;
                }
                
                .date-filter {
                    width: 100%;
                    justify-content: center;
                }
            }
        </style>
    `;
}

    getFooterContent() {
        return `
            <footer>
                <div class="footer-content">
                    <!-- Sobre -->
                    <section class="footer-section">
                        <h3>Padaria Jardim</h3>
                        <p>Sabor artesanal que nasce do cuidado e da tradição.</p>
                    </section>

                    <!-- Contato -->
                    <section class="footer-section">
                        <h3>Contato</h3>
                        <p>📍 Av. Joaquim Caroca, 266 - Universitário<br>Campina Grande - PB</p>
                        <p>📞 (83) 99920-4618</p>
                    </section>

                    <!-- Horário -->
                    <section class="footer-section">
                        <h3>Horário</h3>
                        <p>Terça a domingo</p>
                        <p>07h - 19h</p>
                    </section>

                    <!-- Formas de Pagamento -->
                    <section class="footer-section">
                        <h3>Formas de Pagamento</h3>
                        <div class="footer-payment-icons">
                            <img src="img/payment/cardVisa.png" alt="Visa">
                            <img src="img/payment/cardMastercard.png" alt="MasterCard">
                            <img src="img/payment/cardElo.png" alt="Elo">
                            <img src="img/payment/pix.png" alt="Pix">
                            <img src="img/payment/cash.png" alt="Dinheiro">
                        </div>
                    </section>

                    <!-- Siga-nos -->
                    <section class="footer-section">
                        <h3>Siga-nos</h3>
                        <div class="footer-social-icons">
                            <a href="https://www.instagram.com/jardimpadariacg/">
                                <img src="img/logos/instagram.png" alt="Instagram">
                            </a>
                            <a href="https://api.whatsapp.com/send/?phone=558399204618&text&type=phone_number&app_absent=0">
                                <img src="img/logos/whatsapp.png" alt="WhatsApp">
                            </a>
                        </div>
                    </section>
                </div>

                <div class="footer-bottom">
                    <p>© 2025 Padaria Jardim — Feito com amor e fermentação natural.</p>
                </div>
            </footer>
        `;
    }
}

// Inicializa o carregador de páginas
new PagesLoader();