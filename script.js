// Operation Long March
document.addEventListener("DOMContentLoaded", () => {
  // Subtle parallax on the hero image as you scroll.
  const heroImg = document.querySelector(".hero__img");
  if (heroImg && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    addEventListener("scroll", () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      heroImg.style.transform = `scale(1.08) translateY(${y * 0.15}px)`;
    }, { passive: true });
  }

  initMaps();
  initLaunchSequence();

  document.querySelectorAll(".imin").forEach((btn) => {
    btn.addEventListener("click", () => {
      launchRockets();
      btn.classList.add("imin--done");
    });
  });
});

// Real driving route (Haikou Meilan Airport → Hilton Wenchang), from OSRM. [lat, lon]
const DRIVE_ROUTE = [[19.94153,110.45904],[19.9417,110.463],[19.94207,110.46366],[19.94289,110.46379],[19.94348,110.46407],[19.94378,110.46573],[19.94377,110.4694],[19.94382,110.48299],[19.94356,110.49394],[19.94267,110.49992],[19.94163,110.49954],[19.94932,110.50053],[19.95261,110.50604],[19.95003,110.51603],[19.9438,110.52678],[19.93594,110.53534],[19.91776,110.55271],[19.91041,110.55923],[19.8953,110.56862],[19.8879,110.57423],[19.87297,110.59012],[19.8613,110.60346],[19.85349,110.61537],[19.84694,110.62327],[19.83646,110.6326],[19.82405,110.64401],[19.81871,110.65052],[19.80351,110.67068],[19.79624,110.67815],[19.78998,110.68296],[19.77985,110.68858],[19.75685,110.7],[19.74698,110.70364],[19.7303,110.70881],[19.72201,110.71031],[19.71338,110.71071],[19.70183,110.71105],[19.69166,110.71321],[19.68419,110.71464],[19.67985,110.71487],[19.6657,110.71424],[19.65302,110.71501],[19.6337,110.71949],[19.62432,110.72208],[19.61902,110.72607],[19.61223,110.73382],[19.60431,110.73959],[19.59489,110.74454],[19.57985,110.74944],[19.56774,110.75132],[19.56156,110.75146],[19.56245,110.75077],[19.56284,110.75105],[19.56447,110.75606],[19.56897,110.77037],[19.56994,110.77877],[19.57155,110.79469],[19.57352,110.80961],[19.5736,110.81764],[19.57577,110.83268],[19.57953,110.84294],[19.58397,110.85329],[19.58475,110.86277],[19.5841,110.87048],[19.59423,110.91104],[19.59536,110.91387],[19.59619,110.91539],[19.59796,110.91782],[19.60007,110.91991],[19.60213,110.9214],[19.60359,110.92221],[19.60631,110.92326],[19.60915,110.92384],[19.61823,110.92625],[19.62404,110.92903],[19.63028,110.93012],[19.63534,110.93001],[19.64147,110.93125],[19.64895,110.93496],[19.6552,110.93856],[19.65845,110.94108],[19.65842,110.94744],[19.65484,110.95228],[19.65318,110.95599],[19.65164,110.9591],[19.65136,110.96183],[19.65144,110.96514],[19.65269,110.97048],[19.65147,110.97629],[19.65141,110.97864],[19.65203,110.9824],[19.6512,110.9866],[19.64839,110.98977],[19.64551,110.98941],[19.64437,110.98839]];

