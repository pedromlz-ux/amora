'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const ARTICLES = [
  {
    id: 'biomarcadores-nutricionais',
    title: 'Avanços em Biomarcadores Nutricionais para Terapias Personalizadas',
    category: 'Nutrição Clínica',
    readTime: '18 Min Leitura',
    image: '/blog_biomarcadores.png',
    date: '24 Outubro, 2026',
    author: {
      name: 'Dra. Elena Rostova',
      role: 'Diretora de Pesquisa',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
    },
    summary: 'Uma análise profunda das metodologias emergentes de sequenciamento que estão redefinindo a precisão diagnóstica em intervenções dietéticas clínicas.',
    content: `Os biomarcadores nutricionais representam a vanguarda da nutrição clínica de precisão, permitindo uma avaliação objetiva do estado metabólico e da ingestão alimentar. Tradicionalmente, a anamnese alimentar baseava-se em recordatórios subjetivos, propensos a biases de memória e estimativas incorretas de porções. A introdução de técnicas analíticas modernas permitiu substituir essas métricas imprecisas por indicadores moleculares estáveis obtidos diretamente de tecidos biológicos.

A falha crônica dos métodos tradicionais de registro alimentar reside na subjetividade do relato humano, o que gera subnotificação de calorias e distorção na proporção real de macronutrientes. Na prática clínica baseada em evidências, necessitamos de ferramentas validadas cientificamente para mensurar a exposição a nutrientes ativos. Biomarcadores objetivos reduzem o ruído analítico e fornecem dados quantitativos de alta precisão.

A ascensão das abordagens multi-ômicas (como genômica, transcriptômica, metabolômica e lipidômica) permite mapear a resposta biológica individual a alimentos específicos. Através da espectrometria de massas acoplada à cromatografia líquida, conseguimos quantificar milhares de metabólitos séricos após a ingestão de uma refeição padronizada, identificando a taxa de absorção e o clearance de compostos bioativos.

Em termos de síndrome metabólica e sensibilidade à insulina, marcadores clássicos como a hemoglobina glicada e a insulina de jejum estão sendo complementados por análises de perfil lipídico complexo. A quantificação de diacilgliceróis e ceramidas nas membranas celulares fornece um indicador direto de lipotoxicidade e sinalização prejudicada do receptor de insulina no tecido muscular esquelético.

Adicionalmente, os metabólitos derivados da microbiota intestinal surgem como importantes biomarcadores nutricionais. O composto trimetilamina-N-óxido (TMAO), derivado da metabolização bacteriana de colina e carnitina, serve como marcador de risco cardiovascular associado ao consumo elevado de carne vermelha. Por outro lado, a dosagem plasmática de ácidos graxos de cadeia curta (como butirato e acetato) sinaliza uma fermentação saudável de fibras insolúveis.

Modificações epigenéticas, tais como a metilação do DNA e a acetilação de histonas, também servem como marcadores de exposição a longo prazo. Nutrientes doadores de grupos metil (como folato, colina e vitamina B12) modulam diretamente o epigenoma do hospedeiro. O monitoramento dessas alterações permite rastrear a suscetibilidade a doenças crônicas antes que os sintomas clínicos se manifestem fisicamente.

A integração desses imensos bancos de dados metabolômicos com algoritmos de machine learning viabiliza a criação de modelos preditivos. O software correlaciona a assinatura biológica de base com a resposta glicêmica e lipídica esperada para diferentes grupos alimentares. Essa automação reduz consideravelmente o empirismo na prescrição dietética contemporânea.

O monitoramento contínuo é viabilizado por meio de biochips de fluxo lateral e dispositivos vestíveis minimamente invasivos. Essas ferramentas de monitoramento em tempo real nos permitem acompanhar a eficácia metabólica das intervenções nutricionais quase instantaneamente. Ajustes nas proporções de micronutrientes ativos e aminoácidos específicos podem ser feitos dinamicamente a cada consulta.

Em suma, a transição para uma medicina diagnóstica baseada em biomarcadores objetivos redefine a nutrição clínica. Deixamos de tratar médias populacionais para focar na individualidade bioquímica e na homeostase de sistemas integrados. Este paradigma preventivo é o caminho mais seguro para mitigar o avanço de dislipidemias, diabetes mellitus tipo 2 e disfunções cardiovasculares crônicas.`
  },
  {
    id: 'api-saude-clinica',
    title: 'Integração de APIs de Saúde em Protocolos Clínicos',
    category: 'Health Tech',
    readTime: '14 Min Leitura',
    image: '/blog_apis.png',
    date: '18 Outubro, 2026',
    author: {
      name: 'Dr. Sarah Chen',
      role: 'Líder de Integrações Médicas',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
    },
    summary: 'Como a padronização de dados FHIR está acelerando a interoperabilidade entre plataformas de nutrição e registros eletrônicos de saúde.',
    content: `A convergência entre sistemas de informação em saúde e a prática nutricional contemporânea estabeleceu um novo paradigma baseado no consumo integrado de APIs robustas. APIs que se conectam a dispositivos de monitoramento contínuo de glicose (CGM), balanças de bioimpedância e wearables de variabilidade cardíaca fornecem aos profissionais um ecossistema contínuo e contextualizado. A telemetria de dados substitui as consultas esporádicas por um acompanhamento longitudinal ininterrupto.

O papel das APIs de CGM é crucial na elucidação das respostas glicêmicas individuais aos alimentos do cotidiano. Em vez de estimar o índice glicêmico teórico de uma refeição, o profissional de saúde acessa as curvas glicêmicas reais registradas em intervalos de cinco minutos. Isso permite correlacionar picos glicêmicos pós-prandiais imediatos com alimentos específicos consumidos e registrados pelo paciente.

A bioimpedância segmental também se beneficia de integrações automatizadas por meio de APIs corporativas. Os dados de balanças profissionais são transmitidos sem fio diretamente para a ficha do paciente na nuvem, atualizando instantaneamente os vetores de massa muscular esquelética, gordura visceral e água extracelular. A análise de tendências de hidratação e anabolismo muscular ocorre sem digitação manual.

O padrão FHIR (Fast Healthcare Interoperability Resources) atua como o principal protocolo de comunicação e formatação para essas APIs. Ele define recursos RESTful padronizados que facilitam a troca de informações clínicas seguras entre o software do Amora e os sistemas integrados de grandes hospitais. A interoperabilidade estrita protege a integridade e uniformidade dos registros médicos eletrônicos.

No back-end do sistema clínico, loops automatizados de processamento avaliam os fluxos de dados de forma preditiva. Caso o algoritmo detecte picos glicêmicos acima de 160 mg/dL associados a uma queda na taxa metabólica basal, o sistema notifica o profissional imediatamente. Essa triagem contínua substitui a revisão manual exaustiva de prontuários.

Essas notificações em tempo real reduzem o intervalo necessário entre o diagnóstico de uma descompensação metabólica e a intervenção dietética corretiva. O profissional de saúde pode entrar em contato com o paciente para ajustar a carga glicêmica ou fracionamento dietético antes que a condição progrida para sintomas crônicos. A ação precoce melhora drasticamente o desfecho terapêutico.

Além disso, as APIs permitem cruzar dados de adesão nutricional com dados de wearables, como o padrão de sono profundo e a variabilidade da frequência cardíaca (HRV). Altos níveis de cortisol circulante (sinalizados por baixa HRV) podem ser correlacionados com maior desejo por carboidratos refinados e distúrbios de saciedade. Esse entendimento holístico guiará intervenções de regulação emocional integrativa.

A segurança e privacidade das informações de saúde são blindadas em conformidade total com a LGPD e HIPAA. Os tokens de acesso às APIs sensíveis são armazenados em cofres digitais criptografados no servidor, nunca expostos ao navegador do usuário final. Bancos de dados isolados garantem que informações médicas não sofram vazamento ou cruzamento não autorizado.

Por fim, a centralização de dados biométricos via APIs cria uma plataforma de inteligência preditiva para clínicas de nutrição de alto desempenho. O profissional conta com relatórios estruturados e dinâmicos que demonstram visualmente a evolução de parâmetros metabólicos. A tecnologia passa a atuar como uma extensão cognitiva da tomada de decisão médica.`
  },
  {
    id: 'sintese-proteica-futuro',
    title: 'Sintetização de Proteínas e o Futuro Suplementar',
    category: 'Biotecnologia',
    readTime: '15 Min Leitura',
    image: '/blog_sintese.png',
    date: '12 Outubro, 2026',
    author: {
      name: 'Dr. Marcus Vance',
      role: 'Especialista em Proteínas Alternativas',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
    },
    summary: 'Revisão sistemática das técnicas de fermentação de precisão na criação de perfis de aminoácidos otimizados para recuperação pós-operatória.',
    content: `A engenharia biológica e a tecnologia de alimentos uniram forças para revolucionar a terapia nutricional clínica por meio da síntese controlada de proteínas via fermentação de precisão. Esse processo biotecnológico avançado utiliza microrganismos programados para expressar proteínas idênticas às de origem animal, porém sem os componentes associados que causam intolerâncias ou alergias alimentares comuns.

Os vetores de expressão gênica em fungos filamentosos ou leveduras são manipulados para secretar cadeias peptídicas específicas de interesse clínico. A fermentação ocorre em biorreatores de aço inoxidável sob rigorosas condições controladas de oxigênio, pH, temperatura e aporte de substratos carbônicos. O produto resultante é isolado de forma pura através de técnicas de microfiltração e secagem por atomização.

Essa pureza molecular permite a formulação de dietas enterais elementares e oligoméricas de digestibilidade e absorção quase instantâneas. Pacientes críticos internados em UTIs, com trato gastrointestinal severamente comprometido, recebem formulações baseadas em peptídeos purificados que não demandam esforço enzimático digestivo. A rápida absorção evita o catabolismo muscular e a atrofia das vilosidades intestinais.

A biotecnologia também viabiliza o enriquecimento de suplementos com imunoglobulinas e fatores de crescimento bioativos. Frações imunologicamente ativas como a lactoferrina recombinante ajudam a regular a imunidade local intestinal e a conter o sobrecrescimento de patógenos no lúmen. O suplemento deixa de ser meramente calórico-proteico e passa a atuar como modulador da barreira biológica.

Em pacientes oncológicos geriátricos, a sarcopenia é um fator preditivo independente de mortalidade e intolerância ao tratamento quimioterápico. Suplementos proteicos convencionais de whey ou soja muitas vezes não entregam o perfil ideal de leucina necessário para ativar a via de síntese proteica mTOR nessa população. O enriquecimento com aminoácidos purificados sintetizados em bioreatores otimiza o anabolismo proteico.

A cicatrização de feridas crônicas (como úlceras de decúbito e pé diabético) demanda um aporte específico de aminoácidos como arginina, prolina e glutamina. Suplementos construídos por síntese biotecnológica reúnem esses aminoácidos em razões estequiométricas otimizadas para a síntese acelerada de colágeno fibrilar e regeneração tecidual endotelial.

Outra vantagem crítica reside na eliminação completa de antígenos alimentares. Proteínas do leite sintetizadas em laboratório não contêm lactose, caseína de digestão lenta ou beta-lactoglobulinas alergênicas. Pacientes portadores de alergias múltiplas ou doenças autoimunes intestinais encontram nessas formulações uma fonte segura de nitrogênio biodisponível.

Adicionalmente, os suplementos de precisão eliminam contaminantes químicos e físicos que podem estar presentes em fontes animais e vegetais convencionais, como metais pesados, pesticidas e resíduos de antibióticos. A purificação em nível farmacêutico garante a entrega de um nutriente inócuo.

O futuro dos suplementos reside na produção sob demanda de perfis nutricionais personalizados em biorreatores domésticos ou clínicos de microescala. O perfil de aminoácidos ingerido pelo paciente será sintonizado com sua taxa de degradação proteica diária avaliada via biomarcadores urinários. A nutrição alcança, assim, a sua escala de personalização molecular máxima.`
  },
  {
    id: 'microbioma-resposta-glicemica',
    title: 'Microbioma e Resposta Glicêmica',
    category: 'Pesquisa Aplicada',
    readTime: '12 Min Leitura',
    image: '/blog_microbioma.png',
    date: '05 Outubro, 2026',
    author: {
      name: 'Dra. Juliana Mendes',
      role: 'Pesquisadora Associada de Microbiologia',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150'
    },
    summary: 'Estudo de coorte evidenciando a correlação entre a diversidade da flora intestinal e a variabilidade glicêmica contínua em pacientes pré-diabéticos.',
    content: `A regulação homeostática da glicemia e a tolerância periférica à insulina estão diretamente coordenadas pela diversidade taxonômica e abundância funcional do microbioma intestinal humano. Microrganismos dos filos Firmicutes, Bacteroidetes e Actinobacteria digerem polissacarídeos complexos e fibras insolúveis que escapam à digestão enzimática no intestino delgado, convertendo-os em metabólitos de sinalização essenciais conhecidos como ácidos graxos de cadeia curta (AGCC).

Essas moléculas sinalizadoras (como butirato, propionato e acetato) atuam ligando-se a receptores específicos acoplados à proteína G (GPR41 e GPR43) nas células enteroendócrinas do cólon, estimulando a liberação sistêmica das incretinas GLP-1 (Glucagon-like Peptide-1) e PYY (Peptide YY). Esse mecanismo eleva a secreção de insulina de forma dependente de glicose, melhora a captação de glicose nos tecidos esquelético e hepático e retarda o esvaziamento gástrico, atenuando as oscilações glicêmicas.

Os AGCCs também penetram na circulação porta, exercendo efeitos diretos sobre a gliconeogênese hepática e a adipogênese. O propionato atua como substrato para a gliconeogênese intestinal de forma benéfica, enviando sinais ao sistema nervoso central que regulam o apetite e a homeostase energética, reduzindo a ingestão compulsiva de sacarose.

Quadros de disbiose intestinal ou perda na diversidade de espécies bacterianas anti-inflamatórias (como Akkermansia muciniphila e Faecalibacterium prausnitzii) estão amplamente associados ao aumento da permeabilidade da mucosa intestinal. Essa quebra da barreira epitelial permite a translocação de lipopolissacarídeos (LPS) de bactérias Gram-negativas para a circulação portal, desencadeando endotoxemia metabólica.

A endotoxemia sistêmica de baixo grau ativa receptores toll-like (TLR4) nos tecidos adiposo e hepático, induzindo a secreção de citocinas pró-inflamatórias como TNF-alfa e IL-6. Essas citocinas ativam quinases intracelulares (como a JNK) que fosforilam o substrato do receptor de insulina (IRS-1) em resíduos de serina, interrompendo a cascata de sinalização de captação de glicose mediada por transportadores GLUT4.

Intervenções dietéticas voltadas para o enriquecimento da microbiota representam ferramentas indispensáveis na remissão da resistência periférica à insulina. A suplementação direcionada com prebióticos como a inulina de cadeia longa e a goma guar parcialmente hidrolisada (GGPH) estimula seletivamente táxons produtores de butirato, restaurando a espessura da camada de muco protetora do epitélio intestinal.

O uso de polifenóis bioativos (como antocianinas da amora e resveratrol) também modula favoravelmente o microbioma. Esses compostos agem como prebióticos atípicos, estimulando a proliferação de Akkermansia muciniphila. Essa espécie bacteriana degrada mucina de forma controlada, estimulando a renovação celular e o fortalecimento das junções de oclusão (tight junctions), reduzindo a permeabilidade ao LPS.

Adicionalmente, estudos clínicos robustos de sequenciamento metagenômico demonstram que indivíduos com alta diversidade microbiana exibem curvas de resposta glicêmica pós-prandial muito mais previsíveis e estáveis. Pacientes com disbiose grave, por outro lado, mostram picos glicêmicos exagerados e imprevisíveis mesmo após ingerirem alimentos de baixo índice glicêmico teórico.

A incorporação do perfil metagenômico intestinal na rotina de avaliação diagnóstica de pacientes diabéticos ou pré-diabéticos revolucionará a terapia nutricional. Em vez de prescrever dietas restritivas genéricas baseadas puramente em contagem de carboidratos, o profissional médico prescreverá substratos prebióticos específicos para modular os táxons bacterianos em falta, tratando a causa primária da disfunção endócrina.`
  }
];

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeArticleId, setActiveArticleId] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  const [userProfile, setUserProfile] = useState({
    name: 'Pedro Miguel',
    email: 'pedromlzaparoli@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Pedro+Miguel&background=7e22ce&color=fff&size=256&bold=true',
    plan: 'Free'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (loading) return;

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    const htmlEl = document.documentElement;
    if (savedTheme === 'dark') {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }

    // Load profile
    const name = localStorage.getItem('user_name') || 'Pedro Miguel';
    const email = localStorage.getItem('user_email') || 'pedromlzaparoli@gmail.com';
    const avatar = localStorage.getItem('user_avatar') || 'https://ui-avatars.com/api/?name=Pedro+Miguel&background=7e22ce&color=fff&size=256&bold=true';
    const plan = localStorage.getItem('user_plan') || 'Free';

    setUserProfile({ name, email, avatar, plan });
  }, [loading]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    const htmlEl = document.documentElement;
    if (nextTheme === 'dark') {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_avatar");
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0A0A0B]">
        <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin"></div>
      </div>
    );
  }

  const workspaceSubtitle = `personal-${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-DM...`;
  const activeArticle = ARTICLES.find(a => a.id === activeArticleId);
  const filteredArticles = selectedCategory === 'Todas' 
    ? ARTICLES 
    : ARTICLES.filter(a => a.category === selectedCategory);

  return (
    <div className="bg-[#F9FAFB] dark:bg-[#0A0A0B] min-h-screen text-gray-900 dark:text-white flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SideNavBar Component */}
      <nav className={`h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#18181B] border-r border-gray-200 dark:border-[#27272A] flex flex-col py-6 z-50 transition-transform duration-300 md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <a href="/" className="px-6 pb-6 border-b border-gray-200 dark:border-[#27272A] mb-6 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg mx-2 p-2 block decoration-none">
          <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center overflow-hidden bg-purple-750 text-white font-bold text-sm">
            A
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="font-medium text-sm truncate text-gray-900 dark:text-white">{userProfile.name.split(' ')[0]}'s Works...</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{workspaceSubtitle}</p>
          </div>
          <svg className="text-gray-400 dark:text-gray-500" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
            <path d="m7 15 5 5 5-5"></path>
            <path d="m7 9 5-5 5 5"></path>
          </svg>
        </a>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 space-y-6">
          {/* Section 1 */}
          <div>
            <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Aprender</p>
            <div className="space-y-1">
              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="text-sm">Amora</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/recursos">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14h6"></path>
                  <path d="M9 18h6"></path>
                  <path d="M12 11v-4"></path>
                </svg>
                <span className="text-sm">Recursos Profissionais</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 transition-colors" href="/blog">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span className="text-sm">Blog</span>
              </a>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <p className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Ajustes</p>
            <div className="space-y-1">
              <a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" href="/configuracao">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span className="text-sm">Configuração</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 border-t border-gray-200 dark:border-[#27272A] space-y-4">
          <div className="px-2">
            <span className={`inline-block px-2 py-1 rounded font-medium text-xs ${userProfile.plan === 'Premium' ? 'bg-amber-500 text-black animate-pulse shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
              {userProfile.plan === 'Premium' ? 'Premium Plan' : 'Free Plan'}
            </span>
          </div>
          <div onClick={() => router.push('/configuracao')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 relative">
              <img alt={userProfile.name} className="w-full h-full object-cover" src={userProfile.avatar} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userProfile.name}</p>
              <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
            </div>
            <svg className="text-gray-400 dark:text-gray-500 shrink-0" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="m7 15 5 5 5-5"></path>
              <path d="m7 9 5-5 5 5"></path>
            </svg>
          </div>
          
          <button onClick={handleSignOut} className="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2 active:scale-95 transition-transform">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 w-full min-h-screen flex flex-col">
        
        {/* TopAppBar */}
        <header className="bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md top-0 sticky z-40 border-b border-gray-200 dark:border-[#27272A] flex justify-between items-center w-full px-8 h-16">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Abrir Menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg text-purple-700 dark:text-purple-400 font-semibold cursor-pointer" onClick={() => setActiveArticleId(null)}>
              Amora Workspace
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              aria-label="Toggle Dark Mode" 
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button aria-label="Notifications" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="px-6 py-8 max-w-5xl mx-auto w-full flex-1 flex flex-col">
          
          {activeArticleId === null ? (
            // LIST VIEW
            <div className="space-y-8 flex-1 flex flex-col">
              
              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['Todas', 'Nutrição Clínica', 'Biotecnologia', 'Health Tech', 'Pesquisa Aplicada'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'Todas' ? 'Todas' : cat)}
                    className={`px-4 py-1.5 rounded-full font-medium text-sm transition-all whitespace-nowrap active:scale-95 border ${
                      (cat === 'Todas' && selectedCategory === 'Todas') || selectedCategory === cat
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                        : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#27272A] hover:border-purple-400 dark:hover:border-purple-700'
                    }`}
                  >
                    {cat === 'Todas' ? 'Todas as Categorias' : cat}
                  </button>
                ))}
              </div>

              {selectedCategory === 'Todas' && (
                /* Featured Article (Hero) */
                <article 
                  onClick={() => setActiveArticleId(ARTICLES[0].id)} 
                  className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:hover:shadow-none transition-all duration-300 cursor-pointer"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-full min-h-[350px] overflow-hidden">
                      <img 
                        alt={ARTICLES[0].title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-out" 
                        src={ARTICLES[0].image} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden pointer-events-none"></div>
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-[#18181B] z-10 relative">
                      <div className="space-y-4 relative z-20">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-medium text-xs uppercase tracking-wider border border-purple-200 dark:border-purple-800">
                            {ARTICLES[0].category}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            {ARTICLES[0].readTime}
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors leading-tight">
                          {ARTICLES[0].title}
                        </h2>
                        <p className="text-base text-gray-500 dark:text-gray-400 font-light leading-relaxed max-w-xl">
                          {ARTICLES[0].summary}
                        </p>
                        <div className="pt-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <img alt={ARTICLES[0].author.name} className="w-full h-full object-cover" src={ARTICLES[0].author.avatar} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{ARTICLES[0].author.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{ARTICLES[0].author.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles
                  // Skip featured if showing "Todas" to avoid duplicate
                  .filter(art => selectedCategory !== 'Todas' || art.id !== ARTICLES[0].id)
                  .map(art => (
                    <article 
                      key={art.id}
                      onClick={() => setActiveArticleId(art.id)}
                      className="group flex flex-col bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:hover:shadow-none transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative h-48 overflow-hidden border-b border-gray-200 dark:border-[#27272A] bg-gray-50 dark:bg-gray-900/10">
                        <img 
                          alt={art.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                          src={art.image} 
                          loading="lazy"
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-purple-700 dark:text-purple-400 font-semibold text-xs uppercase tracking-wider">
                            {art.category}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {art.readTime}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug">
                          {art.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-light line-clamp-3 mb-4 flex-1">
                          {art.summary}
                        </p>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-[#27272A]/30 pt-3">
                          <span className="text-xs text-gray-500">{art.date}</span>
                          <span className="material-symbols-outlined text-gray-400 hover:text-purple-700 transition-colors cursor-pointer text-lg">
                            bookmark
                          </span>
                        </div>
                      </div>
                    </article>
                ))}
              </div>
              
              {/* Load More Button */}
              <div className="flex justify-center pt-4 pb-8">
                <button className="px-6 py-2.5 rounded-full border border-gray-200 dark:border-[#27272A] text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-purple-700/50 transition-all flex items-center gap-1 group active:scale-95 transition-transform">
                  Carregar Mais Artigos
                  <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
                </button>
              </div>

            </div>
          ) : (
            // ARTICLE DETAIL VIEW
            <div className="space-y-6 flex-1 animate-slide-up">
              
              {/* Back Link */}
              <button 
                onClick={() => setActiveArticleId(null)}
                className="flex items-center gap-2 text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium text-sm transition-colors cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Voltar para a listagem
              </button>

              <article className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl overflow-hidden p-6 md:p-10 space-y-8">
                {/* Meta details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-semibold text-xs uppercase tracking-wider border border-purple-200 dark:border-purple-800">
                      {activeArticle.category}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      {activeArticle.readTime}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      {activeArticle.date}
                    </span>
                  </div>
                  
                  <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {activeArticle.title}
                  </h1>
                  
                  {/* Author card */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 overflow-hidden">
                      <img alt={activeArticle.author.name} className="w-full h-full object-cover" src={activeArticle.author.avatar} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{activeArticle.author.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activeArticle.author.role}</p>
                    </div>
                  </div>
                </div>

                {/* Hero image */}
                <div className="relative h-64 md:h-[450px] rounded-xl overflow-hidden border border-gray-200 dark:border-[#27272A] shadow-md">
                  <img 
                    alt={activeArticle.title} 
                    className="w-full h-full object-cover" 
                    src={activeArticle.image} 
                  />
                </div>

                {/* Article body content */}
                <div className="prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300 space-y-6 font-light">
                  {activeArticle.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="whitespace-pre-line border-l-2 border-transparent hover:border-purple-500/30 pl-1 transition-colors">
                      {paragraph}
                    </p>
                  ))}
                </div>

              </article>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
