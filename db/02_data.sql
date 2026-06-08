-- =============================================================================
-- JEU DE DONNÉES OFFICIEL - GROUPE YMMO (13 STRUCTURES & 13 COMMERCIAUX)
-- =============================================================================

INSERT INTO agences (id, name, city, postcode) VALUES 
(1, 'YMMO Siège Social', 'Aix-en-Provence', '13100'),
(2, 'YMMO Paris Centre', 'Paris', '75001'),
(3, 'YMMO Lyon Lumière', 'Lyon', '69002'),
(4, 'YMMO Marseille Vieux-Port', 'Marseille', '13001'),
(5, 'YMMO Nice Promenade', 'Nice', '06000'),
(6, 'YMMO Bordeaux Quinconces', 'Bordeaux', '33000'),
(7, 'YMMO Toulouse Capitole', 'Toulouse', '31000'),
(8, 'YMMO Nantes Atlantique', 'Nantes', '44000'),
(9, 'YMMO Strasbourg Europe', 'Strasbourg', '67000'),
(10, 'YMMO Lille Grand-Place', 'Lille', '59000'),
(11, 'YMMO Montpellier Comédie', 'Montpellier', '34000'),
(12, 'YMMO Rennes Parlement', 'Rennes', '35000'),
(13, 'YMMO Reims Cathédrale', 'Reims', '51100');

--  Insertion du Personnel
INSERT INTO users (id, firstname, lastname, email, password, role, id_agence) VALUES 
(1, 'Jean', 'Directeur', 'jean.dir@ymmo.fr', 'hashed_pass_dir', 'direction', 1),

-- Les 13 Commerciaux (id 2 à 14) rattachés chacun à leur structure respective
(2, 'Alice', 'Bernard', 'alice.b@ymmo.fr', 'hashed_pass_com', 'commercial', 1),   -- Siège (Aix)
(3, 'Thomas', 'Durand', 'thomas.d@ymmo.fr', 'hashed_pass_com', 'commercial', 2),  -- Paris
(4, 'Sophie', 'Lefebvre', 'sophie.l@ymmo.fr', 'hashed_pass_com', 'commercial', 3), -- Lyon
(5, 'Marc', 'Moreau', 'marc.m@ymmo.fr', 'hashed_pass_com', 'commercial', 4),      -- Marseille
(6, 'Lucas', 'Michel', 'lucas.m@ymmo.fr', 'hashed_pass_com', 'commercial', 5),    -- Nice
(7, 'Emma', 'Garcia', 'emma.g@ymmo.fr', 'hashed_pass_com', 'commercial', 6),      -- Bordeaux
(8, 'Chloé', 'Dubois', 'chloe.d@ymmo.fr', 'hashed_pass_com', 'commercial', 7),    -- Toulouse
(9, 'Antoine', 'Rousseau', 'antoine.r@ymmo.fr', 'hashed_pass_com', 'commercial', 8),-- Nantes
(10, 'Léa', 'Mathieu', 'lea.m@ymmo.fr', 'hashed_pass_com', 'commercial', 9),      -- Strasbourg
(11, 'Hugo', 'Chevalier', 'hugo.c@ymmo.fr', 'hashed_pass_com', 'commercial', 10),  -- Lille
(12, 'Manon', 'Guillot', 'manon.g@ymmo.fr', 'hashed_pass_com', 'commercial', 11),  -- Montpellier
(13, 'Enzo', 'Fontaine', 'enzo.f@ymmo.fr', 'hashed_pass_com', 'commercial', 12),  -- Rennes
(14, 'Inès', 'Dupuy', 'ines.d@ymmo.fr', 'hashed_pass_com', 'commercial', 13),      -- Reims

-- Base de clients fictifs pour l'historique des achats (id 15 à 19)
(15, 'Paul', 'Acheteur1', 'paul.buyer@gmail.com', 'hashed_client', 'client', NULL),
(16, 'Julie', 'Acheteur2', 'julie.buyer@gmail.com', 'hashed_client', 'client', NULL),
(17, 'Kevin', 'Acheteur3', 'kevin.buyer@gmail.com', 'hashed_client', 'client', NULL),
(18, 'Laura', 'Acheteur4', 'laura.buyer@gmail.com', 'hashed_client', 'client', NULL),
(19, 'Maxime', 'Acheteur5', 'maxime.buyer@gmail.com', 'hashed_client', 'client', NULL);

