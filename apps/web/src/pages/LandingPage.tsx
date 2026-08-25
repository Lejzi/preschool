import { Link } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronRight,
  CreditCard,
  Heart,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: CalendarCheck,
    title: "Obecność bez papieru",
    description:
      "Sprawdzaj listę w kilka chwil i od razu widzisz, kto jest obecny, spóźniony lub nieobecny.",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: MessageCircle,
    title: "Spokojna komunikacja",
    description:
      "Wiadomości i ogłoszenia trafiają do właściwych rodziców — bez szukania w grupowych czatach.",
    tone: "bg-blue-50 text-blue-700",
  },
  {
    icon: CreditCard,
    title: "Rozliczenia pod kontrolą",
    description:
      "Faktury, terminy i zaległości w jednym widoku. Mniej arkuszy, więcej przejrzystości.",
    tone: "bg-violet-50 text-violet-700",
  },
  {
    icon: Utensils,
    title: "Jadłospis, który się zgadza",
    description:
      "Planuj menu z uwzględnieniem alergenów i udostępniaj je rodzicom bez dodatkowych wiadomości.",
    tone: "bg-amber-50 text-amber-700",
  },
  {
    icon: Baby,
    title: "Pełny obraz dziecka",
    description:
      "Najważniejsze dane, potrzeby żywieniowe i historia aktywności zawsze pod ręką uprawnionego zespołu.",
    tone: "bg-rose-50 text-rose-700",
  },
  {
    icon: BarChart3,
    title: "Dzień w jednym pulpicie",
    description:
      "Najważniejsze liczby i pilne sprawy widać od razu po zalogowaniu — bez przeklikiwania modułów.",
    tone: "bg-cyan-50 text-cyan-700",
  },
];

