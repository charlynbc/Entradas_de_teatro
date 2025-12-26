/**
 * BACÓ - Sistema de Teatro
 * Biblioteca JavaScript Común
 * Versión: 1.0.0
 * Última actualización: 26 Diciembre 2025
 */

// ============================================
// AUTENTICACIÓN Y TOKENS
// ============================================

const BacoAuth = {
    /**
     * Obtiene el token JWT del localStorage
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Guarda el token JWT en localStorage
     */
    setToken(token) {
        localStorage.setItem('token', token);
    },

    /**
     * Elimina el token JWT
     */
    clearToken() {
        localStorage.removeItem('token');
    },

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Obtiene headers para peticiones autenticadas
     */
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    /**
     * Redirige al login si no está autenticado
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    /**
     * Cierra sesión y redirige al index
     */
    logout() {
        this.clearToken();
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    }
};

// ============================================
// MANEJO DE ERRORES Y NOTIFICACIONES
// ============================================

const BacoUI = {
    /**
     * Muestra un mensaje de error elegante
     */
    showError(message, duration = 5000) {
        const existing = document.querySelector('.baco-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'baco-toast baco-toast-error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },

    /**
     * Muestra un mensaje de éxito
     */
    showSuccess(message, duration = 3000) {
        const existing = document.querySelector('.baco-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'baco-toast baco-toast-success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },

    /**
     * Muestra un loading overlay
     */
    showLoading(message = 'Cargando...') {
        let overlay = document.querySelector('.baco-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'baco-loading-overlay';
            overlay.innerHTML = `
                <div class="baco-loading-content">
                    <div class="baco-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        setTimeout(() => overlay.classList.add('show'), 10);
    },

    /**
     * Oculta el loading overlay
     */
    hideLoading() {
        const overlay = document.querySelector('.baco-loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    },

    /**
     * Muestra un modal de confirmación
     */
    confirm(message, title = 'Confirmar Acción', confirmText = 'Confirmar', cancelText = 'Cancelar') {
        // API Promise-first (permite: const ok = await Baco.UI.confirm(...))
        // Mantener compatibilidad: si el 2do parámetro es función, usar firma vieja (callbacks)
        if (typeof title === 'function') {
            const onConfirm = title;
            const onCancel = confirmText;

            const modal = document.createElement('div');
            modal.className = 'baco-confirm-modal';
            modal.innerHTML = `
                <div class="baco-confirm-content">
                    <i class="fas fa-question-circle"></i>
                    <h3>Confirmar Acción</h3>
                    <p>${message}</p>
                    <div class="baco-confirm-buttons">
                        <button class="btn btn-primary" id="confirmYes">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                        <button class="btn btn-secondary" id="confirmNo">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 10);

            document.getElementById('confirmYes').onclick = () => {
                modal.remove();
                if (onConfirm) onConfirm();
            };

            document.getElementById('confirmNo').onclick = () => {
                modal.remove();
                if (onCancel) onCancel();
            };
            return;
        }

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'baco-confirm-modal';
            modal.innerHTML = `
                <div class="baco-confirm-content">
                    <i class="fas fa-question-circle"></i>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="baco-confirm-buttons">
                        <button class="btn btn-primary" id="confirmYes">
                            <i class="fas fa-check"></i> ${confirmText}
                        </button>
                        <button class="btn btn-secondary" id="confirmNo">
                            <i class="fas fa-times"></i> ${cancelText}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 10);

            const cleanup = () => {
                try { modal.remove(); } catch {}
            };

            document.getElementById('confirmYes').onclick = () => {
                cleanup();
                resolve(true);
            };

            document.getElementById('confirmNo').onclick = () => {
                cleanup();
                resolve(false);
            };
        });
    }
};

// ============================================
// PETICIONES API
// ============================================

const BacoAPI = {
    baseURL: '/api',

    /**
     * Realiza una petición GET
     */
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: BacoAuth.getAuthHeaders()
            });
            
            if (response.status === 401) {
                BacoAuth.logout();
                return null;
            }
            
            if (!response.ok) {
                const text = await response.text();
                let error;
                try {
                    error = text ? JSON.parse(text) : {};
                } catch {
                    error = { message: text || 'Error en la petición' };
                }
                throw new Error(error.message || 'Error en la petición');
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error(`Error en GET ${endpoint}:`, error);
            BacoUI.showError(error.message);
            throw error;
        }
    },

    /**
     * Realiza una petición POST
     */
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: BacoAuth.getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (response.status === 401) {
                BacoAuth.logout();
                return null;
            }
            
            if (!response.ok) {
                const text = await response.text();
                let error;
                try {
                    error = text ? JSON.parse(text) : {};
                } catch {
                    error = { message: text || 'Error en la petición' };
                }
                throw new Error(error.message || 'Error en la petición');
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error(`Error en POST ${endpoint}:`, error);
            BacoUI.showError(error.message);
            throw error;
        }
    },

    /**
     * Realiza una petición PUT
     */
    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: BacoAuth.getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (response.status === 401) {
                BacoAuth.logout();
                return null;
            }
            
            if (!response.ok) {
                const text = await response.text();
                let error;
                try {
                    error = text ? JSON.parse(text) : {};
                } catch {
                    error = { message: text || 'Error en la petición' };
                }
                throw new Error(error.message || 'Error en la petición');
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error(`Error en PUT ${endpoint}:`, error);
            BacoUI.showError(error.message);
            throw error;
        }
    },

    /**
     * Realiza una petición DELETE
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: BacoAuth.getAuthHeaders()
            });
            
            if (response.status === 401) {
                BacoAuth.logout();
                return null;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error en la petición');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error en DELETE ${endpoint}:`, error);
            BacoUI.showError(error.message);
            throw error;
        }
    }
};