-- Insertion de 30 Biens Immobiliers répartis géographiquement
INSERT INTO property (id, title, description, category, type, price, area, rooms, city, postcode, user_id, status) VALUES 
-- Aix-en-Provence / Siège (Commercial id: 2)
(1, 'Bastide Provençale de Prestige', 'Authentique bastide avec piscine...', 'Résidentiel', 'Maison', 920000, 165, 6, 'Aix-en-Provence', '13100', 2, 'Vendu'),
(2, 'Villa Contemporaine Celony', 'Lignes épurées, grand terrain...', 'Résidentiel', 'Maison', 1250000, 190, 7, 'Aix-en-Provence', '13100', 2, 'Disponible'),
(3, 'Appartement Centre Historique', 'Charme de l''ancien rénové...', 'Résidentiel', 'Appartement', 340000, 52, 2, 'Aix-en-Provence', '13100', 2, 'Vendu'),
-- Paris (Commercial id: 3)
(4, 'Studio Cosy Saint-Michel', 'Idéal investissement locatif...', 'Résidentiel', 'Appartement', 290000, 19, 1, 'Paris', '75005', 3, 'Vendu'),
(5, 'Duplex Haussmannien Marais', 'Prestations haut de gamme...', 'Résidentiel', 'Appartement', 1450000, 95, 4, 'Paris', '75004', 3, 'Vendu'),
(6, 'Bureaux d''Affaires Opéra', 'Plateau de bureaux modernes...', 'Professionnel', 'Bureau', 2800000, 150, 5, 'Paris', '75009', 3, 'Disponible'),
-- Lyon (Commercial id: 4)
(7, 'T3 Lumineux Confluence', 'Résidence BBC, balcon exposé sud...', 'Résidentiel', 'Appartement', 310000, 68, 3, 'Lyon', '69002', 4, 'Vendu'),
(8, 'Plateau de Bureaux Part-Dieu', 'Emplacement tertiaire stratégique...', 'Professionnel', 'Bureau', 890000, 130, 4, 'Lyon', '69003', 4, 'Vendu'),
-- Marseille (Commercial id: 5)
(9, 'T2 Vue Mer Endoume', 'Rare à la vente, terrasse plein ciel...', 'Résidentiel', 'Appartement', 280000, 40, 2, 'Marseille', '13007', 5, 'Vendu'),
(10, 'Maison de Ville Roucas-Blanc', 'Calme, jardin, charme fou...', 'Résidentiel', 'Maison', 740000, 110, 4, 'Marseille', '13007', 5, 'Disponible'),
-- Nice (Commercial id: 6)
(11, '3 Pièces Promenade des Anglais', 'Vue mer panoramique, grand balcon...', 'Résidentiel', 'Appartement', 620000, 75, 3, 'Nice', '06000', 6, 'Vendu'),
(12, 'Villa d''Architecte Cimiez', 'Prestations luxueuses, piscine miroir...', 'Résidentiel', 'Maison', 1850000, 220, 8, 'Nice', '06000', 6, 'Disponible'),
-- Bordeaux (Commercial id: 7)
(13, 'Echoppe Bordelaise Chartrons', 'Jardin intime sans vis-à-vis...', 'Résidentiel', 'Maison', 490000, 95, 4, 'Bordeaux', '33300', 7, 'Vendu'),
(14, 'Bureaux Rénovés Centre-Ville', 'Idéal professions libérales...', 'Professionnel', 'Bureau', 360000, 60, 3, 'Bordeaux', '33000', 7, 'Vendu'),
-- Toulouse (Commercial id: 8)
(15, 'T3 Toulousain Briques Apparentes', 'Hyper-centre, beaucoup de cachet...', 'Résidentiel', 'Appartement', 2650000, 72, 3, 'Toulouse', '31000', 8, 'Vendu'),
(16, 'Maison Familiale Tournefeuille', 'Grand jardin, quartier résidentiel...', 'Résidentiel', 'Maison', 420000, 120, 5, 'Toulouse', '31170', 8, 'Disponible'),
-- Nantes (Commercial id: 9)
(17, 'Loft Atypique Île de Nantes', 'Ancien entrepôt réhabilité...', 'Résidentiel', 'Appartement', 450000, 105, 3, 'Nantes', '44200', 9, 'Vendu'),
(18, 'Local Commercial Centre-Ville', 'Emplacement numéro 1, forte visibilité...', 'Professionnel', 'Local commercial', 580000, 80, 2, 'Nantes', '44000', 9, 'Vendu'),
-- Strasbourg (Commercial id: 10)
(19, 'Appartement Neudorf T4', 'Proche tramway, grande terrasse...', 'Résidentiel', 'Appartement', 330000, 88, 4, 'Strasbourg', '67100', 10, 'Vendu'),
(20, 'Bureaux Secteur Européen', 'Plateau moderne câblé RJ45...', 'Professionnel', 'Bureau', 720000, 110, 4, 'Strasbourg', '67000', 10, 'Disponible'),
-- Lille (Commercial id: 11)
(21, 'Type 2 Vieux-Lille', 'Idéal premier achat, briques et poutres...', 'Résidentiel', 'Appartement', 195000, 38, 2, 'Lille', '59800', 11, 'Vendu'),
(22, 'Maison de Ville Vauban', 'Proche universités, petite cour...', 'Résidentiel', 'Maison', 380000, 100, 5, 'Lille', '59000', 11, 'Vendu'),
-- Montpellier (Commercial id: 12)
(23, 'T3 Moderne Port Marianne', 'Terrasse dinatoire, garage en sous-sol...', 'Résidentiel', 'Appartement', 295000, 70, 3, 'Montpellier', '34000', 12, 'Vendu'),
(24, 'Villa Contemporaine Castelnau', 'Design épuré, piscine, climatisation...', 'Résidentiel', 'Maison', 810000, 150, 6, 'Montpellier', '34170', 12, 'Disponible'),
-- Rennes (Commercial id: 13)
(25, 'Appartement T2 Thabor', 'Résidence de standing, calme absolu...', 'Résidentiel', 'Appartement', 185000, 45, 2, 'Rennes', '35000', 13, 'Vendu'),
(26, 'Maison Néo-Bretonne', 'Tranquillité en périphérie proche...', 'Résidentiel', 'Maison', 410000, 130, 6, 'Rennes', '35000', 13, 'Vendu'),
-- Reims (Commercial id: 14)
(27, 'T3 Proche Cathédrale', 'Lumineux, dernier étage, box inclus...', 'Résidentiel', 'Appartement', 240000, 65, 3, 'Reims', '51100', 14, 'Vendu'),
(28, 'Immeuble de Bureaux Centre', 'Investissement tertiaire sécurisé...', 'Professionnel', 'Bureau', 1350000, 310, 10, 'Reims', '51100', 14, 'Disponible'),
-- Données additionnelles pour affiner le modèle mathématique de l''IA
(29, 'Studio Étudiant Villeurbanne', 'Vendu meublé, forte rentabilité...', 'Résidentiel', 'Appartement', 135000, 18, 1, 'Lyon', '69100', 4, 'Vendu'),
(30, 'Maison de Ville Rénovée', 'Prestations modernes et garage...', 'Résidentiel', 'Maison', 480000, 115, 4, 'Bordeaux', '33000', 7, 'Vendu');

