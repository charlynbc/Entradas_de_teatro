export const DISCLAIMERS = {
  SISTEMA_NO_PROCESA: `Baco Teatro no procesa ni retiene dinero. Los pagos se realizan directamente a cuentas del grupo.`,
  CUENTA_DECLARADA: `Cuenta declarada por el director del grupo. Verificá antes de transferir.`,
  DIRECTOR_VALIDA: `Como director, sos responsable de validar que el pago haya ingresado realmente.`,
  MERCADOPAGO_REDIRECT: `Serás redirigido a la pasarela de pago. El pago se realizará a la cuenta del grupo.`,
  REPORTE_INTERNO: `Registro interno de operaciones. No constituye factura ni comprobante fiscal.`
};

export function mostrarDisclaimer(tipo, contenedor) {
  const texto = DISCLAIMERS[tipo];
  if (!texto) return;
  const div = document.createElement('div');
  div.className = 'disclaimer-box';
  div.innerHTML = `<p>${texto}</p>`;
  contenedor.insertBefore(div, contenedor.firstChild);
}
