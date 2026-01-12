import pg from 'pg';

const pool = new pg.Pool({
    connectionString: 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function test() {
    try {
        // Verificar columnas de funciones
        const schemaCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'funciones' AND column_name IN ('obra_id', 'grupo_id')
        `);
        console.log('Columnas detectadas:', schemaCheck.rows.map(r => r.column_name));
        
        // Contar funciones
        const count = await pool.query('SELECT COUNT(*) FROM funciones');
        console.log('Total funciones:', count.rows[0].count);
        
        // Intentar el query completo
        const query = `
            SELECT 
                f.id,
                f.fecha,
                f.lugar,
                f.capacidad,
                f.precio_base,
                f.foto_url,
                f.estado,
                o.nombre as obra_nombre,
                o.descripcion as obra_descripcion,
                g.nombre as grupo_nombre,
                COUNT(t.code) FILTER (WHERE t.estado = 'DISPONIBLE') as entradas_disponibles
            FROM funciones f
            JOIN obras o ON f.obra_id = o.id
            JOIN grupos g ON o.grupo_id = g.id
            LEFT JOIN tickets t ON t.funcion_id = f.id
            WHERE f.fecha > CURRENT_TIMESTAMP
                AND f.estado = 'PROGRAMADA'
                AND o.estado = 'LISTA'
                AND g.estado = 'ACTIVO'
            GROUP BY f.id, o.nombre, o.descripcion, g.nombre
            ORDER BY f.fecha ASC
        `;
        
        const result = await pool.query(query);
        console.log('Funciones encontradas:', result.rows.length);
        console.log('Funciones:', JSON.stringify(result.rows, null, 2));
        
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

test();
