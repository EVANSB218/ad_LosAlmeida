// public/script.js

// --- FUNCIONES DE UTILIDAD PARA MENSAJES ---
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) { // Asegurarse de que el elemento existe
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
    }
}

function clearMessage(elementId) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.className = 'message';
        messageElement.style.display = 'none';
    }
}

// --- LÓGICA DE AUTENTICACIÓN (REGISTRO Y LOGIN) ---

// Lógica de Registro (registerForm)
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage('registerMessage');

        const nombre_usuario = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const contrasena = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_usuario, email, contrasena }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('registerMessage', data.message, 'success');
                registerForm.reset();
            } else {
                showMessage('registerMessage', data.message, 'error');
            }
        } catch (error) {
            console.error('Error de red al registrar:', error);
            showMessage('registerMessage', 'Error de conexión. Inténtalo de nuevo.', 'error');
        }
    });
}

// Lógica de Login (loginForm)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage('loginMessage');

        const email = document.getElementById('loginEmail').value;
        const contrasena = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, contrasena }),
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('username', data.user.nombre_usuario);
                sessionStorage.setItem('loggedIn', 'true');
                showMessage('loginMessage', data.message, 'success');
                window.location.href = '/dashboard.html'; // Redirigir al dashboard
            } else {
                showMessage('loginMessage', data.message, 'error');
            }
        } catch (error) {
            console.error('Error de red al iniciar sesión:', error);
            showMessage('loginMessage', 'Error de conexión. Inténtalo de nuevo.', 'error');
        }
    });
}

// Lógica de Logout (logoutButton)
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('cart'); // Limpiar el carrito al cerrar sesión
        window.location.href = '/login.html';
    });
}

// --- LÓGICA DEL DASHBOARD (REGISTRAR PRODUCTOS) ---

const productForm = document.getElementById('productForm');
if (productForm) {
    // Mostrar mensaje de bienvenida en dashboard
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        const username = sessionStorage.getItem('username');
        if (username) {
            welcomeMessage.textContent = `Bienvenido, ${username}!`;
        } else {
            // Si no hay usuario logueado, redirigir al login
            window.location.href = '/login.html';
        }
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage('productMessage');

        const referencia = document.getElementById('referencia').value;
        const nombre = document.getElementById('nombre').value;
        const descripcion = document.getElementById('descripcion').value;
        const precio = parseFloat(document.getElementById('precio').value);
        const cantidad = parseInt(document.getElementById('cantidad').value);

        if (!referencia || !nombre || isNaN(precio) || precio <= 0 || isNaN(cantidad) || cantidad <= 0) {
            showMessage('productMessage', 'Asegúrate de que referencia, nombre, precio y cantidad sean válidos y positivos.', 'error');
            return;
        }

        try {
            const response = await fetch('/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referencia, nombre, descripcion, precio, cantidad }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('productMessage', data.message, 'success');
                productForm.reset();
            } else {
                showMessage('productMessage', data.message, 'error');
            }
        } catch (error) {
            console.error('Error de red al registrar producto:', error);
            showMessage('productMessage', 'Error de conexión. Inténtalo de nuevo.', 'error');
        }
    });
}

// --- LÓGICA DE VISUALIZACIÓN DE PRODUCTOS EN INDEX.HTML ---

