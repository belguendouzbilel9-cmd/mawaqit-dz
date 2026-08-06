const SETUP_DONE_KEY = "mawaqit_setup_v1_done";

function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

function buildOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "setupWizardOverlay";
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:var(--bg-deep, #0A1F1C);
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:28px 20px; text-align:center;
    font-family:inherit; direction:rtl;
  `;
  overlay.innerHTML = `
    <div style="max-width:420px; width:100%;">
      <div id="swIcon" style="font-size:48px; margin-bottom:14px;">🕌</div>
      <h2 id="swTitle" style="color:var(--gold-soft,#E4C878); font-size:20px; margin-bottom:12px;"></h2>
      <p id="swBody" style="color:var(--cream,#F3EFE0); font-size:14.5px; line-height:1.8; margin-bottom:22px;"></p>
      <div id="swStatus" style="color:var(--muted,#8FA69C); font-size:13px; min-height:20px; margin-bottom:16px;"></div>
      <div id="swButtons" style="display:flex; flex-direction:column; gap:10px;"></div>
      <div style="margin-top:22px; color:var(--muted,#8FA69C); font-size:12px;" id="swProgress"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function setStep({ icon, title, body, status, buttons, progress }) {
  document.getElementById("swIcon").textContent = icon || "🕌";
  document.getElementById("swTitle").textContent = title || "";
  document.getElementById("swBody").textContent = body || "";
  document.getElementById("swStatus").textContent = status || "";
  document.getElementById("swProgress").textContent = progress || "";
  const wrap = document.getElementById("swButtons");
  wrap.innerHTML = "";
  (buttons || []).forEach(b => {
    const btn = document.createElement("button");
    btn.textContent = b.label;
    btn.style.cssText = `
      padding:13px 16px; border-radius:12px; font-size:15px; font-weight:600;
      border:1px solid ${b.primary ? "var(--gold,#CBA135)" : "var(--line,#254E44)"};
      background:${b.primary ? "var(--gold,#CBA135)" : "transparent"};
      color:${b.primary ? "#12302A" : "var(--gold-soft,#E4C878)"};
      cursor:pointer;
    `;
    btn.addEventListener("click", b.onClick);
    wrap.appendChild(btn);
  });
}

function finishWizard(overlay) {
  localStorage.setItem(SETUP_DONE_KEY, "1");
  overlay.remove();
}

async function stepWelcome(overlay) {
  setStep({
    icon: "🕌",
    title: "إعداد سريع قبل البدء",
    body: "حتى يدق الأذان تلقائيًا في وقته — حتى لو كان التطبيق مغلقًا تمامًا — نحتاج نضبط معك إذنين بسيطين. الخطوة تاخذ أقل من دقيقة.",
    buttons: [
      { label: "ابدأ الإعداد", primary: true, onClick: () => stepNotifications(overlay) }
    ],
    progress: "الخطوة 1 من 3"
  });
}

async function stepNotifications(overlay) {
  setStep({
    icon: "🔔",
    title: "إذن الإشعارات",
    body: "اسمح للتطبيق بإرسال إشعارات حتى يقدر ينبهك عند دخول وقت كل صلاة.",
    status: "بانتظار السماح...",
    progress: "الخطوة 2 من 3",
    buttons: []
  });

  try {
    const { LocalNotifications } = window.Capacitor.Plugins;
    const result = await LocalNotifications.requestPermissions();
    if (result.display === "granted") {
      setStep({
        icon: "✅",
        title: "إذن الإشعارات",
        body: "تم! الإشعارات مفعّلة.",
        buttons: [
          { label: "التالي", primary: true, onClick: () => stepBattery(overlay) }
        ],
        progress: "الخطوة 2 من 3"
      });
    } else {
      setStep({
        icon: "⚠️",
        title: "إذن الإشعارات",
        body: "بدون هذا الإذن، ما راح يوصلك أي تنبيه أذان نهائيًا. تقدر تفعّله يدويًا لاحقًا من إعدادات الهاتف إذا رفضته بالغلط.",
        buttons: [
          { label: "أعد المحاولة", primary: true, onClick: () => stepNotifications(overlay) },
          { label: "تخطي مؤقتًا", primary: false, onClick: () => stepBattery(overlay) }
        ],
        progress: "الخطوة 2 من 3"
      });
    }
  } catch (e) {
    stepBattery(overlay);
  }
}

async function stepBattery(overlay) {
  setStep({
    icon: "🔋",
    title: "استثناء توفير البطارية",
    body: "بعض الهواتف (شاومي، أوبو، هواوي...) توقف التطبيقات بالخلفية لتوفير البطارية، وهذا يمنع الأذان من الاشتغال وأنت مسكّر التطبيق. اضغط الزر وسيفتح إعداد النظام — اختر \"سماح / بدون قيود\".",
    progress: "الخطوة 3 من 3",
    buttons: [
      {
        label: "فتح إعداد البطارية والتشغيل التلقائي",
        primary: true,
        onClick: async () => {
          try {
            const plugins = window.Capacitor.Plugins;
            if (plugins.DontKillMyApp) {
              await plugins.DontKillMyApp.requestRunInBackground();
            }
          } catch (e) { console.error("DontKillMyApp error", e); }
          setStep({
            icon: "🔋",
            title: "استثناء توفير البطارية",
            body: "إذا ظهرت لك نافذة أو صفحة إعدادات، فعّل الخيار المناسب ثم ارجع هنا واضغط \"تم، إنهاء الإعداد\".",
            buttons: [
              { label: "تم، إنهاء الإعداد", primary: true, onClick: () => finishWizard(overlay) }
            ],
            progress: "الخطوة 3 من 3"
          });
        }
      },
      { label: "تخطي هذه الخطوة", primary: false, onClick: () => finishWizard(overlay) }
    ]
  });
}

async function initSetupWizard() {
  if (!isNative()) return;
  if (localStorage.getItem(SETUP_DONE_KEY) === "1") return;
  const overlay = buildOverlay();
  stepWelcome(overlay);
}

window.initSetupWizard = initSetupWizard;
