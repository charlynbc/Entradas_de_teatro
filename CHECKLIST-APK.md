# 🍞 CHECKLIST HORNEADO DEL APK - BACO TEATRO

## 📋 PRE-REQUISITOS

### ✅ Ya tenés (completados):
- [x] App Expo creada (`baco-teatro-app/`)
- [x] Backend funcionando en Render
- [x] Cuenta Expo creada
- [x] EAS CLI instalado globalmente
- [x] Login en EAS exitoso (`eas login`)
- [x] `eas.json` configurado con perfil production

### 🔧 Antes de hornear:
- [ ] Backend URL en `api/api.js` apuntando a producción
- [ ] `app.json` con package correcto: `com.bacoteatro.app`
- [ ] Assets (iconos) en carpeta `assets/` (pueden ser placeholders)

---

## 🍞 PASO A PASO: HORNEAR APK

### 1️⃣ Verificar que todo está listo

```bash
cd baco-teatro-app

# Ver configuración
cat app.json | grep -A2 "android"
# Debe mostrar: "package": "com.bacoteatro.app"

# Ver backend URL
cat api/api.js | grep API_URL
# Debe ser: https://tu-backend.onrender.com
```

**Checklist**:
- [ ] Package name correcto
- [ ] Backend URL apuntando a producción
- [ ] Permisos de cámara configurados

---

### 2️⃣ Iniciar el build (EL HORNEADO) 🔥

```bash
cd /workspaces/Entradas_de_teatro/baco-teatro-app

# Build APK para Android
eas build --platform android --profile production
```

**Expo va a hacer**:
1. ✅ Verificar credenciales
2. ✅ Subir código a servidores Expo
3. ✅ Compilar APK en la nube
4. ✅ Generar link de descarga

**Tiempo estimado**: 10-20 minutos ☕

**Checklist durante build**:
- [ ] Build inició correctamente
- [ ] No hay errores de dependencias
- [ ] Compilación completada
- [ ] Link de descarga recibido

---

### 3️⃣ Esperar a que termine (a veces llora) 😢

**Errores comunes**:

❌ **"Missing icon.png"**
```bash
# Crear icono placeholder 1024x1024
echo "Agregar icon.png en assets/"
```

❌ **"Package name conflict"**
```bash
# Cambiar package en app.json
nano app.json
# android.package: "com.bacoteatro.app"
```

❌ **"Dependencies not installed"**
```bash
npm install
```

**Checklist errores**:
- [ ] Sin errores de assets
- [ ] Sin conflictos de package
- [ ] Sin errores de dependencias

---

### 4️⃣ Descargar el APK 📥

Cuando termine el build:

```
✅ Build successful!

APK URL:
https://expo.dev/accounts/tu-cuenta/projects/baco-teatro-app/builds/abc123def456

Download: https://expo.dev/artifacts/eas/xyz789.apk
```

**Descargar**:
```bash
# Opción 1: Click en el link del terminal
# Opción 2: Visitar expo.dev/builds
# Opción 3: curl (desde terminal)
curl -o baco-teatro.apk "https://expo.dev/artifacts/eas/xyz789.apk"
```

**Checklist descarga**:
- [ ] APK descargado completo
- [ ] Tamaño ~50-100 MB
- [ ] Extensión `.apk`

---

### 5️⃣ Probar en Android real 📱

**Instalar APK**:

```bash
# Opción A: Transferir por USB
adb install baco-teatro.apk

# Opción B: Subir a Drive/Dropbox
# → Abrir desde celular
# → "Instalar app desconocida" → Permitir

# Opción C: WhatsApp/Telegram
# → Enviar APK
# → Descargar
# → Instalar
```

**Habilitar instalación**:
1. Configuración → Seguridad
2. "Fuentes desconocidas" → Activar
3. O permitir en app específica (Drive, WhatsApp)

**Checklist instalación**:
- [ ] APK instalado correctamente
- [ ] App aparece en menú
- [ ] Icono correcto
- [ ] Nombre "Baco Teatro"

---

### 6️⃣ Testing funcional 🧪

Abrir app y probar:

**Login**:
- [ ] Pantalla de login carga
- [ ] Ingresar teléfono: `+5491100000000`
- [ ] Ingresar password: `admin123`
- [ ] Login exitoso → ve Home Admin

**ADMIN**:
- [ ] Ver shows existentes
- [ ] Crear nueva función
- [ ] Generar tickets
- [ ] Asignar tickets a vendedor
- [ ] Ver reportes
- [ ] Escanear QR y validar

**VENDEDOR** (crear usuario vendedor primero):
- [ ] Login con vendedor
- [ ] Ver tickets asignados
- [ ] Reservar ticket
- [ ] Reportar venta
- [ ] Ver QR de ticket