// ---- Real maps (Leaflet) ----
function initMaps() {
  if (typeof L === "undefined") return;

  // Real coordinates [lat, lon]
  const BKK    = [13.690, 100.750]; // Suvarnabhumi
  const HAIKOU = [19.935, 110.459]; // Haikou Meilan Intl (HAK)
  const HILTON  = [19.64455, 110.98822]; // Hilton Wenchang, Qishui Bay (user-supplied)
  const SITE    = [19.6144, 110.9510];   // Wenchang launch centre — LM-10B LAUNCH pad
  const LANDING = [19.5680, 110.9640];   // offshore booster LANDING pad (sea recovery)

  const tiles = () =>
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    });

  // Maps built below the fold can render with gray gaps until measured while visible.
  const refreshWhenVisible = (map, el) => {
    map.whenReady(() => map.invalidateSize());
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { map.invalidateSize(); io.disconnect(); }
      });
    }, { threshold: 0.1 });
    io.observe(el);
  };

  const mk = (latlng, emoji, text, cls, anchor) =>
    L.marker(latlng, {
      icon: L.divIcon({
        className: "",
        html: `<span class="mapmark ${cls || ""}"><span class="mapmark__dot">${emoji}</span><span class="mapmark__txt">${text}</span></span>`,
        iconSize: null,
        iconAnchor: anchor || [11, 11],
      }),
    });

  const distLabel = (latlng, text) =>
    L.marker(latlng, {
      icon: L.divIcon({ className: "", html: `<span class="mapdist">${text}</span>`, iconAnchor: [30, 9] }),
      interactive: false,
    });

  // --- Map 1: the flight ---
  const f = document.getElementById("map-flight");
  if (f) {
    const m1 = L.map(f, { scrollWheelZoom: false, zoomControl: true });
    tiles().addTo(m1);
    mk(BKK, "✈", "Bangkok · BKK", "mapmark--light").addTo(m1);
    mk(HAIKOU, "🛬", "Haikou · HAK", "mapmark--gold").addTo(m1);
    L.polyline([BKK, HAIKOU], { color: "#f5c542", weight: 4, dashArray: "8 10", opacity: 0.95 }).addTo(m1);
    m1.fitBounds(L.latLngBounds(BKK, HAIKOU), { padding: [45, 45] });
    refreshWhenVisible(m1, f);
  }

  // --- Map 2: the drive (airport → hotel), real road route ---
  const d = document.getElementById("map-drive");
  if (d) {
    const m2 = L.map(d, { scrollWheelZoom: false, zoomControl: true });
    tiles().addTo(m2);
    L.polyline(DRIVE_ROUTE, { color: "#e23636", weight: 5, opacity: 0.9, lineJoin: "round" }).addTo(m2);
    mk(HAIKOU, "🛬", "Haikou airport · HAK", "mapmark--gold").addTo(m2);
    mk(HILTON, "🏨", "Hilton Wenchang", "mapmark--light").addTo(m2);
    m2.fitBounds(L.latLngBounds(DRIVE_ROUTE), { paddingTopLeft: [50, 40], paddingBottomRight: [150, 40] });
    refreshWhenVisible(m2, d);
  }

  // --- Map 3: Wenchang close-up (hotel + launch pad + booster landing pad) ---
  const l = document.getElementById("map-local");
  if (l) {
    const m3 = L.map(l, { scrollWheelZoom: false, zoomControl: true });
    tiles().addTo(m3);
    // hotel ↔ launch pad: the distance that matters
    L.polyline([HILTON, SITE], { color: "#14233b", weight: 3, dashArray: "4 7", opacity: 0.85 }).addTo(m3);
    distLabel([(HILTON[0] + SITE[0]) / 2, (HILTON[1] + SITE[1]) / 2], "≈ 5 km").addTo(m3);
    // launch pad → booster sea landing pad (reusable first stage flies back)
    L.polyline([SITE, LANDING], { color: "#1d8fc4", weight: 3, dashArray: "2 8", opacity: 0.8 }).addTo(m3);
    mk(HILTON, "🏨", "Hilton Wenchang", "mapmark--light", [11, 30]).addTo(m3);
    mk(SITE, "🚀", "LM-10B launch pad ✗", "mapmark--red").addTo(m3);
    mk(LANDING, "🪂", "Booster landing pad", "", [11, 11]).addTo(m3);
    m3.fitBounds(L.latLngBounds([HILTON, SITE, LANDING]), { paddingTopLeft: [60, 50], paddingBottomRight: [150, 50] });
    refreshWhenVisible(m3, l);
  }
}

// ---- Play the song once on load, then launch the giant rocket 5s in ----
function initLaunchSequence() {
  const audio = document.getElementById("bgm");
  const rocket = document.getElementById("megarocket");
  if (!audio || !rocket) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let armed = false;

  // Fire the giant rocket once, 5s after playback actually begins.
  const armLaunch = () => {
    if (armed) return;
    armed = true;
    if (reduce) return; // honour reduced-motion: skip the animation
    setTimeout(() => {
      rocket.classList.add("megarocket--launch");
      // Clean up once it's off-screen so it can't linger or re-trigger.
      rocket.addEventListener("animationend", () => rocket.remove(), { once: true });
    }, 5000);
  };

  // Start the 5s clock the moment the song really starts playing.
  audio.addEventListener("playing", armLaunch, { once: true });

  // Try to autoplay; many browsers block sound until the user interacts.
  const tryPlay = () => audio.play().catch(() => {});
  tryPlay();

  // Fallback: if autoplay was blocked, start on the first user gesture.
  const onGesture = () => {
    tryPlay();
    if (!audio.paused) {
      ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
        removeEventListener(ev, onGesture)
      );
    }
  };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    addEventListener(ev, onGesture, { passive: true })
  );
}

// ---- "IM IN" full-screen rocket blast ----
function launchRockets() {
  const overlay = document.createElement("div");
  overlay.className = "rocket-overlay";
  document.body.appendChild(overlay);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const N = reduce ? 0 : 260;
  let maxLife = 0;

  for (let i = 0; i < N; i++) {
    const r = document.createElement("span");
    r.className = "rocket-fly";
    r.textContent = "🚀";
    const dur = 2 + Math.random() * 2.6;
    const delay = Math.random() * 1.4;
    maxLife = Math.max(maxLife, dur + delay);
    r.style.left = Math.random() * 100 + "vw";
    r.style.fontSize = 16 + Math.random() * 44 + "px";
    r.style.setProperty("--dx", (Math.random() * 2 - 1) * 36 + "vw");
    r.style.setProperty("--rot", (Math.random() * 2 - 1) * 80 + "deg");
    r.style.animationDuration = dur + "s";
    r.style.animationDelay = delay + "s";
    overlay.appendChild(r);
  }

  setTimeout(() => overlay.remove(), reduce ? 1200 : (maxLife + 0.4) * 1000);
}