-- 4. Insertion de l'historique des Transactions (22 ventes réelles pour l'entraînement de l'IA)
INSERT INTO transactions (property_id, buyer_id, final_price, sold_at) VALUES 
(1, 15, 910000, '2026-01-15 10:00:00'),
(3, 16, 335000, '2026-01-20 11:30:00'),
(4, 15, 285000, '2026-02-02 14:00:00'),
(5, 17, 1420000, '2026-02-14 16:45:00'),
(7, 18, 305000, '2026-02-28 09:15:00'),
(8, 19, 870000, '2026-03-05 10:30:00'),
(9, 16, 2720000, '2026-03-12 14:00:00'),
(11, 17, 610000, '2026-03-25 15:00:00'),
(13, 15, 485000, '2026-04-02 11:00:00'),
(14, 19, 350000, '2026-04-10 16:30:00'),
(15, 18, 260000, '2026-04-18 09:45:00'),
(17, 16, 440000, '2026-04-26 14:15:00'),
(18, 17, 565000, '2026-05-02 10:00:00'),
(19, 15, 322000, '2026-05-08 11:30:00'),
(21, 19, 190000, '2026-05-14 15:20:00'),
(22, 18, 375000, '2026-05-20 16:40:00'),
(23, 16, 290000, '2026-05-25 10:15:00'),
(25, 17, 180000, '2026-05-28 14:50:00'),
(26, 15, 405000, '2026-06-01 09:30:00'),
(27, 19, 238000, '2026-06-02 11:00:00'),
(29, 18, 130000, '2026-06-02 16:00:00'),
(30, 16, 475000, '2026-06-03 10:30:00');