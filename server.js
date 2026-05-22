const { serve, file } = Bun;

serve({
  port: parseInt(process.env.PORT) || 3000,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;
    if (pathname === '/') pathname = '/token-generator.html';

    return new Response(file(`./public${pathname}`));
  },
});