**Checklist funcionalidad**:
- [ ] Login funciona
- [ ] API conecta con backend
- [ ] Cámara QR funciona
- [ ] Todas las pantallas cargan
- [ ] Sin crashes

---

### 7️⃣ Distribuir a los actores 🎭

**Métodos de distribución**:

**A) WhatsApp** (más fácil):
```
1. Subir APK a Drive/Dropbox
2. Obtener link público
3. Mandar por WhatsApp:
   "Hola! Instalá la app de Baco Teatro:
   [link al APK]
   
   Después de instalar:
   - Abrí la app
   - Te van a dar tu teléfono y contraseña
   - Logueate y listo!"
```

**B) Telegram**:
```
1. Crear canal/grupo "Baco Teatro App"
2. Subir APK directo
3. Los actores descargan desde ahí
```

**C) Drive** (más profesional):
```
1. Subir a Google Drive
2. Compartir con permisos "Cualquiera con el link"
3. Mandar link + instrucciones
```

**Checklist distribución**:
- [ ] APK accesible por link
- [ ] Instrucciones claras enviadas
- [ ] Credenciales de cada vendedor creadas
- [ ] Al menos 1 actor instaló y probó

---

## 🍏 BONUS: iOS (CHEF AVANZADO)

### Pre-requisitos iOS:
- [ ] Apple Developer ($99 USD/año)
- [ ] Mac o servicio cloud Mac
- [ ] Certificados iOS configurados

### Build iOS:

```bash
cd baco-teatro-app

# Configurar certificados
eas credentials

# Build para TestFlight (beta testing)
eas build --platform ios --profile production

# Esperar 15-30 minutos
# Apple va a revisar como si fuera examen de UTU 📝

# Subir a TestFlight
eas submit --platform ios
```

### TestFlight:

1. App sube a App Store Connect
2. Invitar testers por email
3. Testers instalan TestFlight
4. Testers instalan tu app desde TestFlight
5. Feedback y arreglos
6. Submit final a App Store (revisión 2-3 días)

**Checklist iOS**:
- [ ] Apple Developer activo
- [ ] Certificados configurados
- [ ] Build iOS exitoso
- [ ] App en TestFlight
- [ ] Testers invitados
- [ ] Feedback recibido
- [ ] App aprobada en App Store

---

## 🎯 CHECKLIST FINAL COMPLETO

### Backend:
- [x] Backend en Render funcionando
- [x] PostgreSQL con datos
- [x] Endpoints respondiendo
- [ ] URL pública configurada en app

### App Android:
- [x] Código Expo completo
- [x] EAS configurado
- [x] eas.json creado
- [ ] Build APK exitoso
- [ ] APK descargado
- [ ] APK instalado en device
- [ ] Testing completo OK
- [ ] Distribuido a actores

### App iOS (opcional):
- [ ] Apple Developer activo
- [ ] Build iOS exitoso
- [ ] TestFlight configurado
- [ ] App Store submission

### Distribución:
- [ ] APK en Drive/Dropbox
- [ ] Link compartido con actores
- [ ] Instrucciones enviadas
- [ ] Credenciales creadas
- [ ] Al menos 1 actor vendiendo

---

## 🚨 TROUBLESHOOTING

### "Build failed: Missing dependencies"
```bash
cd baco-teatro-app
rm -rf node_modules
npm install
eas build --platform android --clear-cache
```

### "APK no instala en Android"
```
1. Configuración → Seguridad
2. Activar "Fuentes desconocidas"
3. O permitir en app específica
```

### "App cierra al abrir"
```
- Verificar API_URL esté correcto
- Ver logs: adb logcat | grep ReactNative
- Rebuild con: eas build --platform android --clear-cache
```

### "Cámara no funciona"
```
- Verificar permisos en app.json
- Dar permisos en Android: Configuración → Apps → Baco Teatro → Permisos → Cámara
```

---

## 📞 RESUMEN EJECUTIVO

**Para pasar de código a APK instalable**:

1. ✅ `eas login` (ya hecho)
2. ✅ Crear `eas.json` (ya hecho)
3. ⏳ `eas build --platform android` (ahora)
4. ⏳ Esperar 10-20 min
5. ⏳ Descargar APK
6. ⏳ Instalar en Android
7. ⏳ Probar login + funcionalidades
8. ⏳ Distribuir a actores por WhatsApp/Drive

**Tiempo total**: 30-45 minutos

**Resultado**: App instalable funcionando en celulares reales 🎭📱🔥

---

¿Querés que ejecute el build ahora? 🍞
