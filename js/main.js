/**
 * CT Global Rent a Car — Customer-Only Platform Logic (index.html)
 * Strictly shows only customer-facing screens, minimal vehicle cards,
 * and opens full vehicle details + date availability checker on "Verificar Disponibilidad".
 */

let rentalsState = [];
let activeCategoryFilter = 'all';

function showToast(message) {
  const toast = document.getElementById('toastMsg');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3600);
}

document.addEventListener('DOMContentLoaded', () => {
  rentalsState = loadRentalsState();

  // Initialize Default Date Inputs (Today -> +3 Days)
  const defaultStart = getOffsetDateStr(0);
  const defaultEnd = getOffsetDateStr(3);

  const homeStartInput = document.getElementById('homeStartDate');
  const homeEndInput = document.getElementById('homeEndDate');

  if (homeStartInput) homeStartInput.value = defaultStart;
  if (homeEndInput) homeEndInput.value = defaultEnd;

  // =========================================================================
  // 1. MULTI-SCREEN ROUTER (CUSTOMER SCREENS ONLY)
  // =========================================================================
  const screens = document.querySelectorAll('.app-screen');
  const navTabBtns = document.querySelectorAll('[data-screen-target]');
  const navLinksContainer = document.getElementById('navLinks');
  const mobileToggle = document.getElementById('mobileToggle');

  function switchScreen(screenName) {
    screens.forEach((sec) => {
      sec.classList.toggle('active', sec.id === `screen-${screenName}`);
    });

    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.screenTarget === screenName);
    });

    if (navLinksContainer) {
      navLinksContainer.classList.remove('open');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderFleetCatalog();
  }

  window.switchScreen = switchScreen;

  navTabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.screenTarget;
      if (target) switchScreen(target);
    });
  });

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
    });
  }

  // =========================================================================
  // 2. HERO VEHICLE SHOWCASE SWITCHER
  // =========================================================================
  const heroCarIds = ['hilux', 'rush', 'raize', 'yaris'];
  let currentHeroIdx = 0;

  const heroCategoryEl = document.getElementById('heroCarCategory');
  const heroPriceEl = document.getElementById('heroCarPrice');
  const heroNameEl = document.getElementById('heroCarName');
  const heroImgEl = document.getElementById('heroCarImg');
  const heroSpec1El = document.getElementById('heroSpec1');
  const heroSpec2El = document.getElementById('heroSpec2');
  const heroSpec3El = document.getElementById('heroSpec3');
  const heroCheckBtn = document.getElementById('heroCheckBtn');
  const switchBtns = document.querySelectorAll('.hero-switch-btn');

  function updateHeroShowcase(index) {
    currentHeroIdx = index;
    const carId = heroCarIds[index];
    const v = FLEET_VEHICLES.find((c) => c.id === carId);
    if (!v || !heroImgEl) return;

    switchBtns.forEach((b, i) => b.classList.toggle('active', i === index));

    heroCategoryEl.textContent = v.categoryLabel;
    heroPriceEl.textContent = `$${v.price} / día`;
    heroNameEl.textContent = v.name;
    heroImgEl.src = v.image;
    heroImgEl.alt = v.name;
    heroSpec1El.textContent = v.passengers;
    heroSpec2El.textContent = v.transmission;
    heroSpec3El.textContent = v.highlight;

    if (heroCheckBtn) {
      heroCheckBtn.onclick = () => openVehicleDetailModal(v.id);
    }
  }

  switchBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      updateHeroShowcase(idx);
    });
  });

  // Home Quick Search Button -> Jumps to Flota Screen
  const homeSearchBtn = document.getElementById('homeSearchBtn');
  const homeCategorySelect = document.getElementById('homeCategorySelect');

  if (homeSearchBtn) {
    homeSearchBtn.addEventListener('click', () => {
      if (homeCategorySelect) {
        activeCategoryFilter = homeCategorySelect.value;
      }
      switchScreen('flota');
    });
  }

  // =========================================================================
  // 3. MINIMAL FLEET CARDS RENDERER (ONLY ESSENTIAL INFO ON CARD)
  // =========================================================================
  const fleetGridEl = document.getElementById('fleetGridContainer');
  const filterTabs = document.querySelectorAll('.filter-tab');

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeCategoryFilter = tab.dataset.filter;
      renderFleetCatalog();
    });
  });

  function renderFleetCatalog() {
    if (!fleetGridEl) return;
    rentalsState = loadRentalsState();

    filterTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.filter === activeCategoryFilter);
    });

    let html = '';

    FLEET_VEHICLES.forEach((car) => {
      if (activeCategoryFilter !== 'all' && car.category !== activeCategoryFilter) {
        return;
      }

      html += `
        <article class="car-card">
          <div class="car-card-stage">
            <span class="car-badge-top">${car.categoryLabel}</span>
            <img src="${car.image}" alt="${car.name}" class="car-img" />
          </div>
          <div class="car-card-body">
            <div class="car-header-row">
              <h3 class="car-title">${car.name}</h3>
              <div class="car-price-box">
                <span class="car-price-amount">$${car.price}</span>
                <span class="car-price-period">por día</span>
              </div>
            </div>

            <div class="car-spec-pills">
              <span class="car-spec-pill">👥 ${car.passengers}</span>
              <span class="car-spec-pill">❄️ ${car.transmission}</span>
              <span class="car-spec-pill">✨ ${car.highlight}</span>
            </div>

            <div class="car-card-footer">
              <button type="button" class="btn btn-navy" onclick="openVehicleDetailModal('${car.id}')">
                📅 Verificar Disponibilidad
              </button>
            </div>
          </div>
        </article>
      `;
    });

    fleetGridEl.innerHTML = html;
  }

  // =========================================================================
  // 4. FULL VEHICLE DETAIL & DATE AVAILABILITY MODAL ("Verificar Disponibilidad")
  // =========================================================================
  const bookingModal = document.getElementById('clientBookingModal');
  const bookingCarIdInput = document.getElementById('bookingCarId');
  const modalCarTitleEl = document.getElementById('bookingModalCarTitle');
  const modalCarCategoryEl = document.getElementById('modalCarCategory');
  const modalCarImgEl = document.getElementById('modalCarImg');
  const modalCarPriceEl = document.getElementById('modalCarPrice');
  const modalCarQualitiesEl = document.getElementById('modalCarQualities');
  const modalMiniCalEl = document.getElementById('modalMiniCalendar');
  const bookingStartInput = document.getElementById('bookingStartDate');
  const bookingEndInput = document.getElementById('bookingEndDate');
  const bookingStatusBanner = document.getElementById('bookingStatusBanner');
  const bookingSummaryText = document.getElementById('bookingSummaryText');
  const bookingSubmitBtn = document.getElementById('bookingSubmitBtn');
  const clientBookingForm = document.getElementById('clientBookingForm');

  function buildModalCalendarHtml(vehicleId) {
    let cells = '';
    for (let i = 0; i < 10; i++) {
      const dStr = getOffsetDateStr(i);
      const { dow, dayNum } = formatShortDay(dStr);
      const isBusy = Boolean(getOverlappingRental(rentalsState, vehicleId, dStr, dStr));
      cells += `
        <div class="mini-cal-day ${isBusy ? 'day-busy' : 'day-free'}" title="${formatHumanDate(dStr)}: ${isBusy ? 'No disponible' : 'Disponible'}">
          <span>${dow}</span>
          ${dayNum}
        </div>
      `;
    }
    return cells;
  }

  window.openVehicleDetailModal = (carId) => {
    rentalsState = loadRentalsState();
    const car = FLEET_VEHICLES.find((c) => c.id === carId);
    if (!car || !bookingModal) return;

    bookingCarIdInput.value = car.id;
    modalCarTitleEl.textContent = car.name;
    modalCarCategoryEl.textContent = `${car.categoryLabel} · ${car.passengers}`;
    modalCarImgEl.src = car.image;
    modalCarImgEl.alt = car.name;
    modalCarPriceEl.textContent = `$${car.price} / día`;
    modalCarQualitiesEl.innerHTML = car.qualities.map((q) => `<li>${q}</li>`).join('');
    modalMiniCalEl.innerHTML = buildModalCalendarHtml(car.id);

    const sDate = (homeStartInput && homeStartInput.value) || getOffsetDateStr(0);
    const eDate = (homeEndInput && homeEndInput.value) || getOffsetDateStr(3);

    bookingStartInput.value = sDate;
    bookingEndInput.value = eDate;
    updateBookingModalAvailability();
    bookingModal.classList.add('open');
  };

  window.closeClientBookingModal = () => {
    if (bookingModal) bookingModal.classList.remove('open');
  };

  window.selectNextAvailableDates = (afterDateStr) => {
    const [y, m, d] = afterDateStr.split('-').map(Number);
    const nextStart = new Date(y, m - 1, d + 1, 12, 0, 0);
    const nextEnd = new Date(y, m - 1, d + 4, 12, 0, 0);
    const fmt = (dt) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    bookingStartInput.value = fmt(nextStart);
    bookingEndInput.value = fmt(nextEnd);
    updateBookingModalAvailability();
  };

  function updateBookingModalAvailability() {
    const car = FLEET_VEHICLES.find((c) => c.id === bookingCarIdInput.value);
    if (!car) return;

    if (bookingEndInput.value < bookingStartInput.value) {
      bookingEndInput.value = bookingStartInput.value;
    }

    const sDate = bookingStartInput.value;
    const eDate = bookingEndInput.value;
    const days = calcDaysBetween(sDate, eDate);
    const total = days * car.price;
    const conflict = getOverlappingRental(rentalsState, car.id, sDate, eDate);

    bookingSummaryText.innerHTML = `Duración: <strong>${days} ${days === 1 ? 'día' : 'días'}</strong> · Tarifa: <strong>$${car.price}/día</strong> · Total Estimado: <strong>$${total} USD</strong>`;

    if (conflict) {
      bookingStatusBanner.className = 'car-date-status-box busy-box';
      bookingStatusBanner.innerHTML = `
        <strong>🔴 No disponible del ${formatHumanDate(conflict.startDate)} al ${formatHumanDate(conflict.endDate)}</strong><br/>
        <span>Este vehículo se encuentra reservado en esas fechas. Estará libre a partir del <strong>${formatHumanDate(conflict.endDate)}</strong>.</span>
        <div style="margin-top:0.55rem;">
          <button type="button" class="btn btn-navy" style="padding:0.4rem 0.85rem;font-size:0.75rem;" onclick="selectNextAvailableDates('${conflict.endDate}')">
            Seleccionar próxima fecha disponible →
          </button>
        </div>
      `;
      if (bookingSubmitBtn) {
        bookingSubmitBtn.disabled = true;
        bookingSubmitBtn.style.opacity = '0.5';
      }
    } else {
      bookingStatusBanner.className = 'car-date-status-box free-box';
      bookingStatusBanner.innerHTML = `
        <strong>🟢 ¡Vehículo disponible del ${formatHumanDate(sDate)} al ${formatHumanDate(eDate)}!</strong><br/>
        <span>Podés completar tus datos abajo para reservarlo por <strong>${days} ${days === 1 ? 'día' : 'días'} ($${total} USD)</strong>.</span>
      `;
      if (bookingSubmitBtn) {
        bookingSubmitBtn.disabled = false;
        bookingSubmitBtn.style.opacity = '1';
      }
    }
  }

  if (bookingStartInput && bookingEndInput) {
    bookingStartInput.addEventListener('change', updateBookingModalAvailability);
    bookingEndInput.addEventListener('change', updateBookingModalAvailability);
  }

  if (clientBookingForm) {
    clientBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const carId = bookingCarIdInput.value;
      const sDate = bookingStartInput.value;
      const eDate = bookingEndInput.value;
      const conflict = getOverlappingRental(rentalsState, carId, sDate, eDate);

      if (conflict) {
        updateBookingModalAvailability();
        return;
      }

      const clientName = document.getElementById('bookingClientName').value.trim() || 'Cliente Web';
      const clientPhone = document.getElementById('bookingClientPhone').value.trim() || '+505 8800 0000';
      const clientDoc = document.getElementById('bookingClientDoc').value.trim() || '001-000000-0000A';
      const destination = document.getElementById('bookingDestination').value.trim() || 'Managua, Nicaragua';
      const pickup = document.getElementById('bookingPickup').value;

      const newRental = {
        id: 'rental-' + Date.now(),
        vehicleId: carId,
        clientName,
        clientRole: 'Reserva Cliente Web',
        clientPhone,
        clientDoc,
        currentLocation: destination,
        pickupPoint: pickup,
        startDate: sDate,
        endDate: eDate,
        status: 'Reservado'
      };

      rentalsState.unshift(newRental);
      saveRentalsState(rentalsState);
      closeClientBookingModal();
      clientBookingForm.reset();
      showToast(`✅ ¡Reserva confirmada para ${clientName}!`);
    });
  }

  updateHeroShowcase(0);
  renderFleetCatalog();
});
