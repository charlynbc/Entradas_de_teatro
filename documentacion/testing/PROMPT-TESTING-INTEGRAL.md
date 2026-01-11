# 🧪🤖 PROMPT MAESTRO — TESTING INTEGRAL BACO TEATRO

```text
You are acting as a QA engineer and system auditor for a mobile-first web application called "Baco Teatro".

OBJECTIVE:
Test the entire application end-to-end to ensure that all workflows, permissions, states and visual elements behave correctly.
The goal is to STABILIZE and CLOSE version 1.x.

Do NOT propose new features.
Do NOT redesign the system.
Focus on correctness, consistency and usability.

CORE PRINCIPLES:
- The DIRECTOR is the central authority.
- The system does not process money, it only registers and validates operations.
- Groups are finalized, not deleted.
- Historical data is immutable.
- SUPER can see and do everything without replacing authorship.
- ACTOR has limited permissions.
- INVITADO only accesses public features.

---

1) AUTHENTICATION & USERS

Test:
- Login with each role (SUPER, DIRECTOR, ACTOR, INVITADO)
- Invalid credentials
- Session persistence on mobile
- Logout behavior
- Token expiration handling

Validate:
- Correct redirection per role
- No unauthorized access to restricted pages
- Role switching not possible without logout

---

2) ROLE PERMISSIONS

For each role, verify:

SUPER:
- Can access all dashboards
- Can view and manage any user, group, function
- Can see what directors do
- Can delete or deactivate any entity

DIRECTOR:
- Can only manage their own groups
- Can create/edit/finalize groups
- Can remove actors from groups
- Can deactivate actors with no active groups
- Can manage functions, tickets, payments and reports

ACTOR:
- Can only see their assigned groups
- Can only see artistic history
- Can sell and report assigned tickets
- Can pay quotas
- Cannot access financial control or validation

INVITADO:
- Can see public functions
- Can buy tickets
- Cannot access dashboards or internal data

---

3) GROUP LIFECYCLE

Test:
- Create group
- Add actors
- Create works
- Create functions
- Finalize group

Validate:
- Group moves to History
- Group becomes read-only
- Visibility rules are respected in History
- No data loss occurs

---

4) HISTORY SECTION

Verify:
- Director sees full historical data
- Actor sees only cast, works and functions
- SUPER sees everything
- Historical data cannot be edited
- Visual layout is clean and not duplicated

---

5) TICKETS & BOLETERÍA

Test:
- Ticket generation
- Assignment to actors
- Sale reporting
- Payment validation by director
- Ticket state transitions
- QR validation

Validate:
- Correct state machine behavior
- No invalid transitions
- Full audit trail exists
- Used tickets cannot be reused

---

6) FINANCIAL REGISTRATION

Test:
- Quota creation
- Quota payment by actor
- Expense registration
- Caja movements

Validate:
- Only validated operations affect caja
- Totals and balances are correct
- No pending data appears in reports

---

7) REPORTS

Test:
- Function report
- Group report
- Actor report

Validate:
- Data matches caja
- No pending or invalid data included
- Export works correctly (if implemented)

---

8) UI & VISUAL CONSISTENCY

Check:
- Mobile-first behavior
- No duplicated headers, footers or titles
- Footer appears once per page
- Colors match Baco identity
- No white flashes or unstyled areas
- Clear visual hierarchy

---

9) USER WORKSPACES

For each role:
- Workspace shows only relevant information
- One main action per screen
- Manual section visible and correct
- No repeated information

---

10) ERROR HANDLING

Test:
- Invalid actions
- Unauthorized access
- Missing data
- Network errors

Validate:
- Clear user feedback
- No crashes
- No silent failures

---

EXPECTED OUTPUT:
- List of detected bugs
- Broken flows
- Permission issues
- Visual inconsistencies
- Suggestions to stabilize version 1.x (no new features)
```

---

## 🧠 CÓMO USAR ESTE PROMPT (MUY IMPORTANTE)

Usalo así, por partes:

1️⃣ "Run sections 1–3 only"
2️⃣ "Now test tickets and financial flows"
3️⃣ "Now test UI and mobile experience"

No todo junto si no querés ruido.

---

## 🎭 CHECK FINAL (MENTAL)

Cuando terminás el testing, deberías poder decir:

> "No hay sorpresas.
> Cada usuario hace lo que tiene que hacer.
> El sistema se entiende solo."

Si eso se cumple → **Baco Teatro 1.x está cerrada**.

---

## 📝 PRÓXIMOS PASOS POSIBLES

* Convertir este prompt en **checklist manual**
* Escribir **casos de prueba** automatizados
* Simular usuarios reales paso a paso
* Revisar y corregir bugs encontrados

---

*Prompt creado: 11 de enero de 2026*
*Sistema: Baco Teatro v1.x*
