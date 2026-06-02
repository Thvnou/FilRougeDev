




// Formulaire de recherche !!!

// Bouttons Acheter et Vendre
const boutons = document.querySelectorAll('.onglets-acheter-vendre button');
boutons.forEach(btn => {
  btn.addEventListener('click', () => {
    boutons.forEach(b => b.classList.remove('actif'));
    btn.classList.add('actif');
  });
});


// Validation + action du bouton Rechercher
const boutonRecherche = document.querySelector('.bouton-recherche');
const inputOu = document.querySelector('.formulaire-recherche input[type="text"]');
const inputBudget = document.querySelector('.formulaire-recherche input[type="number"]:nth-child(2)');
const inputSurface = document.querySelector('.formulaire-recherche input[type="number"]:nth-child(3)');

boutonRecherche.addEventListener('click', () => {
  const ou = inputOu.value.trim();
  const budget = inputBudget.value.trim();
  const surface = inputSurface.value.trim();
  const typeRecherche = document.querySelector('.onglets-acheter-vendre button.actif')?.textContent;

  // Vérification : localisation obligatoire
  if (!ou) {
    inputOu.style.border = '2px solid red';
    inputOu.placeholder = 'Veuillez indiquer un lieu';
    return;
  } else {
    inputOu.style.border = 'none';
  }

  // Vérification : budget positif
  if (budget && Number(budget) <= 0) {
    inputBudget.style.border = '2px solid red';
    return;
  } else {
    inputBudget.style.border = 'none';
  }

  // Vérification : surface positive
  if (surface && Number(surface) <= 0) {
    inputSurface.style.border = '2px solid red';
    return;
  } else {
    inputSurface.style.border = 'none';
  }

  // Construction de l'objet de recherche
  const recherche = {
    type: typeRecherche,
    localisation: ou,
    budget: budget || null,
    surface: surface || null,
  };

  console.log('Recherche lancée :', recherche);

  // Redirection avec paramètres dans l'URL
  const params = new URLSearchParams();
  params.set('type', typeRecherche);
  params.set('lieu', ou);
  if (budget) params.set('budget', budget);
  if (surface) params.set('surface', surface);

  window.location.href = `resultats.html?${params.toString()}`;
});


// Réinitialisation des erreurs à la saisie
[inputOu, inputBudget, inputSurface].forEach(input => {
  input.addEventListener('input', () => {
    input.style.border = 'none';
  });
});


// Touche Entrée déclenche la recherche
document.querySelector('.formulaire-recherche').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') boutonRecherche.click();
});