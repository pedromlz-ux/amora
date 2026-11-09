// Compêndio de Atividades Físicas (Ainsworth et al. / Nutritotal PRO)
// 1 MET = 3.5 ml O2/kg/min = 1 kcal/kg/hora

export const MET_CATEGORIES = [
  { id: 'all', label: 'Todas as Atividades', icon: 'apps' },
  { id: 'caminhada_corrida', label: 'Caminhada & Corrida', icon: 'directions_run' },
  { id: 'ciclismo', label: 'Ciclismo', icon: 'directions_bike' },
  { id: 'fitness_aerobica', label: 'Fitness & Musculação', icon: 'fitness_center' },
  { id: 'aquaticos', label: 'Esportes Aquáticos', icon: 'pool' },
  { id: 'lutas', label: 'Lutas & Artes Marciais', icon: 'sports_mma' },
  { id: 'coletivos_quadra', label: 'Esportes de Quadra & Campo', icon: 'sports_soccer' },
  { id: 'danca_ginastica', label: 'Dança & Flexibilidade', icon: 'self_improvement' },
  { id: 'cotidiano_trabalho', label: 'Cotidiano, Casa & Lazer', icon: 'home' }
];

export const INTENSITY_LEVELS = {
  LEVE: { label: 'Leve', range: '< 3.0 METs', color: 'emerald', bgClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
  MODERADA: { label: 'Moderada', range: '3.0 - 5.9 METs', color: 'amber', bgClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
  VIGOROSA: { label: 'Vigorosa / Intensa', range: '6.0 - 8.9 METs', color: 'orange', bgClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800' },
  MUITO_INTENSA: { label: 'Muito Intensa', range: '≥ 9.0 METs', color: 'rose', bgClass: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' }
};

export const getIntensity = (met) => {
  if (met < 3.0) return INTENSITY_LEVELS.LEVE;
  if (met < 6.0) return INTENSITY_LEVELS.MODERADA;
  if (met < 9.0) return INTENSITY_LEVELS.VIGOROSA;
  return INTENSITY_LEVELS.MUITO_INTENSA;
};

export const MET_ACTIVITIES = [
  // Caminhada & Corrida
  { id: 'caminhada_leve', name: 'Caminhada 4,8 km/h (leve)', met: 3.30, category: 'caminhada_corrida', keywords: 'andar passear esteira leve' },
  { id: 'caminhada_media', name: 'Caminhada 5,6 km/h (média)', met: 3.80, category: 'caminhada_corrida', keywords: 'andar esteira ritmo normal' },
  { id: 'caminhada_mod_forte', name: 'Caminhada 6,5 km/h (moderada/forte)', met: 5.00, category: 'caminhada_corrida', keywords: 'caminhada rapida passo acelerado' },
  { id: 'caminhada_forte', name: 'Caminhada 7,2 km/h (forte / rápida)', met: 6.30, category: 'caminhada_corrida', keywords: 'caminhada muito rapida esteira inclinada' },
  { id: 'caminhada_8km', name: 'Caminhada 8,0 km/h', met: 8.00, category: 'caminhada_corrida', keywords: 'caminhar acelerado power walking' },
  { id: 'caminhada_marcha', name: 'Caminhada (Marcha atlética)', met: 6.50, category: 'caminhada_corrida', keywords: 'marcha atletica passos largos' },
  { id: 'corrida_10_7', name: 'Corrida 10,7 km/h (Pace ~5:36 min/km)', met: 11.00, category: 'caminhada_corrida', keywords: 'trotar jogging corrida rua esteira' },
  { id: 'corrida_11_2', name: 'Corrida 11,2 km/h (Pace ~5:21 min/km)', met: 11.50, category: 'caminhada_corrida', keywords: 'corrida moderada corrida rua esteira' },
  { id: 'corrida_12_0', name: 'Corrida 12,0 km/h (Pace 5:00 min/km)', met: 12.50, category: 'caminhada_corrida', keywords: 'corrida forte esteira pista' },
  { id: 'corrida_12_8', name: 'Corrida 12,8 km/h (Pace ~4:41 min/km)', met: 13.50, category: 'caminhada_corrida', keywords: 'corrida rapida 5k 10k' },
  { id: 'corrida_13_8', name: 'Corrida 13,8 km/h (Pace ~4:20 min/km)', met: 14.00, category: 'caminhada_corrida', keywords: 'tiro ritmo acelerado prova' },
  { id: 'corrida_14_4', name: 'Corrida 14,4 km/h (Pace ~4:10 min/km)', met: 15.00, category: 'caminhada_corrida', keywords: 'ritmo forte sprint endurance' },
  { id: 'corrida_16_0', name: 'Corrida 16,0 km/h (Pace 3:45 min/km)', met: 16.00, category: 'caminhada_corrida', keywords: 'tiro velocidade alta performance' },
  { id: 'corrida_17_5', name: 'Corrida 17,5 km/h (Pace ~3:25 min/km)', met: 18.00, category: 'caminhada_corrida', keywords: 'sprint maximo atleta elite' },

  // Ciclismo
  { id: 'ciclismo_leve', name: 'Ciclismo < 16,0 km/h (Lazer / Leve)', met: 4.00, category: 'ciclismo', keywords: 'bicicleta pedalar passeio ergometrica' },
  { id: 'ciclismo_16_19', name: 'Ciclismo 16,0 a 19,0 km/h (Moderado)', met: 6.00, category: 'ciclismo', keywords: 'bike velocidade moderada ciclofaixa' },
  { id: 'ciclismo_19_22', name: 'Ciclismo 19,0 a 22,0 km/h (Vigoroso)', met: 8.00, category: 'ciclismo', keywords: 'bike estrada spinning pedal firme' },
  { id: 'ciclismo_22_25', name: 'Ciclismo 22,0 a 25,0 km/h (Rápido)', met: 10.00, category: 'ciclismo', keywords: 'spinning avancado ciclismo speed' },
  { id: 'ciclismo_25_30', name: 'Ciclismo 25,0 a 30,0 km/h (Competição / Muito Forte)', met: 12.00, category: 'ciclismo', keywords: 'corrida bike pelotao ciclismo estrada' },

  // Fitness & Musculação
  { id: 'musculacao_media', name: 'Musculação média (treino de força geral)', met: 4.50, category: 'fitness_aerobica', keywords: 'academia pesos halteres hipertrofia' },
  { id: 'musculacao_pesada', name: 'Musculação pesada / Bodybuilding / Powerlifting', met: 6.00, category: 'fitness_aerobica', keywords: 'crossfit treino intenso carga alta leg press' },
  { id: 'aerobia_geral', name: 'Ginástica Aeróbia (geral)', met: 6.50, category: 'fitness_aerobica', keywords: 'aula coletiva jump cardio' },
  { id: 'aerobia_baixo_impacto', name: 'Aeróbia de baixo impacto', met: 5.00, category: 'fitness_aerobica', keywords: 'cardio sem impacto esteira eliptico' },
  { id: 'aerobia_alto_impacto', name: 'Aeróbia de alto impacto (HIIT / Jump)', met: 7.00, category: 'fitness_aerobica', keywords: 'hiit jump pliometria aula intensa' },
  { id: 'step_baixo', name: 'Step 15 - 20 cm', met: 8.50, category: 'fitness_aerobica', keywords: 'aula de step plataforma' },
  { id: 'step_alto', name: 'Step 25 - 30 cm', met: 10.00, category: 'fitness_aerobica', keywords: 'step alto cardio intenso' },
  { id: 'pular_corda_lento', name: 'Pular corda (ritmo lento)', met: 8.00, category: 'fitness_aerobica', keywords: 'corda aquecimento salto' },
  { id: 'pular_corda_mod', name: 'Pular corda (ritmo moderado)', met: 10.00, category: 'fitness_aerobica', keywords: 'corda box crossfit' },
  { id: 'pular_corda_rapido', name: 'Pular corda (ritmo rápido / double under)', met: 12.00, category: 'fitness_aerobica', keywords: 'corda double under velocidade' },
  { id: 'alongamento', name: 'Alongamento / Flexibilidade', met: 2.50, category: 'fitness_aerobica', keywords: 'stretching mobilidade flexibilidade' },
  { id: 'ginastica_geral', name: 'Ginástica funcional / Calistenia básica', met: 4.00, category: 'fitness_aerobica', keywords: 'funcional peso do corpo abdominais' },

  // Esportes Aquáticos
  { id: 'natacao_leve', name: 'Natação (livre / leve)', met: 7.00, category: 'aquaticos', keywords: 'nadar piscina crawl costas' },
  { id: 'natacao_medio', name: 'Natação (livre / moderada)', met: 8.50, category: 'aquaticos', keywords: 'nado continuo treino natacao' },
  { id: 'natacao_forte', name: 'Natação (livre / forte)', met: 10.00, category: 'aquaticos', keywords: 'tiro piscina borboleta nado rapido' },
  { id: 'natacao_45m', name: 'Natação 45 m/min', met: 8.00, category: 'aquaticos', keywords: 'pace natacao treino cronometrado' },
  { id: 'natacao_68m', name: 'Natação 68 m/min', met: 11.00, category: 'aquaticos', keywords: 'natacao competicao alta velocidade' },
  { id: 'hidroginastica', name: 'Hidroginástica', met: 4.00, category: 'aquaticos', keywords: 'ginastica aquatica piscina' },
  { id: 'polo_aquatico', name: 'Polo aquático', met: 10.00, category: 'aquaticos', keywords: 'jogo bola piscina water polo' },
  { id: 'remo_leve', name: 'Remo (leve)', met: 3.50, category: 'aquaticos', keywords: 'remar caiaque canoagem' },
  { id: 'remo_moderado', name: 'Remo (moderado)', met: 7.00, category: 'aquaticos', keywords: 'remo barco canoa' },
  { id: 'remo_ergometrico', name: 'Remo ergométrico (Rowing indoor)', met: 7.00, category: 'aquaticos', keywords: 'remo academia ergometro concept2' },
  { id: 'remo_forte', name: 'Remo (forte)', met: 8.50, category: 'aquaticos', keywords: 'remo alta intensidade' },
  { id: 'remo_muito_forte', name: 'Remo (muito forte / competição)', met: 12.00, category: 'aquaticos', keywords: 'remo sprint competicao regata' },
  { id: 'surfe', name: 'Surfe', met: 3.00, category: 'aquaticos', keywords: 'surf prancha ondas mar' },
  { id: 'mergulho', name: 'Mergulho (recreativo / autônomo)', met: 3.00, category: 'aquaticos', keywords: 'scuba diving mar' },

  // Lutas & Artes Marciais
  { id: 'boxe_saco', name: 'Boxe (treino de saco / luva de foco)', met: 6.00, category: 'lutas', keywords: 'luta soco saco de pancada' },
  { id: 'boxe_sparring', name: 'Boxe (sparring / simulação de combate)', met: 9.00, category: 'lutas', keywords: 'luta combate sparring' },
  { id: 'boxe_luta', name: 'Boxe (luta / ringue oficial)', met: 12.00, category: 'lutas', keywords: 'combate oficial ringue' },
  { id: 'jiu_jitsu', name: 'Jiu-jitsu (treino e rola)', met: 10.00, category: 'lutas', keywords: 'bjj kimono tatame submissao' },
  { id: 'judo', name: 'Judô', met: 10.00, category: 'lutas', keywords: 'quedas projecoes tatame' },
  { id: 'karate', name: 'Karatê', met: 10.00, category: 'lutas', keywords: 'kata kumite golpes' },
  { id: 'kickboxing', name: 'Kick-boxing / Muay Thai', met: 10.00, category: 'lutas', keywords: 'muay thai chutes socos combate' },
  { id: 'taekwondo', name: 'Tae kwon do', met: 10.00, category: 'lutas', keywords: 'chutes artes marciais' },
  { id: 'tai_chi', name: 'Tai chi chuan', met: 4.00, category: 'lutas', keywords: 'arte marcial suave meditacao movimento' },

  // Esportes Coletivos & Quadra
  { id: 'futebol_eventual', name: 'Futebol recreativo / pelada', met: 7.00, category: 'coletivos_quadra', keywords: 'society campo pelada futebolzinho' },
  { id: 'futebol_competicao', name: 'Futebol (jogo oficial / competitivo)', met: 10.00, category: 'coletivos_quadra', keywords: 'futebol 11 campo campeonato' },
  { id: 'futebol_americano', name: 'Futebol americano', met: 8.00, category: 'coletivos_quadra', keywords: 'flag touch tackle nfl' },
  { id: 'futebol_americano_comp', name: 'Futebol americano (competição)', met: 9.00, category: 'coletivos_quadra', keywords: 'jogo oficial campeonato' },
  { id: 'basquete_casual', name: 'Basquete casual / arremessos', met: 6.00, category: 'coletivos_quadra', keywords: 'street ball arremesso quadra' },
  { id: 'basquete_oficial', name: 'Basquete oficial / jogo treino', met: 7.00, category: 'coletivos_quadra', keywords: 'quadra coletivo 5x5' },
  { id: 'basquete_competicao', name: 'Basquete (competição)', met: 8.00, category: 'coletivos_quadra', keywords: 'partida oficial campeonato' },
  { id: 'volei_casual', name: 'Vôlei casual / recreativo', met: 3.00, category: 'coletivos_quadra', keywords: 'voleibol recreacao' },
  { id: 'volei_ginasio', name: 'Vôlei competição em ginásio', met: 8.00, category: 'coletivos_quadra', keywords: 'quadra salto cortada' },
  { id: 'volei_praia', name: 'Vôlei de praia / Futevôlei', met: 8.00, category: 'coletivos_quadra', keywords: 'areia beach volley futevolei' },
  { id: 'tenis_individual', name: 'Tênis (simples)', met: 7.00, category: 'coletivos_quadra', keywords: 'saibro quadra raquete' },
  { id: 'tenis_duplas', name: 'Tênis (duplas)', met: 5.00, category: 'coletivos_quadra', keywords: 'raquete beach tennis' },
  { id: 'tenis_mesa', name: 'Tênis de mesa (Ping-pong)', met: 4.00, category: 'coletivos_quadra', keywords: 'ping pong raquete mesa' },
  { id: 'squash', name: 'Squash', met: 12.00, category: 'coletivos_quadra', keywords: 'raquete parede quadra fechada' },
  { id: 'badminton_casual', name: 'Badminton casual', met: 4.50, category: 'coletivos_quadra', keywords: 'peteca raquete leve' },
  { id: 'badminton_comp', name: 'Badminton competição', met: 7.00, category: 'coletivos_quadra', keywords: 'peteca torneio' },
  { id: 'hoquei_campo', name: 'Hóquei de campo', met: 8.00, category: 'coletivos_quadra', keywords: 'taco grama' },
  { id: 'hoquei_gelo', name: 'Hóquei no gelo / Patins', met: 8.00, category: 'coletivos_quadra', keywords: 'patins patinacao no gelo' },
  { id: 'atletismo_obstaculos', name: 'Atletismo (corridas com barreiras / obstáculos)', met: 10.00, category: 'coletivos_quadra', keywords: 'salto pista barreira' },
  { id: 'atletismo_arremesso', name: 'Atletismo (peso, disco, martelo)', met: 4.00, category: 'coletivos_quadra', keywords: 'lancamento arremesso forca' },
  { id: 'atletismo_saltos', name: 'Atletismo (salto em altura, vara, dardo)', met: 6.00, category: 'coletivos_quadra', keywords: 'salto triplo vara dardo' },
  { id: 'golfe', name: 'Golfe (caminhando e carregando bolsa)', met: 4.50, category: 'coletivos_quadra', keywords: 'taco campo tacadas' },
  { id: 'boliche', name: 'Boliche', met: 3.00, category: 'coletivos_quadra', keywords: 'pistas pinos arremesso' },

  // Dança & Ginástica
  { id: 'bale', name: 'Balé clássico', met: 4.80, category: 'danca_ginastica', keywords: 'danca ponta sapatilha' },
  { id: 'jazz', name: 'Dança Jazz / Contemporânea', met: 4.80, category: 'danca_ginastica', keywords: 'ritmo danca contemporanea' },
  { id: 'danca_salao', name: 'Dança de salão (ritmo lento/moderado)', met: 3.00, category: 'danca_ginastica', keywords: 'forro samba bolero valsa' },
  { id: 'patinacao', name: 'Patinação (roller / inline)', met: 7.00, category: 'danca_ginastica', keywords: 'patins roller rua' },
  { id: 'skate', name: 'Skate / Longboard', met: 5.00, category: 'danca_ginastica', keywords: 'skateboarding manobras' },
  { id: 'esquiar_casual', name: 'Esquiar / Snowboard casual', met: 7.00, category: 'danca_ginastica', keywords: 'neve montanha ski' },

  // Cotidiano, Ocupacional & Lazer
  { id: 'dormir', name: 'Dormir / Sono', met: 0.90, category: 'cotidiano_trabalho', keywords: 'dormir repouso sono' },
  { id: 'leitura', name: 'Leitura / Estudo sentado', met: 1.80, category: 'cotidiano_trabalho', keywords: 'ler estudar computador trabalho sentado' },
  { id: 'arrumar_cama', name: 'Arrumar a cama / Limpeza leve', met: 2.00, category: 'cotidiano_trabalho', keywords: 'faxina doméstica tarefas casa' },
  { id: 'cozinhar_parado', name: 'Cozinhar parado / Preparar refeições', met: 2.00, category: 'cotidiano_trabalho', keywords: 'culinaria cozinha picar alimentos' },
  { id: 'cozinhar_andando', name: 'Cozinhar andando / Atividades na cozinha', met: 2.50, category: 'cotidiano_trabalho', keywords: 'limpar cozinha panelas' },
  { id: 'lavar_louca', name: 'Lavar louça', met: 2.30, category: 'cotidiano_trabalho', keywords: 'pia pratos copos' },
  { id: 'pintar_casa_dentro', name: 'Pintar a casa (paredes internas)', met: 3.00, category: 'cotidiano_trabalho', keywords: 'reforma rolo pintura' },
  { id: 'pintar_casa_fora', name: 'Pintar a casa (área externa / escada)', met: 5.00, category: 'cotidiano_trabalho', keywords: 'obra pintura externa' },
  { id: 'pesca_casual', name: 'Pesca casual', met: 3.00, category: 'cotidiano_trabalho', keywords: 'pescar rio lago mar' },
  { id: 'tocar_piano', name: 'Tocar piano / Teclado', met: 2.50, category: 'cotidiano_trabalho', keywords: 'instrumento musical musica' },
  { id: 'tocar_tambor', name: 'Tocar bateria / Tambor', met: 4.00, category: 'cotidiano_trabalho', keywords: 'bateria percussao musica' },
  { id: 'arco_flecha', name: 'Arco e flecha', met: 3.50, category: 'cotidiano_trabalho', keywords: 'tiro ao alvo arco' },
  { id: 'asa_delta', name: 'Asa-delta / Parapente', met: 3.50, category: 'cotidiano_trabalho', keywords: 'voo livre' },
  { id: 'motocross', name: 'Motocross / Trilha de moto', met: 4.00, category: 'cotidiano_trabalho', keywords: 'moto trilha terra' }
];

export const calculateMetExpenditure = ({ met, weightKg, durationMinutes }) => {
  const p = parseFloat(weightKg) || 0;
  const d = parseFloat(durationMinutes) || 0;
  const m = parseFloat(met) || 0;

  if (p <= 0 || d <= 0 || m <= 0) {
    return {
      kcal: 0,
      kcalPerMinute: 0,
      vo2_ml_kg_min: 0,
      vo2_liters_total: 0,
      fatGramsBurnEstimate: 0,
      durationHours: 0
    };
  }

  const durationHours = d / 60;
  const kcal = m * p * durationHours;
  const kcalPerMinute = kcal / d;
  
  // 1 MET = 3.5 ml O2 / kg / min
  const vo2_ml_kg_min = m * 3.5;
  const vo2_liters_total = (vo2_ml_kg_min * p * d) / 1000;

  // Gordura teórica: 1g gordura corporal ~ 7.7 kcal
  const fatGramsBurnEstimate = (kcal / 7.7);

  return {
    kcal: parseFloat(kcal.toFixed(2)),
    kcalPerMinute: parseFloat(kcalPerMinute.toFixed(2)),
    vo2_ml_kg_min: parseFloat(vo2_ml_kg_min.toFixed(1)),
    vo2_liters_total: parseFloat(vo2_liters_total.toFixed(2)),
    fatGramsBurnEstimate: parseFloat(fatGramsBurnEstimate.toFixed(1)),
    durationHours: parseFloat(durationHours.toFixed(2))
  };
};
