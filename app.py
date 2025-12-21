from flask import Flask, render_template, request, redirect, url_for, flash, session
from functools import wraps
from datetime import datetime
import os
from database import Database
from models import Evento, Venta, Usuario

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

db = Database()

# Decorador para requerir login
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor inicia sesión', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Decorador para requerir rol de admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor inicia sesión', 'error')
            return redirect(url_for('login'))
        
        usuario = db.obtener_usuario_por_id(session['user_id'])
        if not usuario or usuario.rol not in ['admin', 'superuser']:
            flash('No tienes permisos para acceder a esta página', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Decorador para requerir rol de superuser
def superuser_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor inicia sesión', 'error')
            return redirect(url_for('login'))
        
        usuario = db.obtener_usuario_por_id(session['user_id'])
        if not usuario or usuario.rol != 'superuser':
            flash('No tienes permisos para acceder a esta página', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Decorador para requerir rol de director
def director_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor inicia sesión', 'error')
            return redirect(url_for('login'))
        
        usuario = db.obtener_usuario_por_id(session['user_id'])
        if not usuario or usuario.rol not in ['director', 'superuser']:
            flash('No tienes permisos para acceder a esta página', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Decorador para requerir rol de actor
def actor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor inicia sesión', 'error')
            return redirect(url_for('login'))
        
        usuario = db.obtener_usuario_por_id(session['user_id'])
        if not usuario or usuario.rol not in ['actor', 'superuser']:
            flash('No tienes permisos para acceder a esta página', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    """Página principal - muestra todos los eventos disponibles"""
    eventos = db.obtener_eventos()
    return render_template('index.html', eventos=eventos)

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    """Registro de nuevos usuarios"""
    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        telefono = request.form.get('telefono', '').strip()
        
        if not nombre or not email or not password:
            flash('Por favor complete todos los campos obligatorios', 'error')
            return render_template('registro.html')
        
        # Verificar si el email ya existe
        if db.obtener_usuario_por_email(email):
            flash('El email ya está registrado', 'error')
            return render_template('registro.html')
        
        # Crear usuario
        user_id = db.crear_usuario(nombre, email, password, telefono)
        if user_id:
            flash('Registro exitoso. Por favor inicia sesión', 'success')
            return redirect(url_for('login'))
        else:
            flash('Error al registrar usuario', 'error')
    
    return render_template('registro.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Inicio de sesión"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        
        usuario = db.verificar_credenciales(email, password)
        if usuario:
            session['user_id'] = usuario.id
            session['user_nombre'] = usuario.nombre
            session['user_email'] = usuario.email
            session['user_rol'] = usuario.rol
            flash(f'Bienvenido {usuario.nombre}!', 'success')
            
            # Redirigir según el rol del usuario
            if usuario.rol == 'superuser':
                return redirect(url_for('dashboard_superuser'))
            elif usuario.rol == 'director':
                return redirect(url_for('dashboard_director'))
            elif usuario.rol == 'actor':
                return redirect(url_for('dashboard_actor'))
            else:  # cliente
                return redirect(url_for('index'))
        else:
            flash('Email o contraseña incorrectos', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Cerrar sesión"""
    session.clear()
    flash('Sesión cerrada exitosamente', 'success')
    return redirect(url_for('index'))

@app.route('/perfil')
@login_required
def perfil():
    """Perfil del usuario"""
    usuario = db.obtener_usuario_por_id(session['user_id'])
    ventas = db.obtener_ventas_por_usuario(session['user_id'])
    return render_template('perfil.html', usuario=usuario, ventas=ventas)

@app.route('/evento/<int:evento_id>')
def detalle_evento(evento_id):
    """Página de detalle de un evento específico"""
    evento = db.obtener_evento(evento_id)
    if not evento:
        flash('Evento no encontrado', 'error')
        return redirect(url_for('index'))
    return render_template('detalle_evento.html', evento=evento)

@app.route('/comprar/<int:evento_id>', methods=['GET', 'POST'])
@login_required
def comprar(evento_id):
    """Proceso de compra de entradas"""
    evento = db.obtener_evento(evento_id)
    if not evento:
        flash('Evento no encontrado', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        cantidad = request.form.get('cantidad', type=int)
        
        if not cantidad or cantidad <= 0:
            flash('La cantidad debe ser mayor a 0', 'error')
            return render_template('comprar.html', evento=evento)
        
        if cantidad > evento.entradas_disponibles:
            flash(f'Solo hay {evento.entradas_disponibles} entradas disponibles', 'error')
            return render_template('comprar.html', evento=evento)
        
        # Procesar la compra
        total = cantidad * evento.precio
        usuario = db.obtener_usuario_por_id(session['user_id'])
        venta_id = db.crear_venta(evento_id, session['user_id'], cantidad, total)
        
        if venta_id:
            flash(f'Compra realizada exitosamente. ID de compra: {venta_id}', 'success')
            return redirect(url_for('confirmacion', venta_id=venta_id))
        else:
            flash('Error al procesar la compra. Puede que no haya suficientes entradas disponibles', 'error')
            return render_template('comprar.html', evento=evento)
    
    return render_template('comprar.html', evento=evento)

@app.route('/confirmacion/<int:venta_id>')
@login_required
def confirmacion(venta_id):
    """Página de confirmación de compra"""
    venta = db.obtener_venta(venta_id)
    if not venta:
        flash('Venta no encontrada', 'error')
        return redirect(url_for('index'))
    
    # Verificar que la venta pertenece al usuario actual
    if venta['user_id'] != session['user_id']:
        flash('No tienes permiso para ver esta venta', 'error')
        return redirect(url_for('index'))
    
    evento = db.obtener_evento(venta['evento_id'])
    usuario = db.obtener_usuario_por_id(venta['user_id'])
    return render_template('confirmacion.html', venta=venta, evento=evento, usuario=usuario)

# ==================== DASHBOARDS POR ROL ====================

@app.route('/dashboard/superuser')
@superuser_required
def dashboard_superuser():
    """Dashboard para Super Usuario"""
    eventos = db.obtener_eventos()
    ventas = db.obtener_todas_ventas()
    usuarios = db.obtener_todos_usuarios()
    
    # Estadísticas generales
    total_ventas = sum(v['total'] for v in ventas)
    total_entradas_vendidas = sum(v['cantidad'] for v in ventas)
    total_eventos = len(eventos)
    total_usuarios = len(usuarios)
    
    # Estadísticas por rol
    usuarios_por_rol = {}
    for usuario in usuarios:
        rol = usuario.rol
        usuarios_por_rol[rol] = usuarios_por_rol.get(rol, 0) + 1
    
    return render_template('dashboard_superuser.html', 
                         eventos=eventos,
                         ventas=ventas,
                         usuarios=usuarios,
                         total_ventas=total_ventas,
                         total_entradas_vendidas=total_entradas_vendidas,
                         total_eventos=total_eventos,
                         total_usuarios=total_usuarios,
                         usuarios_por_rol=usuarios_por_rol)

@app.route('/dashboard/director')
@director_required
def dashboard_director():
    """Dashboard para Director"""
    eventos = db.obtener_eventos()
    ventas = db.obtener_todas_ventas()
    
    # Estadísticas de eventos
    eventos_activos = [e for e in eventos if e.entradas_disponibles > 0]
    eventos_agotados = [e for e in eventos if e.entradas_disponibles == 0]
    
    # Estadísticas de ventas
    total_recaudado = sum(v['total'] for v in ventas)
    total_entradas = sum(v['cantidad'] for v in ventas)
    
    return render_template('dashboard_director.html',
                         eventos=eventos,
                         eventos_activos=len(eventos_activos),
                         eventos_agotados=len(eventos_agotados),
                         total_recaudado=total_recaudado,
                         total_entradas=total_entradas,
                         ventas=ventas[:10])  # Últimas 10 ventas

@app.route('/dashboard/actor')
@actor_required
def dashboard_actor():
    """Dashboard para Actor/Actriz"""
    eventos = db.obtener_eventos()
    
    # Para el actor, mostramos los eventos en los que participa
    # (En una implementación real, habría una tabla de relación actor-evento)
    mis_eventos = eventos[:5]  # Simulación
    
    proximos_eventos = [e for e in eventos if e.entradas_disponibles > 0]
    
    return render_template('dashboard_actor.html',
                         mis_eventos=mis_eventos,
                         proximos_eventos=proximos_eventos,
                         total_eventos=len(eventos))

# ==================== RUTAS DE ADMINISTRACIÓN ====================

@app.route('/admin')
@admin_required
def admin():
    """Panel de administración (para admin y superuser)"""
    eventos = db.obtener_eventos()
    ventas = db.obtener_todas_ventas()
    usuarios = db.obtener_todos_usuarios()
    
    # Estadísticas
    total_ventas = sum(v['total'] for v in ventas)
    total_entradas_vendidas = sum(v['cantidad'] for v in ventas)
    
    return render_template('admin.html', 
                         eventos=eventos, 
                         ventas=ventas, 
                         usuarios=usuarios,
                         total_ventas=total_ventas,
                         total_entradas_vendidas=total_entradas_vendidas)

@app.route('/admin/evento/nuevo', methods=['GET', 'POST'])
@admin_required
def nuevo_evento():
    """Crear un nuevo evento"""
    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        fecha = request.form.get('fecha', '').strip()
        hora = request.form.get('hora', '').strip()
        lugar = request.form.get('lugar', '').strip()
        precio = request.form.get('precio', type=float)
        entradas_disponibles = request.form.get('entradas_disponibles', type=int)
        descripcion = request.form.get('descripcion', '').strip()
        imagen_url = request.form.get('imagen_url', '').strip()
        
        if not all([nombre, fecha, hora, lugar, precio, entradas_disponibles]):
            flash('Por favor complete todos los campos obligatorios', 'error')
            return render_template('nuevo_evento.html')
        
        if db.crear_evento(nombre, fecha, hora, lugar, precio, entradas_disponibles, descripcion, imagen_url):
            flash('Evento creado exitosamente', 'success')
            return redirect(url_for('admin'))
        else:
            flash('Error al crear el evento', 'error')
    
    return render_template('nuevo_evento.html')

@app.route('/admin/evento/editar/<int:evento_id>', methods=['GET', 'POST'])
@admin_required
def editar_evento(evento_id):
    """Editar un evento existente"""
    evento = db.obtener_evento(evento_id)
    if not evento:
        flash('Evento no encontrado', 'error')
        return redirect(url_for('admin'))
    
    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        fecha = request.form.get('fecha', '').strip()
        hora = request.form.get('hora', '').strip()
        lugar = request.form.get('lugar', '').strip()
        precio = request.form.get('precio', type=float)
        entradas_disponibles = request.form.get('entradas_disponibles', type=int)
        descripcion = request.form.get('descripcion', '').strip()
        imagen_url = request.form.get('imagen_url', '').strip()
        
        if db.actualizar_evento(evento_id, nombre, fecha, hora, lugar, precio, entradas_disponibles, descripcion, imagen_url):
            flash('Evento actualizado exitosamente', 'success')
            return redirect(url_for('admin'))
        else:
            flash('Error al actualizar el evento', 'error')
    
    return render_template('editar_evento.html', evento=evento)

@app.route('/admin/evento/eliminar/<int:evento_id>')
@admin_required
def eliminar_evento(evento_id):
    """Eliminar un evento"""
    if db.eliminar_evento(evento_id):
        flash('Evento eliminado exitosamente', 'success')
    else:
        flash('Error al eliminar el evento. Puede que tenga ventas asociadas', 'error')
    return redirect(url_for('admin'))

@app.route('/admin/usuarios')
@admin_required
def admin_usuarios():
    """Gestión de usuarios"""
    usuarios = db.obtener_todos_usuarios()
    return render_template('admin_usuarios.html', usuarios=usuarios)

@app.route('/admin/usuario/cambiar-rol/<int:user_id>/<nuevo_rol>')
@superuser_required
def cambiar_rol_usuario(user_id, nuevo_rol):
    """Cambiar el rol de un usuario (solo superuser)"""
    if nuevo_rol not in ['cliente', 'admin', 'director', 'actor', 'superuser']:
        flash('Rol inválido', 'error')
        return redirect(url_for('admin_usuarios'))
    
    if db.cambiar_rol_usuario(user_id, nuevo_rol):
        flash('Rol actualizado exitosamente', 'success')
    else:
        flash('Error al actualizar el rol', 'error')
    
    return redirect(url_for('admin_usuarios'))

@app.route('/admin/ventas')
@admin_required
def admin_ventas():
    """Reporte de ventas"""
    ventas = db.obtener_todas_ventas()
    return render_template('admin_ventas.html', ventas=ventas)

@app.route('/mis-compras')
def mis_compras():
    """Buscar compras por email (para usuarios no registrados)"""
    return render_template('mis_compras.html')

@app.route('/buscar-compras', methods=['POST'])
def buscar_compras():
    """Buscar compras por email"""
    email = request.form.get('email', '').strip()
    if not email:
        flash('Por favor ingrese un email', 'error')
        return redirect(url_for('mis_compras'))
    
    ventas = db.obtener_ventas_por_email(email)
    return render_template('resultado_compras.html', ventas=ventas, email=email)

# Manejo de errores
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
    db.inicializar_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
