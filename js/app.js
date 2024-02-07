function iniciarApp() {
  const sltCategorias = document.querySelector("#categorias");
  const resultado = document.querySelector("#resultado");
  const modal = new bootstrap.Modal("#modal", {});

  if (sltCategorias) {
    sltCategorias.addEventListener("change", seleccionarCategoria);
    obtenerCategorias();
  }

  const favoritosDiv = document.querySelector(".favoritos");
  if (favoritosDiv) {
    obtenerFavoritos();
  }

  //obtener las categorías
  function obtenerCategorias() {
    const url = "https://www.themealdb.com/api/json/v1/1/categories.php"; //la API no tiene una key
    fetch(url)
      .then((response) => response.json())
      .then((datos) => mostrarCategorias(datos.categories));
  }

  //mostrar categorias en el HTML
  function mostrarCategorias(categorias = []) {
    categorias.forEach((categoria) => {
      const { strCategory } = categoria;
      opcionCat = document.createElement("option");
      opcionCat.value = strCategory;
      opcionCat.textContent = strCategory;
      sltCategorias.appendChild(opcionCat);
    });
  }

  function seleccionarCategoria(e) {
    const categoria = e.target.value;

    url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
    fetch(url)
      .then((response) => response.json())
      .then((datos) => mostrarRecetas(datos.meals));
  }

  function mostrarRecetas(recetas = []) {
    limpiarHTML(resultado);
    const heading = document.createElement("H2");
    heading.classList.add("text-center", "text-black", "my-5");
    heading.textContent = recetas.length ? "Resultados:" : "No hay resultados";
    resultado.appendChild(heading);

    recetas.forEach((receta) => {
      const { idMeal, strMeal, strMealThumb } = receta;

      const recetaContenedor = document.createElement("div");
      recetaContenedor.classList.add("col-md-4");

      const recetaCard = document.createElement("div");
      recetaCard.classList.add("card", "mb-4");

      const recetaImagen = document.createElement("img");
      recetaImagen.classList.add("card-img-top");
      recetaImagen.alt = `Imagen de la receta ${strMealThumb}`;
      recetaImagen.src = strMealThumb ?? receta.img;

      const recetaCardBody = document.createElement("div");
      recetaCardBody.classList.add("card-body");

      const recetaHeading = document.createElement("h3");
      recetaHeading.classList.add("card-title", "mb-3");
      recetaHeading.textContent = strMeal ?? receta.titulo;

      const recetaBoton = document.createElement("button");
      recetaBoton.classList.add("btn", "btn-danger", "w-100");
      recetaBoton.textContent = "Ver receta";
      // recetaBoton.dataset.bsTarget = "#modal";
      // recetaBoton.dataset.bsToggle = "modal";
      recetaBoton.onclick = function () {
        seleccionarReceta(idMeal ?? receta.id);
      };

      //Inyectar en el código HTML
      recetaCardBody.appendChild(recetaHeading);
      recetaCardBody.appendChild(recetaBoton);
      recetaCard.appendChild(recetaImagen);
      recetaCard.appendChild(recetaCardBody);

      recetaContenedor.appendChild(recetaCard);
      resultado.appendChild(recetaContenedor);
    });
  }

  function seleccionarReceta(id) {
    const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    fetch(url)
      .then((response) => response.json())
      .then((datos) => mostrarRecetaModal(datos.meals[0]));
  }

  function mostrarRecetaModal(receta) {
    const { idMeal, strInstructions, strMeal, strMealThumb } = receta;

    //añadir contenido al modal
    const modalTitle = document.querySelector(".modal .modal-title");
    const modalBody = document.querySelector(".modal .modal-body");

    modalTitle.textContent = strMeal;
    /*innerHTML es seguro siempre que los datos estén sanitizados, si se espera a la entrada del 
     usuario, es peligroso */
    modalBody.innerHTML = `
      <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}" />
      <h3 class="my-3">Instrucciones</h3>
      <p>${strInstructions}</p>
    `;

    //Mostrar contenidos e ingredientes
    const table = document.createElement("table");
    table.classList.add("table");
    table.innerHTML = `  
    <thead>
      <tr>
        <th scope="col">Ingredients</th>
        <th scope="col">Amounts</th>
      </tr>
    </thead>`;

    for (let i = 1; i <= 20; i++) {
      if (receta[`strIngredient${i}`]) {
        const filaTabla = document.createElement("tr");
        filaTabla.innerHTML = `
        <td>${receta[`strIngredient${i}`]}</td>
        <td>${receta[`strMeasure${i}`]}</td>
        `;
        table.appendChild(filaTabla);
      }
    }

    modalBody.appendChild(table);

    const modalFooter = document.querySelector(".modal-footer");
    limpiarHTML(modalFooter);

    //boton de cerrar y favorito
    const btnFavorito = document.createElement("button");
    btnFavorito.classList.add("btn", "btn-danger", "col");
    btnFavorito.textContent = existeStorage(idMeal)
      ? "Eliminar favorito"
      : "Guardar favorito";

    //almacenar en localStorage
    btnFavorito.onclick = function () {
      if (existeStorage(idMeal)) {
        eliminarFavorito(idMeal);
        btnFavorito.textContent = "Guardar Favorito";
        mostrarToast("Eliminado Correctamente");
        return;
      }
      agregarFavorito({
        id: idMeal,
        titulo: strMeal,
        img: strMealThumb,
      });
      btnFavorito.textContent = "Eliminar Favorito";
      mostrarToast("Agregado correctamente");
    };

    const btnCerrar = document.createElement("button");
    btnCerrar.classList.add("btn", "btn-secondary", "col");
    btnCerrar.textContent = "Cerrar";
    btnCerrar.onclick = function () {
      modal.hide();
    };

    modalFooter.appendChild(btnFavorito);
    modalFooter.appendChild(btnCerrar);

    //mostrar el modal
    modal.show();
  }

  function agregarFavorito(receta) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    localStorage.setItem("favoritos", JSON.stringify([...favoritos, receta]));
  }

  function eliminarFavorito(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    const nuevosFavoritos = favoritos.filter((favorito) => favorito.id !== id);
    localStorage.setItem("favoritos", JSON.stringify(nuevosFavoritos));
  }

  function existeStorage(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    if (favoritos.find((objeto) => objeto.id === id)) {
      return true;
    } else {
      return false;
    }
  }

  function mostrarToast(mensaje) {
    const toastDiv = document.querySelector("#toast");
    const toastBody = document.querySelector(".toast-body");
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = mensaje;
    toast.show();
  }

  function limpiarHTML(nodo) {
    while (nodo.firstChild) {
      nodo.removeChild(nodo.firstChild);
    }
  }

  function obtenerFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
    if (favoritos.length) {
      mostrarRecetas(favoritos);
      return;
    }
    const noFavoritos = document.createElement("p");
    noFavoritos.textContent = "No hay favoritos aun";
    noFavoritos.classList.add("fs-4", "text-center", "font-bold", "mt-5");
    resultado.appendChild(noFavoritos);
  }
}

document.addEventListener("DOMContentLoaded", iniciarApp);