const roleBenefits = [
  {
    label: "Dla dyrekcji",
    title: "Pełna kontrola, mniej administracji",
    description:
      "Zespół, grupy, frekwencja, rozliczenia i bieżące sprawy placówki w jednym, czytelnym systemie.",
    bullets: ["Szybki podgląd dnia", "Zarządzanie personelem", "Kontrola zaległych płatności"],
    color: "bg-brand-600",
  },
  {
    label: "Dla nauczycieli",
    title: "Więcej czasu z dziećmi",
    description:
      "Codzienne zadania zajmują minuty, a potrzebne informacje są dostępne dokładnie tam, gdzie ich szukasz.",
    bullets: ["Prosta lista obecności", "Grupy i profile dzieci", "Szybki kontakt z rodzicami"],
    color: "bg-emerald-600",
  },
  {
    label: "Dla rodziców",
    title: "Spokój przez cały dzień",
    description:
      "Jadłospis, zajęcia, ogłoszenia, wiadomości i rozliczenia — bez wielu aplikacji i chaotycznych grup.",
    bullets: ["Wszystkie informacje w jednym miejscu", "Bezpośrednie wiadomości", "Przejrzyste rozliczenia"],
    color: "bg-violet-600",
  },
];

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl font-black shadow-sm ${
          inverse ? "bg-white text-brand-700" : "bg-brand-600 text-white"
        }`}
        aria-hidden="true"
      >
        P
      </span>
      <span className={`font-bold tracking-tight ${inverse ? "text-white" : "text-slate-950"}`}>
        Przedszkole <span className={inverse ? "text-brand-200" : "text-brand-600"}>App</span>
      </span>
    </div>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfcff] text-slate-900">
      <header className="relative z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" aria-label="Przedszkole App — strona główna">
            <BrandMark />
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Główna nawigacja">
            <a className="transition-colors hover:text-brand-700" href="#mozliwosci">Możliwości</a>
            <a className="transition-colors hover:text-brand-700" href="#dla-kogo">Dla kogo</a>
            <a className="transition-colors hover:text-brand-700" href="#bezpieczenstwo">Bezpieczeństwo</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="btn-ghost">Zaloguj się</Link>
            <Link to="/register" className="btn-primary px-5 py-2.5">
              Zacznij bezpłatnie <ArrowRight size={16} />
            </Link>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg md:hidden">
            <nav className="flex flex-col gap-1 text-sm font-medium" aria-label="Nawigacja mobilna">
              {[["#mozliwosci", "Możliwości"], ["#dla-kogo", "Dla kogo"], ["#bezpieczenstwo", "Bezpieczeństwo"]].map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-slate-50">{label}</a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <Link to="/login" className="btn-secondary">Zaloguj się</Link>
                <Link to="/register" className="btn-primary">Załóż konto</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_10%,rgba(79,70,229,0.12),transparent_34%),radial-gradient(circle_at_10%_55%,rgba(14,165,233,0.08),transparent_27%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-18 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
            <div className="max-w-2xl animate-fade-in">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
                <Sparkles size={14} /> Prościej dla całego przedszkola
              </div>
              <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Mniej administracji. <span className="text-brand-600">Więcej czasu dla dzieci.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Obecność, wiadomości, jadłospis, zajęcia i rozliczenia w jednym spokojnym miejscu dla dyrekcji, nauczycieli i rodziców.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="btn-primary px-6 py-3.5 text-base shadow-lg shadow-brand-600/20">
                  Wypróbuj bezpłatnie <ArrowRight size={18} />
                </Link>
                <a href="#mozliwosci" className="btn-secondary px-6 py-3.5 text-base">
                  Zobacz możliwości <ChevronRight size={18} />
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                {['Bez karty płatniczej', 'Uruchomienie w kilka minut', 'Dostęp na telefonie i komputerze'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" />{item}</span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-200/50 via-sky-100/40 to-violet-100/60 blur-2xl" />
              <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-slate-900/15">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <BrandMark />
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-slate-100" />
                    <span className="hidden text-sm font-medium text-slate-600 sm:block">Anna Kowalska</span>
                  </div>
                </div>
                <div className="bg-slate-50/80 p-5 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">{today}</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">Dzień dobry, Aniu 👋</h2>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["18", "Obecnych", "bg-emerald-500"],
                      ["3", "Do sprawdzenia", "bg-amber-500"],
                      ["2", "Wiadomości", "bg-blue-500"],
                      ["1", "Zaległość", "bg-rose-500"],
                    ].map(([value, label, color]) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                        <span className={`mb-3 block h-2 w-8 rounded-full ${color}`} />
                        <strong className="block text-xl text-slate-900">{value}</strong>
                        <span className="text-[11px] text-slate-500">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[1.25fr_0.75fr]">
                    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm">Dzisiejsze zadania</strong>
                        <span className="text-xs font-medium text-brand-600">3 zadania</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {["Uzupełnij obecność grupy Motylki", "Opublikuj jadłospis na piątek", "Odpowiedz na 2 wiadomości"].map((task, index) => (
                          <div key={task} className="flex items-center gap-3 text-xs text-slate-600">
                            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${index === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {index === 0 ? <Check size={13} /> : index + 1}
                            </span>
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-900 p-4 text-white shadow-sm">
                      <MessageCircle className="text-brand-300" size={22} />
                      <p className="mt-5 text-sm font-semibold">Nowa wiadomość</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">Mama Zosi zapytała o jutrzejsze zajęcia.</p>
                      <span className="mt-4 inline-flex text-xs font-semibold text-brand-300">Odpowiedz →</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-xl sm:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={18} /></span>
                <div><strong className="block text-sm">Lista gotowa</strong><span className="text-xs text-slate-500">18 dzieci obecnych</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-7">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-5 px-5 text-center sm:flex-row sm:gap-10">
            <p className="text-sm font-semibold text-slate-500">Jeden system zamiast:</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-400">
              <span>papierowych list</span><span>grupowych czatów</span><span>arkuszy rozliczeń</span><span>ogłoszeń na drzwiach</span>
            </div>
          </div>
        </section>

        <section id="mozliwosci" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Wszystko pod ręką</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Codzienna praca bez codziennego chaosu</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">Najważniejsze procesy placówki połączone w przejrzysty system, którego zespół nie musi długo się uczyć.</p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, tone }) => (
                <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-900/5">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={21} /></span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dla-kogo" className="scroll-mt-20 bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-300">Jedna placówka, trzy perspektywy</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Każdy widzi dokładnie to, czego potrzebuje</h2>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {roleBenefits.map((role) => (
                <article key={role.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-7">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${role.color}`}>{role.label}</span>
                  <h3 className="mt-5 text-xl font-bold">{role.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{role.description}</p>
                  <ul className="mt-6 space-y-3">
                    {role.bullets.map((bullet) => <li key={bullet} className="flex items-center gap-2.5 text-sm text-slate-200"><Check size={16} className="text-emerald-400" />{bullet}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="bezpieczenstwo" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div className="relative mx-auto grid h-72 w-full max-w-md place-items-center rounded-[2rem] bg-gradient-to-br from-brand-50 to-violet-100">
              <div className="absolute left-10 top-10 h-20 w-20 rounded-3xl bg-white/60" />
              <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full bg-brand-200/50" />
              <span className="relative grid h-28 w-28 place-items-center rounded-[2rem] bg-white text-brand-600 shadow-xl shadow-brand-900/10"><ShieldCheck size={52} strokeWidth={1.7} /></span>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Dane pod właściwą opieką</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Dostęp dopasowany do roli</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Dyrekcja, nauczyciel i rodzic pracują na jednym systemie, ale każdy ma dostęp tylko do przeznaczonych dla niego informacji.</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {["Role i uprawnienia", "Bezpieczne logowanie", "Oddzielne dane placówek", "Centralne zarządzanie zespołem"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={14} /></span>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand-600 px-6 py-14 text-center text-white shadow-2xl shadow-brand-900/20 sm:px-12 sm:py-16">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[50px] border-white/5" />
            <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-white/5" />
            <Heart className="relative mx-auto text-brand-200" size={28} fill="currentColor" />
            <h2 className="relative mt-4 text-3xl font-black tracking-tight sm:text-4xl">Spokojniejszy dzień zaczyna się tutaj</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-brand-100">Załóż konto i zobacz, jak szybko codzienne sprawy przedszkola mogą znaleźć swoje miejsce.</p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50">Zacznij bezpłatnie <ArrowRight size={17} /></Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Mam już konto</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <BrandMark />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Przedszkole App. Dobre miejsce na każdy dzień.</p>
          <div className="flex gap-5 text-sm font-medium text-slate-500"><Link to="/login" className="hover:text-brand-600">Logowanie</Link><Link to="/register" className="hover:text-brand-600">Rejestracja</Link></div>
        </div>
      </footer>
    </div>
  );
}
