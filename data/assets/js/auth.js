const API_URL = "";

document.addEventListener("DOMContentLoaded", () => {

  const btnLogin = document.getElementById("btn-login");
  const modal = document.getElementById("auth-modal");
  const cerrarLogin = document.getElementById("cerrar-login");
  const loginForm = document.getElementById("login-form");
  const mensaje = document.getElementById("login-mensaje");

  function getToken() {
    return localStorage.getItem("token");
  }

  function isAuthenticated() {
    return !!getToken();
  }


  function actualizarUI() {
    if (isAuthenticated()) {
      btnLogin.textContent = "Salir";
      btnLogin.onclick = logout;
    } else {
      btnLogin.textContent = "Ingresar";
      btnLogin.onclick = () => {
        modal.style.display = "flex";
      };
    }
  }

  async function login(username, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error en login");
    }

    localStorage.setItem("token", data.token);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    actualizarUI();
  }

  // Abrir modal (si no está logueado)
  btnLogin.addEventListener("click", () => {
    if (!isAuthenticated()) {
      modal.style.display = "flex";
    }
  });

  // Cerrar modal
  cerrarLogin.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar si clickea afuera
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Envío del formulario
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    try {
      await login(username, password);
      mensaje.textContent = "Ingreso correcto";
      modal.style.display = "none";
      actualizarUI();
    } catch (error) {
      mensaje.textContent = error.message;
    }
  });

  actualizarUI();

  // Hacer accesible globalmente
  window.estaLogueado = isAuthenticated;

});
