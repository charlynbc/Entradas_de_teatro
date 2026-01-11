# ⚡ QUICK START — PASO 4 (5 minutos)

## No leas nada. Solo haz esto:

### 1️⃣ Abre Copilot Chat

```
VS Code → Ctrl+Shift+I
```

### 2️⃣ Copia el Prompt

```
File: PROMPT-PASO-4-COPILOT.md
Selection: TODO (Ctrl+A)
Copy: Ctrl+C
```

### 3️⃣ Pega en Chat

```
En Copilot Chat → Ctrl+V
```

### 4️⃣ Envía

```
Enter
```

### 5️⃣ Espera

```
30 segundos (Copilot genera)
```

### 6️⃣ Copia Bloques

```
Para cada bloque de código:
- Selecciona (Ctrl+A en el bloque)
- Copia (Ctrl+C)
- Abre archivo correspondiente
- Reemplaza TODO (Ctrl+A, Ctrl+V)
- Guarda (Ctrl+S)
```

### 7️⃣ Testa

```
npm test
```

### 8️⃣ Commit

```bash
git add .
git commit -m "PASO 4: Copilot refactor completo"
git push origin main
```

---

## ¿Qué archivos va a generar Copilot?

| Archivo | Acción |
|---------|--------|
| `constants/ticketStates.js` | Actualiza (ya existe) |
| `services/ticketStateMachine.js` | Actualiza (ya existe) |
| `services/ticketService.js` | Actualiza (ya existe) |
| `services/ticketAuditService.js` | Actualiza (ya existe) |
| `services/cajaService.js` | Actualiza (ya existe) |
| `controllers/ticketsController.js` | Crea (nuevo) |

---

## ¿Cuál es el resultado?

- ✅ Controllers < 50 líneas
- ✅ Máquina de estados centralizada
- ✅ Transacciones ACID completas
- ✅ 0 duplicación de lógica
- ✅ Tests sin BD
- ✅ 100% backward compatible

---

## ¿Algo falla?

Si npm test falla o hay error:

```
Copilot, genera el error:
[PEGA EL ERROR AQUÍ]

¿Cómo lo arreglo?
```

Copilot lo corrige.

---

## 🎯 FIN

**Tiempo total:** 5-10 minutos  
**Complejidad:** Trivial (solo copiar/pegar)  
**Resultado:** Sistema refactorizado  

**ADELANTE CAPITÁN** 🚀
