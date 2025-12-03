# Configuración de Base de Datos en Render

## Información de la Base de Datos

- **Servicio**: dpg-d4mqerq4d50c73et3un0-a
- **Nombre**: teatro_tickets
- **Región**: Oregon (US West)
- **Plan**: Free (256MB RAM, 0.1 CPU, 1GB storage)
- **PostgreSQL**: Versión 18
- **Expira**: 31 de diciembre de 2025

## URL de Conexión

```
postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets
```

## Configuración en Render

### Backend Service (baco-teatro-1jxj)

Ve a tu servicio de backend en Render y agrega las siguientes variables de entorno:

```bash
DATABASE_URL=postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets
JWT_SECRET=baco_teatro_secret_key_2024
NODE_ENV=production
PORT=3000
```

### Pasos para Configurar

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio de backend (baco-teatro-1jxj)
3. Ve a "Environment"
4. Haz clic en "Add Environment Variable"
5. Agrega cada variable mencionada arriba
6. Haz clic en "Save Changes"
7. El servicio se reiniciará automáticamente

## Super Usuario

El super usuario ya está creado en la base de datos:

- **Cédula**: 48376669
- **Password**: super123
- **Rol**: supremo
- **Nombre**: Super Baco

## Estado Actual de la Base de Datos

✅ Base de datos virgen y lista para usar:
- 1 usuario (solo el super usuario)
- 0 shows
- 0 tickets
- 0 ensayos

## Scripts Disponibles

### Verificar Estado de la Base de Datos
```bash
cd teatro-tickets-backend
node check-db-render.js
```

### Inicializar Super Usuario (si no existe)
```bash
cd teatro-tickets-backend
export DATABASE_URL='postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets'
node init-super-usuario-render.js
```

### Setup Completo
```bash
cd teatro-tickets-backend
node setup-db-render.js
```

## Conectarse con psql (Opcional)

```bash
psql postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets
```

## Notas Importantes

- La URL de conexión incluye el hostname completo `.oregon-postgres.render.com`
- SSL está habilitado automáticamente (rejectUnauthorized: false)
- El plan gratuito expira el 31 de diciembre de 2025
- La base de datos tiene 1GB de almacenamiento
- Actualmente usando 6.81% del almacenamiento

## Troubleshooting

Si el backend no puede conectarse:
1. Verifica que DATABASE_URL esté configurada en Render
2. Asegúrate de que el servicio se haya reiniciado después de agregar la variable
3. Revisa los logs del servicio en Render
4. Verifica que la base de datos esté "Available" en el dashboard
