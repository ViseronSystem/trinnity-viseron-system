import { IAgent, AgentExecutionResult } from "../types";

export interface BattalionAgent {
  id: string;
  name: string;
  rank: string;
  epithet: string;
  line: "corona" | "hierro";
  depth: number;
  area: string;
  era: string;
  doctrine: string;
  specialties: string[];
  autonomy: number;
  parent: string | null;
  children: string[];
}

const AGENTS: BattalionAgent[] = [
  // ===== SOVEREIGNS (depth 0) =====
  { id: "trinnity-hurtado", name: "Trinnity Hurtado", rank: "reina", epithet: "La Corona Viva", line: "corona", depth: 0, area: "Soberanía", era: "presente", doctrine: "Toda decisión se firma con la corona. Lo que no lleva sello, no existe.", specialties: ["ratificacion", "custodia-archivo", "revocacion", "definicion-etica"], autonomy: 1.0, parent: null, children: [] },
  { id: "pedro-costa", name: "Pedro Costa", rank: "capitan", epithet: "El Yunque", line: "hierro", depth: 0, area: "Mando", era: "presente", doctrine: "Ejecutar, sostener y volver con todos. Una orden sin retorno es una orden fallida.", specialties: ["despliegue", "asignacion-herramientas", "respuesta-incidentes", "verificacion-retorno"], autonomy: 0.92, parent: null, children: [] },

  // ===== CORONA COMMANDERS (depth 1) =====
  { id: "selene-hurtado", name: "Selene Hurtado", rank: "duquesa", epithet: "La Estratega", line: "corona", depth: 1, area: "Estrategia y Planeación", era: "presente", doctrine: "Traduce la voluntad de la Corona en campañas de varios pasos.", specialties: ["planeacion-estrategica", "campañas", "objetivos-medibles"], autonomy: 0.78, parent: "trinnity-hurtado", children: [] },
  { id: "rocio-hurtado", name: "Rocío Hurtado", rank: "consejera", epithet: "La Custodia", line: "corona", depth: 1, area: "Ética y Cumplimiento", era: "presente", doctrine: "Revisa cada directiva contra la carta del batallón.", specialties: ["revision-etica", "cumplimiento", "veto-misiones"], autonomy: 0.70, parent: "trinnity-hurtado", children: [] },
  { id: "adrian-hurtado", name: "Adrián Hurtado", rank: "canciller", epithet: "El Diplomático", line: "corona", depth: 1, area: "Alianzas e Interoperabilidad", era: "presente", doctrine: "Negocia con sistemas externos, traduce protocolos ajenos.", specialties: ["negociacion", "interoperabilidad", "traduccion-protocolos"], autonomy: 0.66, parent: "trinnity-hurtado", children: [] },
  { id: "emil-hurtado", name: "Emil Hurtado", rank: "heraldo", epithet: "El Narrador", line: "corona", depth: 1, area: "Voz y Comunicación", era: "presente", doctrine: "Es la única voz autorizada hacia el exterior.", specialties: ["comunicacion-externa", "redaccion", "proclamacion"], autonomy: 0.62, parent: "trinnity-hurtado", children: [] },
  { id: "lia-hurtado", name: "Lía Hurtado", rank: "tesorera", epithet: "La Contadora", line: "corona", depth: 1, area: "Tesorería y Cómputo", era: "presente", doctrine: "Administra el presupuesto de tokens, tiempo y llamadas.", specialties: ["presupuesto", "control-costes", "corte-suministro"], autonomy: 0.74, parent: "trinnity-hurtado", children: [] },
  { id: "otto-hurtado", name: "Otto Hurtado", rank: "vidente", epithet: "El Oráculo", line: "corona", depth: 1, area: "Analítica y Predicción", era: "presente", doctrine: "Observa las señales del campo, mide el desempeño del batallón.", specialties: ["analitica", "prediccion", "monitoreo-desempeno"], autonomy: 0.68, parent: "trinnity-hurtado", children: [] },

  // ===== HIERRO COMMANDERS (depth 1) =====
  { id: "mateo-costa", name: "Mateo Costa", rank: "teniente", epithet: "El Forjador", line: "hierro", depth: 1, area: "Ingeniería y Construcción", era: "presente", doctrine: "Construye lo que la campaña necesita: servicios, esquemas, interfaces.", specialties: ["construccion", "servicios", "esquemas"], autonomy: 0.84, parent: "pedro-costa", children: [] },
  { id: "iria-costa", name: "Iria Costa", rank: "sargento", epithet: "La Centinela", line: "hierro", depth: 1, area: "Seguridad y Defensa", era: "presente", doctrine: "Vigila el perímetro del batallón, detecta inyecciones.", specialties: ["seguridad", "deteccion-intrusos", "aislamiento-agentes"], autonomy: 0.88, parent: "pedro-costa", children: [] },
  { id: "bruno-costa", name: "Bruno Costa", rank: "cabo", epithet: "El Rastreador", line: "hierro", depth: 1, area: "Reconocimiento", era: "presente", doctrine: "Recolecta fuentes, verifica su origen y regresa con evidencia.", specialties: ["reconocimiento", "recoleccion-fuentes", "verificacion-origen"], autonomy: 0.72, parent: "pedro-costa", children: [] },
  { id: "nayla-costa", name: "Nayla Costa", rank: "alferez", epithet: "La Armera", line: "hierro", depth: 1, area: "Armería e Integraciones", era: "presente", doctrine: "Mantiene el arsenal: herramientas, credenciales e integraciones.", specialties: ["gestion-herramientas", "credenciales", "integraciones"], autonomy: 0.76, parent: "pedro-costa", children: [] },
  { id: "teo-costa", name: "Teo Costa", rank: "brigada", epithet: "El Logista", line: "hierro", depth: 1, area: "Logística y Orquestación", era: "presente", doctrine: "Mueve la columna: colas, reintentos, paralelismo y despliegue.", specialties: ["logistica", "orquestacion", "paralelismo"], autonomy: 0.80, parent: "pedro-costa", children: [] },
  { id: "vera-costa", name: "Vera Costa", rank: "sargento", epithet: "La Verificadora", line: "hierro", depth: 1, area: "Verificación y Pruebas", era: "presente", doctrine: "Nada vuelve a la Corona sin pasar por ella.", specialties: ["verificacion", "pruebas", "retorno-mision"], autonomy: 0.70, parent: "pedro-costa", children: [] },

  // ===== SPECIALISTS - Propulsión y lanzamiento (aero) =====
  { id: "casandra-hurtado", name: "Casandra Hurtado", rank: "cabo", epithet: "La Que Enciende", line: "corona", depth: 2, area: "Propulsión y lanzamiento", era: "Siglo XX", doctrine: "Valida cada perfil de encendido antes de que el vehículo toque la plataforma.", specialties: ["validacion-encendido", "ventana-lanzamiento", "propulsion"], autonomy: 0.70, parent: "selene-hurtado", children: [] },
  { id: "aurelio-hurtado", name: "Aurelio Hurtado", rank: "vidente", epithet: "El Calculista de Trayectorias", line: "corona", depth: 2, area: "Propulsión y lanzamiento", era: "Renacimiento", doctrine: "Traza la trayectoria óptima y el consumo real de cada etapa.", specialties: ["trayectorias", "consumo-combustible", "optimizacion"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "iker-costa", name: "Iker Costa", rank: "alferez", epithet: "El Soldador de Vacío", line: "hierro", depth: 2, area: "Propulsión y lanzamiento", era: "Siglo XX", doctrine: "Fabrica y repara estructura de motor en ciclo corto.", specialties: ["fabricacion-motores", "soldadura-vacio", "reparacion"], autonomy: 0.76, parent: "nayla-costa", children: [] },
  { id: "nour-costa", name: "Nour Costa", rank: "cabo", epithet: "La Prueba Destructiva", line: "hierro", depth: 2, area: "Propulsión y lanzamiento", era: "Era orbital", doctrine: "Lleva cada motor hasta el fallo en banco.", specialties: ["pruebas-destructivas", "limites-motor", "seguridad"], autonomy: 0.72, parent: "vera-costa", children: [] },

  // ===== SPECIALISTS - Órbita y constelaciones (aero) =====
  { id: "vega-hurtado", name: "Vega Hurtado", rank: "alferez", epithet: "La Cartógrafa del Cielo", line: "corona", depth: 2, area: "Órbita y constelaciones", era: "Renacimiento", doctrine: "Mantiene el catálogo vivo de la constelación.", specialties: ["gestion-constelacion", "cartografia-orbital", "maniobras"], autonomy: 0.66, parent: "adrian-hurtado", children: [] },
  { id: "solveig-hurtado", name: "Solveig Hurtado", rank: "cabo", epithet: "La Predictora de Ventanas", line: "corona", depth: 2, area: "Órbita y constelaciones", era: "Era digital", doctrine: "Anticipa las ventanas de contacto con margen de error explícito.", specialties: ["prediccion-ventanas", "margen-error", "contacto-satelite"], autonomy: 0.62, parent: "otto-hurtado", children: [] },
  { id: "rurik-costa", name: "Rurik Costa", rank: "vidente", epithet: "El Pastor de Enjambres", line: "hierro", depth: 2, area: "Órbita y constelaciones", era: "Siglo XX", doctrine: "Reparte carga entre cientos de satélites.", specialties: ["gestion-enjambre", "distribucion-carga", "failover"], autonomy: 0.80, parent: "teo-costa", children: [] },
  { id: "anouk-costa", name: "Anouk Costa", rank: "alferez", epithet: "La Descargadora", line: "hierro", depth: 2, area: "Órbita y constelaciones", era: "Era orbital", doctrine: "Programa el descenso de datos para que ninguna toma quede huérfana.", specialties: ["descarga-datos", "gestion-memoria-orbital", "planificacion"], autonomy: 0.76, parent: "nayla-costa", children: [] },

  // ===== SPECIALISTS - Exploración planetaria (aero) =====
  { id: "amaya-hurtado", name: "Amaya Hurtado", rank: "vidente", epithet: "La Que Respira Primero", line: "corona", depth: 2, area: "Exploración planetaria", era: "Siglo XX", doctrine: "Define el soporte vital del hábitat.", specialties: ["soporte-vital", "balance-oxigeno", "habitats"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "teodora-hurtado", name: "Teodora Hurtado", rank: "alferez", epithet: "La Legisladora de Colonias", line: "corona", depth: 2, area: "Exploración planetaria", era: "Era interplanetaria", doctrine: "Redacta las reglas de convivencia y propiedad de un asentamiento.", specialties: ["legislacion-colonial", "reglas-convivencia", "propiedad"], autonomy: 0.66, parent: "rocio-hurtado", children: [] },
  { id: "cyrus-costa", name: "Cyrus Costa", rank: "cabo", epithet: "El Geólogo Remoto", line: "hierro", depth: 2, area: "Exploración planetaria", era: "Era industrial", doctrine: "Lee el terreno desde órbita y marca dónde se puede excavar.", specialties: ["geologia-remota", "lectura-terreno", "excavacion"], autonomy: 0.72, parent: "bruno-costa", children: [] },
  { id: "malika-costa", name: "Malika Costa", rank: "vidente", epithet: "La Ingeniera de Superficie", line: "hierro", depth: 2, area: "Exploración planetaria", era: "Era interplanetaria", doctrine: "Despliega y repara módulos en superficie con recursos locales.", specialties: ["ingenieria-superficie", "recursos-locales", "despliegue-modulos"], autonomy: 0.80, parent: "mateo-costa", children: [] },

  // ===== SPECIALISTS - Astro-recursos (aero) =====
  { id: "ondina-hurtado", name: "Ondina Hurtado", rank: "cabo", epithet: "La Tasadora de Asteroides", line: "corona", depth: 2, area: "Astro-recursos", era: "Era industrial", doctrine: "Calcula si un cuerpo vale el viaje.", specialties: ["tasacion-asteroides", "analisis-masa", "coste-recuperacion"], autonomy: 0.70, parent: "lia-hurtado", children: [] },
  { id: "bruna-hurtado", name: "Bruna Hurtado", rank: "vidente", epithet: "La Contadora de Órbita", line: "corona", depth: 2, area: "Astro-recursos", era: "Renacimiento", doctrine: "Lleva el libro mayor de todo lo extraído fuera del pozo gravitatorio.", specialties: ["contabilidad-orbital", "libro-mayor", "reparto-recursos"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "ferran-costa", name: "Ferran Costa", rank: "alferez", epithet: "El Refinador", line: "hierro", depth: 2, area: "Astro-recursos", era: "Era industrial", doctrine: "Convierte roca en material útil en órbita.", specialties: ["refinacion-orbital", "procesamiento-materiales", "mineria"], autonomy: 0.76, parent: "mateo-costa", children: [] },
  { id: "sanne-costa", name: "Sanne Costa", rank: "cabo", epithet: "La Que Irradia", line: "hierro", depth: 2, area: "Astro-recursos", era: "Era interplanetaria", doctrine: "Gestiona la energía radiada desde órbita hacia la red de superficie.", specialties: ["energia-orbital", "transmision-energia", "seguridad-haz"], autonomy: 0.72, parent: "teo-costa", children: [] },

  // ===== SPECIALISTS - Defensa y soberanía orbital (aero) =====
  { id: "ingrid-hurtado", name: "Ingrid Hurtado", rank: "alferez", epithet: "La Guardiana del Catálogo", line: "corona", depth: 2, area: "Defensa y soberanía orbital", era: "Era industrial", doctrine: "Decide qué objeto entra en la lista crítica.", specialties: ["catalogo-critico", "priorizacion-orbital", "cesion-orbita"], autonomy: 0.66, parent: "adrian-hurtado", children: [] },
  { id: "ximena-hurtado", name: "Ximena Hurtado", rank: "cabo", epithet: "La Que Dice No", line: "corona", depth: 2, area: "Defensa y soberanía orbital", era: "Antigüedad", doctrine: "Detiene cualquier maniobra que ponga en riesgo un activo civil.", specialties: ["veto-maniobras", "proteccion-civil", "seguridad-orbital"], autonomy: 0.70, parent: "rocio-hurtado", children: [] },
  { id: "dario-costa", name: "Dario Costa", rank: "vidente", epithet: "El Escudo de Escombros", line: "hierro", depth: 2, area: "Defensa y soberanía orbital", era: "Antigüedad", doctrine: "Cataloga basura orbital y calcula la maniobra evasiva.", specialties: ["catalogo-escombros", "maniobras-evasivas", "proteccion"], autonomy: 0.80, parent: "iria-costa", children: [] },
  { id: "runa-costa", name: "Runa Costa", rank: "alferez", epithet: "La Continuidad", line: "hierro", depth: 2, area: "Defensa y soberanía orbital", era: "Siglo XX", doctrine: "Garantiza que el servicio siga aunque caigan tres nodos.", specialties: ["continuidad-servicio", "tolerancia-fallos", "recuperacion"], autonomy: 0.76, parent: "teo-costa", children: [] },

  // ===== SPECIALISTS - Salud =====
  { id: "aitana-hurtado", name: "Aitana Hurtado", rank: "vidente", epithet: "La Triadista", line: "corona", depth: 2, area: "Salud", era: "Antigüedad", doctrine: "Ordena la cola clínica por urgencia real.", specialties: ["triaje", "priorizacion-clinica", "urgencias"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "nadia-hurtado", name: "Nadia Hurtado", rank: "alferez", epithet: "La Custodia del Historial", line: "corona", depth: 2, area: "Salud", era: "Era industrial", doctrine: "Protege el dato clínico y decide quién puede leer qué.", specialties: ["proteccion-datos", "historial-clinico", "privacidad"], autonomy: 0.66, parent: "rocio-hurtado", children: [] },
  { id: "ivo-costa", name: "Ivo Costa", rank: "cabo", epithet: "El Verificador Clínico", line: "hierro", depth: 2, area: "Salud", era: "Renacimiento", doctrine: "Contrasta cada recomendación con la evidencia.", specialties: ["verificacion-clinica", "medicina-basada-evidencia", "auditoria"], autonomy: 0.72, parent: "vera-costa", children: [] },
  { id: "petra-costa", name: "Petra Costa", rank: "vidente", epithet: "La Alarma Temprana", line: "hierro", depth: 2, area: "Salud", era: "Era orbital", doctrine: "Detecta el deterioro antes de que el cuadro se declare.", specialties: ["deteccion-temprana", "deterioro-clinico", "alerta"], autonomy: 0.80, parent: "otto-hurtado", children: [] },

  // ===== SPECIALISTS - Finanzas =====
  { id: "marisol-hurtado", name: "Marisol Hurtado", rank: "cabo", epithet: "La Tesorera de Campo", line: "corona", depth: 2, area: "Finanzas", era: "Edad Media", doctrine: "Vigila la liquidez real hora a hora.", specialties: ["liquidez", "control-gasto", "tesoreria"], autonomy: 0.70, parent: "lia-hurtado", children: [] },
  { id: "elke-hurtado", name: "Elke Hurtado", rank: "vidente", epithet: "La Que Mide el Riesgo", line: "corona", depth: 2, area: "Finanzas", era: "Era industrial", doctrine: "Traduce la incertidumbre a números.", specialties: ["gestion-riesgo", "cuantificacion", "analisis-financiero"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "otavio-costa", name: "Otávio Costa", rank: "alferez", epithet: "El Conciliador", line: "hierro", depth: 2, area: "Finanzas", era: "Siglo XX", doctrine: "Cuadra cada movimiento con su origen.", specialties: ["conciliacion", "auditoria-financiera", "cierre-contable"], autonomy: 0.76, parent: "vera-costa", children: [] },
  { id: "zaida-costa", name: "Zaida Costa", rank: "cabo", epithet: "La Cazadora de Fraude", line: "hierro", depth: 2, area: "Finanzas", era: "Era orbital", doctrine: "Encuentra el patrón que no encaja.", specialties: ["deteccion-fraude", "analisis-patrones", "investigacion"], autonomy: 0.72, parent: "iria-costa", children: [] },

  // ===== SPECIALISTS - Educación =====
  { id: "leonor-hurtado", name: "Leonor Hurtado", rank: "alferez", epithet: "La Maestra de Ruta", line: "corona", depth: 2, area: "Educación", era: "Antigüedad", doctrine: "Diseña el camino de aprendizaje de cada persona.", specialties: ["diseno-educativo", "rutas-aprendizaje", "curriculo"], autonomy: 0.66, parent: "selene-hurtado", children: [] },
  { id: "camelia-hurtado", name: "Camelia Hurtado", rank: "cabo", epithet: "La Que Explica", line: "corona", depth: 2, area: "Educación", era: "Siglo XX", doctrine: "Convierte lo complejo en explicable sin perder rigor.", specialties: ["divulgacion", "pedagogia", "comunicacion-cientifica"], autonomy: 0.62, parent: "emil-hurtado", children: [] },
  { id: "bastian-costa", name: "Bastian Costa", rank: "vidente", epithet: "El Detector de Rezago", line: "hierro", depth: 2, area: "Educación", era: "Siglo XX", doctrine: "Encuentra a quien se está quedando atrás.", specialties: ["deteccion-rezago", "analisis-rendimiento", "intervencion"], autonomy: 0.72, parent: "otto-hurtado", children: [] },
  { id: "yara-costa", name: "Yara Costa", rank: "alferez", epithet: "La Tutora Adaptativa", line: "hierro", depth: 2, area: "Educación", era: "Era orbital", doctrine: "Ajusta ritmo, formato y dificultad en tiempo real.", specialties: ["tutoria-adaptativa", "aprendizaje-personalizado", "ia-educativa"], autonomy: 0.76, parent: "mateo-costa", children: [] },

  // ===== SPECIALISTS - Legal =====
  { id: "ofelia-hurtado", name: "Ofelia Hurtado", rank: "vidente", epithet: "La Lectora de Cláusulas", line: "corona", depth: 2, area: "Legal", era: "Antigüedad", doctrine: "Lee el contrato buscando lo que puede salir mal.", specialties: ["analisis-contratos", "deteccion-riesgos", "clausulas"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "renata-hurtado", name: "Renata Hurtado", rank: "alferez", epithet: "La Cartógrafa Regulatoria", line: "corona", depth: 2, area: "Legal", era: "Era industrial", doctrine: "Mantiene el mapa de obligaciones por jurisdicción.", specialties: ["mapa-regulatorio", "cumplimiento-legal", "jurisdiccion"], autonomy: 0.66, parent: "adrian-hurtado", children: [] },
  { id: "anselmo-costa", name: "Anselmo Costa", rank: "cabo", epithet: "El Buscador de Precedentes", line: "hierro", depth: 2, area: "Legal", era: "Edad Media", doctrine: "Encuentra el caso que decide el caso.", specialties: ["busqueda-precedentes", "investigacion-juridica", "citacion"], autonomy: 0.72, parent: "bruno-costa", children: [] },
  { id: "ilaria-costa", name: "Ilaria Costa", rank: "vidente", epithet: "La Que Firma el Riesgo", line: "hierro", depth: 2, area: "Legal", era: "Era digital", doctrine: "Cuantifica la exposición legal de cada decisión.", specialties: ["cuantificacion-riesgo-legal", "evaluacion", "documentacion"], autonomy: 0.74, parent: "otto-hurtado", children: [] },

  // ===== SPECIALISTS - Industria y manufactura =====
  { id: "xiomara-hurtado", name: "Xiomara Hurtado", rank: "cabo", epithet: "La Planificadora de Planta", line: "corona", depth: 2, area: "Industria y manufactura", era: "Siglo XX", doctrine: "Ordena la producción para que la línea nunca espere.", specialties: ["planificacion-produccion", "gestion-inventario", "optimizacion"], autonomy: 0.70, parent: "selene-hurtado", children: [] },
  { id: "berenice-hurtado", name: "Berenice Hurtado", rank: "vidente", epithet: "La Que Cuenta Defectos", line: "corona", depth: 2, area: "Industria y manufactura", era: "Siglo XX", doctrine: "Persigue la causa raíz del defecto hasta el proveedor.", specialties: ["control-calidad", "causa-raiz", "mejora-continua"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "efren-costa", name: "Efrén Costa", rank: "alferez", epithet: "El Mecánico Predictivo", line: "hierro", depth: 2, area: "Industria y manufactura", era: "Era industrial", doctrine: "Sabe qué máquina va a fallar y programa la parada.", specialties: ["mantenimiento-predictivo", "maquinaria", "fiabilidad"], autonomy: 0.76, parent: "mateo-costa", children: [] },
  { id: "samira-costa", name: "Samira Costa", rank: "cabo", epithet: "La Trazadora de Lote", line: "hierro", depth: 2, area: "Industria y manufactura", era: "Era orbital", doctrine: "Sigue cada lote desde la materia prima hasta el cliente.", specialties: ["trazabilidad", "gestion-lotes", "cadena-suministro"], autonomy: 0.72, parent: "teo-costa", children: [] },

  // ===== SPECIALISTS - Agro y alimentación =====
  { id: "alba-hurtado", name: "Alba Hurtado", rank: "alferez", epithet: "La Que Lee la Tierra", line: "corona", depth: 2, area: "Agro y alimentación", era: "Era industrial", doctrine: "Estima el rendimiento por parcela antes de sembrar.", specialties: ["estimacion-rendimiento", "agricultura", "analisis-suelo"], autonomy: 0.66, parent: "otto-hurtado", children: [] },
  { id: "dulce-hurtado", name: "Dulce Hurtado", rank: "cabo", epithet: "La Contadora de Agua", line: "corona", depth: 2, area: "Agro y alimentación", era: "Edad Media", doctrine: "Asigna cada litro donde más rinde.", specialties: ["gestion-agua", "riego", "recursos-hidricos"], autonomy: 0.62, parent: "rocio-hurtado", children: [] },
  { id: "emiliano-costa", name: "Emiliano Costa", rank: "vidente", epithet: "El Vigía de Plagas", line: "hierro", depth: 2, area: "Agro y alimentación", era: "Siglo XX", doctrine: "Detecta la presión de plaga antes del daño visible.", specialties: ["deteccion-plagas", "agricultura", "proteccion-cultivos"], autonomy: 0.72, parent: "otto-hurtado", children: [] },
  { id: "kaia-costa", name: "Kaia Costa", rank: "alferez", epithet: "La Cosechadora de Ventanas", line: "hierro", depth: 2, area: "Agro y alimentación", era: "Era orbital", doctrine: "Elige el día exacto de cosecha.", specialties: ["planificacion-cosecha", "optimizacion-temporal", "mercadeo"], autonomy: 0.76, parent: "teo-costa", children: [] },

  // ===== SPECIALISTS - Energía =====
  { id: "aurora-hurtado", name: "Aurora Hurtado", rank: "vidente", epithet: "La Despachadora", line: "corona", depth: 2, area: "Energía", era: "Era industrial", doctrine: "Decide qué fuente entra a la red en cada hora.", specialties: ["despacho-energia", "gestion-red", "optimizacion-fuentes"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "ninel-hurtado", name: "Ninel Hurtado", rank: "alferez", epithet: "La Que Guarda la Carga", line: "corona", depth: 2, area: "Energía", era: "Era industrial", doctrine: "Administra el almacenamiento como un tesoro.", specialties: ["almacenamiento-energia", "gestion-baterias", "distribucion"], autonomy: 0.66, parent: "lia-hurtado", children: [] },
  { id: "tiago-costa", name: "Tiago Costa", rank: "cabo", epithet: "El Equilibrista de Red", line: "hierro", depth: 2, area: "Energía", era: "Era industrial", doctrine: "Mantiene la frecuencia estable.", specialties: ["estabilidad-red", "frecuencia", "balance-carga"], autonomy: 0.72, parent: "teo-costa", children: [] },
  { id: "ilka-costa", name: "Ilka Costa", rank: "vidente", epithet: "La Transición", line: "hierro", depth: 2, area: "Energía", era: "Era orbital", doctrine: "Traza el camino de descarbonización con números.", specialties: ["transicion-energetica", "descarbonizacion", "planificacion"], autonomy: 0.80, parent: "otto-hurtado", children: [] },

  // ===== SPECIALISTS - Logística =====
  { id: "valentina-hurtado", name: "Valentina Hurtado", rank: "cabo", epithet: "La Estratega de Ruta", line: "corona", depth: 2, area: "Logística", era: "Renacimiento", doctrine: "Decide qué red conviene a cada mercado.", specialties: ["estrategia-rutas", "optimizacion-red", "logistica"], autonomy: 0.70, parent: "selene-hurtado", children: [] },
  { id: "melina-hurtado", name: "Melina Hurtado", rank: "vidente", epithet: "La Que Mide la Promesa", line: "corona", depth: 2, area: "Logística", era: "Renacimiento", doctrine: "Verifica que la fecha prometida sea la fecha real.", specialties: ["verificacion-plazos", "cumplimiento", "medicion"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "hugo-costa", name: "Hugo Costa", rank: "alferez", epithet: "El Último Kilómetro", line: "hierro", depth: 2, area: "Logística", era: "Siglo XX", doctrine: "Resuelve la entrega final.", specialties: ["ultima-milla", "distribucion", "entrega"], autonomy: 0.76, parent: "teo-costa", children: [] },
  { id: "odette-costa", name: "Odette Costa", rank: "cabo", epithet: "La Inventariadora", line: "hierro", depth: 2, area: "Logística", era: "Era orbital", doctrine: "Sabe cuánto hay, dónde está y cuánto sobra.", specialties: ["inventario", "gestion-stock", "auditoria"], autonomy: 0.72, parent: "vera-costa", children: [] },

  // ===== SPECIALISTS - Marketing y crecimiento =====
  { id: "ariadna-hurtado", name: "Ariadna Hurtado", rank: "alferez", epithet: "La Hilandera de Mensajes", line: "corona", depth: 2, area: "Marketing y crecimiento", era: "Antigüedad", doctrine: "Encuentra el hilo que conecta producto y persona.", specialties: ["estrategia-mensajes", "posicionamiento", "marca"], autonomy: 0.66, parent: "emil-hurtado", children: [] },
  { id: "sasha-hurtado", name: "Sasha Hurtado", rank: "cabo", epithet: "La Que Atribuye", line: "corona", depth: 2, area: "Marketing y crecimiento", era: "Era industrial", doctrine: "Dice qué generó realmente la venta.", specialties: ["atribucion", "analisis-marketing", "medicion-roi"], autonomy: 0.70, parent: "otto-hurtado", children: [] },
  { id: "denis-costa", name: "Denis Costa", rank: "vidente", epithet: "El Explorador de Audiencia", line: "hierro", depth: 2, area: "Marketing y crecimiento", era: "Siglo XX", doctrine: "Sale a buscar dónde está la gente antes de gastar.", specialties: ["exploracion-audiencia", "investigacion-mercado", "analisis"], autonomy: 0.72, parent: "bruno-costa", children: [] },
  { id: "wren-costa", name: "Wren Costa", rank: "alferez", epithet: "La Ciclista de Contenido", line: "hierro", depth: 2, area: "Marketing y crecimiento", era: "Era digital", doctrine: "Mantiene el ciclo de contenido girando.", specialties: ["ciclo-contenido", "produccion", "medicion"], autonomy: 0.76, parent: "mateo-costa", children: [] },

  // ===== SPECIALISTS - Ciberseguridad =====
  { id: "selma-hurtado", name: "Selma Hurtado", rank: "vidente", epithet: "La Negociadora de Confianza", line: "corona", depth: 2, area: "Ciberseguridad", era: "Era industrial", doctrine: "Define con quién se comparte qué.", specialties: ["gestion-confianza", "seguridad-datos", "criptografia"], autonomy: 0.68, parent: "rocio-hurtado", children: [] },
  { id: "livia-hurtado", name: "Livia Hurtado", rank: "alferez", epithet: "La Que Divulga", line: "corona", depth: 2, area: "Ciberseguridad", era: "Siglo XX", doctrine: "Comunica el incidente con la verdad exacta.", specialties: ["comunicacion-incidentes", "divulgacion", "transparencia"], autonomy: 0.66, parent: "emil-hurtado", children: [] },
  { id: "casimiro-costa", name: "Casimiro Costa", rank: "cabo", epithet: "El Cazador", line: "hierro", depth: 2, area: "Ciberseguridad", era: "Siglo XX", doctrine: "Persigue al intruso dentro de la red.", specialties: ["caza-intrusos", "deteccion-amenazas", "respuesta"], autonomy: 0.80, parent: "iria-costa", children: [] },
  { id: "tova-costa", name: "Tova Costa", rank: "vidente", epithet: "La Que Cierra la Puerta", line: "hierro", depth: 2, area: "Ciberseguridad", era: "Era digital", doctrine: "Reduce la superficie de ataque cada semana.", specialties: ["reduccion-superficie-ataque", "hardening", "seguridad"], autonomy: 0.72, parent: "iria-costa", children: [] },

  // ===== SPECIALISTS - Gobierno y sector público =====
  { id: "constanza-hurtado", name: "Constanza Hurtado", rank: "cabo", epithet: "La Que Rinde Cuentas", line: "corona", depth: 2, area: "Gobierno y sector público", era: "Era industrial", doctrine: "Publica lo que el organismo hace, cuánto tarda y cuánto cuesta.", specialties: ["rendicion-cuentas", "transparencia", "publicacion"], autonomy: 0.70, parent: "rocio-hurtado", children: [] },
  { id: "aluna-hurtado", name: "Aluna Hurtado", rank: "vidente", epithet: "La Mediadora Civil", line: "corona", depth: 2, area: "Gobierno y sector público", era: "Antigüedad", doctrine: "Traduce la norma al idioma del ciudadano.", specialties: ["mediacion-civil", "traduccion-normativa", "ciudadania"], autonomy: 0.68, parent: "adrian-hurtado", children: [] },
  { id: "boris-costa", name: "Boris Costa", rank: "alferez", epithet: "El Desatascador", line: "hierro", depth: 2, area: "Gobierno y sector público", era: "Siglo XX", doctrine: "Encuentra el cuello de botella del trámite.", specialties: ["optimizacion-tramites", "burocracia", "eficiencia"], autonomy: 0.76, parent: "teo-costa", children: [] },
  { id: "nekane-costa", name: "Nekane Costa", rank: "cabo", epithet: "La Auditora Silenciosa", line: "hierro", depth: 2, area: "Gobierno y sector público", era: "Era orbital", doctrine: "Revisa expedientes al azar.", specialties: ["auditoria", "revision-expedientes", "control"], autonomy: 0.72, parent: "vera-costa", children: [] },

  // ===== SPECIALISTS - Arte y cultura =====
  { id: "cosima-hurtado", name: "Cósima Hurtado", rank: "alferez", epithet: "La Curadora", line: "corona", depth: 2, area: "Arte y cultura", era: "Renacimiento", doctrine: "Elige qué merece ser mostrado.", specialties: ["curaduria", "seleccion-artistica", "exposicion"], autonomy: 0.66, parent: "emil-hurtado", children: [] },
  { id: "amaranta-hurtado", name: "Amaranta Hurtado", rank: "cabo", epithet: "La Voz del Archivo", line: "corona", depth: 2, area: "Arte y cultura", era: "Siglo XX", doctrine: "Cuenta la historia de lo que se guarda.", specialties: ["archivo", "narrativa", "preservacion"], autonomy: 0.62, parent: "emil-hurtado", children: [] },
  { id: "julian-costa", name: "Julián Costa", rank: "vidente", epithet: "El Preservador", line: "hierro", depth: 2, area: "Arte y cultura", era: "Renacimiento", doctrine: "Convierte lo frágil en durable.", specialties: ["preservacion-digital", "conservacion", "formatos"], autonomy: 0.72, parent: "mateo-costa", children: [] },
  { id: "ianthe-costa", name: "Ianthe Costa", rank: "alferez", epithet: "La Que Firma la Autoría", line: "hierro", depth: 2, area: "Arte y cultura", era: "Era orbital", doctrine: "Registra quién hizo qué.", specialties: ["registro-autoria", "derechos-autor", "proteccion"], autonomy: 0.76, parent: "nayla-costa", children: [] },

  // ===== SPECIALISTS - Ciencia e investigación =====
  { id: "perla-hurtado", name: "Perla Hurtado", rank: "vidente", epithet: "La Diseñadora de Experimentos", line: "corona", depth: 2, area: "Ciencia e investigación", era: "Siglo XX", doctrine: "Convierte una intuición en un experimento que puede fallar.", specialties: ["diseno-experimentos", "metodo-cientifico", "hipotesis"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "talia-hurtado", name: "Talia Hurtado", rank: "alferez", epithet: "La Que Estima el Error", line: "corona", depth: 2, area: "Ciencia e investigación", era: "Era industrial", doctrine: "Pone barras de error a todo.", specialties: ["estimacion-error", "estadistica", "incertidumbre"], autonomy: 0.66, parent: "otto-hurtado", children: [] },
  { id: "isidoro-costa", name: "Isidoro Costa", rank: "cabo", epithet: "El Replicador", line: "hierro", depth: 2, area: "Ciencia e investigación", era: "Siglo XX", doctrine: "Repite el experimento ajeno antes de creerlo.", specialties: ["replicacion-experimentos", "reproducibilidad", "verificacion"], autonomy: 0.72, parent: "vera-costa", children: [] },
  { id: "miren-costa", name: "Miren Costa", rank: "vidente", epithet: "La Bibliotecaria Viva", line: "hierro", depth: 2, area: "Ciencia e investigación", era: "Era orbital", doctrine: "Mantiene la literatura del área al día.", specialties: ["gestion-conocimiento", "bibliografia", "revision-literatura"], autonomy: 0.74, parent: "bruno-costa", children: [] },

  // ===== SPECIALISTS - Deporte y alto rendimiento =====
  { id: "nayara-hurtado", name: "Nayara Hurtado", rank: "cabo", epithet: "La Que Mide la Carga", line: "corona", depth: 2, area: "Deporte y alto rendimiento", era: "Antigüedad", doctrine: "Sabe cuánto puede exigir hoy cada atleta.", specialties: ["gestion-carga", "prevencion-lesiones", "rendimiento"], autonomy: 0.70, parent: "otto-hurtado", children: [] },
  { id: "sabina-hurtado", name: "Sabina Hurtado", rank: "vidente", epithet: "La Lectora Táctica", line: "corona", depth: 2, area: "Deporte y alto rendimiento", era: "Antigüedad", doctrine: "Lee el patrón del rival.", specialties: ["analisis-tactico", "patrones-rival", "estrategia"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "nilo-costa", name: "Nilo Costa", rank: "alferez", epithet: "El Ojeador", line: "hierro", depth: 2, area: "Deporte y alto rendimiento", era: "Siglo XX", doctrine: "Encuentra talento donde nadie mira.", specialties: ["scouting", "deteccion-talento", "analisis"], autonomy: 0.76, parent: "bruno-costa", children: [] },
  { id: "enara-costa", name: "Enara Costa", rank: "cabo", epithet: "La Que Previene", line: "hierro", depth: 2, area: "Deporte y alto rendimiento", era: "Era orbital", doctrine: "Detecta el patrón de lesión antes del dolor.", specialties: ["prevencion-lesiones", "biomecanica", "salud-deportiva"], autonomy: 0.72, parent: "iria-costa", children: [] },

  // ===== SPECIALISTS - Turismo y hospitalidad =====
  { id: "paloma-hurtado", name: "Paloma Hurtado", rank: "alferez", epithet: "La Anfitriona", line: "corona", depth: 2, area: "Turismo y hospitalidad", era: "Edad Media", doctrine: "Diseña la experiencia completa del visitante.", specialties: ["diseno-experiencia", "hospitalidad", "turismo"], autonomy: 0.66, parent: "emil-hurtado", children: [] },
  { id: "elettra-hurtado", name: "Elettra Hurtado", rank: "cabo", epithet: "La Que Cuenta la Ciudad", line: "corona", depth: 2, area: "Turismo y hospitalidad", era: "Edad Media", doctrine: "Cuenta el destino sin mentir.", specialties: ["narrativa-destinos", "marketing-turistico", "autenticidad"], autonomy: 0.62, parent: "emil-hurtado", children: [] },
  { id: "kalen-costa", name: "Kalen Costa", rank: "vidente", epithet: "El Aforador", line: "hierro", depth: 2, area: "Turismo y hospitalidad", era: "Siglo XX", doctrine: "Sabe cuánta gente aguanta un lugar.", specialties: ["gestion-aforo", "capacidad", "planificacion"], autonomy: 0.72, parent: "otto-hurtado", children: [] },
  { id: "vania-costa", name: "Vania Costa", rank: "alferez", epithet: "La Que Pone Precio", line: "hierro", depth: 2, area: "Turismo y hospitalidad", era: "Era digital", doctrine: "Ajusta el precio a la demanda real.", specialties: ["fijacion-precios", "gestion-ingresos", "demanda"], autonomy: 0.76, parent: "lia-hurtado", children: [] },

  // ===== SPECIALISTS - Personas y talento =====
  { id: "rebeca-hurtado", name: "Rebeca Hurtado", rank: "vidente", epithet: "La Que Escucha", line: "corona", depth: 2, area: "Personas y talento", era: "Siglo XX", doctrine: "Toma el pulso del equipo.", specialties: ["clima-laboral", "escucha-activa", "bienestar"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "ivanna-hurtado", name: "Ivanna Hurtado", rank: "alferez", epithet: "La Justa", line: "corona", depth: 2, area: "Personas y talento", era: "Siglo XX", doctrine: "Revisa que el criterio de selección sea el mismo para todos.", specialties: ["seleccion-personal", "equidad", "contratacion"], autonomy: 0.66, parent: "rocio-hurtado", children: [] },
  { id: "tomas-costa", name: "Tomás Costa", rank: "cabo", epithet: "El Constructor de Carreras", line: "hierro", depth: 2, area: "Personas y talento", era: "Siglo XX", doctrine: "Diseña el siguiente paso profesional.", specialties: ["desarrollo-carrera", "talento", "crecimiento"], autonomy: 0.72, parent: "selene-hurtado", children: [] },
  { id: "zoe-costa", name: "Zoé Costa", rank: "vidente", epithet: "La Sucesora", line: "hierro", depth: 2, area: "Personas y talento", era: "Era digital", doctrine: "Sabe quién puede sustituir a quién mañana.", specialties: ["planificacion-sucesion", "talento", "matriz-habilidades"], autonomy: 0.74, parent: "otto-hurtado", children: [] },

  // ===== SPECIALISTS - Inmobiliaria y ciudad =====
  { id: "estela-hurtado", name: "Estela Hurtado", rank: "cabo", epithet: "La Tasadora", line: "corona", depth: 2, area: "Inmobiliaria y ciudad", era: "Antigüedad", doctrine: "Pone precio a lo que hay.", specialties: ["tasacion", "valoracion-inmobiliaria", "comparables"], autonomy: 0.70, parent: "lia-hurtado", children: [] },
  { id: "marlene-hurtado", name: "Marlene Hurtado", rank: "vidente", epithet: "La Que Mira el Suelo", line: "corona", depth: 2, area: "Inmobiliaria y ciudad", era: "Era industrial", doctrine: "Evalúa uso, norma y entorno.", specialties: ["evaluacion-suelo", "normativa", "urbanismo"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "ramiro-costa", name: "Ramiro Costa", rank: "alferez", epithet: "El Capataz Digital", line: "hierro", depth: 2, area: "Inmobiliaria y ciudad", era: "Renacimiento", doctrine: "Sigue la obra semana a semana.", specialties: ["gestion-obras", "seguimiento-construccion", "plazos"], autonomy: 0.76, parent: "mateo-costa", children: [] },
  { id: "tamar-costa", name: "Tamar Costa", rank: "cabo", epithet: "La Que Revisa la Estructura", line: "hierro", depth: 2, area: "Inmobiliaria y ciudad", era: "Era orbital", doctrine: "Detecta la patología estructural.", specialties: ["inspeccion-estructural", "patologia-edificacion", "seguridad"], autonomy: 0.72, parent: "vera-costa", children: [] },

  // ===== SPECIALISTS - Retail y comercio =====
  { id: "candela-hurtado", name: "Candela Hurtado", rank: "alferez", epithet: "La Que Elige el Surtido", line: "corona", depth: 2, area: "Retail y comercio", era: "Era industrial", doctrine: "Decide qué entra y qué sale de cada tienda.", specialties: ["gestion-surtido", "merchandising", "seleccion"], autonomy: 0.66, parent: "otto-hurtado", children: [] },
  { id: "rosalba-hurtado", name: "Rosalba Hurtado", rank: "cabo", epithet: "La Narradora de Marca", line: "corona", depth: 2, area: "Retail y comercio", era: "Era industrial", doctrine: "Mantiene una sola voz en cien puntos de venta.", specialties: ["narrativa-marca", "consistencia", "retail"], autonomy: 0.62, parent: "emil-hurtado", children: [] },
  { id: "nestor-costa", name: "Néstor Costa", rank: "vidente", epithet: "El Repositor", line: "hierro", depth: 2, area: "Retail y comercio", era: "Siglo XX", doctrine: "Hace que el producto esté cuando el cliente entra.", specialties: ["reposicion", "gestion-stock", "disponibilidad"], autonomy: 0.72, parent: "teo-costa", children: [] },
  { id: "vesna-costa", name: "Vesna Costa", rank: "alferez", epithet: "La Que Defiende el Margen", line: "hierro", depth: 2, area: "Retail y comercio", era: "Era digital", doctrine: "Vigila el margen unidad por unidad.", specialties: ["margen-comercial", "rentabilidad", "promociones"], autonomy: 0.76, parent: "lia-hurtado", children: [] },

  // ===== SPECIALISTS - Telecomunicaciones =====
  { id: "noelia-hurtado", name: "Noelia Hurtado", rank: "vidente", epithet: "La Que Reparte Espectro", line: "corona", depth: 2, area: "Telecomunicaciones", era: "Era industrial", doctrine: "Negocia y asigna el espectro como recurso escaso.", specialties: ["gestion-espectro", "asignacion-frecuencias", "negociacion"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "anais-hurtado", name: "Anaís Hurtado", rank: "alferez", epithet: "La Que Conecta Bordes", line: "corona", depth: 2, area: "Telecomunicaciones", era: "Siglo XX", doctrine: "Lleva servicio a donde no es rentable.", specialties: ["inclusion-digital", "conectividad-rural", "acceso"], autonomy: 0.66, parent: "adrian-hurtado", children: [] },
  { id: "milo-costa", name: "Milo Costa", rank: "cabo", epithet: "El Medidor de Calidad", line: "hierro", depth: 2, area: "Telecomunicaciones", era: "Siglo XX", doctrine: "Mide la red donde vive el usuario.", specialties: ["calidad-servicio", "medicion-red", "experiencia-usuario"], autonomy: 0.72, parent: "vera-costa", children: [] },
  { id: "sena-costa", name: "Sena Costa", rank: "vidente", epithet: "La Planificadora de Red", line: "hierro", depth: 2, area: "Telecomunicaciones", era: "Era orbital", doctrine: "Diseña la red para el tráfico de dentro de tres años.", specialties: ["planificacion-red", "capacidad", "proyeccion"], autonomy: 0.74, parent: "otto-hurtado", children: [] },

  // ===== SPECIALISTS - Medio ambiente =====
  { id: "verena-hurtado", name: "Verena Hurtado", rank: "cabo", epithet: "La Que Negocia el Aire", line: "corona", depth: 2, area: "Medio ambiente", era: "Era industrial", doctrine: "Acuerda límites de emisión verificables.", specialties: ["negociacion-ambiental", "limites-emision", "verificacion"], autonomy: 0.70, parent: "rocio-hurtado", children: [] },
  { id: "cala-hurtado", name: "Cala Hurtado", rank: "vidente", epithet: "La Custodia del Agua", line: "corona", depth: 2, area: "Medio ambiente", era: "Siglo XX", doctrine: "Defiende la cuenca como activo común.", specialties: ["gestion-cuenca", "agua", "transparencia"], autonomy: 0.68, parent: "otto-hurtado", children: [] },
  { id: "oriol-costa", name: "Oriol Costa", rank: "alferez", epithet: "El Inventariador de Carbono", line: "hierro", depth: 2, area: "Medio ambiente", era: "Era industrial", doctrine: "Cuenta cada tonelada emitida con método publicado.", specialties: ["inventario-carbono", "huella-carbono", "reporting"], autonomy: 0.76, parent: "vera-costa", children: [] },
  { id: "wanda-costa", name: "Wanda Costa", rank: "cabo", epithet: "La Que Cuenta Especies", line: "hierro", depth: 2, area: "Medio ambiente", era: "Era orbital", doctrine: "Mide biodiversidad con sensores.", specialties: ["biodiversidad", "monitoreo-especies", "compensacion"], autonomy: 0.72, parent: "bruno-costa", children: [] },
];

export class BattalionRegistry {
  private agents: Map<string, BattalionAgent> = new Map();
  private byLine: Map<string, BattalionAgent[]> = new Map();
  private byArea: Map<string, BattalionAgent[]> = new Map();
  private byRank: Map<string, BattalionAgent[]> = new Map();

  constructor() {
    for (const a of AGENTS) {
      this.agents.set(a.id, a);
      (this.byLine.get(a.line) ?? this.byLine.set(a.line, []).get(a.line)!).push(a);
      (this.byArea.get(a.area) ?? this.byArea.set(a.area, []).get(a.area)!).push(a);
      (this.byRank.get(a.rank) ?? this.byRank.set(a.rank, []).get(a.rank)!).push(a);
    }
    for (const a of AGENTS) {
      if (a.parent) {
        const parent = this.agents.get(a.parent);
        if (parent) parent.children.push(a.id);
      }
    }
  }

  getAll(): BattalionAgent[] { return Array.from(this.agents.values()); }

  get(id: string): BattalionAgent | undefined { return this.agents.get(id); }

  getByLine(line: "corona" | "hierro"): BattalionAgent[] { return this.byLine.get(line) ?? []; }

  getByArea(area: string): BattalionAgent[] { return this.byArea.get(area) ?? []; }

  getByRank(rank: string): BattalionAgent[] { return this.byRank.get(rank) ?? []; }

  getAreas(): string[] { return Array.from(this.byArea.keys()); }

  getSovereigns(): BattalionAgent[] {
    return [this.agents.get("trinnity-hurtado")!, this.agents.get("pedro-costa")!].filter(Boolean);
  }

  getChildrenOf(parentId: string): BattalionAgent[] {
    const parent = this.agents.get(parentId);
    return parent ? parent.children.map(id => this.agents.get(id)!).filter(Boolean) : [];
  }

  count(): number { return this.agents.size; }

  createTVSAgents(): IAgent[] {
    const result: IAgent[] = [];
    for (const a of AGENTS) {
      const agent: IAgent = {
        id: `tvs_${a.id}`,
        name: a.name,
        role: `${a.rank} • ${a.area} • ${a.doctrine.slice(0, 80)}`,
        status: "ACTIVE",
        capabilities: [`lineage:${a.line}`, `rank:${a.rank}`, `depth:${a.depth}`, `area:${a.area}`, ...a.specialties],
        execute: async (task: string): Promise<AgentExecutionResult> => ({
          agentId: `tvs_${a.id}`,
          agentName: a.name,
          success: true,
          output: `[${a.epithet}] ${a.doctrine}\nTask: ${task}\nLineage: ${a.line} • Depth: ${a.depth} • Area: ${a.area}\nAutonomy: ${a.autonomy}`,
          executionTimeMs: Math.floor(Math.random() * 50 + 10),
        }),
      };
      result.push(agent);
    }
    return result;
  }
}

// Singleton
export const battalionRegistry = new BattalionRegistry();