async function fetchAndDisplayProducts() {
    const productGrid = document.querySelector('.product-grid');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const noProductsMessage = document.getElementById('noProductsMessage');

    // Ocultar mensajes de inicio y mostrar el de carga
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (errorMessage) clearMessage('errorMessage');
    if (noProductsMessage) noProductsMessage.style.display = 'none';

    if (!productGrid) return; // Asegurarse de que estamos en la página correcta

    try {
        const response = await fetch('/products');
        const products = await response.json();

        if (!response.ok) {
            if (errorMessage) showMessage('errorMessage', products.message || 'Error al cargar productos.', 'error');
            if (loadingMessage) loadingMessage.style.display = 'none';
            return;
        }

        if (loadingMessage) loadingMessage.style.display = 'none';

        productGrid.innerHTML = ''; // Limpiar productos existentes

        if (products.length === 0) {
            if (noProductsMessage) {
                noProductsMessage.textContent = 'No hay productos disponibles en este momento.';
                noProductsMessage.style.display = 'block';
            }
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h3>${product.nombre}</h3>
                <p><strong>Referencia:</strong> ${product.referencia}</p>
                <p><strong>Descripción:</strong> ${product.descripcion || 'Sin descripción'}</p>
                <p><strong>Precio:</strong> $${product.precio.toFixed(2)}</p>
                <p><strong>Cantidad disponible:</strong> ${product.cantidad}</p>
                <button class="add-to-cart-btn" data-product='${JSON.stringify(product)}'>Añadir al Carrito</button>
            `;
            productGrid.appendChild(productCard);
        });

        // Añadir event listeners para los botones de añadir al carrito
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Parsear los datos del producto del atributo data-product
                const productData = JSON.parse(e.target.dataset.product);
                addToCart(productData);
            });
        });

    } catch (error) {
        console.error('Error de red al cargar productos:', error);
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) showMessage('errorMessage', 'Error de conexión al cargar productos.', 'error');
    }
}

// Llama a fetchAndDisplayProducts solo si estamos en index.html
if (window.location.pathname === '/' || window.location.pathname.startsWith('/index.html')) {
    document.addEventListener('DOMContentLoaded', fetchAndDisplayProducts);
}


// --- LÓGICA DEL CARRITO DE COMPRAS ---

// Cargar el carrito desde sessionStorage (si existe)
let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

function addToCart(product) {
    const existingProductIndex = cart.findIndex(item => item.id === product.id);

    if (existingProductIndex > -1) {
        // Si el producto ya está en el carrito, incrementar selectedQuantity
        // y asegurarse de no exceder la cantidad disponible en stock
        if ((cart[existingProductIndex].selectedQuantity || 0) < product.cantidad) {
            cart[existingProductIndex].selectedQuantity = (cart[existingProductIndex].selectedQuantity || 0) + 1;
        } else {
            alert(`No puedes añadir más de la cantidad disponible (${product.cantidad}) de este producto: ${product.nombre}.`);
            return; // No añadir si excede el stock
        }
    } else {
        // Si es un producto nuevo, añadir con selectedQuantity 1 (si hay stock)
        if (product.cantidad > 0) {
            cart.push({ ...product, selectedQuantity: 1 });
        } else {
            alert(`El producto ${product.nombre} no tiene stock disponible.`);
            return;
        }
    }
    sessionStorage.setItem('cart', JSON.stringify(cart)); // Guardar en sessionStorage
    alert(`${product.nombre} añadido al carrito. Cantidad actual: ${cart.find(item => item.id === product.id).selectedQuantity}`);
    updateCartDisplay(); // Actualizar la vista del carrito si estamos en carrito.html
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');

    if (!cartItemsContainer || !cartTotalElement) return; // Salir si no estamos en carrito.html

    cartItemsContainer.innerHTML = ''; // Limpiar el contenido actual del carrito
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
        cartTotalElement.textContent = '$0.00';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.precio * item.selectedQuantity;
        total += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <h4>${item.nombre}</h4>
            <p>Ref: ${item.referencia}</p>
            <p>Precio Unitario: $${item.precio.toFixed(2)}</p>
            <div class="quantity-control">
                <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                <input type="number" value="${item.selectedQuantity}" min="1" max="${item.cantidad}" class="item-quantity-input" data-id="${item.id}">
                <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
            </div>
            <p>Subtotal: $${itemTotal.toFixed(2)}</p>
            <button class="remove-from-cart-btn" data-id="${item.id}">Eliminar</button>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    cartTotalElement.textContent = `$${total.toFixed(2)}`;

    // Añadir event listeners para los controles de cantidad y eliminar
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            const action = e.target.dataset.action;
            updateCartItemQuantity(productId, action);
        });
    });

    document.querySelectorAll('.item-quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const productId = parseInt(e.target.dataset.id);
            const newQuantity = parseInt(e.target.value);
            updateCartItemQuantity(productId, 'manual', newQuantity);
        });
    });

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            removeFromCart(productId);
        });
    });
}

function updateCartItemQuantity(productId, action, manualQuantity = null) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        if (action === 'increase') {
            if (cart[itemIndex].selectedQuantity < cart[itemIndex].cantidad) {
                cart[itemIndex].selectedQuantity++;
            } else {
                alert(`No puedes añadir más de la cantidad disponible (${cart[itemIndex].cantidad}) de este producto.`);
            }
        } else if (action === 'decrease') {
            if (cart[itemIndex].selectedQuantity > 1) {
                cart[itemIndex].selectedQuantity--;
            }
        } else if (action === 'manual' && manualQuantity !== null) {
            if (manualQuantity >= 1 && manualQuantity <= cart[itemIndex].cantidad) {
                cart[itemIndex].selectedQuantity = manualQuantity;
            } else if (manualQuantity < 1) {
                alert('La cantidad mínima es 1.');
                cart[itemIndex].selectedQuantity = 1; // Restaurar a 1
            } else { // manualQuantity > item.cantidad
                alert(`No puedes añadir más de la cantidad disponible (${cart[itemIndex].cantidad}) de este producto.`);
                cart[itemIndex].selectedQuantity = cart[itemIndex].cantidad; // Restaurar a la cantidad máxima
            }
        }
        sessionStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay(); // Refrescar la vista del carrito
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    sessionStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Llama a updateCartDisplay solo si estamos en carrito.html
if (window.location.pathname.startsWith('/carrito.html')) {
    document.addEventListener('DOMContentLoaded', updateCartDisplay);
}

