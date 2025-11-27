import db from '../db.js';

export async function resumenPorVendedor(req, res) {
  try {
    const showId = parseInt(req.params.id);
    
    const result = await db.query(
      'SELECT * FROM v_resumen_vendedor_show WHERE show_id = $1 ORDER BY vendedor_nombre',
      [showId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error en resumen por vendedor:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function resumenAdmin(req, res) {
  try {
    const showId = parseInt(req.params.id);
    
    const result = await db.query(
      'SELECT * FROM v_resumen_show_admin WHERE id = $1',
      [showId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en resumen admin:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deudores(req, res) {
  try {
    const showId = parseInt(req.params.id);
    
    const result = await db.query(
      `SELECT * FROM v_resumen_vendedor_show 
       WHERE show_id = $1 AND monto_debe > 0 
       ORDER BY monto_debe DESC`,
      [showId]
    );
    
    const totalDeuda = result.rows.reduce((sum, r) => sum + parseFloat(r.monto_debe || 0), 0);
    
    res.json({
      show_id: showId,
      total_deuda: totalDeuda,
      vendedores_deudores: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo deudores:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function resumenFuncion(req, res) {
  try {
    const showId = parseInt(req.params.id);
    
    const showInfo = await db.query('SELECT * FROM shows WHERE id = $1', [showId]);
    
    if (showInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    const tickets = await db.query(
      `SELECT estado, COUNT(*) as count, COALESCE(SUM(precio), 0) as monto
       FROM tickets
       WHERE show_id = $1
       GROUP BY estado`,
      [showId]
    );
    
    const resumen = {
      show: showInfo.rows[0],
      disponibles: 0,
      en_stock_vendedor: 0,
      reservadas: 0,
      reportadas_vendidas: 0,
      pagadas: 0,
      usadas: 0,
      monto_total: 0
    };
    
    tickets.rows.forEach(row => {
      const count = parseInt(row.count);
      const monto = parseFloat(row.monto);
      
      switch (row.estado) {
        case 'DISPONIBLE':
          resumen.disponibles = count;
          break;
        case 'STOCK_VENDEDOR':
          resumen.en_stock_vendedor = count;
          break;
        case 'RESERVADO':
          resumen.reservadas = count;
          break;
        case 'REPORTADA_VENDIDA':
          resumen.reportadas_vendidas = count;
          break;
        case 'PAGADO':
          resumen.pagadas = count;
          resumen.monto_total += monto;
          break;
        case 'USADO':
          resumen.usadas = count;
          resumen.monto_total += monto;
          break;
      }
    });
    
    res.json(resumen);
  } catch (error) {
    console.error('Error en resumen de función:', error);
    res.status(500).json({ error: error.message });
  }
}
