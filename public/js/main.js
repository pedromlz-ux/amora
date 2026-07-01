/* ============================================================
   AMORA — Main JavaScript
   Lead forms, Simulator, Scroll reveals, Mobile menu, Analytics
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Google Analytics Placeholder ---------- */
  // TODO: Replace with your GA4 Measurement ID
  // window.dataLayer = window.dataLayer || [];
  // function gtag(){ dataLayer.push(arguments); }
  // gtag('js', new Date());
  // gtag('config', 'G-XXXXXXXXXX');

  /* ---------- Header Scroll Effect ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', function () {
      const currentScroll = window.scrollY;
      if (currentScroll > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  /* ---------- Mobile Menu ---------- */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-close');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    if (mobileClose) {
      mobileClose.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Scroll Reveal (IntersectionObserver) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all immediately
    reveals.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ---------- Clinical Simulator ---------- */
  var simDiagnostico = document.getElementById('sim-diagnostico');
  var rangePeso = document.getElementById('range-peso');

  function updateSimulator() {
    if (!simDiagnostico || !rangePeso) return;

    var peso = parseFloat(rangePeso.value);
    var diagnostico = simDiagnostico.value;

    var labelPeso = document.getElementById('label-peso');
    if (labelPeso) labelPeso.textContent = peso + ' kg';

    var proteinaGramas = 0.8;
    var conduta = '';

    switch (diagnostico) {
      case 'renal':
        proteinaGramas = 0.6;
        conduta = 'Restrição proteica severa (IRC Conservador)';
        break;
      case 'diabetes':
        proteinaGramas = 1.0;
        conduta = 'Estabilização de glicemia (baixo IG e fibras)';
        break;
      case 'hepatica':
        proteinaGramas = 1.2;
        conduta = 'Prevenção de catabolismo proteico em cirrose compensada';
        break;
      case 'esporte':
        proteinaGramas = 2.0;
        conduta = 'Hipertrofia muscular e otimização do balanço de nitrogênio';
        break;
      default:
        proteinaGramas = 0.8;
        conduta = 'Conduta geral para paciente sem patologia específica';
    }

    var totalProteina = (peso * proteinaGramas).toFixed(1);

    var simProteina = document.getElementById('sim-proteina');
    var simConduta = document.getElementById('sim-conduta');

    if (simProteina) simProteina.textContent = proteinaGramas + ' g/kg (' + totalProteina + 'g total)';
    if (simConduta) simConduta.textContent = conduta;
  }

  if (simDiagnostico) {
    simDiagnostico.addEventListener('change', updateSimulator);
  }
  if (rangePeso) {
    rangePeso.addEventListener('input', updateSimulator);
  }

  // Initialize on load
  updateSimulator();

  /* ---------- Lead Form Submission (Supabase) ---------- */
  var leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var nome = document.getElementById('input-name').value.trim();
      var email = document.getElementById('input-email').value.trim();
      var whatsapp = document.getElementById('input-phone').value.trim();

      if (!nome || !email || !whatsapp) return;

      var submitBtn = leadForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      try {
        // Supabase CDN loaded in HTML
        var supabaseUrl = 'https://gifztywicarguetvtukt.supabase.co';
        var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnp0eXdpY2FyZ3VldHZ0dWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjY4MzUsImV4cCI6MjA5NTA0MjgzNX0.dMqH8K_zMIKab_qwmPFfrdYZl7qGPTlR37qmrAstyVI';
        var supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

        var result = await supabaseClient.from('leads').insert([{
          nome: nome,
          email: email,
          whatsapp: whatsapp
        }]);

        if (result.error) throw result.error;

        // Show success modal
        var modal = document.getElementById('success-modal');
        if (modal) {
          modal.classList.add('open');
        }

        // Redirect after 3 seconds
        setTimeout(function () {
          window.location.href = 'https://amora.hublumi.com/cadastro';
        }, 3000);

      } catch (err) {
        console.error('Erro ao registrar lead:', err);
        alert('Erro ao enviar dados. Por favor, tente novamente.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Experimentar Amora Grátis';
        }
      }
    });
  }

  /* ---------- Contact Form (simple mailto fallback) ---------- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.querySelector('[name="name"]').value;
      var email = contactForm.querySelector('[name="email"]').value;
      var message = contactForm.querySelector('[name="message"]').value;

      var subject = encodeURIComponent('Contato via Site Amora - ' + name);
      var body = encodeURIComponent('Nome: ' + name + '\nEmail: ' + email + '\n\n' + message);
      window.location.href = 'mailto:contato@hublumi.com?subject=' + subject + '&body=' + body;
    });
  }

})();
