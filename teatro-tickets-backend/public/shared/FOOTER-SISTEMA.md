# 🎭 Sistema de Footers Baco Teatro

## ✅ IMPLEMENTADO

### 📁 Archivos Creados

**Footers (3 variantes, mismo CSS):**
- `/shared/footer-publico.html` - Para páginas públicas (cartelera, compra)
- `/shared/footer-interno.html` - Para dashboards internos (director/actor)
- `/shared/footer-legal.html` - Para términos y privacidad

**CSS:**
- `/css/baco-footer.css` - Estilos mobile-first, minimalista, elegante

**Sistema Automático:**
- `/shared/layout-loader.js` - Detecta automáticamente qué footer cargar

---

## 🎨 Características

✅ **Un solo footer por página** (nunca duplicado)  
✅ **Mobile-first** (max-width: 480px, centrado)  
✅ **Minimalista** (3 líneas máximo)  
✅ **Sin navegación** (el footer cierra, no explica)  
✅ **Detección automática** por ruta de página  
✅ **Mismo CSS** para las 3 variantes  

---

## 🧩 Uso en HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Página - Baco Teatro</title>
  
  <!-- CSS del footer -->
  <link rel="stylesheet" href="/css/baco-footer.css">
</head>
<body>
  <!-- Tu contenido aquí -->
  
  <!-- Footer (se carga automáticamente) -->
  <div id="footer-container"></div>
  
  <!-- Sistema de carga automática -->
  <script src="/shared/layout-loader.js"></script>
</body>
</html>
```

---

## 🔍 Detección Automática

El sistema detecta **qué footer cargar** según la ruta:

| Ruta | Footer |
|------|--------|
| `/terminos-y-condiciones.html` | footer-legal.html |
| `/politica-privacidad.html` | footer-legal.html |
| `/pages/roles/*` | footer-interno.html |
| `/pages/admin/*` | footer-interno.html |
| `/pages/grupos/*` | footer-interno.html |
| Resto | footer-publico.html |

---

## 📋 Páginas Actualizadas

✅ guia.html  
✅ sobre-baco.html  
✅ proximas-funciones.html  
✅ terminos-y-condiciones.html  
✅ politica-privacidad.html  

---

## 🎯 Próximos Pasos

### Páginas públicas pendientes:
- [ ] funciones-hoy.html
- [ ] funciones.html
- [ ] obra.html
- [ ] desarrollador.html
- [ ] index.html (mantener diseño actual)

### Páginas internas pendientes:
- [ ] pages/roles/super.html
- [ ] pages/roles/actor.html
- [ ] pages/roles/director.html
- [ ] Resto de dashboards

---

## 🚫 Reglas de Oro (NO ROMPER)

❌ No meter navegación en el footer  
❌ No repetir nombre de grupo/usuario  
❌ No repetir títulos de la página  
❌ No más de 3 líneas  
❌ No footer sticky/pegajoso  
❌ **Nunca copiar el footer inline en cada archivo**  

---

## 🎭 El footer es el telón que baja. No el actor principal.
