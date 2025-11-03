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
        name: "Ciabatta Grãos & Cereais", 
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
    { 
        id: 14, 
        name: "Brioche Tradicional", 
        price: 20.00, 
        description: "Brioche clássico francês, rico em manteiga e ovos. Massa leve e aerada, ideal para o café da manhã.", 
        ingredients: "Farinha de trigo, manteiga francesa, ovos caipiras, açúcar, fermento biológico, leite, sal",
        category: "Doces", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },

    // ============================================
    // PRONTA-ENTREGA (Acompanhamentos)
    // ============================================
    
    { 
        id: 15, 
        name: "Muffins Duplo chocolate", 
        price: 10.00, 
        description: "Muffin úmido com gotas de chocolate e cobertura de ganache de chocolate. Dupla dose de sabor.", 
        ingredients: "Farinha de trigo, cacau em pó, gotas de chocolate, ovos, açúcar, leite, óleo vegetal, fermento químico",
        category: "Pronta-Entrega", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    },
    { 
        id: 16, 
        name: "Muffins Damasco", 
        price: 10.00, 
        description: "Muffin com pedaços de damasco e um toque de especiarias. Sabor agridoce e textura macia.", 
        ingredients: "Farinha de trigo, damasco seco, especiarias, ovos, açúcar, leite, óleo vegetal, fermento químico",
        category: "Pronta-Entrega", 
        day: ["quarta", "quinta", "sexta", "sabado"] 
    }
];
