// public/js/index.js

document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    const cartCountSpan = document.getElementById('cart-count');
    const logoutButton = document.getElementById('logout-button');
    const messageBox = document.getElementById('message-box');
    const loadingSpinner = document.getElementById('loading-spinner');
    const adminLink = document.getElementById('admin-link');
    const authNavLink = document.getElementById('auth-nav-link'); // Este es el enlace "Login / Registro"
    const pedidosLink = document.getElementById('pedidos-link'); // Enlace "Mis Pedidos"

    // CAMBIO CLAVE: API_BASE_URL ahora es dinámica para apuntar al dominio de la aplicación desplegada
    const API_BASE_URL = `${window.location.origin}/api`;

    // Cargar el carrito desde localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();

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

    // Actualiza el contador de ítems en el carrito en la barra de navegación
    function updateCartCount() {
        if (cartCountSpan) {
            cartCountSpan.textContent = cart.reduce((sum, item) => sum + item.cantidad, 0);
        }
    }

    // Función para mostrar/ocultar los enlaces de navegación basados en el estado de autenticación
    function updateNavigationLinks() {
        const user = JSON.parse(localStorage.getItem('user')); // Obtiene la información del usuario logueado

        if (authNavLink && logoutButton && adminLink && pedidosLink) { // Asegúrate de que todos los elementos existan
            if (user) { // Si hay un usuario logueado
                authNavLink.classList.add('hidden'); // Ocultar el enlace de Login/Registro
                logoutButton.classList.remove('hidden'); // Mostrar el botón de Cerrar Sesión
                pedidosLink.classList.remove('hidden'); // Mostrar el enlace de Mis Pedidos

                if (user.rol === 'admin') {
                    adminLink.classList.remove('hidden'); // Mostrar el enlace de Administración si es admin
                } else {
                    adminLink.classList.add('hidden'); // Ocultar el enlace de Administración si es cliente
                }
            } else { // Si no hay usuario logueado
                authNavLink.classList.remove('hidden'); // Mostrar el enlace de Login/Registro
                logoutButton.classList.add('hidden'); // Ocultar el botón de Cerrar Sesión
                adminLink.classList.add('hidden'); // Ocultar el enlace de Administración
                pedidosLink.classList.add('hidden'); // Ocultar el enlace de Mis Pedidos
            }
        }
    }

    // Añade un producto al carrito
    function addToCart(product) {
        const existingItemIndex = cart.findIndex(item => item.id_producto === product.id_producto);

        if (existingItemIndex > -1) {
            // Si el producto ya está en el carrito, incrementa la cantidad
            // Asegúrate de no exceder el stock disponible del producto
            if (cart[existingItemIndex].cantidad < product.stock) {
                cart[existingItemIndex].cantidad++;
                showMessage(`"${product.nombre}" añadido al carrito. Cantidad: ${cart[existingItemIndex].cantidad}`, 'success');
            } else {
                showMessage(`No puedes añadir más de la cantidad disponible (${product.stock}) de "${product.nombre}".`, 'error');
                return; // No añadir si excede el stock
            }
        } else {
            // Si es un producto nuevo, añadir con cantidad 1 (si hay stock)
            if (product.stock > 0) {
                // Asegurarse de que la imagen_url se pase correctamente
                cart.push({ ...product, cantidad: 1, imagen_url: product.imagen_url }); 
                showMessage(`"${product.nombre}" añadido al carrito.`, 'success');
            } else {
                showMessage(`El producto "${product.nombre}" no tiene stock disponible.`, 'error');
                return;
            }
        }
        localStorage.setItem('cart', JSON.stringify(cart)); // Guardar en localStorage
        updateCartCount(); // Actualizar el contador del carrito
    }

    // Renderiza los productos en la interfaz
    function renderProducts(products) {
        if (!productsContainer) {
            console.error("Error: productsContainer no encontrado en el DOM.");
            return;
        }
        productsContainer.innerHTML = ''; // Limpiar productos existentes

        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="text-center text-gray-600 col-span-full">No hay productos disponibles en este momento.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'bg-white rounded-lg shadow-md p-6 flex flex-col justify-between transform transition duration-300 hover:scale-105';

            // Asegura que precio sea un número válido antes de .toFixed()
            const displayPrice = (typeof product.precio === 'number')
                ? product.precio.toFixed(2)
                : (parseFloat(product.precio) || 0).toFixed(2);

            // Usa product.imagen_url (del backend) o una imagen de placeholder
            const imageUrl = product.imagen_url || `https://placehold.co/400x300/E0E0E0/333333?text=${encodeURIComponent(product.nombre)}`;

            productCard.innerHTML = `
                <img src="${imageUrl}" alt="${product.nombre}" class="w-full h-48 object-cover rounded-lg mb-4" onerror="this.onerror=null;this.src='https://placehold.co/400x300/E0E0E0/333333?text=Imagen+no+disponible';" />
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.nombre}</h3>
                <p class="text-gray-600 text-sm mb-2">Categoría: ${product.categoria_nombre || 'N/A'}</p>
                <p class="text-gray-700 text-sm mb-4 flex-grow">${product.descripcion || 'Sin descripción'}</p>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-2xl font-bold text-blue-600">$${displayPrice}</span>
                    <span class="text-gray-500 text-sm">Stock: ${product.stock}</span>
                </div>
                <button class="add-to-cart-btn bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md w-full
                            ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                            data-product-id="${product.id_producto}"
                            data-product-name="${product.nombre}"
                            data-product-price="${product.precio}"
                            data-product-stock="${product.stock}"
                            data-product-image="${product.imagen_url || ''}" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Agotado' : 'Añadir al Carrito'}
                </button>
            `;
            productsContainer.appendChild(productCard);
        });

        // Añadir event listeners para los botones de añadir al carrito
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                const productName = e.target.dataset.productName;
                const productPrice = parseFloat(e.target.dataset.productPrice);
                const productStock = parseInt(e.target.dataset.productStock);
                const productImage = e.target.dataset.productImage; // Obtener la URL de la imagen

                const productData = products.find(p => p.id_producto === productId);
                if (productData) { 
                    addToCart({
                        id_producto: productId,
                        nombre: productName,
                        precio: productPrice,
                        stock: productStock,
                        imagen_url: productImage // Asegurarse de usar imagen_url
                    });
                }
            });
        });
    }

    // Obtiene los productos del backend
    async function fetchProducts() {
        toggleLoading(true); // Muestra el spinner
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`; // Envía el token si está disponible
            }

            const response = await fetch(`${API_BASE_URL}/productos`, {
                method: 'GET',
                headers: headers
            });

            // Verificar si la respuesta es OK antes de intentar parsear como JSON
            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ message: 'Error desconocido' }));
                showMessage(errorResult.message || `Error HTTP: ${response.status}`, 'error');
                if (productsContainer) {
                    productsContainer.innerHTML = '<p class="text-center text-red-600 col-span-full">Error al cargar productos. Por favor, intenta de nuevo más tarde.</p>';
                }
                console.error(`Error al cargar productos: ${response.status}`, errorResult);
                return;
            }

            const result = await response.json();
            renderProducts(result); // Renderizar si la respuesta es OK

        } catch (error) {
            console.error('Error de red al cargar productos:', error);
            showMessage('Error de conexión. No se pudieron cargar los productos.', 'error');
            if (productsContainer) {
                productsContainer.innerHTML = '<p class="text-center text-red-600 col-span-full">Error de conexión. No se pudieron cargar los productos.</p>';
            }
        } finally {
            toggleLoading(false); // Oculta el spinner
        }
    }

    // Maneja el cierre de sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('cart'); // Limpia el carrito al cerrar sesión
            updateNavigationLinks(); // Actualiza la UI de navegación después de cerrar sesión
            window.location.href = '/'; // Redirige a la página de inicio
        });
    }

    // Llama a las funciones iniciales al cargar la página
    updateNavigationLinks();
    fetchProducts();
});

