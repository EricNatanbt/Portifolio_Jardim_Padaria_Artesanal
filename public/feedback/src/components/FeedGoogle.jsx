export default function FeedGoogle() {
  return (
    <div className="coluna">

      <h3 className="col-title">Google Reviews</h3>

      <div className="col-scroll">

        <div className="card">
          <div className="card-top">
            <span className="emoji">😄</span>
            <div>
              <div className="nome">Ketlen Mendes</div>
            </div>
          </div>

          <div className="estrelas">★★★★</div>
          <p className="texto">Produtos de ótima qualidade! Fiz pedido de uma ciabatta e Focaccia, todos os dois são incríveis, sabor maravilhoso eu AMEI, atendimento impecável e apresentação do produto também. Vale muito a pena experimentar essas delícias!</p>
        </div>

        <div className="card">
          <div className="card-top">
            <span className="emoji">😁</span>
            <div>
              <div className="nome">Mariana Santos</div>
            </div>
          </div>

          <div className="estrelas">★★★★★</div>
          <p className="texto">Tudo muito bem embalado, os itens são deliciosos. Não tenho muitos registros, mas estava muito bom! A foto abaixo é da ciabatta de parmesão e orégano(comprei também a clássica); coloquei queijo e esquentei na sanduicheira, o pão bem macio.
Comprei um muffin de banana e doce de leite. Nossa, uma delícia!
Sem falar do pastel de nata, estava com gostinho de infância.
Aguardando, ansiosa, pela próxima fornada para Recife 💚💚</p>
        </div>

      </div>

      <h3 className="col-footer">Google</h3>

    </div>
  );
}