// ============================================
// UTILIDADES DE IMÁGENES
// ============================================

const BacoImage = {
    /**
     * Obtiene URL de placeholder circular con inicial
     */
    getPlaceholder(name, size = 100) {
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        return `https://via.placeholder.com/${size}/1a1a1a/D4AF37?text=${initial}`;
    },

    /**
     * Crea elemento de foto circular
     */
    createCircularPhoto(src, alt, size = 'md') {
        const sizeMap = { sm: 40, md: 60, lg: 100, xl: 180 };
        const img = document.createElement('img');
        img.src = src || this.getPlaceholder(alt, sizeMap[size]);
        img.alt = alt;
        img.className = `photo-circular photo-circular-${size}`;
        img.onerror = () => {
            img.src = this.getPlaceholder(alt, sizeMap[size]);
        };
        return img;
    },

    /**
     * Previsualiza imagen antes de subir
     */
    previewImage(file, callback) {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            BacoUI.showError('El archivo debe ser una imagen');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => callback(e.target.result);
        reader.onerror = () => BacoUI.showError('Error al leer la imagen');
        reader.readAsDataURL(file);
    }
};

// ============================================
// UTILIDADES DE FORMATO
// ============================================

const BacoFormat = {
    /**
     * Formatea fecha en español
     */
    date(dateString, format = 'short') {
        const date = new Date(dateString);
        
        if (format === 'short') {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
        
        if (format === 'long') {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        if (format === 'relative') {
            const now = new Date();
            const diff = now - date;
            const hours = Math.floor(diff / 3600000);
            
            if (hours < 1) return 'Hace un momento';
            if (hours < 24) return `Hace ${hours}h`;
            if (hours < 48) return 'Ayer';
            
            return this.date(dateString, 'short');
        }
        
        return date.toLocaleDateString('es-ES');
    },

    /**
     * Formatea cédula uruguaya
     */
    cedula(cedula) {
        if (!cedula) return '';
        const str = cedula.toString();
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },

    /**
     * Formatea moneda
     */
    currency(amount) {
        return new Intl.NumberFormat('es-UY', {
            style: 'currency',
            currency: 'UYU'
        }).format(amount);
    },

    /**
     * Capitaliza primera letra
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
};

// ============================================
// VALIDACIONES
// ============================================

const BacoValidate = {
    /**
     * Valida cédula uruguaya (7-8 dígitos)
     */
    cedula(cedula) {
        const num = cedula.toString().replace(/\D/g, '');
        return num.length >= 7 && num.length <= 8;
    },

    /**
     * Valida email
     */
    email(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Valida teléfono uruguayo
     */
    phone(phone) {
        const num = phone.toString().replace(/\D/g, '');
        return num.length >= 8 && num.length <= 9;
    },

    /**
     * Valida contraseña (mínimo 6 caracteres)
     */
    password(password) {
        return password && password.length >= 6;
    },

    /**
     * Valida campo no vacío
     */
    required(value) {
        return value && value.toString().trim().length > 0;
    }
};

// ============================================
// ESTILOS PARA TOAST Y MODALES
// ============================================

// Inyectar estilos si no existen
if (!document.getElementById('baco-common-styles')) {
    const styles = document.createElement('style');
    styles.id = 'baco-common-styles';
    styles.textContent = `
        .baco-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a1a, #1f1f1f);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
            z-index: 10000;
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s ease;
            max-width: 400px;
        }
        
        .baco-toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .baco-toast-error {
            border-color: #8B1538;
        }
        
        .baco-toast-success {
            border-color: #4CAF50;
        }
        
        .baco-toast i:first-child {
            font-size: 1.3rem;
        }
        
        .baco-toast-error i:first-child {
            color: #8B1538;
        }
        
        .baco-toast-success i:first-child {
            color: #4CAF50;
        }
        
        .baco-toast span {
            flex: 1;
            color: #F8F8F8;
            font-size: 0.95rem;
        }
        
        .baco-toast button {
            background: none;
            border: none;
            color: rgba(248, 248, 248, 0.6);
            cursor: pointer;
            font-size: 1rem;
            padding: 0;
            transition: color 0.2s;
        }
        
        .baco-toast button:hover {
            color: #D4AF37;
        }
        
        .baco-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .baco-loading-overlay.show {
            opacity: 1;
        }
        
        .baco-loading-content {
            text-align: center;
            color: #F8F8F8;
        }
        
        .baco-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(212, 175, 55, 0.3);
            border-top-color: #D4AF37;
            border-radius: 50%;
            margin: 0 auto 20px;
            animation: spin 0.8s linear infinite;
        }
        
        .baco-confirm-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .baco-confirm-modal.show {
            opacity: 1;
        }
        
        .baco-confirm-content {
            background: linear-gradient(135deg, #1a1a1a, #1f1f1f);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        }
        
        .baco-confirm-content i {
            font-size: 3rem;
            color: #D4AF37;
            margin-bottom: 20px;
        }
        
        .baco-confirm-content h3 {
            font-family: 'Playfair Display', serif;
            color: #D4AF37;
            font-size: 1.8rem;
            margin-bottom: 15px;
        }
        
        .baco-confirm-content p {
            color: rgba(248, 248, 248, 0.8);
            margin-bottom: 30px;
            font-size: 1rem;
            line-height: 1.6;
        }
        
        .baco-confirm-buttons {
            display: flex;
            gap: 15px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            .baco-toast {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(styles);
}

// ============================================
// CUMPLEAÑOS Y FECHAS ESPECIALES
// ============================================

const BacoBirthdays = {
    /**
     * Cache para cumpleaños (se calcula una vez por sesión)
     */
    _cache: null,
    _cacheTime: null,
    _cacheDuration: 1000 * 60 * 30, // 30 minutos

    /**
     * Obtiene el inicio y fin de la semana actual (lunes a domingo)
     */
    getCurrentWeekRange() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, ...
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajustar para que lunes sea el inicio
        
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return { monday, sunday };
    },

    /**
     * Verifica si una fecha de nacimiento cae en la semana actual
     */
    isThisWeek(birthdate) {
        if (!birthdate) return false;
        
        const birth = new Date(birthdate);
        const now = new Date();
        const { monday, sunday } = this.getCurrentWeekRange();
        
        // Crear fecha de cumpleaños de este año
        const thisBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
        
        // Verificar si cae en la semana actual
        return thisBirthday >= monday && thisBirthday <= sunday;
    },

    /**
     * Obtiene todos los usuarios con cumpleaños esta semana
     */
    async getWeeklyBirthdays() {
        // Verificar cache
        if (this._cache && this._cacheTime && (Date.now() - this._cacheTime < this._cacheDuration)) {
            return this._cache;
        }

        try {
            const response = await Baco.API.get('/users/birthdays/weekly');
            this._cache = response;
            this._cacheTime = Date.now();
            return response;
        } catch (error) {
            console.error('Error al obtener cumpleaños:', error);
            return [];
        }
    },

    /**
     * Renderiza el componente de cumpleaños semanales
     */
    async renderWeeklyBanner(containerId) {
        const birthdays = await this.getWeeklyBirthdays();
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        // Si no hay cumpleaños, no mostrar nada
        if (!birthdays || birthdays.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        // Crear HTML del banner
        const singular = birthdays.length === 1;
        const title = singular ? '🎉 Cumpleaños de la semana' : '🎉 Cumpleaños de la semana';
        
        let html = `
            <div class="birthday-banner" style="
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(139, 21, 56, 0.1));
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 30px;
                animation: fadeInUp 0.6s ease-out;
            ">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <i class="fas fa-birthday-cake" style="font-size: 2rem; color: var(--dorado);"></i>
                    <h3 style="
                        font-family: 'Playfair Display', serif;
                        color: var(--dorado);
                        font-size: 1.3rem;
                        margin: 0;
                    ">${title}</h3>
                </div>
                <div style="
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding-left: 50px;
                ">
        `;
        
        birthdays.forEach(user => {
            const roleName = this._getRoleName(user.role);
            const birthDate = new Date(user.fecha_nacimiento);
            const dateStr = `${birthDate.getDate()}/${birthDate.getMonth() + 1}`;
            
            html += `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: rgba(248, 248, 248, 0.9);
                    font-size: 0.95rem;
                ">
                    <i class="fas fa-gift" style="color: var(--dorado); font-size: 0.9rem;"></i>
                    <span><strong>${user.nombre}</strong> (${roleName}) - ${dateStr}</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        container.style.display = 'block';
    },

    /**
     * Helper para obtener nombre del rol
     */
    _getRoleName(role) {
        const roles = {
            'SUPER': 'Super Usuario',
            'ADMIN': 'Director/a',
            'VENDEDOR': 'Actor/Actriz',
            'INVITADO': 'Invitado/a'
        };
        return roles[role] || role;
    },

    /**
     * Limpia el cache (útil para testing)
     */
    clearCache() {
        this._cache = null;
        this._cacheTime = null;
    }
};

// ============================================
// EXPORT GLOBAL
// ============================================

window.Baco = {
    Auth: BacoAuth,
    UI: BacoUI,
    API: BacoAPI,
    Image: BacoImage,
    Format: BacoFormat,
    Validate: BacoValidate,
    Birthdays: BacoBirthdays
};

console.log('🎭 BACÓ Common Library loaded successfully');
