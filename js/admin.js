/**
 * CT Global Rent a Car — Dedicated Administrator Dashboard Logic (admin.html)
 * Manages the 3 demo clients, vehicle GPS/city locations, rental days, and fleet status.
 */

let rentalsState = [];

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

  const adminClientsContainer = document.getElementById('adminClientsContainer');
  const adminFleetTableBody = document.getElementById('adminFleetTableBody');
  const kpiTotalCarsEl = document.getElementById('kpiTotalCars');
  const kpiActiveRentalsEl = document.getElementById('kpiActiveRentals');
  const kpiAvailableCarsEl = document.getElementById('kpiAvailableCars');
  const kpiActiveRevenueEl = document.getElementById('kpiActiveRevenue');

  function renderAdminDashboard() {
    rentalsState = loadRentalsState();

    const rentedVehicleIds = new Set(rentalsState.map((r) => r.vehicleId));
    const activeCount = rentalsState.length;
    const availableCount = Math.max(0, FLEET_VEHICLES.length - rentedVehicleIds.size);

    let totalRevenue = 0;
    rentalsState.forEach((r) => {
      const car = FLEET_VEHICLES.find((c) => c.id === r.vehicleId);
      const price = car ? car.price : 50;
      totalRevenue += calcDaysBetween(r.startDate, r.endDate) * price;
    });

    if (kpiTotalCarsEl) kpiTotalCarsEl.textContent = `${FLEET_VEHICLES.length} Autos`;
    if (kpiActiveRentalsEl) kpiActiveRentalsEl.textContent = `${activeCount} Activas`;
    if (kpiAvailableCarsEl) kpiAvailableCarsEl.textContent = `${availableCount} Libres`;
    if (kpiActiveRevenueEl) kpiActiveRevenueEl.textContent = `$${totalRevenue}`;

    // A. Render Active Demo Clients Cards (The 3 Demo People + any new bookings)
    let cardsHtml = '';
    rentalsState.forEach((rental) => {
      const car = FLEET_VEHICLES.find((c) => c.id === rental.vehicleId) || FLEET_VEHICLES[0];
      const days = calcDaysBetween(rental.startDate, rental.endDate);
      const totalUsd = days * car.price;
      const initials = rental.clientName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('');

      cardsHtml += `
        <article class="admin-rental-card">
          <div class="admin-rental-top">
            <div class="admin-client-person">
              <span class="admin-avatar">${initials}</span>
              <div>
                <h4 class="admin-client-name">${rental.clientName}</h4>
                <span class="admin-client-role">${rental.clientRole || 'Cliente CT Global'}</span>
              </div>
            </div>
            <span class="status-pill rented">● ${rental.status || 'En Renta'}</span>
          </div>

          <div class="admin-rental-body">
            <div class="admin-car-mini">
              <img src="${car.image}" alt="${car.name}" />
              <div>
                <div class="admin-car-mini-title">${car.name}</div>
                <div class="admin-car-mini-plate">Placa: ${car.plate} · $${car.price}/día</div>
              </div>
            </div>

            <div class="admin-location-highlight">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <div>
                <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--color-gold); letter-spacing: 0.08em;">¿Dónde se encuentra el auto?</div>
                <div>${rental.currentLocation}</div>
              </div>
            </div>

            <div class="admin-info-list">
              <div class="admin-info-row">
                <span class="admin-info-label">⏱️ Por cuántos días:</span>
                <span class="admin-info-val">${days} ${days === 1 ? 'día' : 'días'} ($${totalUsd} USD)</span>
              </div>
              <div class="admin-info-row">
                <span class="admin-info-label">📅 Fechas de Renta:</span>
                <span class="admin-info-val">${formatHumanDate(rental.startDate)} → ${formatHumanDate(rental.endDate)}</span>
              </div>
              <div class="admin-info-row">
                <span class="admin-info-label">✈️ Punto de Entrega:</span>
                <span class="admin-info-val">${rental.pickupPoint}</span>
              </div>
              <div class="admin-info-row">
                <span class="admin-info-label">📞 Teléfono / ID:</span>
                <span class="admin-info-val">${rental.clientPhone} · ${rental.clientDoc}</span>
              </div>
            </div>
          </div>

          <div class="admin-rental-actions">
            <button type="button" class="btn btn-navy" onclick="openAdminEditModal('${rental.id}')">
              ✏️ Editar / Ubicación
            </button>
            <button type="button" class="btn btn-outline-navy" onclick="releaseRental('${rental.id}')">
              ✅ Liberar Auto
            </button>
          </div>
        </article>
      `;
    });

    if (adminClientsContainer) {
      adminClientsContainer.innerHTML = cardsHtml;
    }

    // B. Render Full 7-Vehicle Fleet Radar & Location Table
    let rowsHtml = '';
    FLEET_VEHICLES.forEach((car) => {
      const rental = getActiveRentalForVehicle(rentalsState, car.id);
      const isRented = Boolean(rental);
      const locationText = isRented ? rental.currentLocation : car.defaultLocation;
      const clientText = isRented
        ? `<strong>${rental.clientName}</strong><br/><span style="font-size:0.76rem;color:var(--text-muted);">${rental.clientPhone}</span>`
        : `<span style="color:var(--text-muted);">— Sin asignar (En Patio) —</span>`;
      const daysText = isRented
        ? `<strong>${calcDaysBetween(rental.startDate, rental.endDate)} días</strong><br/><span style="font-size:0.75rem;color:var(--text-muted);">${formatHumanDate(rental.startDate)} al ${formatHumanDate(rental.endDate)}</span>`
        : `<span style="color:var(--status-green-text);font-weight:700;">Disponible ($${car.price}/día)</span>`;

      rowsHtml += `
        <tr>
          <td>
            <div class="table-car-cell">
              <img src="${car.image}" alt="${car.name}" class="table-car-thumb" />
              <div>
                <strong style="color:var(--color-navy);display:block;">${car.name}</strong>
                <span style="font-size:0.75rem;color:var(--color-gold);font-weight:700;">Placa: ${car.plate}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="status-pill ${isRented ? 'rented' : 'available'}">
              ● ${isRented ? rental.status : 'Disponible'}
            </span>
          </td>
          <td>${clientText}</td>
          <td>
            <strong style="color:var(--color-navy);">📍 ${locationText}</strong>
          </td>
          <td>${daysText}</td>
          <td>
            ${
              isRented
                ? `<button type="button" class="btn btn-navy" style="padding:0.45rem 0.85rem;font-size:0.76rem;" onclick="openAdminEditModal('${rental.id}')">✏️ Editar</button>`
                : `<button type="button" class="btn btn-gold" style="padding:0.45rem 0.85rem;font-size:0.76rem;" onclick="openAdminNewRentalForCar('${car.id}')">+ Asignar Cliente</button>`
            }
          </td>
        </tr>
      `;
    });

    if (adminFleetTableBody) {
      adminFleetTableBody.innerHTML = rowsHtml;
    }
  }

  // Admin Edit / Create Rental Modal
  const adminModal = document.getElementById('adminEditModal');
  const adminEditForm = document.getElementById('adminEditForm');
  const adminRentalIdInput = document.getElementById('adminRentalId');
  const adminVehicleSelect = document.getElementById('adminVehicleSelect');
  const adminClientNameInput = document.getElementById('adminClientName');
  const adminClientRoleInput = document.getElementById('adminClientRole');
  const adminClientPhoneInput = document.getElementById('adminClientPhone');
  const adminClientDocInput = document.getElementById('adminClientDoc');
  const adminCurrentLocationInput = document.getElementById('adminCurrentLocation');
  const adminPickupPointInput = document.getElementById('adminPickupPoint');
  const adminStartDateInput = document.getElementById('adminStartDate');
  const adminEndDateInput = document.getElementById('adminEndDate');
  const adminStatusSelect = document.getElementById('adminStatusSelect');
  const adminModalSummaryEl = document.getElementById('adminModalSummary');

  if (adminVehicleSelect) {
    adminVehicleSelect.innerHTML = FLEET_VEHICLES.map(
      (c) => `<option value="${c.id}">${c.name} (${c.plate} · $${c.price}/día)</option>`
    ).join('');
  }

  function updateAdminModalSummary() {
    const car = FLEET_VEHICLES.find((c) => c.id === adminVehicleSelect.value) || FLEET_VEHICLES[0];
    const days = calcDaysBetween(adminStartDateInput.value, adminEndDateInput.value);
    const total = days * car.price;
    if (adminModalSummaryEl) {
      adminModalSummaryEl.innerHTML = `Vehículo: <strong>${car.name}</strong> · Duración: <strong>${days} ${days === 1 ? 'día' : 'días'}</strong> · Total Calculado: <strong>$${total} USD</strong>`;
    }
  }

  [adminVehicleSelect, adminStartDateInput, adminEndDateInput].forEach((el) => {
    if (el) el.addEventListener('change', updateAdminModalSummary);
  });

  window.openAdminEditModal = (rentalId) => {
    const rental = rentalsState.find((r) => r.id === rentalId);
    if (!rental || !adminModal) return;

    document.getElementById('adminModalTitle').textContent = `Editar Renta & Ubicación — ${rental.clientName}`;
    adminRentalIdInput.value = rental.id;
    adminVehicleSelect.value = rental.vehicleId;
    adminClientNameInput.value = rental.clientName;
    adminClientRoleInput.value = rental.clientRole || '';
    adminClientPhoneInput.value = rental.clientPhone || '';
    adminClientDocInput.value = rental.clientDoc || '';
    adminCurrentLocationInput.value = rental.currentLocation || '';
    adminPickupPointInput.value = rental.pickupPoint || '';
    adminStartDateInput.value = rental.startDate;
    adminEndDateInput.value = rental.endDate;
    adminStatusSelect.value = rental.status || 'En Renta';

    updateAdminModalSummary();
    adminModal.classList.add('open');
  };

  window.openAdminNewRentalForCar = (carId) => {
    if (!adminModal) return;
    document.getElementById('adminModalTitle').textContent = 'Nueva Asignación de Vehículo';
    adminRentalIdInput.value = '';
    adminVehicleSelect.value = carId || 'agya';
    adminClientNameInput.value = '';
    adminClientRoleInput.value = 'Cliente Corporativo / Personal';
    adminClientPhoneInput.value = '+505 ';
    adminClientDocInput.value = '';
    adminCurrentLocationInput.value = 'Managua · Centro Corporativo';
    adminPickupPointInput.value = 'Aeropuerto Internacional MGA, Managua';
    adminStartDateInput.value = getOffsetDateStr(0);
    adminEndDateInput.value = getOffsetDateStr(3);
    adminStatusSelect.value = 'En Renta';

    updateAdminModalSummary();
    adminModal.classList.add('open');
  };

  window.closeAdminEditModal = () => {
    if (adminModal) adminModal.classList.remove('open');
  };

  if (adminEditForm) {
    adminEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const existingId = adminRentalIdInput.value;
      const payload = {
        id: existingId || 'rental-' + Date.now(),
        vehicleId: adminVehicleSelect.value,
        clientName: adminClientNameInput.value.trim() || 'Cliente Asignado',
        clientRole: adminClientRoleInput.value.trim() || 'Renta Activa',
        clientPhone: adminClientPhoneInput.value.trim() || '+505 8931 8989',
        clientDoc: adminClientDocInput.value.trim() || '001-000000-0000A',
        currentLocation: adminCurrentLocationInput.value.trim() || 'Managua, Nicaragua',
        pickupPoint: adminPickupPointInput.value.trim() || 'Oficina Central Managua',
        startDate: adminStartDateInput.value,
        endDate: adminEndDateInput.value,
        status: adminStatusSelect.value
      };

      if (existingId) {
        const idx = rentalsState.findIndex((r) => r.id === existingId);
        if (idx !== -1) rentalsState[idx] = payload;
      } else {
        rentalsState.unshift(payload);
      }

      saveRentalsState(rentalsState);
      closeAdminEditModal();
      renderAdminDashboard();
      showToast(`✅ Datos actualizados para ${payload.clientName} (${payload.currentLocation}).`);
    });
  }

  window.releaseRental = (rentalId) => {
    const rental = rentalsState.find((r) => r.id === rentalId);
    rentalsState = rentalsState.filter((r) => r.id !== rentalId);
    saveRentalsState(rentalsState);
    renderAdminDashboard();
    if (rental) {
      showToast(`✅ Vehículo liberado de ${rental.clientName}. Ya aparece Disponible en la vista del cliente.`);
    }
  };

  window.resetDemoData = () => {
    rentalsState = getDefaultDemoRentals();
    saveRentalsState(rentalsState);
    renderAdminDashboard();
    showToast('🔄 Se restauraron los 3 clientes demo (Carlos Mendoza, María Fernanda Solís y Roberto Chamorro).');
  };

  renderAdminDashboard();
});
