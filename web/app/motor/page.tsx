"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import styles from "./motor.module.css";
import { DIAGRAM_FLOW, DIAGRAM_SCORE, DIAGRAM_ACTIVATION } from "./diagrams";

/**
 * Motor de propension - Cascada 360 (explainer).
 *
 * Ported from the standalone Colsubsidio artifact into an internal CRM page.
 * The three flowcharts were pre-rendered from Mermaid to static SVG
 * (see ./diagrams.ts) and are inlined here - no runtime mermaid dependency.
 * All styling lives in motor.module.css, fully scoped to this page.
 */
export default function MotorPage() {
  return (
    <>
      <AppHeader />
      <div className={styles.screen}>
        <div className={styles.wrap}>
          <div className={styles.backRow}>
            <Link href="/leads" className={styles.back}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Volver a Leads
            </Link>
          </div>

          <header className={styles.top}>
            <span className={styles.mark}>
              <span>K</span>
            </span>
            <span className={styles.brand}>
              Colsubsidio <b>· Seguros</b>
            </span>
          </header>

          <h1 className={styles.h1}>
            El <span className={styles.hl}>motor de propensión</span>, explicado
          </h1>
          <p className={styles.sub}>
            Cómo Colsubsidio decide, para cada afiliado, <b>qué seguro ofrecerle y por qué</b> — sin
            preguntar nada que ya sabe. Empecemos por los términos.
          </p>

          <div className={styles.thesis}>
            <p>
              <b>No inventamos datos.</b> Cada dato de este motor ya existe en Colsubsidio (aportes de
              nómina/PILA, registro de beneficiarios, recaudo de la cuota). La base del reto trae 5
              columnas; la operación real tiene 20+. <b>Conectarlo es un ETL, no un rediseño.</b>
            </p>
          </div>

          {/* ---------- Glosario ---------- */}
          <section className={styles.section}>
            <span className={styles.eyebrow}>Glosario</span>
            <h2 className={styles.h2}>Los términos, en una línea</h2>
            <p className={styles.lead}>Antes de los diagramas, qué significa cada palabra que verás.</p>
            <div className={styles.gloss}>
              <div className={styles.term}>
                <div className={styles.termT}>Propensión</div>
                <p>
                  Qué tan probable es que una persona <b>necesite/compre</b> cierto seguro. El motor la
                  calcula, de 0 a 100, para cada producto.
                </p>
              </div>
              <div className={styles.term}>
                <div className={styles.termT}>
                  Motor de propensión<span className={styles.badge}>Cascada 360</span>
                </div>
                <p>
                  El sistema que, con los datos del afiliado, <b>arma la mejor oferta y la explica</b>.
                  "Cascada 360" porque combina 3 capas de datos en cascada.
                </p>
              </div>
              <div className={styles.term}>
                <div className={styles.termT}>
                  Capas de datos<span className={styles.badge}>T1·T2·T3</span>
                </div>
                <p>
                  <b>T1 Censal</b>: lo que Colsubsidio tiene por ley (edad, salario, familia).{" "}
                  <b>T2 Transaccional</b>: cómo usa sus productos (droguería, vivienda, viajes).{" "}
                  <b>T3 Declarado</b>: lo que el cliente cuenta en el chat.
                </p>
              </div>
              <div className={styles.term}>
                <div className={styles.termT}>
                  Etapa de vida<span className={styles.badge}>E1–E6</span>
                </div>
                <p>
                  En qué momento de vida está el afiliado, deducido solo de datos censales. Define su{" "}
                  <b>"paquete base"</b> de seguros. Va de <b>E1 (joven)</b> a <b>E6 (adulto mayor)</b> —
                  el detalle más abajo.
                </p>
              </div>
              <div className={styles.term}>
                <div className={styles.termT}>Cobertura de datos</div>
                <p>
                  Qué <b>% del perfil está completo</b>. Alta (ej. 90%) → el motor sugiere con certeza.
                  Baja (ej. 30%, un no afiliado) → pregunta lo mínimo para completarlo.
                </p>
              </div>
              <div className={styles.term}>
                <div className={styles.termT}>Score</div>
                <p>
                  El <b>puntaje 0–100 por producto</b> = paquete base de su etapa + las reglas que
                  aplican. El más alto se ofrece primero.
                </p>
              </div>
              <div className={styles.term}>
                <div className={styles.termT}>Por-qué-NO</div>
                <p>
                  El motor también explica <b>por qué NO ofrece algo</b> (ej. la prima sería muy cara
                  para su ingreso). Transparencia, no venta a presión.
                </p>
              </div>
              <div className={styles.term}>
                <div className={styles.termT}>Audiencia</div>
                <p>
                  Un <b>grupo de afiliados con el mismo perfil/necesidad</b> (ej. "60+ sin exequial"),
                  listo para una campaña.
                </p>
              </div>
            </div>
          </section>

          {/* ---------- El flujo ---------- */}
          <section className={styles.section}>
            <span className={styles.eyebrow}>El flujo</span>
            <h2 className={styles.h2}>De la data a la venta, en 4 pasos</h2>
            <p className={styles.lead}>
              El diagrama muestra el camino; las burbujas de abajo explican cada paso.
            </p>
            <div className={styles.card}>
              <div
                className={styles.mermaid}
                role="img"
                aria-label="Flujo del motor: Datos T1 T2 T3, Motor Cascada 360, Perfil etiquetado, CRM Seguros"
                dangerouslySetInnerHTML={{ __html: DIAGRAM_FLOW }}
              />
            </div>
            <div className={styles.steps}>
              <div className={styles.bubble}>
                <span className={styles.n}>1</span>
                <h4>Datos</h4>
                <p>
                  Se juntan las <b>3 capas</b>: lo censal (T1), el uso de productos (T2) y lo que el
                  cliente declara (T3). Nada se inventa.
                </p>
              </div>
              <div className={styles.bubble}>
                <span className={styles.n}>2</span>
                <h4>Motor</h4>
                <p>
                  Con esos datos calcula un <b>score por producto</b> y elige el mejor bundle. Cada
                  decisión viene con su razón.
                </p>
              </div>
              <div className={`${styles.bubble} ${styles.bubbleYellow}`}>
                <span className={styles.n}>3</span>
                <h4>Perfil etiquetado</h4>
                <p>
                  El resultado: a cada persona se le pone una <b>audiencia</b> y un{" "}
                  <b>seguro sugerido</b>, con el porqué.
                </p>
              </div>
              <div className={styles.bubble}>
                <span className={styles.n}>4</span>
                <h4>CRM Seguros</h4>
                <p>
                  El lead aterriza en el CRM: primero en <b>Leads</b>, y cuando el agente lo trabaja pasa
                  al <b>Pipeline</b>.
                </p>
              </div>
            </div>
          </section>

          {/* ---------- Dentro del motor ---------- */}
          <section className={styles.section}>
            <span className={styles.eyebrow}>Dentro del motor</span>
            <h2 className={styles.h2}>Cómo sale el score</h2>
            <p className={styles.lead}>
              Dos ingredientes: la etapa de vida pone el punto de partida, y las reglas lo ajustan.
            </p>
            <div className={styles.card}>
              <div
                className={styles.mermaid}
                role="img"
                aria-label="Cómo sale el score: Etapa de vida E1 a E6 y Reglas con pesos alimentan el Score 0-100 por producto, que produce el Top-2 con porqué y por-qué-NO"
                dangerouslySetInnerHTML={{ __html: DIAGRAM_SCORE }}
              />
            </div>
            <div className={styles.steps}>
              <div className={styles.bubble}>
                <span className={styles.n}>A</span>
                <h4>Etapa → punto de partida</h4>
                <p>
                  Según la familia y la edad, el afiliado cae en una etapa (E1–E6) que ya trae un{" "}
                  <b>paquete base</b> de seguros con puntajes iniciales.
                </p>
              </div>
              <div className={styles.bubble}>
                <span className={styles.n}>B</span>
                <h4>Reglas → ajustes</h4>
                <p>
                  Unas 20 reglas suman puntos si aplican. Ej.: <b>"tiene hijos menores" → vida +25</b>;{" "}
                  <b>"compró un viaje" → viaje +45</b>. Si una regla no aplica, no suma ni resta.
                </p>
              </div>
              <div className={`${styles.bubble} ${styles.bubbleYellow}`}>
                <span className={styles.n}>C</span>
                <h4>Resultado explicable</h4>
                <p>
                  Se ofrecen los <b>2 productos de mayor score</b>, cada uno con su razón; y se dice
                  por-qué-NO otro (ej. "la prima sería el 6% de tu ingreso").
                </p>
              </div>
            </div>
          </section>

          {/* ---------- Etapas de vida ---------- */}
          <section className={styles.section}>
            <span className={styles.eyebrow}>Las etapas de vida</span>
            <h2 className={styles.h2}>Qué es E1, E2… E6</h2>
            <p className={styles.lead}>
              Cada etapa se deduce solo de datos censales y sugiere un paquete base distinto.
            </p>
            <div className={styles.stages}>
              <div className={styles.stage}>
                <span className={styles.stageId}>E1</span>
                <div className={styles.stageNm}>Joven base</div>
                <div className={styles.stageAge}>18–30 · sin hijos</div>
                <div className={styles.stageBd}>Accidentes, exequial, SOAT de entrada.</div>
              </div>
              <div className={styles.stage}>
                <span className={styles.stageId}>E2</span>
                <div className={styles.stageNm}>Familia inicial</div>
                <div className={styles.stageAge}>hijo 0–5 años</div>
                <div className={styles.stageBd}>Vida, educación, accidentes.</div>
              </div>
              <div className={styles.stage}>
                <span className={styles.stageId}>E3</span>
                <div className={styles.stageNm}>Familia escolar</div>
                <div className={styles.stageAge}>hijo 6–15 años</div>
                <div className={styles.stageBd}>Vida, accidentes, educación, hogar.</div>
              </div>
              <div className={styles.stage}>
                <span className={styles.stageId}>E4</span>
                <div className={styles.stageNm}>Hijos a la U</div>
                <div className={styles.stageAge}>hijo 16–24 años</div>
                <div className={styles.stageBd}>Vida-ahorro, vida.</div>
              </div>
              <div className={styles.stage}>
                <span className={styles.stageId}>E5</span>
                <div className={styles.stageNm}>Prejubilación</div>
                <div className={styles.stageAge}>50–59 años</div>
                <div className={styles.stageBd}>Exequial, salud, vida.</div>
              </div>
              <div className={styles.stage}>
                <span className={styles.stageId}>E6</span>
                <div className={styles.stageNm}>Adulto mayor</div>
                <div className={styles.stageAge}>60+ años</div>
                <div className={styles.stageBd}>Exequial, salud y asistencias.</div>
              </div>
            </div>
          </section>

          {/* ---------- Dos formas de activarlo ---------- */}
          <section className={styles.section}>
            <span className={styles.eyebrow}>Dos formas de activarlo</span>
            <h2 className={styles.h2}>El motor empuja; el agente consulta</h2>
            <p className={styles.lead}>El mismo score se usa de dos maneras.</p>
            <div className={styles.card}>
              <div
                className={styles.mermaid}
                role="img"
                aria-label="Dos formas de activar el motor: Prospección (push) donde el Motor arma Audiencia y dispara Campaña; y Sugerencia (pull) donde el Cliente escribe, se consulta Perfil + score y se da una Oferta con porqué"
                dangerouslySetInnerHTML={{ __html: DIAGRAM_ACTIVATION }}
              />
            </div>
            <div className={styles.steps}>
              <div className={styles.bubble}>
                <span className={styles.n}>↗</span>
                <h4>Prospección (push)</h4>
                <p>
                  El motor arma <b>audiencias</b> (ej. "hipoteca reciente sin seguro de hogar") y dispara
                  la campaña sola. Un afiliado recibe máximo <b>1 mensaje cada 30 días</b>.
                </p>
              </div>
              <div className={`${styles.bubble} ${styles.bubbleYellow}`}>
                <span className={styles.n}>↘</span>
                <h4>Sugerencia (pull)</h4>
                <p>
                  Cuando el cliente escribe, el agente <b>consulta su perfil + score</b> en vivo. Si falta
                  info, pregunta solo 2–3 cosas clave (no un formulario) y ofrece con el porqué.
                </p>
              </div>
            </div>
          </section>

          {/* ---------- Ejemplos ---------- */}
          <section className={styles.section}>
            <span className={styles.eyebrow}>Cómo se ve la salida</span>
            <h2 className={styles.h2}>Tres perfiles, tres ofertas distintas</h2>
            <p className={styles.lead}>
              El mismo motor, distinta persona, distinta recomendación — siempre con su razón.
            </p>
            <div className={styles.egs}>
              <div className={styles.eg}>
                <h3>Marcela · 38 · afiliada</h3>
                <span className={styles.cov}>cobertura 92%</span>
                <ul>
                  <li>
                    <b>Hogar (score 75)</b> — crédito hipotecario hace 9 meses, sin póliza de hogar
                  </li>
                  <li>
                    <b>Vida (75)</b> — 2 hijos menores como beneficiarios
                  </li>
                  <li>
                    <i>por-qué-NO</i> salud prepagada: prima 4.2% del ingreso
                  </li>
                </ul>
              </div>
              <div className={styles.eg}>
                <h3>Jorge · 63 · pensionado</h3>
                <span className={styles.cov}>cobertura 85% · etapa E6</span>
                <ul>
                  <li>
                    <b>Exequial (90)</b> — adulto mayor con grupo familiar amplio
                  </li>
                  <li>
                    <b>Asistencias (50)</b> — prioriza el contacto, nunca sube la prima
                  </li>
                  <li>
                    <i>por-qué-NO</i> vida tradicional: a su edad exige examen médico
                  </li>
                </ul>
              </div>
              <div className={styles.eg}>
                <h3>Laura · 31 · NO afiliada</h3>
                <span className={styles.cov}>cobertura 30% · declarado</span>
                <ul>
                  <li>
                    <b>Mascotas (60)</b> — 2 gatos ("según lo que me contaste")
                  </li>
                  <li>
                    <b>Hogar contenido (40)</b> — arrendataria
                  </li>
                  <li>gancho: "si te afilias, esta tarifa baja con tu categoría"</li>
                </ul>
              </div>
            </div>
          </section>

          <div className={styles.habeas}>
            <span className={styles.habeasIc}>§</span>
            <p>
              <b>Habeas Data por diseño.</b> Las señales sensibles (p. ej. compras crónicas en droguería){" "}
              <b>solo priorizan a quién contactar — jamás cambian la tarifa</b>, y el agente nunca las
              menciona. El dato elige qué ofrecer; el agente solo verbaliza lo que el cliente espera que
              Colsubsidio sepa.
            </p>
          </div>

          <p className={styles.foot}>
            Motor de propensión "Cascada 360": 3 capas de datos (censal / transaccional / declarado) →
            score explicable por producto → CRM Seguros. Degradación elegante: corre con lo que haya y
            pregunta solo lo que más score desbloquea.
          </p>
        </div>
      </div>
    </>
  );
}
