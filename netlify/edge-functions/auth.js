export default async (request, context) => {
  const authHeader = request.headers.get("authorization");

  // Usuário e senha desejados (Você pode alterar aqui)
  const USER = "admin";
  const PASS = "admin123"; // Altere para sua senha preferida

  if (!authHeader) {
    return new Response("Acesso restrito", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Acesso Admin"',
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
      "WWW-Authenticate": 'Basic realm="Acesso Admin"',
    },
  });
};

export const config = {
  path: "/admin/*",
};
