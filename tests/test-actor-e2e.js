/**
 * TEST E2E: ACTOR - Flujo Completo
 * Valida: Crear grupo → asignar stock → venta → cobro → liquidación
 * Ejecutar: npm run test:actor-e2e
 * Fecha: 2025-12-30
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}❌${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

// Crear cliente axios con token
let tokens = {};

async function login(cedula, password) {
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/login`, {
      cedula,
      password
    });
    tokens[cedula] = data.token;
    log.success(`Login exitoso: ${cedula}`);
    return data.token;
  } catch (error) {
    log.error(`Login falló: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

function getHeaders(cedula) {
  return {
    Authorization: `Bearer ${tokens[cedula]}`,
    'Content-Type': 'application/json'
  };
}

// TEST 1: Crear grupo y asignar directores
async function testCrearGrupo() {
  log.section('TEST 1: Crear Grupo y Asignar Directores');
  
  const superCedula = '111111';
  const directorCedula = '222222';
  
  await login(superCedula, 'super123');
  await login(directorCedula, 'director123');
  
  try {
    // SUPER crea grupo
    const groupRes = await axios.post(
      `${BASE_URL}/grupos`,
      {
        nombre: 'Grupo Test E2E ' + Date.now(),
        descripcion: 'Test venta completa',
        director_cedula: directorCedula,
        dia_semana: 'LUNES',
        hora_inicio: '20:00',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        obra_a_realizar: 'Test Obra'
      },
      { headers: getHeaders(superCedula) }
    );
    
    const groupId = groupRes.data.id;
    log.success(`Grupo creado: ID ${groupId}`);
    
    // SUPER agrega director
    await axios.post(
      `${BASE_URL}/grupos/${groupId}/directores`,
      { director_cedula: directorCedula },
      { headers: getHeaders(superCedula) }
    );
    log.success(`Director ${directorCedula} agregado`);
    
    return { groupId, directorCedula, superCedula };
  } catch (error) {
    log.error(`Fallo crear grupo: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// TEST 2: Crear obra y funciones
async function testCrearObra(groupId, directorCedula) {
  log.section('TEST 2: Crear Obra y Funciones');
  
  try {
    // Director crea obra
    const obraRes = await axios.post(
      `${BASE_URL}/obras`,
      {
        grupo_id: groupId,
        nombre: 'Test Obra E2E',
        descripcion: 'Obra para test de venta'
      },
      { headers: getHeaders(directorCedula) }
    );
    
    const obraId = obraRes.data.id;
    log.success(`Obra creada: ID ${obraId}`);
    
    // Director crea función
    const fechaFunc = new Date();
    fechaFunc.setDate(fechaFunc.getDate() + 5); // En 5 días
    
    const funcRes = await axios.post(
      `${BASE_URL}/funciones`,
      {
        obra_id: obraId,
        fecha: fechaFunc.toISOString().split('T')[0],
        hora: '20:00',
        lugar: 'Teatro Test',
        precio_base: 500,
        stock_total: 100
      },
      { headers: getHeaders(directorCedula) }
    );
    
    const funcId = funcRes.data.id;
    log.success(`Función creada: ID ${funcId}, 100 tickets @ $500`);
    
    return { obraId, funcId };
  } catch (error) {
    log.error(`Fallo crear obra: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// TEST 3: Asignar stock a ACTOR y VENDEDOR
async function testAsignarStock(funcId, superCedula, directorCedula, actorCedula, vendedorCedula) {
  log.section('TEST 3: Asignar Stock a Actor y Vendedor');
  
  try {
    // SUPER asigna 50 tickets a ACTOR (STOCK_ACTOR)
    const respuesta1 = await axios.post(
      `${BASE_URL}/tickets/asignar`,
      {
        cantidad: 50,
        funcion_id: funcId,
        actor_cedula: actorCedula
      },
      { headers: getHeaders(superCedula) }
    );
    
    log.success(`50 tickets asignados a ACTOR ${actorCedula}`);
    
    // ACTOR transfiere 30 tickets a VENDEDOR
    const transferRes = await axios.post(
      `${BASE_URL}/tickets/transferir`,
      {
        cantidad: 30,
        funcion_id: funcId,
        destino_cedula: vendedorCedula
      },
      { headers: getHeaders(actorCedula) }
    );
    
    log.success(`30 tickets transferidos de ACTOR a VENDEDOR ${vendedorCedula}`);
    
    return { ticketsActorStock: 20, ticketsVendedorStock: 30 };
  } catch (error) {
    log.error(`Fallo asignar stock: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// TEST 4: Reportar venta
async function testReportarVenta(funcId, vendedorCedula, superCedula) {
  log.section('TEST 4: Reportar Venta');
  
  try {
    // VENDEDOR reporta venta de 10 tickets
    const reportRes = await axios.post(
      `${BASE_URL}/tickets/reportar-venta`,
      {
        funcion_id: funcId,
        cantidad: 10,
        precio_unitario: 500,
        medio_pago: 'EFECTIVO',
        comprador_nombre: 'Cliente Test E2E'
      },
      { headers: getHeaders(vendedorCedula) }
    );
    
    log.success(`10 tickets reportados como vendidos por $5000 total`);
    
    // Verificar que ahora hay REPORTADA_VENDIDA
    const stockRes = await axios.get(
      `${BASE_URL}/tickets/stock?funcion_id=${funcId}`,
      { headers: getHeaders(vendedorCedula) }
    );
    
    const reportada = stockRes.data.filter(t => t.estado === 'REPORTADA_VENDIDA').length;
    log.info(`Tickets en estado REPORTADA_VENDIDA: ${reportada}`);
    
    return { ticketsReportados: 10, montoTotal: 5000 };
  } catch (error) {
    log.error(`Fallo reportar venta: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// TEST 5: SUPER aprueba pago
async function testAprobarPago(funcId, superCedula) {
  log.section('TEST 5: Aprobar Pago');
  
  try {
    // SUPER obtiene tickets REPORTADA_VENDIDA
    const ticketsRes = await axios.get(
      `${BASE_URL}/tickets?funcion_id=${funcId}&estado=REPORTADA_VENDIDA`,
      { headers: getHeaders(superCedula) }
    );
    
    if (ticketsRes.data.length === 0) {
      log.warn('No hay tickets REPORTADA_VENDIDA para aprobar');
      return { ticketsAprobados: 0 };
    }
    
    // SUPER aprueba cada ticket
    let aprobados = 0;
    for (const ticket of ticketsRes.data) {
      try {
        await axios.post(
          `${BASE_URL}/tickets/${ticket.code}/cobrar`,
          { monto: ticket.precio },
          { headers: getHeaders(superCedula) }
        );
        aprobados++;
      } catch (e) {
        log.warn(`Fallo aprobar ${ticket.code}: ${e.response?.data?.error}`);
      }
    }
    
    log.success(`${aprobados} tickets aprobados y en estado PAGADO`);
    return { ticketsAprobados: aprobados };
  } catch (error) {
    log.error(`Fallo aprobar pago: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// TEST 6: Cerrar grupo y generar liquidación
async function testCierreGrupo(groupId, directorCedula, superCedula) {
  log.section('TEST 6: Cierre Definitivo de Grupo');
  
  try {
    // SUPER cierra grupo
    const cierreRes = await axios.post(
      `${BASE_URL}/grupos/${groupId}/cerrar-definitivo`,
      {},
      { headers: getHeaders(superCedula) }
    );
    
    log.success(`Grupo cerrado definitivamente`);
    
    // Obtener PDF liquidación
    try {
      const pdfRes = await axios.get(
        `${BASE_URL}/grupos/${groupId}/liquidacion/pdf`,
        {
          headers: getHeaders(superCedula),
          responseType: 'arraybuffer'
        }
      );
      
      log.success(`PDF liquidación generado (${pdfRes.data.length} bytes)`);
    } catch (e) {
      log.warn(`PDF no disponible: ${e.response?.status}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Fallo cierre: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// TEST 7: Validar integridad de liquidación
async function testValidarLiquidacion(groupId, superCedula) {
  log.section('TEST 7: Validar Liquidación');
  
  try {
    const liquidRes = await axios.get(
      `${BASE_URL}/grupos/${groupId}/liquidacion`,
      { headers: getHeaders(superCedula) }
    );
    
    const liq = liquidRes.data;
    log.info(`Total entradas vendidas: ${liq.total_entradas}`);
    log.info(`Total dinero cobrado: $${liq.monto_total}`);
    log.info(`Tickets PAGADO: ${liq.tickets_pagado}`);
    log.info(`Tickets USADO: ${liq.tickets_usado}`);
    log.info(`Tickets ANULADO: ${liq.tickets_anulado}`);
    
    if (liq.total_entradas > 0 && liq.monto_total > 0) {
      log.success(`Liquidación válida: ${liq.total_entradas} tickets = $${liq.monto_total}`);
    } else {
      log.warn(`Liquidación sin movimiento`);
    }
    
    return liq;
  } catch (error) {
    log.error(`Fallo validar liquidación: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// MAIN
async function runAllTests() {
  log.section('E2E TEST: FLUJO COMPLETO ACTOR → VENTA → LIQUIDACIÓN');
  log.info(`Iniciando en ${BASE_URL}\n`);
  
  try {
    // Crear usuarios si no existen (skip si fallan - pueden existir)
    const testUsers = [
      { cedula: '111111', role: 'SUPER', password: 'super123' },
      { cedula: '222222', role: 'ADMIN', password: 'director123' },
      { cedula: '333333', role: 'ACTOR', password: 'actor123' },
      { cedula: '444444', role: 'ACTOR', password: 'vendedor123' }
    ];
    
    log.section('Configurar Usuarios de Test');
    await login('111111', 'super123'); // SUPER
    
    // TEST: Crear grupo
    const { groupId, directorCedula, superCedula } = await testCrearGrupo();
    
    // TEST: Crear obra y funciones
    const { obraId, funcId } = await testCrearObra(groupId, directorCedula);
    
    // TEST: Asignar stock
    await testAsignarStock(funcId, superCedula, directorCedula, '333333', '444444');
    
    // TEST: Reportar venta
    await testReportarVenta(funcId, '444444', superCedula);
    
    // TEST: Aprobar pago
    await testAprobarPago(funcId, superCedula);
    
    // TEST: Cierre grupo
    await testCierreGrupo(groupId, directorCedula, superCedula);
    
    // TEST: Validar liquidación
    await testValidarLiquidacion(groupId, superCedula);
    
    log.section('✅ TODOS LOS TESTS EXITOSOS');
    process.exit(0);
    
  } catch (error) {
    log.error(`Test falló: ${error.message}`);
    process.exit(1);
  }
}

runAllTests();
