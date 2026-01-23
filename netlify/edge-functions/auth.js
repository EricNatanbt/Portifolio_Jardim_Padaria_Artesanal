export default async (request, context) => {
  const USER = Netlify.env.get("ADMIN_USER");
  const PASS = Netlify.env.get("ADMIN_PASS");

  if (!USER || !PASS) {
    return new Response("Erro de configuração do servidor", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return new Response("Acesso restrito", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin"',
      },
    });
  }

  const authValue = authHeader.split(" ")[1];
  const [user, pass] = atob(authValue).split(":");

  if (user === USER && pass === PASS) {
    return context.next();
  }

  return new Response("Credenciais inválidas", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
};

export const config = {
  path: "/admin/*",
};
