const menuData = [
    // ============================================
    // PÃES ESPECIAIS
    // ============================================
    
    // Pães - Quarta/Sexta
    { 
        id: 1, 
        name: "Baguete", 
        price: 13.00, 
        description: "Clássica baguete francesa, crocante por fora e macia por dentro. Perfeita para acompanhar queijos e vinhos.", 
        ingredients: "Farinha de trigo especial, água mineral, fermento natural, sal marinho, farinha de centeio (para fermentação)",
        category: "Pães", 
        day: ["quarta", "sexta"] 
    },
    { 
        id: 2, 
        name: "Pão Italiano", 
        price: 19.00, 
        description: "Pão de fermentação natural com casca rústica dourada e miolo aerado. Sabor marcante e textura única.", 
        ingredients: "Farinha italiana tipo 00, água filtrada, fermento natural, azeite extra virgem, sal rosa do Himalaia, malte diastático",
        category: "Pães", 
        day: ["quarta", "sexta"] 
    },
    { 
        id: 3, 
        name: "Pão de Gorgonzola & Nozes", 
        price: 21.00, 
        description: "Combinação intensa de gorgonzola cremoso e nozes caramelizadas. Perfeito para acompanhar vinhos tintos.", 
        ingredients: "Farinha de trigo orgânica, queijo gorgonzola DOP, nozes pecã, fermento natural, água, sal marinho, mel silvestre",
        category: "Pães", 
        day: ["quarta", "sexta"] 
    },
    
    // Pães - Quinta/Sábado
    { 
        id: 4, 
        name: "Pão Integral", 
        price: 22.00, 
        description: "Pão 100% integral, rico em fibras e sabor. Textura densa e nutritiva, ideal para uma alimentação saudável.", 
        ingredients: "Farinha integral orgânica, grãos de linhaça, sementes de girassol, aveia em flocos, fermento natural, água, sal, melado de cana",
        category: "Pães", 
        day: ["quinta", "sabado"] 
    },

    // ============================================
    // CIABATTAS
    // ============================================
    
    // Ciabattas - Todos os dias
    { 
        id: 5, 
        name: "Ciabatta Clássica", 
        price: 8.00, 
        description: "Ciabatta leve e crocante, com alveolos grandes e textura única. Ideal para sanduíches gourmet.", 
        ingredients: "Farinha de trigo especial, água, fermento natural, azeite extra virgem, sal marinho, fermento biológico seco",
        category: "Ciabattas", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 6, 
        name: "Ciabatta Grãos e Cereais", 
        price: 8.00, 
        description: "Ciabatta com mix de grãos e cereais, nutritiva e saborosa. Perfeita para um café da manhã saudável.", 
        ingredients: "Farinha integral, grãos de linhaça, sementes de chia, gergelim, aveia, quinoa, fermento natural, água, sal, azeite",
        category: "Ciabattas", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 7, 
        name: "Ciabatta Parmesão & Orégano", 
        price: 8.00, 
        description: "Ciabatta com um toque especial de parmesão reggiano e orégano fresco. Aromática e saborosa.", 
        ingredients: "Farinha de trigo, queijo parmesão reggiano, orégano fresco, fermento natural, água, azeite, sal, alho desidratado",
        category: "Ciabattas", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },

    // ============================================
    // FOCACCIAS
    // ============================================
    
    // Focaccias - Todos os dias
    { 
        id: 8, 
        name: "Focaccia Mediterrânea", 
        price: 24.00, 
        description: "Focaccia artesanal com azeite de oliva, alecrim fresco e tomates secos. Sabores do Mediterrâneo em cada pedaço.", 
        ingredients: "Farinha de trigo especial, azeite extra virgem, tomates secos, alecrim fresco, sal grosso, fermento natural, água, alho",
        category: "Focaccias", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 9, 
        name: "Focaccia 4 Queijos", 
        price: 28.00, 
        description: "Focaccia coberta com uma deliciosa mistura de quatro queijos selecionados. Cremosa e irresistível.", 
        ingredients: "Farinha de trigo, mussarela de búfala, queijo gorgonzola, parmesão reggiano, provolone, azeite, fermento natural, água, sal",
        category: "Focaccias", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 10, 
        name: "Focaccia Defumada", 
        price: 29.00, 
        description: "Focaccia com bacon defumado artesanal e cebola caramelizada. Sabor marcante e defumado intenso.", 
        ingredients: "Farinha de trigo, bacon defumado artesanal, cebola roxa, azeite, sal marinho, pimenta preta, fermento natural, mel mascavo",
        category: "Focaccias", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },

    // ============================================
    // DOCES
    // ============================================
    
    // Doces - Todos os dias
    { 
        id: 11, 
        name: "Pão doce de Coco", 
        price: 22.00, 
        description: "Pão doce macio e fofinho recheado com coco cremoso e leite condensado. Doce tradicional com toque especial.", 
        ingredients: "Farinha de trigo, coco ralado fresco, leite condensado orgânico, ovos caipiras, manteiga, açúcar mascavo, fermento biológico, leite integral",
        category: "Doces", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 12, 
        name: "Cinnamon Roll", 
        price: 22.00, 
        description: "Enrolado de canela com massa macia e recheio generoso, coberto com glacê de cream cheese. Clássico norte-americano perfeito.", 
        ingredients: "Farinha de trigo, canela em pó, açúcar mascavo, manteiga, cream cheese, açúcar de confeiteiro, fermento biológico, ovos, noz-moscada",
        category: "Doces", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 13, 
        name: "Sonho Recheado", 
        price: 10.00, 
        description: "Sonho frito e macio, recheado com creme de baunilha ou doce de leite. Crocante por fora, cremoso por dentro.", 
        ingredients: "Farinha de trigo, ovos caipiras, leite integral, açúcar, creme de baunilha (ou doce de leite artesanal), fermento biológico, canela em pó",
        category: "Doces", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },

    // ============================================
    // BOLOS (Adicionais para categorização)
    // ============================================
    
    { 
        id: 14, 
        name: "Bolo Iubilate", 
        price: 200.00, 
        description: "Bolo premium com camadas de massa amanteigada e recheios especiais. Decorado artisticamente para ocasiões especiais.", 
        ingredients: "Farinha de trigo premium, manteiga francesa, ovos orgânicos, açúcar cristal, chocolate belga 70%, frutas vermelhas, cream cheese, baunilha do Madagascar",
        category: "Bolos", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 15, 
        name: "Dolce Cantabona", 
        price: 120.00, 
        description: "Bolo italiano com textura úmida e sabor intenso de avelã e chocolate. Sofisticação em cada fatia.", 
        ingredients: "Farinha de amêndoas, avelãs torradas, chocolate italiano, manteiga, ovos, açúcar mascavo, essência de baunilha, fermento químico",
        category: "Bolos", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 16, 
        name: "Bolo Magnificat", 
        price: 85.00, 
        description: "Bolo clássico com toque especial de especiarias. Perfeito para o café da tarde com amigos.", 
        ingredients: "Farinha de trigo, canela, noz-moscada, cravo, manteiga, ovos, açúcar, fermento biológico, leite, essência de baunilha",
        category: "Bolos", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },

    // ============================================
    // MINI BOLOS
    // ============================================
    
    { 
        id: 17, 
        name: "Mini Torta Caprese", 
        price: 25.00, 
        description: "Versão individual da clássica torta caprese. Chocolate intenso e textura derretente.", 
        ingredients: "Chocolate amargo 70%, amêndoas, manteiga, ovos, açúcar, farinha de amêndoas, essência de amêndoas, açúcar de confeiteiro",
        category: "Mini Bolos", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 18, 
        name: "Mini Dolce Cantabona", 
        price: 20.00, 
        description: "Pequena versão do Dolce Cantabona, perfeita para uma indulgência individual.", 
        ingredients: "Farinha de amêndoas, avelãs, chocolate, manteiga, ovos, açúcar, essência de baunilha, fermento químico",
        category: "Mini Bolos", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },

    // ============================================
    // CHOCOLATES
    // ============================================
    
    { 
        id: 19, 
        name: "Barra de Chocolate Artesanal", 
        price: 45.00, 
        description: "Chocolate artesanal com 70% cacau, produzido com técnicas tradicionais. Intenso e sofisticado.", 
        ingredients: "Cacau 70% orgânico, açúcar de coco, manteiga de cacau, baunilha em fava, sal rosa do Himalaia",
        category: "Chocolate", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 20, 
        name: "Bombons Recheados", 
        price: 100.00, 
        description: "Caixa com seleção de bombons recheados: ganache, praliné e frutas. Presente perfeito para amantes de chocolate.", 
        ingredients: "Chocolate belga 55%, chocolate ao leite, chocolate branco, creme de avelã, frutas cristalizadas, licor de laranja, essência de baunilha",
        category: "Chocolate", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 21, 
        name: "Brownie Premium", 
        price: 85.00, 
        description: "Brownie com textura densa e úmida, repleto de nozes e gotas de chocolate. Indulgência máxima.", 
        ingredients: "Chocolate amargo 70%, manteiga, ovos caipiras, açúcar mascavo, nozes, farinha de trigo, essência de baunilha, sal marinho",
        category: "Chocolate", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },

    // ============================================
    // PRODUTOS ADICIONAIS
    // ============================================
    
    { 
        id: 22, 
        name: "Pão Francês Artesanal", 
        price: 35.00, 
        description: "Nosso pão francês artesanal com fermentação lenta. Casca crocante e miolo macio e alveolado.", 
        ingredients: "Farinha de trigo especial, água, fermento natural, sal marinho, maltose, farinha de centeio (para fermentação)",
        category: "Pães", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 23, 
        name: "Pão de Queijo Artesanal", 
        price: 40.00, 
        description: "Pão de queijo mineiro autêntico, com polvilho azedo e queijo minas curado. Crocante por fora, macio por dentro.", 
        ingredients: "Polvilho azedo, queijo minas curado, ovos caipiras, leite integral, óleo, sal, queijo parmesão",
        category: "Pães", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 24, 
        name: "Croissant de Chocolate", 
        price: 15.00, 
        description: "Croissant folhado com recheio generoso de chocolate belga. Perfeito para o café da manhã.", 
        ingredients: "Farinha de trigo, manteiga francesa, chocolate belga, ovos, leite, açúcar, fermento biológico, sal",
        category: "Doces", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 25, 
        name: "Pão de Mel com Damasco", 
        price: 25.00, 
        description: "Pão de mel úmido e especiado com pedaços de damasco e cobertura de chocolate amargo.", 
        ingredients: "Farinha de trigo integral, mel silvestre, damascos secos, especiarias (canela, cravo, noz-moscada), chocolate amargo, fermento químico, ovos",
        category: "Doces", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    }
];