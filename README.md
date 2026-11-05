# NISHLAM Project

Site da NISHLAM Project, serigrafia de camisetas e acessórios. Mostra o catálogo das peças e tem um simulador onde o cliente envia a própria arte e vê como ela fica estampada, na frente ou nas costas, em cada cor de camiseta.

Site em produção: https://nishlamproject.com.br

## Stack

- **HTML, CSS e JavaScript** puros, sem framework e sem etapa de build
- **Canvas** para o simulador de estampa
- Deploy na **Vercel**

## Estrutura

```
index.html, home.js       página inicial: catálogo, ondas do topo e leque de cores
produto.html, produto.js  página de cada peça com o simulador
products.js               peças, cores e a renderização da estampa no tecido
styles.css                estilos
assets/                   fotos das peças e identidade da marca
```

## Rodando localmente

É só servir a pasta:

```bash
python -m http.server 5500
```

e abrir http://localhost:5500.

Feito por [Nicolas Caraffa](https://caraffa-portfolio.vercel.app).
