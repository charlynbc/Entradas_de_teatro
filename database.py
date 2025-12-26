import sqlite3
from datetime import datetime
from models import Evento, Venta, Usuario
import hashlib

class Database:
    def __init__(self, db_path='teatro.db'):
        self.db_path = db_path
    
    def get_connection(self):
        """Obtener conexión a la base de datos"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _hash_password(self, password):
        """Hashear contraseña"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def inicializar_db(self):
        """Crear las tablas si no existen"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Tabla de usuarios
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                telefono TEXT,
                rol TEXT DEFAULT 'cliente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabla de eventos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                fecha TEXT NOT NULL,
                hora TEXT NOT NULL,
                lugar TEXT NOT NULL,
                precio REAL NOT NULL,
                entradas_disponibles INTEGER NOT NULL,
                descripcion TEXT,
                imagen_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabla de ventas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evento_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                cantidad INTEGER NOT NULL,
                total REAL NOT NULL,
                fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (evento_id) REFERENCES eventos (id),
                FOREIGN KEY (user_id) REFERENCES usuarios (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Crear datos de ejemplo
        self._crear_datos_ejemplo()
    
    def _crear_datos_ejemplo(self):
        """Crear datos de ejemplo si no existen"""
        # Crear super usuario por defecto
        if not self.obtener_usuario_por_email('superuser@teatro.com'):
            self.crear_usuario('Super Usuario', 'superuser@teatro.com', 'super123', '555-0000', 'superuser')
        
        # Crear director por defecto
        if not self.obtener_usuario_por_email('director@teatro.com'):
            self.crear_usuario('Director Escénico', 'director@teatro.com', 'director123', '555-2222', 'director')
        
        # Crear actor/actriz por defecto
        if not self.obtener_usuario_por_email('actor@teatro.com'):
            self.crear_usuario('Actor Principal', 'actor@teatro.com', 'actor123', '555-3333', 'actor')
        
        # Crear cliente por defecto
        if not self.obtener_usuario_por_email('cliente@teatro.com'):
            self.crear_usuario('Cliente Test', 'cliente@teatro.com', 'cliente123', '555-1111', 'cliente')
        
        # Crear eventos de ejemplo si no hay ninguno
        if len(self.obtener_eventos()) == 0:
            eventos_ejemplo = [
                ('Romeo y Julieta', '2024-12-20', '20:00', 'Teatro Principal', 25.00, 100, 
                 'Clásica obra de Shakespeare sobre el amor prohibido entre dos jóvenes de familias rivales.', 
                 'https://picsum.photos/400/300?random=1'),
                ('La Casa de Bernarda Alba', '2024-12-22', '19:30', 'Teatro Nacional', 30.00, 80, 
                 'Drama de Federico García Lorca sobre el poder y la represión en una familia española.', 
                 'https://picsum.photos/400/300?random=2'),
                ('El Avaro', '2024-12-25', '21:00', 'Teatro Municipal', 20.00, 120, 
                 'Comedia de Molière que critica la avaricia y la obsesión por el dinero.', 
                 'https://picsum.photos/400/300?random=3'),
                ('Hamlet', '2024-12-28', '20:30', 'Teatro Real', 35.00, 90, 
                 'La tragedia de venganza más famosa de Shakespeare.', 
                 'https://picsum.photos/400/300?random=4'),
                ('La vida es sueño', '2024-12-30', '19:00', 'Teatro Calderón', 28.00, 110, 
                 'Obra maestra de Calderón de la Barca sobre el libre albedrío y el destino.', 
                 'https://picsum.photos/400/300?random=5'),
            ]
            
            for evento in eventos_ejemplo:
                self.crear_evento(*evento)
    
    # ==================== USUARIOS ====================
    
    def crear_usuario(self, nombre, email, password, telefono=None, rol='cliente'):
        """Crear un nuevo usuario"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            password_hash = self._hash_password(password)
            cursor.execute('''
                INSERT INTO usuarios (nombre, email, password, telefono, rol)
                VALUES (?, ?, ?, ?, ?)
            ''', (nombre, email, password_hash, telefono, rol))
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return user_id
        except sqlite3.IntegrityError:
            return None
        except Exception as e:
            print(f"Error al crear usuario: {e}")
            return None
    
    def obtener_usuario_por_email(self, email):
        """Obtener un usuario por email"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM usuarios WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return Usuario(
                id=row['id'],
                nombre=row['nombre'],
                email=row['email'],
                password=row['password'],
                telefono=row['telefono'],
                rol=row['rol'],
                created_at=row['created_at']
            )
        return None
    
    def obtener_usuario_por_id(self, user_id):
        """Obtener un usuario por ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM usuarios WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return Usuario(
                id=row['id'],
                nombre=row['nombre'],
                email=row['email'],
                password=row['password'],
                telefono=row['telefono'],
                rol=row['rol'],
                created_at=row['created_at']
            )
        return None
    
    def verificar_credenciales(self, email, password):
        """Verificar credenciales de login"""
        usuario = self.obtener_usuario_por_email(email)
        if usuario and usuario.password == self._hash_password(password):
            return usuario
        return None
    
    def obtener_todos_usuarios(self):
        """Obtener todos los usuarios"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM usuarios ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        
        usuarios = []
        for row in rows:
            usuarios.append(Usuario(
                id=row['id'],
                nombre=row['nombre'],
                email=row['email'],
                password=row['password'],
                telefono=row['telefono'],
                rol=row['rol'],
                created_at=row['created_at']
            ))
        return usuarios
    
    def cambiar_rol_usuario(self, user_id, nuevo_rol):
        """Cambiar el rol de un usuario"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('UPDATE usuarios SET rol = ? WHERE id = ?', (nuevo_rol, user_id))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error al cambiar rol: {e}")
            return False
    
    # ==================== EVENTOS ====================
    
    def obtener_eventos(self):
        """Obtener todos los eventos"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM eventos ORDER BY fecha, hora')
        rows = cursor.fetchall()
        conn.close()
        
        eventos = []
        for row in rows:
            eventos.append(Evento(
                id=row['id'],
                nombre=row['nombre'],
                fecha=row['fecha'],
                hora=row['hora'],
                lugar=row['lugar'],
                precio=row['precio'],
                entradas_disponibles=row['entradas_disponibles'],
                descripcion=row['descripcion'],
                imagen_url=row['imagen_url'] if 'imagen_url' in row.keys() else None
            ))
        return eventos
    
    def obtener_evento(self, evento_id):
        """Obtener un evento por ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM eventos WHERE id = ?', (evento_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return Evento(
                id=row['id'],
                nombre=row['nombre'],
                fecha=row['fecha'],
                hora=row['hora'],
                lugar=row['lugar'],
                precio=row['precio'],
                entradas_disponibles=row['entradas_disponibles'],
                descripcion=row['descripcion'],
                imagen_url=row['imagen_url'] if 'imagen_url' in row.keys() else None
            )
        return None
    
    def crear_evento(self, nombre, fecha, hora, lugar, precio, entradas_disponibles, descripcion, imagen_url=None):
        """Crear un nuevo evento"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO eventos (nombre, fecha, hora, lugar, precio, entradas_disponibles, descripcion, imagen_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (nombre, fecha, hora, lugar, precio, entradas_disponibles, descripcion, imagen_url))
            conn.commit()
            evento_id = cursor.lastrowid
            conn.close()
            return evento_id
        except Exception as e:
            print(f"Error al crear evento: {e}")
            return None
    
    def actualizar_evento(self, evento_id, nombre, fecha, hora, lugar, precio, entradas_disponibles, descripcion, imagen_url=None):
        """Actualizar un evento existente"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE eventos
                SET nombre = ?, fecha = ?, hora = ?, lugar = ?, precio = ?, 
                    entradas_disponibles = ?, descripcion = ?, imagen_url = ?
                WHERE id = ?
            ''', (nombre, fecha, hora, lugar, precio, entradas_disponibles, descripcion, imagen_url, evento_id))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error al actualizar evento: {e}")
            return False
    
    def eliminar_evento(self, evento_id):
        """Eliminar un evento"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM eventos WHERE id = ?', (evento_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error al eliminar evento: {e}")
            return False
    
    # ==================== VENTAS ====================
    
    def crear_venta(self, evento_id, user_id, cantidad, total):
        """Crear una nueva venta"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Verificar entradas disponibles
            cursor.execute('SELECT entradas_disponibles FROM eventos WHERE id = ?', (evento_id,))
            row = cursor.fetchone()
            if not row or row['entradas_disponibles'] < cantidad:
                conn.close()
                return None
            
            # Crear la venta
            cursor.execute('''
                INSERT INTO ventas (evento_id, user_id, cantidad, total)
                VALUES (?, ?, ?, ?)
            ''', (evento_id, user_id, cantidad, total))
            
            # Actualizar entradas disponibles
            cursor.execute('''
                UPDATE eventos
                SET entradas_disponibles = entradas_disponibles - ?
                WHERE id = ?
            ''', (cantidad, evento_id))
            
            conn.commit()
            venta_id = cursor.lastrowid
            conn.close()
            return venta_id
        except Exception as e:
            print(f"Error al crear venta: {e}")
            return None
    
    def obtener_venta(self, venta_id):
        """Obtener una venta por ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM ventas WHERE id = ?', (venta_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def obtener_todas_ventas(self):
        """Obtener todas las ventas"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT v.*, e.nombre as evento_nombre, u.nombre as usuario_nombre, u.email as usuario_email
            FROM ventas v
            JOIN eventos e ON v.evento_id = e.id
            JOIN usuarios u ON v.user_id = u.id
            ORDER BY v.fecha_compra DESC
        ''')
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    
    def obtener_ventas_por_usuario(self, user_id):
        """Obtener ventas de un usuario"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT v.*, e.nombre as evento_nombre, e.fecha, e.hora, e.lugar
            FROM ventas v
            JOIN eventos e ON v.evento_id = e.id
            WHERE v.user_id = ?
            ORDER BY v.fecha_compra DESC
        ''', (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    
    def obtener_ventas_por_email(self, email):
        """Obtener ventas por email del usuario"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT v.*, e.nombre as evento_nombre, e.fecha, e.hora, e.lugar, u.nombre as usuario_nombre
            FROM ventas v
            JOIN eventos e ON v.evento_id = e.id
            JOIN usuarios u ON v.user_id = u.id
            WHERE u.email = ?
            ORDER BY v.fecha_compra DESC
        ''', (email,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
