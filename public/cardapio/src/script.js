const dias = ["quarta", "quinta", "sexta", "sabado"];
let diaAtualIndex = -1;

// Função para mostrar o cardápio do dia
function mostrarDia(index) {
  document.querySelectorAll(".dia").forEach(div => div.style.display = "none");

  const titulo = document.getElementById("titulo-dia");
  const mensagem = document.getElementById("mensagem");

  if (index >= 0 && index < dias.length) {
    const dia = dias[index];
    document.getElementById(dia).style.display = "block";
    titulo.textContent = `Cardápio de ${capitalize(dia)}`;
    mensagem.textContent = "Clique à direita para avançar, à esquerda para voltar 🌿";
  } else {
    // Mostra o banner "sem fornadas"
    document.getElementById("sem-fornadas").style.display = "block";
    titulo.textContent = "Sem Fornadas Hoje";
    mensagem.textContent = "Clique à direita para avançar, à esquerda para voltar 🌿";
  }
}

function capitalize(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}


const hoje = new Date().getDay(); 
switch (hoje) {
  case 3: diaAtualIndex = 0; break; // quarta
  case 4: diaAtualIndex = 1; break; // quinta
  case 5: diaAtualIndex = 2; break; // sexta
  case 6: diaAtualIndex = 3; break; // sábado
  default: diaAtualIndex = -1; // domingo a terça
}

// Mostrar cardápio inicial
mostrarDia(diaAtualIndex);

// Navegação por clique no corpo da página
document.body.addEventListener("click", (e) => {
  const metade = window.innerWidth / 2;

  if (e.clientX > metade) {
    diaAtualIndex = (diaAtualIndex + 1) % (dias.length + 1); 
  } else {
    diaAtualIndex = (diaAtualIndex - 1 + (dias.length + 1)) % (dias.length + 1);
  }

  // Ajuste para quando estiver em "sem fornadas"
  if (diaAtualIndex === dias.length) diaAtualIndex = -1;

  mostrarDia(diaAtualIndex);
});

// Navegação por teclado (setas esquerda/direita)
document.body.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    diaAtualIndex = (diaAtualIndex + 1) % (dias.length + 1);
    if (diaAtualIndex === dias.length) diaAtualIndex = -1;
    mostrarDia(diaAtualIndex);
  } else if (e.key === "ArrowLeft") {
    diaAtualIndex = (diaAtualIndex - 1 + (dias.length + 1)) % (dias.length + 1);
    if (diaAtualIndex === dias.length) diaAtualIndex = -1;
    mostrarDia(diaAtualIndex);
  }
});
