window.PRESETS = window.PRESETS || {};
// Spanish version of the Quotax preset. Served at /es/inicio (see i18n.js and config.js).
window.PRESETS.quotecraft_es = {
  name: "Quotax",
  appUrl: "/es",
  tagline: "Cotizaciones que ganan.",
  headline: "Envíe una cotización con precios, lista para el cliente, en 2 minutos y ya probada con compradores de IA.",
  subhead:
    "Arme una cotización detallada con descuentos e impuestos, o describa el trabajo y deje que la IA la redacte. Luego, la Sala de Negociación la envía a seis agentes compradores de IA. Le dicen quién firma, quién pone objeciones y por qué, y qué precio le deja más ingresos.",
  accent: "#22c55e",
  customer: "Agencias, consultores, proveedores de TI, empresas de eventos, servicios para el hogar y contratistas: cualquiera que envíe más de 10 cotizaciones al mes.",
  whyNow:
    "Hoy los agentes de IA pueden simular compradores realistas en segundos. Eso hace que probar un precio antes de enviarlo sea lo bastante barato para hacerlo en cada cotización, no solo en un estudio de precios anual.",
  features: [
    { title: "Detallada en minutos", body: "Plantillas por industria, redacción con IA a partir de una línea de descripción y totales en vivo con descuento e impuestos." },
    { title: "Sala de Negociación: panel de compradores IA", body: "Seis agentes compradores (dueño, director financiero, fundador, empresa grande, cliente recurrente, escéptico) revisan la cotización en paralelo y dicen su precio máximo real." },
    { title: "Optimizador de precios", body: "Prueba 29 precios contra el panel y recomienda el que más ingresos deja por trato. Se aplica con un clic." },
    { title: "Propuesta lista para el cliente", body: "Una propuesta limpia, con su marca y línea de aceptación, lista para imprimir o guardar como PDF. Cargos únicos y mensuales con totales separados." },
  ],
  stats: [
    { value: "6", label: "agentes compradores de IA por cotización" },
    { value: "29", label: "precios probados" },
    { value: "2 min", label: "del trabajo a la propuesta" },
  ],
  testimonials: [],
  pricing: [
    { plan: "Solo", price: "US$29/mes", items: ["Cotizaciones ilimitadas", "Redacción con IA", "Propuestas en PDF"] },
    { plan: "Equipo", price: "US$99/mes", items: ["5 usuarios", "Panel de compradores IA", "Optimizador de precios"], highlight: true },
    { plan: "Empresa", price: "US$299/mes", items: ["Usuarios ilimitados", "Perfiles de compradores a medida", "Exportación a CRM"] },
  ],
  demo: {
    title: "Pruébelo: describa un trabajo y reciba una cotización",
    placeholder: "Catering para una cena de empresa de 120 personas, 3 tiempos, barra libre, 10 meseros...",
    button: "Redactar mi cotización",
    fallbackResult: [
      "COTIZACIÓN · Golden Fork Events → Lumen Labs",
      "Cena de 3 tiempos         120 × $68     $8,160",
      "Barra libre, 3 h          120 × $32     $3,840",
      "Personal del evento        10 × $280    $2,800",
      "Decoración y alquileres     1 × $2,600  $2,600",
      "Subtotal $17,400 · Impuesto 8.5% $1,479 · TOTAL $18,879",
      "",
      "Sala de Negociación: 4 de 6 compradores aceptan. Mejor precio $18,400 (+$1,100 esperados por trato).",
      "→ Abra la app completa para editar, probar con compradores IA y exportar un PDF.",
    ].join("\n"),
    systemPrompt:
      "Eres Quotax. Responde SIEMPRE en español. A partir de la descripción de un trabajo, genera una cotización compacta y detallada en texto plano: una línea de encabezado 'COTIZACIÓN · <vendedor> → <cliente>', 3 a 6 partidas alineadas como 'descripción  cant × $unitario  $importe' a precios de mercado realistas, luego 'Subtotal · Impuesto 8.5% · TOTAL' con la aritmética correcta. Termina con: '→ Abra la app completa para probar esta cotización con 6 agentes compradores de IA y encontrar el mejor precio.' Menos de 120 palabras.",
  },
  cta: { primary: "Firmar carta de intención", secondary: "Suscribirse" },
  loiTerms:
    "Tenemos la intención de suscribirnos a {product} en el plan {plan} durante al menos 12 meses una vez disponible, sujeto a una prueba exitosa de 14 días. Esta carta no es vinculante.",
  stripeLink: "",
  team: [
    { name: "Orri Bogdan", role: "CEO y financiamiento. Cofundó ALL Labs (levantó US$5M, más de 1,000 tiendas, vendida en 2024)." },
    { name: "Joseph Weinerman", role: "Ventas. Cofundador y CTO de Founders Game; ingeniero fundador en ALL Labs." },
    { name: "Imaan Soltanalipour", role: "Producto e ingeniería. Desarrolló software de IA en tiempo real en UCLA; ex-Amgen, NASA NCAS." },
  ],
};
