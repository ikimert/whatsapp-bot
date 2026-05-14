import { ReactNode, useEffect, useState } from 'react';

type Page = 'dashboard' | 'randevular' | 'musteriler' | 'ayarlar';

type Appointment = {
  id: number;
  isim: string;
  telefon: string;
  tarih: string;
  saat: string;
  durum: 'Onaylandı' | 'Bekliyor' | 'İptal';
};

const menuItems: { key: Page; label: string; icon: ReactNode }[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" />
      </svg>
    ),
  },
  {
    key: 'randevular',
    label: 'Randevular',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    key: 'musteriler',
    label: 'Müşteriler',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6M23 11h-6" />
      </svg>
    ),
  },
  {
    key: 'ayarlar',
    label: 'Ayarlar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.4l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8c0 .66.39 1.26 1 1.51.16.06.33.09.51.09H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

export default function App() {
  const apiUrl =
    (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
    'http://localhost:3001';
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    isim: '',
    telefon: '',
    tarih: '',
    saat: '',
  });

  const closeNewAppointmentModal = () => {
    setIsNewAppointmentModalOpen(false);
    setNewAppointmentForm({ isim: '', telefon: '', tarih: '', saat: '' });
  };

  const formatToDisplayDate = (value: string) => {
    if (value.includes('-')) {
      const [year, month, day] = value.split('-');
      return `${day}.${month}.${year}`;
    }
    return value;
  };

  const now = new Date();
  const todayFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
  const todayAppointmentCount = appointments.filter((item) => item.tarih === todayFormatted).length;
  const totalCustomerCount = appointments.length;
  const waitingRequestCount = appointments.filter((item) => item.durum === 'Bekliyor').length;

  useEffect(() => {
    if (activePage !== 'randevular') {
      return;
    }

    const fetchAppointments = async () => {
      try {
        const response = await fetch(`${apiUrl}/randevu`);
        if (!response.ok) {
          return;
        }
        const data: Appointment[] = await response.json();
        setAppointments(data);
      } catch {
        setAppointments([]);
      }
    };

    fetchAppointments();
  }, [activePage, apiUrl]);

  const handleSaveAppointment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isim = newAppointmentForm.isim.trim();
    const telefon = newAppointmentForm.telefon.trim();
    const tarih = newAppointmentForm.tarih.trim();
    const saat = newAppointmentForm.saat.trim();

    if (!isim || !telefon || !tarih || !saat) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/randevu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isim,
          telefon,
          tarih: formatToDisplayDate(tarih),
          saat,
          durum: 'Bekliyor',
        }),
      });

      if (!response.ok) {
        return;
      }

      const savedAppointment: Appointment = await response.json();
      setAppointments((prev) => [...prev, savedAppointment]);
      closeNewAppointmentModal();
    } catch {
      return;
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/randevu/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        return;
      }

      setAppointments((prev) => prev.filter((item) => item.id !== id));
    } catch {
      return;
    }
  };

  const renderContent = () => {
    if (activePage === 'dashboard') {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">Bugünkü Randevu</p>
              <p className="mt-2 text-3xl font-bold text-[#25D366]">{todayAppointmentCount}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">Toplam Müşteri</p>
              <p className="mt-2 text-3xl font-bold text-[#25D366]">{totalCustomerCount}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-400">Bekleyen Talepler</p>
              <p className="mt-2 text-3xl font-bold text-[#25D366]">{waitingRequestCount}</p>
            </div>
          </div>
        </div>
      );
    }

    if (activePage === 'randevular') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-white">Randevular</h1>
            <button
              type="button"
              className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-[#1fb85a]"
              onClick={() => setIsNewAppointmentModalOpen(true)}
            >
              + Yeni Randevu
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="min-w-[760px] text-left text-sm text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">İsim</th>
                  <th className="px-4 py-3 font-medium">Telefon</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Saat</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800 last:border-b-0">
                    <td className="px-4 py-3">{row.isim}</td>
                    <td className="px-4 py-3">{row.telefon}</td>
                    <td className="px-4 py-3">{row.tarih}</td>
                    <td className="px-4 py-3">{row.saat}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          row.durum === 'Onaylandı'
                            ? 'bg-[#25D366]/15 text-[#25D366]'
                            : row.durum === 'Bekliyor'
                              ? 'bg-yellow-500/15 text-yellow-300'
                              : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {row.durum}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-800 hover:text-[#25D366]"
                          aria-label="Düzenle"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-800 hover:text-red-400"
                          aria-label="Sil"
                          onClick={() => handleDeleteAppointment(row.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">
          {activePage === 'musteriler' ? 'Müşteriler' : 'Ayarlar'}
        </h1>
        <p className="text-zinc-400">Bu sayfa yakında aktif olacak.</p>
      </div>
    );
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`h-full w-64 border-r border-zinc-800 bg-zinc-950 ${mobile ? '' : 'fixed left-0 top-0 hidden md:flex'} flex-col`}
    >
      <div className="flex h-16 items-center border-b border-zinc-800 px-5">
        <span className="text-lg font-semibold text-[#25D366]">WhatsApp Randevu</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActivePage(item.key);
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-[#25D366]/15 text-[#25D366]'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <Sidebar />

      {isNewAppointmentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={closeNewAppointmentModal}
        >
          <div
            className="h-full w-full bg-zinc-950 p-5 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-xl sm:border sm:border-zinc-800"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Yeni Randevu Oluştur</h2>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                onClick={closeNewAppointmentModal}
                aria-label="Modalı kapat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveAppointment}>
              <div>
                <label className="mb-1 block text-sm text-zinc-300" htmlFor="isim">
                  İsim
                </label>
                <input
                  id="isim"
                  type="text"
                  required
                  value={newAppointmentForm.isim}
                  onChange={(event) =>
                    setNewAppointmentForm((prev) => ({
                      ...prev,
                      isim: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-300" htmlFor="telefon">
                  Telefon
                </label>
                <input
                  id="telefon"
                  type="tel"
                  required
                  value={newAppointmentForm.telefon}
                  onChange={(event) =>
                    setNewAppointmentForm((prev) => ({
                      ...prev,
                      telefon: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-300" htmlFor="tarih">
                  Tarih
                </label>
                <input
                  id="tarih"
                  type="date"
                  required
                  value={newAppointmentForm.tarih}
                  onChange={(event) =>
                    setNewAppointmentForm((prev) => ({
                      ...prev,
                      tarih: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-300" htmlFor="saat">
                  Saat
                </label>
                <input
                  id="saat"
                  type="time"
                  required
                  value={newAppointmentForm.saat}
                  onChange={(event) =>
                    setNewAppointmentForm((prev) => ({
                      ...prev,
                      saat: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 focus:border-[#25D366]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeNewAppointmentModal}
                  className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-[#1fb85a]"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Menüyü kapat"
          />
          <div className="relative z-10 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-800 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menüyü aç"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-zinc-200">Mert Admin</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M20 21a8 8 0 1 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
          </div>
        </header>

        <main className="p-4 md:p-6">{renderContent()}</main>
      </div>
    </div>
  );
}
