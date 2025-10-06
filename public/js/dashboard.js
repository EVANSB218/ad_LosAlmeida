// public/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    const productCategorySelect = document.getElementById('product-category');
    const logoutButton = document.getElementById('logout-button');
    const messageBox = document.getElementById('message-box');
    const loadingSpinner = document.getElementById('loading-spinner');

    // CAMBIO CLAVE: API_BASE_URL ahora es dinámica para apuntar al dominio de la aplicación desplegada
    const API_BASE_URL = `${window.location.origin}/api`;

    // Función para mostrar mensajes en la caja de mensajes global
    function showMessage(message, type = 'success') {
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = `message-box show ${type}`;
            setTimeout(() => {
                messageBox.classList.remove('show');
            }, 3000);
        } else {
            console.warn('Elemento message-box no encontrado en el DOM.');
            // No usar alert() en producción o en apps complejas
            // alert(message); // Fallback si no hay messageBox
        }
    }

    // Función para mostrar/ocultar el spinner de carga global
    function toggleLoading(show) {
        if (loadingSpinner) {
            if (show) {
                loadingSpinner.classList.add('show');
            } else {
                loadingSpinner.classList.remove('show');
            }
        }
    }

    // Verificar si el usuario está autenticado y es administrador
    function checkAdminAccess() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token || !user || user.rol !== 'admin') {
            showMessage('Acceso denegado. Debes ser administrador para registrar productos.', 'error');
            setTimeout(() => {
                window.location.href = '/index.html'; // Redirigir si no es admin
            }, 2000);
            return false;
        }
        return true;
    }

    // Cargar categorías para el dropdown del formulario de producto
    async function loadCategories() {
        try {
            // Se realiza una petición a la nueva ruta de categorías
            const response = await fetch(`${API_BASE_URL}/categorias`);

            // Validación de respuesta OK antes de parsear JSON
            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ message: 'Error desconocido al cargar categorías.' }));
                showMessage(errorResult.message || `Error HTTP: ${response.status} al cargar categorías.`, 'error');
                console.error(`Error al cargar categorías: ${response.status}`, errorResult);
                return;
            }

            const categories = await response.json();

            productCategorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id_categoria; // Usar id_categoria como valor
                option.textContent = category.nombre_categoria;
                productCategorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error de red al cargar categorías:', error);
            showMessage('Error de conexión. No se pudieron cargar las categorías.', 'error');
        }
    }

    // Manejar el envío del formulario de producto
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!checkAdminAccess()) return; // Re-verificar acceso al enviar el formulario

            toggleLoading(true); // Mostrar spinner

            // Obtener los datos del formulario y mapearlos a los nombres de la DB
            const data = {
                nombre: document.getElementById('product-name').value,
                descripcion: document.getElementById('product-description').value,
                precio: parseFloat(document.getElementById('product-price').value),
                stock: parseInt(document.getElementById('product-stock').value),
                // CAMBIO: Asegúrate de que el campo de imagen se llame 'imagen_url' al enviarlo al backend
                imagen_url: document.getElementById('product-image-url').value, 
                id_categoria: parseInt(productCategorySelect.value) // Obtener el ID de la categoría
            };

            // Validaciones adicionales del lado del cliente
            if (!data.nombre || isNaN(data.precio) || data.precio <= 0 || isNaN(data.stock) || data.stock < 0 || !data.id_categoria) {
                showMessage('Por favor, completa todos los campos obligatorios y asegúrate de que precio y stock sean números válidos.', 'error');
                toggleLoading(false);
                return;
            }

            const token = localStorage.getItem('token'); // Obtener el token de autenticación

            try {
                const response = await fetch(`${API_BASE_URL}/productos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Enviar el token en los encabezados
                    },
                    body: JSON.stringify(data) // Enviar los datos del producto como JSON
                });

                // Validación de respuesta OK antes de parsear JSON
                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ message: 'Error desconocido' }));
                    showMessage(errorResult.message || `Error HTTP: ${response.status}`, 'error');
                    console.error(`Error al registrar producto: ${response.status}`, errorResult);
                    return;
                }

                const result = await response.json();
                showMessage(result.message, 'success');
                productForm.reset(); // Limpiar el formulario después del registro exitoso
                // Opcional: Recargar categorías si se permite añadir nuevas desde aquí
                // loadCategories();

            } catch (error) {
                console.error('Error de red al registrar producto:', error);
                showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
            } finally {
                toggleLoading(false); // Ocultar spinner
            }
        });
    }

    // Manejar el cierre de sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('cart'); // Limpia el carrito al cerrar sesión
            window.location.href = '/index.html'; // Redirige al index (main products page)
        });
    }

    // Cargar categorías y verificar acceso al cargar la página
    if (checkAdminAccess()) {
        loadCategories();
    }
});
