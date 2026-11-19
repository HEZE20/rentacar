/**
 * CT Global Rent a Car — Shared Fleet Catalog & Demo State Store
 * Shared between index.html (Vista Cliente) and admin.html (Vista Administrador)
 */

const STORAGE_KEY_RENTALS = 'ctglobal_demo_rentals_v3';

function getOffsetDateStr(offsetDays) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatHumanDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d} ${months[(m || 1) - 1]} ${y}`;
}

function formatShortDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return {
    dow: days[dateObj.getDay()],
    dayNum: d
  };
}

function calcDaysBetween(startStr, endStr) {
  if (!startStr || !endStr) return 1;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const dt2 = new Date(y2, m2 - 1, d2, 12, 0, 0);
  const diff = Math.round((dt2 - dt1) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

const FLEET_VEHICLES = [
  {
    id: 'agya',
    name: 'Toyota Agya 2026',
    shortName: 'Agya 2026',
    plate: 'M 410-205',
    category: 'economico',
    categoryLabel: 'Económico',
    price: 35,
    passengers: '5 Pasajeros',
    transmission: 'A/C · Dirección Asistida',
    highlight: 'Bajo Consumo',
    image: 'assets/images/car-agya.png',
    defaultLocation: 'Base Central CT Global · Managua',
    qualities: [
      'Diseño compacto y moderno.',
      'Motor pequeño y eficiente en consumo.',
      'Fácil de maniobrar y estacionar.',
      'Capacidad aproximada de 5 pasajeros.',
      'Dirección asistida y aire acondicionado.'
    ]
  },
  {
    id: 'grandi10',
    name: 'Hyundai Grand i10',
    shortName: 'Grand i10',
    plate: 'M 398-614',
    category: 'economico',
    categoryLabel: 'Compacto Urbano',
    price: 40,
    passengers: '5 Pasajeros',
    transmission: 'Multimedia · A/C',
    highlight: 'Confort Urbano',
    image: 'assets/images/car-grandi10.png',
    defaultLocation: 'Sucursal Aeropuerto Internacional MGA',
    qualities: [
      'Diseño compacto.',
      'Cabina funcional y confortable.',
      'Fácil conducción en espacios urbanos.',
      'Capacidad de hasta 5 pasajeros, según versión.',
      'Equipamiento multimedia y aire acondicionado, según unidad.'
    ]
  },
  {
    id: 'yaris',
    name: 'Toyota Yaris Sedan 2026',
    shortName: 'Yaris Sedán',
    plate: 'M 388-504',
    category: 'sedan',
    categoryLabel: 'Sedán Ejecutivo',
    price: 45,
    passengers: '5 Pasajeros',
    transmission: 'Maletero Amplio',
    highlight: 'Conectividad',
    image: 'assets/images/car-yaris.png',
    defaultLocation: 'Base Central CT Global · Managua',
    qualities: [
      'Diseño moderno y elegante.',
      'Carrocería tipo sedán.',
      'Cabina cómoda y espaciosa.',
      'Maletero independiente para equipaje.',
      'Tecnología multimedia y conectividad, según versión.'
    ]
  },
  {
    id: 'raize',
    name: 'Toyota Raize 2026',
    shortName: 'Raize SUV',
    plate: 'M 415-902',
    category: 'suv',
    categoryLabel: 'SUV Compacto',
    price: 50,
    passengers: '5 Pasajeros',
    transmission: 'Pantalla Multimedia',
    highlight: 'Maletero Práctico',
    image: 'assets/images/car-raize.png',
    defaultLocation: 'Base Central CT Global · Managua',
    qualities: [
      'Diseño SUV compacto.',
      'Capacidad para 5 pasajeros.',
      'Cabina funcional.',
      'Pantalla multimedia y conectividad, según versión.',
      'Buena maniobrabilidad.',
      'Maletero práctico.'
    ]
  },
  {
    id: 'kicks',
    name: 'Nissan Kicks',
    shortName: 'Nissan Kicks',
    plate: 'M 407-331',
    category: 'suv',
    categoryLabel: 'SUV Deportivo',
    price: 50,
    passengers: '5 Pasajeros',
    transmission: 'Conducción Elevada',
    highlight: 'Amplio Equipaje',
    image: 'assets/images/car-kicks.png',
    defaultLocation: 'Sucursal Aeropuerto Internacional MGA',
    qualities: [
      'Diseño SUV moderno y deportivo.',
      'Posición de conducción elevada.',
      'Espacio interior funcional.',
      'Buena capacidad para pasajeros y equipaje.',
      'Tecnología y conectividad, según versión.'
    ]
  },
  {
    id: 'rush',
    name: 'Toyota Rush 2026',
    shortName: 'Rush 7 Pax',
    plate: 'M 402-119',
    category: 'suv',
    categoryLabel: 'SUV Familiar · 3 Filas',
    price: 70,
    passengers: '7 Pasajeros',
    transmission: '3 Filas Abatibles',
    highlight: 'Frenos ABS',
    image: 'assets/images/car-rush.png',
    defaultLocation: 'Base Central CT Global · Managua',
    qualities: [
      'Diseño SUV familiar.',
      'Capacidad de hasta 7 pasajeros en la configuración correspondiente.',
      'Tres filas de asientos.',
      'Asientos abatibles para ampliar el espacio de carga.',
      'Sistema de frenos ABS y asistencias de seguridad, según versión.'
    ]
  },
  {
    id: 'hilux',
    name: 'Toyota Hilux Intermedia 2026',
    shortName: 'Hilux 2026',
    plate: 'M 394-812',
    category: 'pickup',
    categoryLabel: 'Pickup 4x4',
    price: 85,
    passengers: '5 Pasajeros',
    transmission: 'Amplia Tina',
    highlight: 'Trabajo Exigente',
    image: 'assets/images/car-hilux.png',
    defaultLocation: 'Base Central CT Global · Managua',
    qualities: [
      'Diseño robusto tipo pickup.',
      'Cabina para pasajeros.',
      'Amplia tina de carga.',
      'Construcción pensada para trabajos exigentes.',
      'Opciones de motorización y tracción según versión.'
    ]
  }
];

function getDefaultDemoRentals() {
  return [
    {
      id: 'demo-1',
      vehicleId: 'hilux',
      clientName: 'Carlos Mendoza',
      clientRole: 'Proyecto Agroindustrial · Corporativo',
      clientPhone: '+505 8842 1930',
      clientDoc: '001-150488-0042K',
      currentLocation: 'Estelí · Km 148 Carretera Panamericana Norte',
      pickupPoint: 'Aeropuerto Internacional MGA, Managua',
      startDate: getOffsetDateStr(0),
      endDate: getOffsetDateStr(5),
      status: 'En Renta'
    },
    {
      id: 'demo-2',
      vehicleId: 'rush',
      clientName: 'María Fernanda Solís',
      clientRole: 'Viaje Familiar & Turismo',
      clientPhone: '+505 8715 6044',
      clientDoc: '001-220992-0018L',
      currentLocation: 'San Juan del Sur, Rivas · Zona Costera',
      pickupPoint: 'Hotel InterContinental Metrocentro, Managua',
      startDate: getOffsetDateStr(1),
      endDate: getOffsetDateStr(5),
      status: 'Reservado / En Ruta'
    },
    {
      id: 'demo-3',
      vehicleId: 'yaris',
      clientName: 'Roberto Chamorro',
      clientRole: 'Consultoría Empresarial',
      clientPhone: '+505 8960 3312',
      clientDoc: '041-081185-0005M',
      currentLocation: 'Managua Centro · Carretera a Masaya Km 5.5',
      pickupPoint: 'Entrega VIP Domicilio · Las Colinas, Managua',
      startDate: getOffsetDateStr(-1),
      endDate: getOffsetDateStr(2),
      status: 'En Renta'
    }
  ];
}

function loadRentalsState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RENTALS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  const defaults = getDefaultDemoRentals();
  saveRentalsState(defaults);
  return defaults;
}

function saveRentalsState(rentals) {
  try {
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(rentals));
  } catch (e) {
    // ignore
  }
}

function getOverlappingRental(rentals, vehicleId, startDate, endDate) {
  return rentals.find(
    (r) => r.vehicleId === vehicleId && rangesOverlap(startDate, endDate, r.startDate, r.endDate)
  );
}

function getActiveRentalForVehicle(rentals, vehicleId) {
  const today = getOffsetDateStr(0);
  const current = rentals.find(
    (r) => r.vehicleId === vehicleId && r.startDate <= today && r.endDate >= today
  );
  if (current) return current;
  return rentals.find((r) => r.vehicleId === vehicleId);
}
