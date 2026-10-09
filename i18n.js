// Spanish site version. Served at /es (quote builder) and /es/inicio (landing page); ?lang=es also works.
// English pages load this too, only to get the "Español" switch in the nav.
// The page code stays in English: this file translates template data at the source (QX.tpl),
// then translates rendered text, placeholders, aria-labels and titles as the page draws them.
(function () {
  let lang = "en";
  try { if (new URLSearchParams(location.search).get("lang") === "es") lang = "es"; } catch (_) {}
  if (/^\/es(\/|$)/.test(location.pathname)) lang = "es";
  const es = lang === "es";
  const isHome = /home\.html$|^\/es\/inicio\/?$/.test(location.pathname);

  // ---------- Template data (line items, checklist names + Spanish match keywords, stages, intros) ----------
  const ITEMS = {
    "Your Company": "Su empresa", "The Patel Residence": "Residencia Patel",
    "Discovery & strategy workshop": "Taller de descubrimiento y estrategia", "UX/UI design (hours)": "Diseño UX/UI (horas)",
    "Development (hours)": "Desarrollo (horas)", "Booking system integration": "Integración del sistema de reservas",
    "Monthly support & hosting retainer": "Iguala mensual de soporte y hosting",
    "Onboarding & setup": "Incorporación y configuración", "User licenses (per seat / yr)": "Licencias de usuario (por puesto / año)",
    "Data migration": "Migración de datos", "Premium support (per month)": "Soporte premium (por mes)",
    "Dinner, 3 courses": "Cena de 3 tiempos", "Open bar, 3 hours": "Barra libre, 3 horas",
    "Event staff (per person)": "Personal del evento (por persona)", "Venue styling & rentals": "Decoración del lugar y alquileres",
    "Strip-out & disposal": "Desmontaje y retiro de escombros", "Demolition": "Demolición",
    "Metal stud framing (lf)": "Estructura de perfiles metálicos (pie lineal)", "Framing & drywall": "Estructura y tablaroca",
    "Drywall hang & finish (sf)": "Instalación y acabado de tablaroca (pie²)", "Carpet tile (sy)": "Loseta de alfombra (yarda²)",
    "Finishes": "Acabados", "Paint, 2 coats (sf)": "Pintura, 2 manos (pie²)",
    "Doors, frames & hardware (ea)": "Puertas, marcos y herrajes (c/u)", "Doors & hardware": "Puertas y herrajes",
    "Supervision (weeks)": "Supervisión (semanas)", "General conditions": "Condiciones generales",
    "Discovery & brand strategy workshop": "Taller de descubrimiento y estrategia de marca",
    "Visual identity system (logo, type, color)": "Sistema de identidad visual (logotipo, tipografía, color)",
    "Website design, up to 8 pages": "Diseño de sitio web, hasta 8 páginas",
    "Launch content & photo art direction": "Contenido de lanzamiento y dirección de arte fotográfica",
    "Project management": "Gestión del proyecto", "Monthly brand & site retainer": "Iguala mensual de marca y sitio web",
    "Brand refresh and launch website. Fixed scope, three review rounds, delivered in 8 weeks.": "Renovación de marca y sitio web de lanzamiento. Alcance fijo, tres rondas de revisión, entrega en 8 semanas.",
    "On signature": "A la firma", "On launch": "Al lanzamiento", "Deposit": "Anticipo", "On installation": "A la instalación",
    "On grid connection": "A la conexión a la red", "On completion": "Al terminar",
    "Dedicated fibre access": "Acceso dedicado de fibra", "Managed network": "Red administrada", "Cloud connect": "Conexión a la nube",
    "Data centre cross-connect": "Interconexión en centro de datos", "Installation": "Instalación", "Activation": "Activación",
    "Office cleaning visit": "Visita de limpieza de oficina", "Deep clean (quarterly)": "Limpieza profunda (trimestral)",
    "Window washing": "Lavado de ventanas", "Supplies & consumables": "Insumos y consumibles",
    "6.6 kW solar system (16 × 410 W panels)": "Sistema solar de 6.6 kW (16 paneles × 410 W)", "5 kW hybrid inverter": "Inversor híbrido de 5 kW",
    "Racking & roof fixings": "Estructura de montaje y fijaciones de techo", "Installation labour (hours)": "Mano de obra de instalación (horas)",
    "Grid connection & compliance certificate": "Conexión a la red y certificado de cumplimiento",
    "Pavers, 12×12 concrete (sq ft)": "Adoquines de concreto 12×12 (pie²)", "Base gravel & sand (tons)": "Grava y arena de base (toneladas)",
    "Retaining wall block (linear ft)": "Bloque para muro de contención (pie lineal)", "Sod (sq ft)": "Pasto en rollo (pie²)",
    "Labor (crew hours)": "Mano de obra (horas de cuadrilla)", "Skid-steer rental (day)": "Renta de minicargador (día)",
    "Switchboard upgrade (incl. RCBOs)": "Actualización de tablero eléctrico (incl. RCBO)",
    "Power points, double (supply + install)": "Tomacorrientes dobles (suministro e instalación)",
    "LED downlights (supply + install)": "Luminarias LED empotradas (suministro e instalación)", "Cabling & conduit (m)": "Cableado y tubería (m)",
    "Labour (hours)": "Mano de obra (horas)", "Labor (hours)": "Mano de obra (horas)",
    "Materials: framing & drywall": "Materiales: estructura y tablaroca", "Electrical subcontract": "Subcontrato eléctrico",
    "Permits & inspection": "Permisos e inspección", "Waste removal": "Retiro de residuos",
    "Tuition, per term": "Colegiatura, por periodo", "Lunch programme, per term": "Programa de almuerzo, por periodo",
    "Transport, per term": "Transporte, por periodo", "Activity & materials fee, per term": "Cuota de actividades y materiales, por periodo",
    "Start of term": "Inicio del periodo", "Mid-term": "Mitad del periodo", "Paybill 400200, Account: student name": "Paybill 400200, Cuenta: nombre del estudiante",
  };
  // Checklist: [Spanish name, Spanish keywords that count the item as already covered]
  const CHECKS = {
    "Service charge / gratuity": ["Cargo por servicio / propina", "cargo por servicio|propina"],
    "Rentals: linens, glassware": ["Alquileres: mantelería, cristalería", "mantel|cristal|alquiler"],
    "Delivery & setup": ["Entrega y montaje", "entrega|montaje"],
    "Late-night / overtime staff": ["Personal nocturno / horas extra", "nocturno|horas extra"],
    "Dumpsters / debris haul": ["Contenedores / retiro de escombros", "contenedor|escombro"],
    "Permits & inspections": ["Permisos e inspecciones", "permiso|inspecci"],
    "After-hours work premium": ["Recargo por trabajo fuera de horario", "fuera de horario|nocturno|noche"],
    "Contingency (5%)": ["Contingencia (5%)", "contingencia|imprevisto"],
    "Final clean": ["Limpieza final", "limpieza"],
    "Scaffolding / edge protection": ["Andamios / protección perimetral", "andamio|protección perimetral|seguridad"],
    "Electrical certificate of compliance": ["Certificado eléctrico de cumplimiento", "certificado|cumplimiento"],
    "Monitoring / app setup": ["Monitoreo / configuración de app", "monitoreo|app"],
    "Travel": ["Traslado", "traslado|viaje"],
    "Disposal / haul-off (load)": ["Retiro / acarreo de desechos (carga)", "acarreo|desecho|retiro de"],
    "Extra pavers waste allowance 10% (sq ft)": ["Adoquines extra por merma 10% (pie²)", "merma|adoquines extra|excedente"],
    "Extra skid-steer day (contingency)": ["Día extra de minicargador (contingencia)", "día extra|contingencia"],
    "Delivery / freight": ["Entrega / flete", "entrega|flete|transporte"],
    "Edging / restraint (linear ft)": ["Bordillo / contención de borde (pie lineal)", "bordillo|contención de borde"],
    "Permits / utility locate": ["Permisos / localización de servicios", "permiso|localización|811"],
    "Certificate of Electrical Safety / compliance": ["Certificado de seguridad eléctrica / cumplimiento", "certificado|cumplimiento|permiso"],
    "Travel / call-out": ["Traslado / visita", "traslado|visita|viaje"],
    "Small resi items (clips, junction boxes, glands)": ["Material menor (grapas, cajas de conexión, prensaestopas)", "material menor|grapas|cajas de conexión|consumible"],
    "Test & tag / commissioning": ["Pruebas y etiquetado / puesta en marcha", "prueba|puesta en marcha"],
    "Waste removal": ["Retiro de residuos", "residuo|desecho|escombro"],
    "Patching / make-good": ["Resanes / reparaciones finales", "resane|reparaci"],
  };
  const it = (s) => ITEMS[s] || s;
  function tpl(T) {
    if (!es) return T;
    Object.values(T).forEach((t) => {
      t.seller = it(t.seller); t.client = it(t.client); if (t.payDetails) t.payDetails = it(t.payDetails);
      t.items.forEach((row) => { row[0] = it(row[0]); if (row[3] && row[3].section) row[3].section = it(row[3].section); });
      (t.catalog || []).forEach((c) => { c[0] = it(c[0]); });
      (t.stages || []).forEach((s) => { s[1] = it(s[1]); });
      (t.checklist || []).forEach((c) => { const x = CHECKS[c[0]]; if (x) { c[0] = x[0]; c[3] = x[1]; } });
      if (t.brand && t.brand.intro) t.brand.intro = it(t.brand.intro);
    });
    return T;
  }

  // ---------- UI strings: exact matches ----------
  const D = Object.assign({}, ITEMS, {
    "About": "Acerca de", "Pricing": "Precios", "Sign LOI": "Firmar carta de intención",
    "Quotax · Quote builder": "Quotax · Generador de cotizaciones",
    "1 · Build the quote": "1 · Arme la cotización",
    "Start from a template, or describe the job and let AI draft the line items.": "Empiece con una plantilla, o describa el trabajo y deje que la IA redacte las partidas.",
    "Blank quote": "Cotización en blanco", "Agency / consulting": "Agencia / consultoría", "IT / software": "TI / software",
    "Events / catering": "Eventos / catering", "Interiors / fit-out": "Interiores / acondicionamiento",
    "Creative studio / proposal": "Estudio creativo / propuesta", "Telecom / enterprise (SG)": "Telecom / empresas (SG)",
    "Cleaning / home services": "Limpieza / servicios del hogar", "Roofing / solar (NZ)": "Techos / solar (NZ)",
    "Landscape / hardscape": "Paisajismo / obra exterior", "Electrical (AU)": "Eléctrico (AU)", "Education / school fees (KES)": "Educación / colegiaturas (KES)", "Trades / contractor": "Oficios / contratista",
    "Describe the job (optional)": "Describa el trabajo (opcional)", "✨ AI draft": "✨ Borrador con IA", "Drafting…": "Redactando…",
    "Your company": "Su empresa", "Client": "Cliente", "Guests (catering)": "Invitados (catering)",
    "Logo (optional)": "Logotipo (opcional)", "Brand color": "Color de marca", "Font": "Tipografía",
    "Clean sans": "Sans limpia", "Classic serif": "Serif clásica", "Modern": "Moderna",
    "Proposal intro (optional)": "Introducción de la propuesta (opcional)",
    "Your logo, color and font appear on the customer's proposal and share link. No logo? We use your initials.": "Su logotipo, color y tipografía aparecen en la propuesta del cliente y en el enlace compartido. ¿Sin logotipo? Usamos sus iniciales.",
    "Logo added. It appears on the proposal and the share link.": "Logotipo agregado. Aparece en la propuesta y en el enlace compartido.",
    "That file isn't an image we can read. Try a PNG or JPG.": "No podemos leer ese archivo como imagen. Pruebe con PNG o JPG.",
    "Show sections and cost + markup (internal only, hidden on the customer's quote)": "Mostrar secciones y costo + margen de ganancia (solo interno, oculto en la cotización del cliente)",
    "Mark each line One-time or Monthly (separate totals, never one blended number)": "Marcar cada partida como Pago único o Mensual (totales separados, nunca un solo número mezclado)",
    "Section": "Sección", "Item": "Concepto", "Billing": "Facturación", "Cost": "Costo", "Markup %": "Margen %", "Qty": "Cant.",
    "× Guests": "× Invitados", "Unit price": "Precio unitario", "Amount": "Importe", "One-time": "Pago único", "Monthly": "Mensual",
    "Choose product": "Elija un producto", "+ Add line item": "+ Agregar partida",
    "Discount %": "Descuento %", "Tax %": "Impuesto %", "Tax name": "Nombre del impuesto", "Currency": "Moneda", "Tax mode": "Modo de impuesto",
    "Tax added on top": "Impuesto adicional al precio", "Prices include tax (GST/VAT)": "Precios con impuesto incluido (IVA)",
    "Payment terms": "Condiciones de pago", "Payment method": "Forma de pago", "Payment details": "Datos de pago",
    "Due on receipt": "Pago al recibir", "Net 15": "Neto 15 días", "Net 30": "Neto 30 días", "Net 45": "Neto 45 días", "Net 60": "Neto 60 días", "Net 90": "Neto 90 días",
    "Card on file, monthly": "Tarjeta registrada, mensual", "Monthly, net 60": "Mensual, neto 60 días", "Quarterly upfront": "Trimestral por adelantado",
    "Termly": "Por periodo escolar", "Annual upfront": "Anual por adelantado",
    "Card": "Tarjeta", "Bank transfer": "Transferencia bancaria", "Paper check": "Cheque", "Direct debit": "Domiciliación bancaria", "Cash": "Efectivo", "Other": "Otro",
    "Deposit %": "Anticipo %", "Valid for (days)": "Vigencia (días)", "Contract term (months)": "Plazo del contrato (meses)", "Notes": "Notas",
    "Payment stages": "Etapas de pago", "None": "Ninguna", "+ Add stage": "+ Agregar etapa",
    "Discount": "Descuento", "Tax": "Impuesto", "VAT": "IVA", "GST/VAT": "IVA", "Tax:": "Impuesto:", "VAT:": "IVA:", "GST/VAT:": "IVA:",
    "One-time total": "Total de pago único", "Monthly recurring total (per month)": "Total mensual recurrente (por mes)",
    "Deposit due": "Anticipo a pagar", "Balance due": "Saldo pendiente", "Stage": "Etapa",
    "Margin floor % (this bid)": "Margen mínimo % (esta oferta)", "Enter costs to see your margin.": "Ingrese costos para ver su margen.",
    "⚠ Missed anything?": "⚠ ¿Olvidó algo?", "(internal check, never on the customer's quote)": "(revisión interna, nunca aparece en la cotización del cliente)",
    "Missing:": "Falta:", "+ Add line": "+ Agregar partida", "Not needed": "No hace falta",
    "🚩 THIN JOB": "🚩 MARGEN BAJO", "✓ Above floor": "✓ Sobre el mínimo", "Margin": "Margen",
    "📄 Generate quote": "📄 Generar cotización", "🎯 Test with AI buyers": "🎯 Probar con compradores IA", "Test with AI buyers": "Probar con compradores IA",
    "2 · Deal Room": "2 · Sala de Negociación",
    "Six AI buyer agents (owner, CFO, founder, enterprise, repeat client, skeptic) review your quote at the same time. Each names the most they'd really pay. The price optimizer then finds the price that earns the most.": "Seis agentes compradores de IA (dueño, director financiero, fundador, empresa grande, cliente recurrente, escéptico) revisan su cotización al mismo tiempo. Cada uno dice lo máximo que realmente pagaría. Luego el optimizador encuentra el precio que más ingresos deja.",
    "Run": "Use", "to see who signs, who pushes back, and the best price.": "para ver quién firma, quién pone objeciones y cuál es el mejor precio.",
    "6 buyers reviewing…": "6 compradores revisando…", "Sending the quote to Dana, Marcus, Priya, Tom, Lena and Raj…": "Enviando la cotización a Dana, Marcus, Priya, Tom, Lena y Raj…",
    "Optimal": "Óptimo", "expected revenue lift / deal": "aumento de ingreso esperado / trato", "Expected revenue at each price:": "Ingreso esperado en cada precio:",
    "yours": "el suyo", "best": "el mejor", "Apply best price": "Aplicar el mejor precio", "Would pay up to": "Pagaría hasta",
    "accept": "acepta", "negotiate": "negocia", "reject": "rechaza",
    "The buyer panel is busy. Try again in a moment.": "El panel de compradores está ocupado. Intente de nuevo en un momento.",
    "🖨️ Print / save PDF": "🖨️ Imprimir / guardar PDF", "🔗 Copy share link": "🔗 Copiar enlace para compartir", "Build your own quote": "Arme su propia cotización",
    "Share link (no login needed, opens this quote with the Accept section)": "Enlace para compartir (sin iniciar sesión; abre esta cotización con la sección para aceptarla)",
    "Link ready. Copy it and send it to your customer.": "Enlace listo. Cópielo y envíelo a su cliente.",
    "Copied to clipboard. Send it to your customer.": "Copiado al portapapeles. Envíelo a su cliente.",
    "Team": "Equipo", "· Quotax quote builder ·": "· Generador de cotizaciones Quotax ·", "Deals": "Tratos",
    "Proposal": "Propuesta", "Prepared for": "Preparada para", "Quote #": "Cotización n.º", "Date": "Fecha", "Valid until": "Válida hasta",
    "Guests": "Invitados", "Description": "Descripción", "Contract term": "Plazo del contrato", "Total contract value": "Valor total del contrato",
    "Per month": "Por mes", "Per quarter": "Por trimestre", "Per term": "Por periodo", "Per year": "Por año",
    "One-time charges": "Cargos únicos", "Monthly recurring charges": "Cargos mensuales recurrentes", "Unit price / mo": "Precio unitario / mes",
    "Monthly subtotal": "Subtotal mensual", "Monthly recurring total": "Total mensual recurrente", "/ month": "/ mes",
    "Payment schedule": "Calendario de pagos", "Payment terms:": "Condiciones de pago:", "Payment method:": "Forma de pago:", "Notes:": "Notas:",
    "Thank you for your business.": "Gracias por su preferencia.", "Status:": "Estado:", "PENDING ACCEPTANCE": "PENDIENTE DE ACEPTACIÓN", "ACCEPTED": "ACEPTADA",
    "Acceptance must be by an": "La aceptación debe hacerla un", "authorized signatory": "firmante autorizado",
    "To accept this quote, enter your name and the date, then click": "Para aceptar esta cotización, escriba su nombre y la fecha, y haga clic en",
    "To accept this quote, enter your name, title and the date, then click": "Para aceptar esta cotización, escriba su nombre, su cargo y la fecha, y haga clic en",
    "Accept quote": "Aceptar cotización", "✔ Accept quote": "✔ Aceptar cotización", "Customer name": "Nombre del cliente", "Title": "Cargo",
    "Prepared with Quotax · Team Quotax": "Preparada con Quotax · Equipo Quotax",
    "✅ ACCEPTED by": "✅ ACEPTADA por", "on": "el",
    "Enter the customer's name to accept.": "Escriba el nombre del cliente para aceptar.",
    "Enter the authorized signatory's title.": "Escriba el cargo del firmante autorizado.", "Pick the acceptance date.": "Elija la fecha de aceptación.",
    "Add a client name first.": "Primero agregue el nombre del cliente.", "Add at least one line item.": "Agregue al menos una partida.",
    "Add at least one priced line item.": "Agregue al menos una partida con precio.",
    "AI drafting is unavailable right now. Pick a template instead.": "La redacción con IA no está disponible ahora. Elija una plantilla.",
    "That share link is incomplete. Ask the sender for a new one.": "Ese enlace está incompleto. Pida uno nuevo a quien se lo envió.",
    "⚠ Before you send:": "⚠ Antes de enviar:", "(internal, not on the customer's copy)": "(interno, no aparece en la copia del cliente)",
    "Recurring charges are billed monthly. One-time charges are billed per the payment schedule.": "Los cargos recurrentes se facturan mensualmente. Los cargos únicos se facturan según el calendario de pagos.",
    "Recurring charges are billed monthly. Installation and activation fees are one-time.": "Los cargos recurrentes se facturan mensualmente. Las tarifas de instalación y activación son únicas.",
    // placeholders and aria-labels
    "Website redesign for a 20-person dental clinic, 6 pages, booking integration, 3 months support": "Rediseño del sitio web de una clínica dental de 20 personas, 6 páginas, integración de reservas, 3 meses de soporte",
    "One or two lines on the goal and scope": "Una o dos líneas sobre el objetivo y el alcance", "e.g. Acct 12345, Paybill 400200": "ej. Cuenta 12345, Paybill 400200",
    "e.g. Labour": "ej. Mano de obra", "Full name": "Nombre completo", "e.g. Head of Procurement": "ej. Director de Compras",
    "Acceptance date": "Fecha de aceptación", "Add line item": "Agregar partida", "Add payment stage": "Agregar etapa de pago",
    "Contract term in months": "Plazo del contrato en meses", "Customer name (accepted by)": "Nombre del cliente (aceptada por)",
    "Describe the job": "Describa el trabajo", "Margin floor percent": "Porcentaje de margen mínimo", "Missed anything?": "¿Olvidó algo?",
    "Proposal font": "Tipografía de la propuesta", "Proposal intro": "Introducción de la propuesta", "Share link": "Enlace para compartir",
    "Signatory title": "Cargo del firmante", "Upload logo": "Subir logotipo", "Remove stage": "Quitar etapa",
    // landing page
    "Demo": "Demo", "Try the live demo": "Pruebe la demo en vivo", "Open Quotax →": "Abrir Quotax →", "Open the full app →": "Abrir la app completa →",
    "Who it's for": "Para quién es", "Why now": "Por qué ahora", "Letter of intent": "Carta de intención", "Your name": "Su nombre",
    "Company": "Empresa", "Email": "Correo electrónico", "Seats / agents": "Puestos / agentes", "I agree, and sign below": "Acepto y firmo abajo",
    "Signature (type your full name)": "Firma (escriba su nombre completo)", "Sign letter of intent": "Firmar carta de intención",
    "Pre-order": "Preventa", "Card (test mode)": "Tarjeta (modo de prueba)", "Pay": "Pagar", "Cancel": "Cancelar", "Running…": "Generando…",
    "LOI": "Carta", "✓ Letter of intent signed": "✓ Carta de intención firmada", "Signed:": "Firmado:", "✓ Payment received": "✓ Pago recibido", "Order #": "Pedido n.º",
  });
  const LINEF = { description: "descripción", quantity: "cantidad", "unit price": "precio unitario", billing: "facturación", cost: "costo", "markup percent": "margen %", "per guest": "por invitado", section: "sección", product: "producto" };
  const exact = (s) => (Object.prototype.hasOwnProperty.call(D, s) ? D[s] : null);
  const tw = (s) => exact(s) || s;
  const termRe = "(Due on receipt|Net \\d+|Card on file, monthly|Monthly, net 60|Quarterly upfront|Termly|Annual upfront)";
  // Dynamic strings: [pattern, replacement]. Applied in order to text that has no exact match.
  const RULES = [
    [/^Line (\d+) (description|quantity|unit price|billing|cost|markup percent|per guest|section|product)$/, (m, n, f) => `Partida ${n}: ${LINEF[f]}`],
    [/^Remove line (\d+)$/, "Quitar partida $1"], [/^Remove stage (\d+)$/, "Quitar etapa $1"],
    [/^Stage (\d+) label$/, "Etiqueta de la etapa $1"], [/^Stage (\d+) percent$/, "Porcentaje de la etapa $1"], [/^Stage (\d+)$/, "Etapa $1"],
    [/^Add (.+)$/, (m, a) => `Agregar ${tw(a)}`], [/^Not needed: (.+)$/, (m, a) => `No hace falta: ${tw(a)}`],
    [/^(.+?) \(([\d.]+)%(, included)?\)$/, (m, a, p, inc) => `${tw(a)} (${p}%${inc ? ", incluido" : ""})`],
    [/^(\d+)\. (.+)$/, (m, n, a) => `${n}. ${tw(a)}`],
    [/^(.+) subtotal$/, (m, a) => `Subtotal: ${tw(a)}`],
    [/^(\d+) months · (\d+) payments$/, "$1 meses · $2 pagos"], [/^(\d+) months$/, "$1 meses"],
    [/^\(one-time \+ (\d+) × monthly\)$/, "(pago único + $1 × mensual)"],
    [/^One-time \+ (.+)\/mo × (\d+) mo = contract value$/, "Pago único + $1/mes × $2 meses = valor del contrato"],
    [/^(.+) per (month|quarter|term|year) × (\d+) \((\d+) mo\) = contract value$/, (m, a, per, n, mo) => `${a} por ${{ month: "mes", quarter: "trimestre", term: "periodo", year: "año" }[per]} × ${n} (${mo} meses) = valor del contrato`],
    [/^Contract value \((\d+) mo\)$/, "Valor del contrato ($1 meses)"],
    [/^Stages add up to (.+)%\. They should total 100%\.$/, "Las etapas suman $1%. Deben sumar 100%."],
    [/^Checklist: (\d+)\/(\d+) covered(.*)$/, "Lista de verificación: $1/$2 cubiertos$3"],
    [/^win rate at (.+)$/, "tasa de cierre a $1"], [/^best price \((\d+)% win\)$/, "mejor precio ($1% de cierre)"],
    [/^(.+): (\d+)% win, (.+) expected$/, "$1: $2% de cierre, $3 esperado"],
    [/^Live AI agents · (.+)$/, "Agentes de IA en vivo · $1"], [/^Simulated panel · (.+)$/, "Panel simulado · $1"],
    [/^Quote (\S+) · One-time (.+) · Monthly (.+)\/mo$/, "Cotización $1 · Pago único $2 · Mensual $3/mes"],
    [/^Quote (\S+) · Total (.+)$/, "Cotización $1 · Total $2"], [/^Quote (\S+) · (.+)$/, "Cotización $1 · $2"],
    [/^Pre-order (.*)$/, "Preventa $1"], [/^LOI #(.+)$/, "Carta n.º $1"], [/^Receipt sent to (.+)\.$/, "Recibo enviado a $1."],
    [new RegExp("^" + termRe + "$"), (m, t) => tw(t)],
    // Substring rules for sentences that get joined with other text.
    [new RegExp("^" + termRe + "\\.", "g"), (m, t) => tw(t) + "."],
    [/(\d+) possible miss(es)?:/g, (m, n, pl) => (pl ? `${n} posibles omisiones:` : `${n} posible omisión:`)],
    [/Missing:/g, "Falta:"],
    [/Line (\d+) \((.*?)\) has quantity 0/g, (m, n, d) => `La partida ${n} (${d === "no description" ? "sin descripción" : d}) tiene cantidad 0`],
    [/Line (\d+) \((.*?)\) has unit price 0/g, (m, n, d) => `La partida ${n} (${d === "no description" ? "sin descripción" : d}) tiene precio unitario 0`],
    [/([\w\/]+) is 0%\. Is that right for this job\?/g, (m, t) => `${tw(t)} es 0%. ¿Es correcto para este trabajo?`],
    [/THIN JOB: margin ([\d.]+)% is below your ([\d.]+)% floor\. You'd need about (.+?) more to reach it\./g, "MARGEN BAJO: el margen de $1% está por debajo de su mínimo de $2%. Necesitaría unos $3 más para alcanzarlo."],
    [/Thin section: (.+?) at ([\d.]+)% \(floor ([\d.]+)%\)/g, "Sección con margen bajo: $1 al $2% (mínimo $3%)"],
    [/\(cost (.+?), price (.+?)\)/g, "(costo $1, precio $2)"], [/(\d+) line\(s\) without cost/g, "$1 partida(s) sin costo"],
    [/·\s*Concern: /g, "· Inquietud: "], [/·\s*Fix: /g, "· Solución: "],
    [/ \((?:(\d+(?:\.\d+)?) × )?(\d+) guests\)/g, (m, q, g) => ` (${q ? q + " × " : ""}${g} invitados)`],
    [/of (.*?)\. By accepting, you confirm you are authorized to commit (.*?) to this quote\./g, "de $1. Al aceptar, confirma que está autorizado para comprometer a $2 con esta cotización."],
    [/([\d.]+)% added to prices\./g, "$1% adicional a los precios."], [/([\d.]+)% included in prices\./g, "$1% incluido en los precios."],
    [/ intends to purchase /g, " tiene la intención de comprar "],
  ];
  const SENTENCES = Object.keys(D).filter((k) => k.length >= 40).sort((a, b) => b.length - a.length);

  function tr(raw) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
    const core = m[2];
    if (!core) return raw;
    let out = exact(core);
    if (out == null) {
      out = core;
      for (const [re, rep] of RULES) {
        if (re.global) out = out.replace(re, rep);
        else if (re.test(out)) { out = out.replace(re, rep); break; }
      }
      for (const s of SENTENCES) if (out.includes(s)) out = out.split(s).join(D[s]);
    }
    return m[1] + out + m[3];
  }

  const ATTRS = ["placeholder", "aria-label", "title"];
  function trEl(el) {
    if (el.nodeType !== 1 || el.closest("script,style,[data-no-i18n]")) return;
    ATTRS.forEach((a) => { const v = el.getAttribute(a); if (v) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } });
    // Options without a value attribute: pin the English value so page logic keeps working, then translate the label.
    if (el.tagName === "OPTION" && !el.hasAttribute("value")) el.setAttribute("value", el.textContent);
    if (el.dataset.stages) el.dataset.stages = el.dataset.stages.split("|").map((x) => { const [p, l] = x.split(":"); return p + ":" + it(l); }).join("|");
    if (el.tagName === "A") {
      const h = el.getAttribute("href") || "";
      const nh = h.replace(/^\/app\.html(?=$|[#?])/, "/es").replace(/^\/home\.html(?=$|[#?])/, "/es/inicio");
      if (nh !== h) el.setAttribute("href", nh);
    }
  }
  function trText(n) {
    if (!n.parentElement || n.parentElement.closest("script,style,noscript,[data-no-i18n]")) return;
    const v = n.nodeValue, t = tr(v);
    if (t !== v) n.nodeValue = t;
  }
  function walk(root) {
    if (root.nodeType === 3) return trText(root);
    if (root.nodeType !== 1) return;
    trEl(root);
    root.querySelectorAll("*").forEach(trEl);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) trText(w.currentNode);
  }

  function addSwitch() {
    const nav = document.querySelector(".nav nav");
    if (!nav || nav.querySelector("[data-lang-switch]")) return;
    const a = document.createElement("a");
    a.setAttribute("data-lang-switch", ""); a.setAttribute("data-no-i18n", "");
    if (es) { a.href = isHome ? "/home.html" : "/app.html"; a.textContent = "English"; a.lang = "en"; a.hreflang = "en"; }
    else { a.href = isHome ? "/es/inicio" : "/es"; a.textContent = "Español"; a.lang = "es"; a.hreflang = "es"; }
    a.setAttribute("aria-label", es ? "Switch to English" : "Ver en español");
    nav.insertBefore(a, nav.firstChild);
  }

  function start() {
    addSwitch();
    if (!es) return;
    document.documentElement.lang = "es";
    document.title = tr(document.title);
    const notes = document.getElementById("notes");
    if (notes && notes.value === "Thank you for your business.") notes.value = notes.defaultValue = D[notes.value];
    // Default tax names are set by code (input.value = "Tax"/"VAT"); show the Spanish name instead.
    const tn = document.getElementById("taxname");
    if (tn) {
      const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
      const TAXN = { Tax: "Impuesto", VAT: "IVA", "GST/VAT": "IVA" };
      Object.defineProperty(tn, "value", { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, TAXN[v] || v); } });
      tn.value = tn.value;
    }
    walk(document.body);
    new MutationObserver((recs) => {
      recs.forEach((r) => {
        if (r.type === "characterData") trText(r.target);
        else if (r.type === "attributes") trEl(r.target);
        else r.addedNodes.forEach((n) => (n.nodeType === 3 ? trText(n) : walk(n)));
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    // Share-view and landing pages set document.title from code.
    const title = document.querySelector("title");
    if (title) new MutationObserver(() => { const t = tr(document.title); if (t !== document.title) document.title = t; }).observe(title, { childList: true, characterData: true, subtree: true });
  }

  // AI endpoints answer in Spanish when asked.
  if (es && window.fetch) {
    const f0 = window.fetch.bind(window);
    window.fetch = (u, o) => {
      if (typeof u === "string" && /^\/api\/(draft|simulate|demo)$/.test(u) && o && typeof o.body === "string") {
        try { o = Object.assign({}, o, { body: JSON.stringify(Object.assign(JSON.parse(o.body), { lang: "es" })) }); } catch (_) {}
      }
      return f0(u, o);
    };
  }

  window.QX = { lang, locale: es ? "es" : undefined, tpl, tr, start };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
