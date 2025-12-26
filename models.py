from dataclasses import dataclass
from typing import Optional

@dataclass
class Usuario:
    id: int
    nombre: str
    email: str
    password: str
    telefono: Optional[str] = None
    rol: str = 'cliente'
    created_at: Optional[str] = None

@dataclass
class Evento:
    id: int
    nombre: str
    fecha: str
    hora: str
    lugar: str
    precio: float
    entradas_disponibles: int
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None

@dataclass
class Venta:
    id: int
    evento_id: int
    user_id: int
    cantidad: int
    total: float
    fecha_compra: str
